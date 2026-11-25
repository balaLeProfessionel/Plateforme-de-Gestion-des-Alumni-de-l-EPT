import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ProfilService } from '../../../../core/services/profil/profil-service';
import { BrouillonCv } from '../../../../core/services/import-cv/brouillon-cv';
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
  private readonly brouillonCv = inject(BrouillonCv);
  private readonly router = inject(Router);

  private readonly formulaire = viewChild(InfosPersonnelles);

  protected readonly profil = signal<Profil | null>(null);
  protected readonly enSauvegarde = signal(false);
  protected readonly message = signal<MessageSection | null>(null);
  protected readonly identiteCv = computed(() => this.brouillonCv.profil()?.identite ?? null);

  // Avec un CV, les champs pre-remplis ne sont pas encore enregistres :
  // « Continuer » enregistre d'abord, pour ne pas les perdre.
  protected readonly libelleContinuer = computed(() =>
    this.identiteCv() ? 'Enregistrer et continuer' : 'Continuer'
  );
  private continuerApresEnregistrement = false;

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
    this.brouillonCv.charger().subscribe();
  }

  protected enregistrer(donnees: ProfilRequest): void {
    this.enSauvegarde.set(true);
    this.message.set(null);

    this.profilService.majProfil(donnees).subscribe({
      next: (profil) => {
        this.enSauvegarde.set(false);
        this.profil.set(profil);
        this.message.set({ type: 'succes', texte: 'Informations enregistrées.' });
        if (this.continuerApresEnregistrement) {
          this.etapeSuivante();
        }
      },
      error: (err: { error?: { message?: string } }) => {
        this.enSauvegarde.set(false);
        this.continuerApresEnregistrement = false;
        this.message.set({
          type: 'erreur',
          texte: err?.error?.message ?? "Échec de l'enregistrement."
        });
      }
    });
  }

  protected continuer(): void {
    const formulaire = this.formulaire();
    if (!this.identiteCv() || !formulaire) {
      this.etapeSuivante();
      return;
    }
    this.continuerApresEnregistrement = formulaire.valider();
  }

  protected etapeSuivante(): void {
    this.router.navigate(['/completer-profil/formations']);
  }
}
