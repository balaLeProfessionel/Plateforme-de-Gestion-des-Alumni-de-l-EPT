import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProfilService } from '../../../../core/services/profil/profil-service';
import { OrganismeService } from '../../../../core/services/organisme/organisme-service';
import { Experience } from '../../../../core/services/models/profil.model';
import { OrganismeSuggestion } from '../../../../core/services/models/organisme.model';
import { EtatCartes, ETAT_CARTES_VIDE } from '../../composants/etat-carte.model';
import {
  DemandeEnregistrement,
  ListeExperiences
} from '../../composants/liste-experiences/liste-experiences';
import { NavigationEtapes } from '../../composants/navigation-etapes/navigation-etapes';

// Etape 3 du parcours : les experiences professionnelles.
@Component({
  selector: 'app-etape-experiences',
  imports: [ListeExperiences, NavigationEtapes],
  templateUrl: './etape-experiences.html',
  styleUrl: './etape-experiences.scss'
})
export class EtapeExperiences {
  private readonly profilService = inject(ProfilService);
  private readonly organismeService = inject(OrganismeService);
  private readonly router = inject(Router);

  protected readonly experiences = signal<Experience[]>([]);
  // Cartes vierges en cours de saisie. Elles vivent ici et non dans la liste :
  // la page est la seule a savoir qu'une creation a reussi et qu'il faut
  // retirer le brouillon correspondant.
  protected readonly brouillons = signal<string[]>([]);
  protected readonly etat = signal<EtatCartes>(ETAT_CARTES_VIDE);
  private compteurBrouillons = 0;

  // L'autocomplete ne fait aucun appel : c'est ici qu'on interroge le service
  // et qu'on redescend les resultats par input.
  protected readonly suggestions = signal<OrganismeSuggestion[]>([]);
  protected readonly enRechercheOrganisme = signal(false);

  constructor() {
    this.charger();
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
      }
    });
  }

  protected ajouterBrouillon(): void {
    this.compteurBrouillons += 1;
    const cle = `nouvelle-experience-${this.compteurBrouillons}`;
    this.brouillons.update((cles) => [...cles, cle]);
  }

  protected abandonnerBrouillon(cle: string): void {
    this.retirerBrouillon(cle);
    this.effacerMessageSi(cle);
  }

  protected enregistrerCarte(demande: DemandeEnregistrement): void {
    this.etat.set({ cleEnCours: demande.cle, cleMessage: null, message: null });

    const requete =
      demande.id === null
        ? this.profilService.creerExperience(demande.donnees)
        : this.profilService.modifierExperience(demande.id, demande.donnees);

    requete.subscribe({
      next: () => {
        // Une creation peut avoir cree un organisme a la volee : on recharge
        // depuis le serveur pour afficher le nom d'organisme resolu.
        this.charger();

        if (demande.id === null) {
          // Le brouillon disparait au profit de la carte enregistree : lui
          // rattacher un message n'aurait plus de sens.
          this.retirerBrouillon(demande.cle);
          this.etat.set(ETAT_CARTES_VIDE);
          return;
        }

        this.etat.set({
          cleEnCours: null,
          cleMessage: demande.cle,
          message: { type: 'succes', texte: 'Expérience enregistrée.' }
        });
      },
      error: (err: { error?: { message?: string } }) => {
        this.etat.set({
          cleEnCours: null,
          cleMessage: demande.cle,
          message: {
            type: 'erreur',
            texte: err?.error?.message ?? "Échec de l'enregistrement."
          }
        });
      }
    });
  }

  protected supprimer(id: string): void {
    this.etat.set({ cleEnCours: id, cleMessage: null, message: null });

    this.profilService.supprimerExperience(id).subscribe({
      next: () => {
        this.etat.set(ETAT_CARTES_VIDE);
        this.charger();
      },
      error: (err: { error?: { message?: string } }) => {
        this.etat.set({
          cleEnCours: null,
          cleMessage: id,
          message: {
            type: 'erreur',
            texte: err?.error?.message ?? 'Échec de la suppression.'
          }
        });
      }
    });
  }

  protected terminer(): void {
    this.router.navigate(['/accueil']);
  }

  private charger(): void {
    this.profilService.listerExperiences().subscribe({
      next: (liste) => this.experiences.set(liste),
      error: () =>
        this.etat.set({
          cleEnCours: null,
          cleMessage: null,
          message: { type: 'erreur', texte: 'Impossible de charger vos expériences.' }
        })
    });
  }

  private retirerBrouillon(cle: string): void {
    this.brouillons.update((cles) => cles.filter((c) => c !== cle));
  }

  private effacerMessageSi(cle: string): void {
    if (this.etat().cleMessage === cle) {
      this.etat.set(ETAT_CARTES_VIDE);
    }
  }
}
