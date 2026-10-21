import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { InputText } from 'primeng/inputtext';

import { AuthService } from '../../../core/services/auth/auth-service';
import { Profil, ProfilRequest } from '../../../core/services/models/profil.model';
import { ProfilService } from '../../../core/services/profil/profil-service';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { chargerImagePourRecadrage } from '../../../shared/images/charger-image';
import { FORMAT_PHOTO_PROFIL } from '../../../shared/images/recadrage';
import { RecadreurImage } from '../../../shared/images/recadreur-image';
import { InfosPersonnelles } from '../composants/infos-personnelles/infos-personnelles';
import { MessageSection } from '../composants/message-section.model';

interface ModeleMotDePasse {
  actuel: string;
  nouveau: string;
  confirmation: string;
}

@Component({
  selector: 'app-parametres-profil',
  imports: [FormField, InfosPersonnelles, InputText, RouterLink, BoutonRetour, AvatarMembre, RecadreurImage],
  templateUrl: './parametres-profil.html',
  styleUrl: './parametres-profil.scss'
})
export class ParametresProfil implements OnDestroy {
  private readonly profilService = inject(ProfilService);
  private readonly authService = inject(AuthService);

  protected readonly profil = signal<Profil | null>(null);
  protected readonly enChargement = signal(true);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly enSauvegarde = signal(false);
  protected readonly messageInformations = signal<MessageSection | null>(null);
  protected readonly fichierPhoto = signal<File | null>(null);
  protected readonly apercuPhoto = signal<string | null>(null);
  protected readonly erreurPhoto = signal<string | null>(null);
  protected readonly succesPhoto = signal<string | null>(null);
  protected readonly envoiPhoto = signal(false);
  /** Photo en cours de recadrage, avant d'être retenue. */
  protected readonly photoARecadrer = signal<HTMLImageElement | null>(null);
  protected readonly formatPhoto = FORMAT_PHOTO_PROFIL;
  protected readonly envoiMotDePasse = signal(false);
  protected readonly messageMotDePasse = signal<MessageSection | null>(null);
  protected readonly afficherActuel = signal(false);
  protected readonly afficherNouveau = signal(false);
  protected readonly afficherConfirmation = signal(false);

  protected readonly modeleMotDePasse = signal<ModeleMotDePasse>({
    actuel: '', nouveau: '', confirmation: ''
  });
  protected readonly formulaireMotDePasse = form(this.modeleMotDePasse, (champ) => {
    required(champ.actuel, { message: 'Le mot de passe actuel est obligatoire' });
    required(champ.nouveau, { message: 'Le nouveau mot de passe est obligatoire' });
    minLength(champ.nouveau, 8, { message: 'Au moins 8 caractères' });
    required(champ.confirmation, { message: 'Confirmez le nouveau mot de passe' });
  });

  protected readonly sourcePhoto = computed(() => this.apercuPhoto() ?? this.profil()?.urlPhoto ?? null);
  protected readonly typeMembre = computed(() => {
    const role = this.profil()?.role;
    return role ? ({
      ETUDIANT: 'Étudiant', ALUMNI: 'Alumni', PERSONNEL: 'Personnel', VISITEUR: 'Visiteur'
    } as Record<string, string>)[role] ?? 'Membre' : '';
  });

  constructor() {
    this.charger();
  }

  ngOnDestroy(): void {
    this.libererApercu();
    this.fermerRecadrage();
  }

  protected charger(): void {
    this.enChargement.set(true);
    this.erreurChargement.set(null);
    this.profilService.obtenirProfil().subscribe({
      next: (profil) => {
        this.profil.set(profil);
        this.enChargement.set(false);
      },
      error: () => {
        this.erreurChargement.set('Impossible de charger les paramètres du profil.');
        this.enChargement.set(false);
      }
    });
  }

  protected enregistrerInformations(donnees: ProfilRequest): void {
    this.enSauvegarde.set(true);
    this.messageInformations.set(null);
    this.profilService.majProfil(donnees).subscribe({
      next: (profil) => {
        this.profil.set(profil);
        this.authService.synchroniserProfil(profil);
        this.enSauvegarde.set(false);
        this.messageInformations.set({ type: 'succes', texte: 'Informations enregistrées.' });
      },
      error: (erreur: { error?: Record<string, string> }) => {
        this.enSauvegarde.set(false);
        this.messageInformations.set({
          type: 'erreur', texte: this.extraireErreur(erreur.error, 'Échec de l’enregistrement.')
        });
      }
    });
  }

