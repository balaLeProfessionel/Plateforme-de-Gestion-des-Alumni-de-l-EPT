import { Component, inject, signal } from '@angular/core';
import { TYPES_ORGANISME } from '../../../core/data/types-organisme';
import { Router } from '@angular/router';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';
import { form, FormField, required } from '@angular/forms/signals';
import { InputText } from 'primeng/inputtext';
import { OrganismePublic } from '../../../core/services/models/organisme.model';

@Component({
  selector: 'app-completer-organisme',
  imports: [FormField, InputText],
  templateUrl: './completer-organisme.html',
  styleUrl: './completer-organisme.scss',
})
export class CompleterOrganisme {
  private readonly organismeService = inject(OrganismeService);
  private readonly router = inject(Router);

  protected readonly types = TYPES_ORGANISME;

  protected readonly modele = signal({
    description: '',
    secteurActivite: '',
    typeOrganisme: '',
    adresse: '',
    siteWeb: '',
    pays: ''
  });

  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.description, { message: "La description est obligatoire" });
    required(champ.secteurActivite, { message: "Le secteur d'activité est obligatoire" });
    required(champ.typeOrganisme, { message: "Le type d'organisme est obligatoire" });
  });

  protected readonly enChargement = signal(false);
  protected readonly chargementProfil = signal(true);
  protected readonly profilCharge = signal(false);
  protected readonly messageErreur = signal<string | null>(null);

  constructor() {
    this.chargerProfil();
  }

  protected chargerProfil(): void {
    this.chargementProfil.set(true);
    this.messageErreur.set(null);
    this.organismeService.obtenirMonProfil().subscribe({
      next: (profil) => {
        this.appliquerProfil(profil);
        this.profilCharge.set(true);
        this.chargementProfil.set(false);
      },
      error: (erreur) => {
        this.chargementProfil.set(false);
        this.messageErreur.set(erreur?.error?.message ?? 'Impossible de charger le profil de l’organisme.');
      }
    });
  }

  valider(): void {
    if (this.formulaire().invalid()) {
      this.formulaire().markAsTouched();
      this.messageErreur.set('Merci de compléter les champs obligatoires ci-dessous.');
      return;
    }

    this.enChargement.set(true);
    this.messageErreur.set(null);

    this.organismeService.completerMonProfilOrganisme(this.modele()).subscribe({
      next: (profil) => {
        this.appliquerProfil(profil);
        this.profilCharge.set(true);
        this.enChargement.set(false);
        this.router.navigate(['/accueil']);
      },
      error: (err) => {
        this.enChargement.set(false);
        this.messageErreur.set(err?.error?.message ?? "Échec de l'enregistrement.");
      }
    });
  }

  passer(): void {
    // L'utilisateur peut différer la complétion, il pourra y revenir plus tard
    this.router.navigate(['/accueil']);
  }

  private appliquerProfil(profil: OrganismePublic): void {
    this.modele.set({
      description: profil.description ?? '',
      secteurActivite: profil.secteurActivite ?? '',
      typeOrganisme: profil.typeOrganisme ?? '',
      adresse: profil.adresse ?? '',
      siteWeb: profil.siteWeb ?? '',
      pays: profil.pays ?? ''
    });
  }
}
