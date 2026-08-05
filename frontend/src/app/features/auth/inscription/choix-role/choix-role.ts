import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

interface OptionRole {
  cle: string;
  titre: string;
  description: string;
  icone: string;
}

@Component({
  selector: 'app-choix-role',
  imports: [],
  templateUrl: './choix-role.html',
  styleUrl: './choix-role.scss',
})
export class ChoixRole {
  private readonly router = inject(Router);

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
      description: "Entreprise ou institution partenaire. Publiez des offres, recrutez des ingénieurs et collaborez avec l'école.",
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
}
