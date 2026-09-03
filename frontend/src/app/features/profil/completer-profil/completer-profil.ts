import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProfilService } from '../../../core/services/profil/profil-service';
import { Profil, ProfilRequest } from '../../../core/services/models/profil.model';
import { MessageSection } from '../composants/message-section.model';
import { InfosPersonnelles } from '../composants/infos-personnelles/infos-personnelles';

// Page de completion du profil proposee juste apres la verification OTP.
// Elle orchestre : elle detient l'etat, appelle le service et distribue
// les donnees aux composants de presentation. Ces derniers ne connaissent
// ni le reseau ni la navigation.
@Component({
  selector: 'app-completer-profil',
  imports: [InfosPersonnelles],
  templateUrl: './completer-profil.html',
  styleUrl: './completer-profil.scss'
})
export class CompleterProfil {
  private readonly profilService = inject(ProfilService);
  private readonly router = inject(Router);

  protected readonly profil = signal<Profil | null>(null);
  protected readonly enSauvegardeInfos = signal(false);
  protected readonly messageInfos = signal<MessageSection | null>(null);

  constructor() {
    // On charge le profil existant : la page sert aussi bien a le completer
    // apres l'inscription qu'a le modifier plus tard.
    this.profilService.obtenirProfil().subscribe({
      next: (profil) => this.profil.set(profil),
      error: () => this.messageInfos.set({
        type: 'erreur',
        texte: 'Impossible de charger votre profil.'
      })
    });
  }

  // Sauvegarde propre a la section : chaque section se valide independamment.
  protected enregistrerInfos(donnees: ProfilRequest): void {
    this.enSauvegardeInfos.set(true);
    this.messageInfos.set(null);

    this.profilService.majProfil(donnees).subscribe({
      next: (profil) => {
        this.enSauvegardeInfos.set(false);
        this.profil.set(profil);
        this.messageInfos.set({ type: 'succes', texte: 'Informations enregistrees.' });
      },
      error: (err: { error?: { message?: string } }) => {
        this.enSauvegardeInfos.set(false);
        this.messageInfos.set({
          type: 'erreur',
          texte: err?.error?.message ?? "Echec de l'enregistrement."
        });
      }
    });
  }

  protected remplirPlusTard(): void {
    // Aucune sauvegarde : l'utilisateur pourra revenir depuis son profil.
    this.router.navigate(['/accueil']);
  }
}
