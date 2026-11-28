import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CadreInscription } from '../cadre-inscription/cadre-inscription';

import { InscriptionGoogle } from '../../../../core/services/auth/inscription-google';
import { AuthResponse } from '../../../../core/services/models/auth-response.model';
import { BoutonGoogle } from '../../bouton-google/bouton-google';

interface OptionRole {
  cle: string;
  titre: string;
  description: string;
  icone: string;
}

// Premiere etape de l'inscription : le membre coche son profil puis continue.
@Component({
  selector: 'app-choix-role',
  imports: [RouterLink, CadreInscription, BoutonGoogle],
  templateUrl: './choix-role.html',
  styleUrl: './choix-role.scss',
})
export class ChoixRole {
  private readonly router = inject(Router);
  private readonly inscriptionGoogle = inject(InscriptionGoogle);
  /** Compte Google retenu : la personne n’a plus qu’à choisir son profil. */
  protected readonly google = this.inscriptionGoogle.enAttente;
  protected readonly erreurGoogle = signal<string | null>(null);

  protected readonly roles: OptionRole[] = [
    {
      cle: 'ALUMNI',
      titre: 'Diplômé de l’EPT',
      description: 'Retrouvez votre promotion, le mentorat et les opportunités du réseau.',
      icone: 'pi-graduation-cap'
    },
    {
      cle: 'PERSONNEL',
      titre: 'Personnel de l’EPT',
      description: 'Enseignant, chercheur ou membre de l’administration.',
      icone: 'pi-briefcase'
    },
    {
      cle: 'ORGANISME',
      titre: 'Entreprise ou institution',
      description: 'Présentez votre organisme et publiez vos événements.',
      icone: 'pi-building'
    },
    {
      cle: 'VISITEUR',
      titre: 'Visiteur',
      description: 'Suivez l’actualité et les événements de la communauté.',
      icone: 'pi-user'
    }
  ];

  protected readonly choisi = signal<string | null>(null);
  protected readonly erreur = signal(false);

  protected choisir(cle: string): void {
    this.choisi.set(cle);
    this.erreur.set(false);
  }

  protected continuer(): void {
    const role = this.choisi();
    if (!role) {
      this.erreur.set(true);
      return;
    }
    this.router.navigate(['/inscription/formulaire', role]);
  }

  /** L’adresse Google avait déjà un compte : la session est ouverte. */
  protected connecte(utilisateur: AuthResponse): void {
    void this.router.navigate([utilisateur.doitChangerMotDePasse ? '/premiere-connexion' : '/accueil']);
  }

  protected abandonnerGoogle(): void {
    this.inscriptionGoogle.oublier();
  }
}
