import { Component, ElementRef, Injector, afterNextRender, computed, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { email, form, minLength, pattern, readonly, required, FormField } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../../../../core/services/auth/auth-service';
import { InscriptionGoogle } from '../../../../core/services/auth/inscription-google';
import { AuthResponse } from '../../../../core/services/models/auth-response.model';
import { FilieresService } from '../../../../core/services/filieres/filieres';
import { ChampFormulaire } from '../../../../shared/formulaires/champ-formulaire/champ-formulaire';
import { focaliserPremiereErreur } from '../../../../shared/formulaires/focus-premiere-erreur';
import { BoutonGoogle } from '../../bouton-google/bouton-google';
import { CadreInscription } from '../cadre-inscription/cadre-inscription';

const LONGUEUR_MOT_DE_PASSE = 8;
/** Profils ouverts à l'inscription libre (les étudiants sont créés par l'école). */
const ROLES_OUVERTS = ['ALUMNI', 'PERSONNEL', 'ORGANISME', 'VISITEUR'];

type Etape = 'identite' | 'compte';
type Champ = 'nom' | 'prenom' | 'nomOrganisme' | 'email' | 'password' | 'filiere' | 'anneeSortie' | 'telephone';

// Champs verifies avant de quitter chaque etape
const CHAMPS_ETAPE: Record<Etape, Champ[]> = {
  identite: ['nomOrganisme', 'prenom', 'nom', 'email', 'telephone'],
  compte: ['filiere', 'anneeSortie', 'password']
};

// Inscription en deux etapes (apres le choix du profil) : qui vous etes, puis
// votre compte. Les erreurs n'apparaissent qu'apres une saisie ou un essai de continuer.
@Component({
  selector: 'app-formulaire',
  imports: [FormField, RouterLink, ChampFormulaire, CadreInscription, BoutonGoogle],
  templateUrl: './formulaire.html',
  styleUrl: './formulaire.scss',
})
export class Formulaire {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly titre = viewChild<ElementRef<HTMLElement>>('titre');

  // Le rôle suit le paramètre d'URL (/inscription/formulaire/ALUMNI), même quand
  // Angular réutilise la page (boutons précédent / suivant du navigateur)
  private readonly roleAdresse = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('role') ?? 'VISITEUR')),
    { initialValue: this.route.snapshot.paramMap.get('role') ?? 'VISITEUR' }
  );
  protected readonly role = linkedSignal(() => this.roleAdresse());

  protected readonly filieres = inject(FilieresService).proposees();

  constructor() {
    // Profil inconnu dans l'adresse (ETUDIANT, faute de frappe…) : retour au choix,
    // plutôt qu'un refus du serveur à la toute fin du formulaire
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((p) => {
      if (!ROLES_OUVERTS.includes(p.get('role') ?? 'VISITEUR')) {
        this.router.navigate(['/inscription']);
      }
    });
  }

  protected readonly libelleRole = computed(() => {
    switch (this.role()) {
      case 'ALUMNI': return 'Diplômé de l’EPT';
      case 'PERSONNEL': return 'Personnel de l’EPT';
      case 'ORGANISME': return 'Entreprise ou institution';
      default: return 'Visiteur';
    }
  });

  protected readonly estOrganisme = computed(() => this.role() === 'ORGANISME');
  protected readonly montreFiliere = computed(
    () => this.role() === 'ALUMNI' || this.role() === 'PERSONNEL'
  );
  protected readonly montreAnnee = computed(() => this.role() === 'ALUMNI');
  protected readonly montreTelephone = computed(() => this.role() !== 'VISITEUR');

  // Un changement de profil ramène à la première étape
  protected readonly etape = linkedSignal<string, Etape>({ source: this.role, computation: () => 'identite' });
  protected readonly numeroEtape = computed(() => (this.etape() === 'identite' ? 2 : 3));

  /** Inscription avec Google : adresse imposée par Google, pas de mot de passe. */
  private readonly inscriptionGoogle = inject(InscriptionGoogle);
  protected readonly google = this.inscriptionGoogle.enAttente;

  // Le modèle contient tous les champs possibles ; on n'utilise que ceux qui servent.
  // Avec Google, l'adresse, le prénom et le nom sont pré-remplis.
  protected readonly modele = signal({
    nom: this.google()?.nom ?? '',
    prenom: this.google()?.prenom ?? '',
    nomOrganisme: '',
    email: this.google()?.email ?? '',
    password: '',
    filiere: '',
    anneeSortie: '',
    telephone: ''
  });

  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.nom, { message: 'Le nom est obligatoire' });
    required(champ.prenom, { message: 'Le prénom est obligatoire' });
    required(champ.email, { message: "L'email est obligatoire" });
    email(champ.email, { message: 'Vérifiez l’adresse : elle doit ressembler à nom@exemple.com' });
    // Avec Google, l'adresse est imposée par le jeton et aucun mot de passe n'est demandé
    readonly(champ.email, () => this.google() !== null);
    required(champ.password, { message: 'Le mot de passe est obligatoire', when: () => this.google() === null });
    minLength(champ.password, LONGUEUR_MOT_DE_PASSE, { message: 'Au moins 8 caractères' });
    pattern(champ.anneeSortie, /^((19[5-9]\d)|(20\d\d))?$/, { message: 'Une année entre 1950 et 2099, par exemple 2021' });
    pattern(champ.telephone, /^[+\d][\d\s.-]{6,}$|^$/, { message: 'Un numéro de téléphone, par exemple 77 123 45 67' });
    required(champ.nomOrganisme, {
      message: "Le nom de l'organisme est obligatoire",
      when: () => this.estOrganisme()
    });
  });

  protected readonly enChargement = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly afficherMdp = signal(false);

  /** Ce qui reste à saisir pour le mot de passe, affiché pendant la frappe. */
  protected readonly aideMotDePasse = computed(() => {
    const manque = LONGUEUR_MOT_DE_PASSE - this.modele().password.length;
    if (manque <= 0) return 'Longueur suffisante';
    return manque === LONGUEUR_MOT_DE_PASSE ? 'Au moins 8 caractères' : `Encore ${manque} caractère${manque > 1 ? 's' : ''}`;
  });

  // Étapes pour lesquelles l'utilisateur a déjà tenté de continuer
  private readonly etapesTentees = linkedSignal<string, ReadonlySet<Etape>>({
    source: this.role,
    computation: () => new Set()
  });

  /**
   * Erreur d'un champ : après une saisie quittée, ou après un essai de continuer.
   * Traverser un champ vide au clavier ne le met pas en erreur.
   */
  protected erreur(nom: Champ): string | null {
    const champ = this.formulaire[nom]();
    const tentee = this.etapesTentees().has(CHAMPS_ETAPE.identite.includes(nom) ? 'identite' : 'compte');
    const montrer = (champ.touched() && champ.dirty()) || tentee;
    return montrer && champ.invalid() ? (champ.errors()[0]?.message ?? null) : null;
  }

  /** Coche verte : champ rempli, quitté et correct. */
  protected valide(nom: Champ): boolean {
    const champ = this.formulaire[nom]();
    return champ.touched() && !champ.invalid() && this.modele()[nom] !== '';
  }

  protected continuer(): void {
    if (this.etapeInvalide('identite')) return;
    this.messageErreur.set(null);
    this.etape.set('compte');
    this.focaliserTitre();
  }

  protected retour(): void {
    this.etape.set('identite');
    this.focaliserTitre();
  }

  sInscrire(): void {
    if (this.etapeInvalide('identite')) {
      this.etape.set('identite');
      return;
    }
    if (this.etapeInvalide('compte')) return;

    this.enChargement.set(true);
    this.messageErreur.set(null);

    const m = this.modele();

    // On construit le corps adapté au rôle
    const corps: Record<string, unknown> = {
      nom: m.nom.trim(),
      prenom: m.prenom.trim(),
      email: m.email.trim(),
      password: m.password,
      role: this.role()
    };

    if (this.montreAnnee() && m.anneeSortie) {
      corps['anneeSortie'] = Number(m.anneeSortie);
    }
    if (this.montreFiliere()) {
      corps['filiere'] = m.filiere;
    }
    if (this.montreTelephone() && m.telephone) {
      corps['telephone'] = m.telephone.trim();
    }
    if (this.estOrganisme()) {
      corps['nomOrganisme'] = m.nomOrganisme.trim();
    }

    const google = this.google();
    if (google) {
      this.inscrireAvecGoogle(google.credential, corps);
      return;
    }

    this.authService.inscrire(corps).subscribe({
      next: (res) => {
        this.enChargement.set(false);
        // On passe à l'écran de vérification en transmettant l'email
        this.router.navigate(['/inscription/verification'], {
          queryParams: { email: res.email }
        });
      },
      error: (err) => {
        this.enChargement.set(false);
        this.messageErreur.set(err?.error?.message ?? "L'inscription a échoué. Réessayez.");
      }
    });
  }

  /**
   * L’adresse vient du jeton Google (le serveur ignore toute autre adresse) : pas de mot de passe
   * ni de code par e-mail, la session s’ouvre tout de suite.
   */
  private inscrireAvecGoogle(credential: string, corps: Record<string, unknown>): void {
    const { email: _adresse, password: _motDePasse, ...profil } = corps;
    this.authService.inscriptionGoogle({ ...profil, credential }).subscribe({
      next: (res) => {
        this.enChargement.set(false);
        this.inscriptionGoogle.oublier();
        // Même suite qu'après la vérification par code : compléter le profil (CV ou saisie), ou l'organisme
        void this.router.navigate([res.role === 'ORGANISME' ? '/completer-organisme' : '/completer-profil']);
      },
      error: (err: HttpErrorResponse) => {
        this.enChargement.set(false);
        // Jeton Google expiré ou refusé : il faut repasser par le bouton Google.
        if (err.status === 401) {
          this.inscriptionGoogle.oublier();
          this.messageErreur.set('La validation par Google a expiré. Revenez à l’étape précédente et cliquez à nouveau sur « Continuer avec Google ».');
          return;
        }
        this.messageErreur.set(err?.error?.message ?? "L'inscription a échoué. Réessayez.");
      }
    });
  }

  /** Adresse Google sans compte : on reprend ce que Google sait, la saisie déjà faite reste pour le reste. */
  protected preRemplirAvecGoogle(): void {
    const compte = this.google();
    if (!compte) return;
    this.messageErreur.set(null);
    this.modele.update((m) => ({
      ...m,
      email: compte.email,
      prenom: compte.prenom || m.prenom,
      nom: compte.nom || m.nom,
      password: ''
    }));
  }

  /** L'adresse Google avait déjà un compte : la session est ouverte, pas besoin de s'inscrire. */
  protected ouvrirEspace(utilisateur: AuthResponse): void {
    void this.router.navigate([utilisateur.doitChangerMotDePasse ? '/premiere-connexion' : '/accueil']);
  }

  /** Retour à l'inscription par mot de passe, avec une adresse à saisir. */
  protected abandonnerGoogle(): void {
    this.inscriptionGoogle.oublier();
    this.modele.update((m) => ({ ...m, email: '' }));
  }

  // Note l'essai sur l'étape : toutes ses erreurs s'affichent
  private etapeInvalide(etape: Etape): boolean {
    const champs = CHAMPS_ETAPE[etape];
    this.etapesTentees.update((tentees) => new Set([...tentees, etape]));
    champs.forEach((nom) => this.formulaire[nom]().markAsTouched());
    const invalide = champs.some((nom) => this.formulaire[nom]().invalid());
    if (invalide) {
      focaliserPremiereErreur(this.hote.nativeElement, this.injector);
    }
    return invalide;
  }

  // Après un changement d'étape, le lecteur d'écran annonce le nouveau titre
  private focaliserTitre(): void {
    afterNextRender(() => this.titre()?.nativeElement.focus(), { injector: this.injector });
  }
}
