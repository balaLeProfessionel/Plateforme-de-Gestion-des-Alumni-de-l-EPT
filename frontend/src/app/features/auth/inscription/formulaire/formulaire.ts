import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { email, form, minLength, readonly, required, FormField } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';

import { AuthService } from '../../../../core/services/auth/auth-service';
import { InscriptionGoogle } from '../../../../core/services/auth/inscription-google';
import { FILIERES } from '../../../../core/data/filieres';

@Component({
  selector: 'app-formulaire',
  imports: [FormField, InputText, Message, RouterLink],
  templateUrl: './formulaire.html',
  styleUrl: './formulaire.scss',
})
export class Formulaire {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Le rôle vient du paramètre d'URL (/inscription/formulaire/ALUMNI)
  protected readonly role = signal(this.route.snapshot.paramMap.get('role') ?? 'VISITEUR');

  protected readonly filieres = FILIERES.map((f) => ({ label: f, value: f }));

  protected readonly libelleRole = computed(() => {
    switch (this.role()) {
      case 'ALUMNI': return 'Diplômé';
      case 'PERSONNEL': return 'Personnel EPT';
      case 'ORGANISME': return 'Organisme';
      default: return 'Visiteur';
    }
  });

  protected readonly estOrganisme = computed(() => this.role() === 'ORGANISME');
  protected readonly montreFiliere = computed(
    () => this.role() === 'ALUMNI' || this.role() === 'PERSONNEL'
  );

  protected readonly montreAnnee = computed(() => this.role() === 'ALUMNI');

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
    email(champ.email, { message: "Format d'email invalide" });
    readonly(champ.email, () => this.google() !== null);
    required(champ.password, { message: 'Le mot de passe est obligatoire', when: () => this.google() === null });
    minLength(champ.password, 8, { message: 'Au moins 8 caractères' });
    required(champ.nomOrganisme, {
      message: "Le nom de l'organisme est obligatoire",
      when: () => this.estOrganisme()
    });
  });

  protected readonly enChargement = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly afficherMdp = signal(false);

  sInscrire(): void {
    if (this.formulaire().invalid()) {
      this.formulaire().markAsTouched();
      return;
    }

    this.enChargement.set(true);
    this.messageErreur.set(null);

    const m = this.modele();


    // On construit le corps adapté au rôle
    const corps: Record<string, unknown> = {
      nom: m.nom,
      prenom: m.prenom,
      email: m.email,
      password: m.password,
      role: this.role()
    };

    if (this.montreAnnee() && m.anneeSortie) {
      corps['anneeSortie'] = Number(m.anneeSortie);
    }
    if (this.montreFiliere()) {
      corps['filiere'] = m.filiere;
    }
    if (m.telephone) {
      corps['telephone'] = m.telephone;
    }
    if (this.estOrganisme()) {
      corps['nomOrganisme'] = m.nomOrganisme;
    }

    const google = this.google();
    if (google) {
      this.inscrireAvecGoogle(google.credential, corps);
      return;
    }

    this.authService.inscrire(corps).subscribe({
      next: (res) => {
        this.enChargement.set(false);
        // On passe à l'écran OTP en transmettant l'email
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
      next: () => {
        this.enChargement.set(false);
        this.inscriptionGoogle.oublier();
        void this.router.navigate(['/accueil']);
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
}
