import { DOCUMENT } from '@angular/common';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import { Experience, Formation } from '../../../../core/services/models/profil.model';
import { OrganismeSuggestion } from '../../../../core/services/models/organisme.model';
import { OrganismeService } from '../../../../core/services/organisme/organisme-service';
import { ProfilService } from '../../../../core/services/profil/profil-service';
import { EtatCartes, ETAT_CARTES_VIDE, etatEnCours, etatPourCarte } from '../../composants/etat-carte.model';
import { DemandeExperience, ListeExperiences } from '../../composants/liste-experiences/liste-experiences';
import { DemandeFormation, ListeFormations } from '../../composants/liste-formations/liste-formations';

type TypeParcours = 'experience' | 'formation';
type Element = Experience | Formation;

/**
 * Expériences ou formations dans « Modifier mon profil » : chaque carte s’enregistre seule, sans
 * quitter la page (l’assistant « Compléter le profil » reste réservé à la première inscription).
 */
@Component({
  selector: 'app-section-parcours',
  imports: [ListeExperiences, ListeFormations],
  templateUrl: './section-parcours.html',
})
export class SectionParcours {
  private readonly profilService = inject(ProfilService);
  private readonly organismeService = inject(OrganismeService);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);

  readonly type = input.required<TypeParcours>();

  protected readonly elements = signal<Element[]>([]);
  protected readonly brouillons = signal<string[]>([]);
  protected readonly etat = signal<EtatCartes>(ETAT_CARTES_VIDE);
  protected readonly suggestions = signal<OrganismeSuggestion[]>([]);
  protected readonly enRechercheOrganisme = signal(false);
  private compteurBrouillons = 0;

  constructor() {
    // Le type n’est connu qu’une fois l’input posé : on charge à ce moment-là.
    effect(() => {
      this.type();
      untracked(() => this.charger());
    });
  }

  protected experiences(): Experience[] {
    return this.elements() as Experience[];
  }

  protected formations(): Formation[] {
    return this.elements() as Formation[];
  }

  protected ajouterBrouillon(): void {
    this.compteurBrouillons += 1;
    this.brouillons.update((cles) => [...cles, `nouvelle-${this.type()}-${this.compteurBrouillons}`]);
  }

  protected abandonnerBrouillon(cle: string): void {
    this.brouillons.update((cles) => cles.filter((c) => c !== cle));
    const { [cle]: _retire, ...reste } = this.etat().messages;
    this.etat.update((etat) => ({ ...etat, messages: reste }));
  }

  protected rechercherOrganismes(texte: string): void {
    this.enRechercheOrganisme.set(true);
    this.organismeService.rechercherOrganismes(texte).subscribe({
      next: (resultats) => {
        this.enRechercheOrganisme.set(false);
        this.suggestions.set(resultats);
      },
      error: () => {
        this.enRechercheOrganisme.set(false);
        this.suggestions.set([]);
      },
    });
  }

  protected enregistrer(demande: DemandeExperience | DemandeFormation): void {
    this.etat.set(etatEnCours(demande.cle));
    const requete: Observable<Element> = this.type() === 'experience'
      ? (demande.id === null
          ? this.profilService.creerExperience((demande as DemandeExperience).donnees)
          : this.profilService.modifierExperience(demande.id, (demande as DemandeExperience).donnees))
      : (demande.id === null
          ? this.profilService.creerFormation((demande as DemandeFormation).donnees)
          : this.profilService.modifierFormation(demande.id, (demande as DemandeFormation).donnees));
    requete.subscribe({
      next: (enregistre) => {
        if (demande.id === null) {
          this.elements.update((liste) => [...liste, enregistre]);
          this.brouillons.update((cles) => cles.filter((c) => c !== demande.cle));
        } else {
          this.elements.update((liste) => liste.map((e) => (e.id === enregistre.id ? enregistre : e)));
        }
        this.etat.set(etatPourCarte(enregistre.id, { type: 'succes', texte: 'Enregistré.' }));
      },
      error: (err: { error?: { message?: string } }) =>
        this.etat.set(etatPourCarte(demande.cle, { type: 'erreur', texte: err?.error?.message ?? 'Échec de l’enregistrement.' })),
    });
  }

  protected supprimer(id: string): void {
    this.etat.set(etatEnCours(id));
    const requete = this.type() === 'experience' ? this.profilService.supprimerExperience(id) : this.profilService.supprimerFormation(id);
    requete.subscribe({
      next: () => {
        this.etat.set(ETAT_CARTES_VIDE);
        this.elements.update((liste) => liste.filter((e) => e.id !== id));
      },
      error: (err: { error?: { message?: string } }) =>
        this.etat.set(etatPourCarte(id, { type: 'erreur', texte: err?.error?.message ?? 'Échec de la suppression.' })),
    });
  }

  private charger(): void {
    const requete: Observable<Element[]> = this.type() === 'experience'
      ? this.profilService.listerExperiences()
      : this.profilService.listerFormations();
    requete.subscribe({
      next: (liste) => {
        this.elements.set(liste);
        this.mettreEnAvant(liste);
      },
      error: () => this.etat.set({
        ...ETAT_CARTES_VIDE,
        messageGlobal: { type: 'erreur', texte: this.type() === 'experience' ? 'Impossible de charger vos expériences.' : 'Impossible de charger vos formations.' },
      }),
    });
  }

  /** ?modifier=<id>&type=… (depuis la fenêtre d’une étape du profil) : la carte est amenée à l’écran et reçoit le focus. */
  private mettreEnAvant(liste: Element[]): void {
    const parametres = this.route.snapshot.queryParamMap;
    const id = parametres.get('modifier');
    if (!id || parametres.get('type') !== this.type() || !liste.some((e) => e.id === id)) return;
    requestAnimationFrame(() => {
      // Premier champ de la carte : on peut modifier tout de suite.
      const element = this.document.getElementById(`${id}-${this.type() === 'experience' ? 'poste' : 'libelle'}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element?.focus({ preventScroll: true });
    });
  }
}
