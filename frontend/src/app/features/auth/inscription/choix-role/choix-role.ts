import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { InscriptionGoogle } from '../../../../core/services/auth/inscription-google';
import { AuthResponse } from '../../../../core/services/models/auth-response.model';
import { BoutonGoogle } from '../../bouton-google/bouton-google';

interface OptionRole {
  cle: string;
  titre: string;
  description: string;
  icone: string;
}

@Component({
  selector: 'app-choix-role',
  imports: [RouterLink, BoutonGoogle],
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
      titre: 'Diplômé',
      description: "Vous avez obtenu un diplôme à l'EPT. Rejoignez le réseau des anciens, retrouvez vos camarades et accédez aux opportunités.",
      icone: 'pi-graduation-cap'
    },
    {
      cle: 'PERSONNEL',
      titre: 'Personnel EPT',
      description: "Vous êtes enseignant, chercheur ou membre de l'administration de l'EPT. Accompagnez les étudiants et gérez la vie de l'école.",
      icone: 'pi-briefcase'
    },
    {
      cle: 'ORGANISME',
      titre: 'Organisme',
      description: "Entreprise ou institution partenaire. Présentez votre organisme dans l'annuaire et publiez vos événements.",
      icone: 'pi-building'
    },
    {
      cle: 'VISITEUR',
      titre: 'Visiteur',
      description: "Vous n'avez pas de lien direct avec l'EPT mais souhaitez suivre l'actualité et les événements de la communauté.",
      icone: 'pi-user'
    }
  ];

  choisirRole(role: string): void {
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
