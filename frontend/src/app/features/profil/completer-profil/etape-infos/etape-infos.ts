import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProfilService } from '../../../../core/services/profil/profil-service';
import { Profil, ProfilRequest } from '../../../../core/services/models/profil.model';
import { MessageSection } from '../../composants/message-section.model';
import { InfosPersonnelles } from '../../composants/infos-personnelles/infos-personnelles';
import { NavigationEtapes } from '../../composants/navigation-etapes/navigation-etapes';

// Etape 1 du parcours : les informations personnelles.
// Elle orchestre : elle detient l'etat, appelle le service et navigue.
// Le composant de presentation ne connait ni le reseau ni le routeur.
@Component({
  selector: 'app-etape-infos',
  imports: [InfosPersonnelles, NavigationEtapes],
  templateUrl: './etape-infos.html',
  styleUrl: './etape-infos.scss'
})
export class EtapeInfos {
  private readonly profilService = inject(ProfilService);
  private readonly router = inject(Router);

  protected readonly profil = signal<Profil | null>(null);
  protected readonly enSauvegarde = signal(false);
  protected readonly message = signal<MessageSection | null>(null);

  constructor() {
    // On charge le profil existant : l'ecran sert aussi bien a le completer
    // apres l'inscription qu'a le modifier plus tard.
    this.profilService.obtenirProfil().subscribe({
      next: (profil) => this.profil.set(profil),
      error: () =>
        this.message.set({
          type: 'erreur',
          texte: 'Impossible de charger votre profil.'
        })
    });
  }

  protected enregistrer(donnees: ProfilRequest): void {
    this.enSauvegarde.set(true);
    this.message.set(null);

    this.profilService.majProfil(donnees).subscribe({
      next: (profil) => {
        this.enSauvegarde.set(false);
        this.profil.set(profil);
        this.message.set({ type: 'succes', texte: 'Informations enregistrées.' });
      },
      error: (err: { error?: { message?: string } }) => {
        this.enSauvegarde.set(false);
        this.message.set({
          type: 'erreur',
          texte: err?.error?.message ?? "Échec de l'enregistrement."
        });
      }
    });
  }

  protected etapeSuivante(): void {
    this.router.navigate(['/completer-profil/formations']);
  }
}
