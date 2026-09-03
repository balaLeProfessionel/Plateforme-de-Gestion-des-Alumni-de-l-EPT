import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProfilService } from '../../../core/services/profil/profil-service';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';
import { Experience, Profil, ProfilRequest } from '../../../core/services/models/profil.model';
import { OrganismeSuggestion } from '../../../core/services/models/organisme.model';
import { MessageSection } from '../composants/message-section.model';
import { EtatCartes, ETAT_CARTES_VIDE } from '../composants/etat-carte.model';
import { InfosPersonnelles } from '../composants/infos-personnelles/infos-personnelles';
import {
  DemandeEnregistrement,
  ListeExperiences
} from '../composants/liste-experiences/liste-experiences';

// Page de completion du profil proposee juste apres la verification OTP.
// Elle orchestre : elle detient l'etat, appelle les services et distribue
// les donnees aux composants de presentation. Ces derniers ne connaissent
// ni le reseau ni la navigation.
@Component({
  selector: 'app-completer-profil',
  imports: [InfosPersonnelles, ListeExperiences],
  templateUrl: './completer-profil.html',
  styleUrl: './completer-profil.scss'
})
export class CompleterProfil {
  private readonly profilService = inject(ProfilService);
  private readonly organismeService = inject(OrganismeService);
  private readonly router = inject(Router);

  // ===== Infos personnelles =====
  protected readonly profil = signal<Profil | null>(null);
  protected readonly enSauvegardeInfos = signal(false);
  protected readonly messageInfos = signal<MessageSection | null>(null);

  // ===== Experiences =====
  protected readonly experiences = signal<Experience[]>([]);
  // Cartes vierges en cours de saisie. Elles vivent ici et non dans la liste :
  // la page est la seule a savoir qu'une creation a reussi et qu'il faut
  // retirer le brouillon correspondant.
  protected readonly brouillonsExperiences = signal<string[]>([]);
  protected readonly etatExperiences = signal<EtatCartes>(ETAT_CARTES_VIDE);
  private compteurBrouillons = 0;

  // ===== Organismes (partages par toutes les cartes) =====
  protected readonly suggestions = signal<OrganismeSuggestion[]>([]);
  protected readonly enRechercheOrganisme = signal(false);

  constructor() {
    // On charge le profil existant : la page sert aussi bien a le completer
    // apres l'inscription qu'a le modifier plus tard.
    this.profilService.obtenirProfil().subscribe({
      next: (profil) => this.profil.set(profil),
      error: () =>
        this.messageInfos.set({
          type: 'erreur',
          texte: 'Impossible de charger votre profil.'
        })
    });

    this.chargerExperiences();
  }

  // ===== Infos personnelles =====

  // Sauvegarde propre a la section : chaque section se valide independamment.
  protected enregistrerInfos(donnees: ProfilRequest): void {
    this.enSauvegardeInfos.set(true);
    this.messageInfos.set(null);

    this.profilService.majProfil(donnees).subscribe({
      next: (profil) => {
        this.enSauvegardeInfos.set(false);
        this.profil.set(profil);
        this.messageInfos.set({ type: 'succes', texte: 'Informations enregistrées.' });
      },
      error: (err: { error?: { message?: string } }) => {
        this.enSauvegardeInfos.set(false);
        this.messageInfos.set({
          type: 'erreur',
          texte: err?.error?.message ?? "Échec de l'enregistrement."
        });
      }
    });
  }

  // ===== Recherche d'organismes =====
  // L'autocomplete ne fait aucun appel : c'est ici qu'on interroge le service
  // et qu'on redescend les resultats par input.

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

  // ===== Experiences =====

  protected ajouterBrouillonExperience(): void {
    this.compteurBrouillons += 1;
    const cle = `nouvelle-experience-${this.compteurBrouillons}`;
    this.brouillonsExperiences.update((cles) => [...cles, cle]);
  }

  protected abandonnerBrouillonExperience(cle: string): void {
    this.retirerBrouillon(cle);
    this.effacerMessageSi(cle);
  }

  protected enregistrerExperience(demande: DemandeEnregistrement): void {
    this.etatExperiences.set({ cleEnCours: demande.cle, cleMessage: null, message: null });

    const requete =
      demande.id === null
        ? this.profilService.creerExperience(demande.donnees)
        : this.profilService.modifierExperience(demande.id, demande.donnees);

    requete.subscribe({
      next: () => {
        // Une creation peut avoir cree un organisme a la volee : on recharge
        // depuis le serveur pour afficher le nom d'organisme resolu.
        this.chargerExperiences();

        if (demande.id === null) {
          // Le brouillon disparait au profit de la carte enregistree : lui
          // rattacher un message n'aurait plus de sens.
          this.retirerBrouillon(demande.cle);
          this.etatExperiences.set(ETAT_CARTES_VIDE);
          return;
        }

        this.etatExperiences.set({
          cleEnCours: null,
          cleMessage: demande.cle,
          message: { type: 'succes', texte: 'Expérience enregistrée.' }
        });
      },
      error: (err: { error?: { message?: string } }) => {
        this.etatExperiences.set({
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

  protected supprimerExperience(id: string): void {
    this.etatExperiences.set({ cleEnCours: id, cleMessage: null, message: null });

    this.profilService.supprimerExperience(id).subscribe({
      next: () => {
        this.etatExperiences.set(ETAT_CARTES_VIDE);
        this.chargerExperiences();
      },
      error: (err: { error?: { message?: string } }) => {
        this.etatExperiences.set({
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

  protected remplirPlusTard(): void {
    // Aucune sauvegarde : l'utilisateur pourra revenir depuis son profil.
    this.router.navigate(['/accueil']);
  }

  private chargerExperiences(): void {
    this.profilService.listerExperiences().subscribe({
      next: (liste) => this.experiences.set(liste),
      error: () =>
        this.etatExperiences.set({
          cleEnCours: null,
          cleMessage: null,
          message: { type: 'erreur', texte: 'Impossible de charger vos expériences.' }
        })
    });
  }

  private retirerBrouillon(cle: string): void {
    this.brouillonsExperiences.update((cles) => cles.filter((c) => c !== cle));
  }

  private effacerMessageSi(cle: string): void {
    if (this.etatExperiences().cleMessage === cle) {
      this.etatExperiences.set(ETAT_CARTES_VIDE);
    }
  }
}