  /** La photo choisie passe par le recadrage carré : c'est le résultat recadré qui est envoyé. */
  protected async choisirPhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0] ?? null;
    input.value = '';
    this.erreurPhoto.set(null);
    this.succesPhoto.set(null);
    if (!fichier) return;
    try {
      this.fermerRecadrage();
      this.photoARecadrer.set(await chargerImagePourRecadrage(fichier, FORMAT_PHOTO_PROFIL));
    } catch (erreur) {
      this.erreurPhoto.set(erreur instanceof Error ? erreur.message : 'Cette photo ne peut pas être utilisée.');
    }
  }

  protected appliquerRecadrage(fichier: File): void {
    this.fermerRecadrage();
    this.libererApercu();
    this.fichierPhoto.set(fichier);
    this.apercuPhoto.set(URL.createObjectURL(fichier));
  }

  protected fermerRecadrage(): void {
    const image = this.photoARecadrer();
    if (image) URL.revokeObjectURL(image.src);
    this.photoARecadrer.set(null);
  }

  protected annulerPhoto(): void {
    this.libererApercu();
    this.fichierPhoto.set(null);
    this.erreurPhoto.set(null);
  }

  protected enregistrerPhoto(): void {
    const fichier = this.fichierPhoto();
    if (!fichier) return;
    this.envoiPhoto.set(true);
    this.erreurPhoto.set(null);
    this.profilService.modifierPhoto(fichier).subscribe({
      next: (profil) => {
        this.profil.set(profil);
        this.authService.synchroniserProfil(profil);
        this.annulerPhoto();
        this.envoiPhoto.set(false);
        this.succesPhoto.set('Photo de profil mise à jour.');
      },
      error: (erreur: { error?: { message?: string } }) => {
        this.envoiPhoto.set(false);
        this.erreurPhoto.set(erreur.error?.message ?? 'Impossible d’enregistrer la photo.');
      }
    });
  }

  protected supprimerPhoto(): void {
    if (!this.profil()?.urlPhoto) return;
    this.envoiPhoto.set(true);
    this.erreurPhoto.set(null);
    this.profilService.supprimerPhoto().subscribe({
      next: (profil) => {
        this.profil.set(profil);
        this.authService.synchroniserProfil(profil);
        this.annulerPhoto();
        this.envoiPhoto.set(false);
        this.succesPhoto.set('Photo de profil supprimée.');
      },
      error: () => {
        this.envoiPhoto.set(false);
        this.erreurPhoto.set('Impossible de supprimer la photo.');
      }
    });
  }

  protected changerMotDePasse(): void {
    this.messageMotDePasse.set(null);
    if (this.formulaireMotDePasse().invalid()) {
      this.formulaireMotDePasse().markAsTouched();
      return;
    }
    const valeurs = this.modeleMotDePasse();
    if (valeurs.nouveau !== valeurs.confirmation) {
      this.messageMotDePasse.set({ type: 'erreur', texte: 'Les deux nouveaux mots de passe diffèrent.' });
      return;
    }
    if (valeurs.actuel === valeurs.nouveau) {
      this.messageMotDePasse.set({ type: 'erreur', texte: 'Choisissez un mot de passe différent.' });
      return;
    }
    this.envoiMotDePasse.set(true);
    this.authService.changerMotDePasse(valeurs.actuel, valeurs.nouveau).subscribe({
      next: () => {
        this.envoiMotDePasse.set(false);
        this.modeleMotDePasse.set({ actuel: '', nouveau: '', confirmation: '' });
        this.messageMotDePasse.set({
          type: 'succes', texte: 'Mot de passe modifié. Les autres sessions ont été déconnectées.'
        });
      },
      error: (erreur: { status?: number; error?: { message?: string } }) => {
        this.envoiMotDePasse.set(false);
        this.messageMotDePasse.set({
          type: 'erreur',
          texte: erreur.status === 401
            ? 'Le mot de passe actuel est incorrect.'
            : erreur.error?.message ?? 'Impossible de modifier le mot de passe.'
        });
      }
    });
  }

  private libererApercu(): void {
    const url = this.apercuPhoto();
    if (url) URL.revokeObjectURL(url);
    this.apercuPhoto.set(null);
  }

  private extraireErreur(erreur: Record<string, string> | undefined, secours: string): string {
    if (!erreur) return secours;
    return erreur['message'] ?? Object.values(erreur)[0] ?? secours;
  }
}
