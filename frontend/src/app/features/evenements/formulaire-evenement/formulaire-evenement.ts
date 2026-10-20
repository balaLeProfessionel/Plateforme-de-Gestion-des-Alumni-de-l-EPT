import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField, form, maxLength, required, submit, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { EvenementService } from '../../../core/services/evenements/evenement';
import { AudienceEvenement, Evenement, EvenementRequest } from '../../../core/services/models/evenement';
import { etatNavigationEvenement, urlRetourInterne } from '../navigation-evenements';

interface ModeleFormulaireEvenement {
  titre: string;
  description: string;
  lieu: string;
  dateDebut: string;
  dateFin: string;
  audience: AudienceEvenement;
  nombrePlaces: string;
}

@Component({
  selector: 'app-formulaire-evenement',
  imports: [FormField],
  templateUrl: './formulaire-evenement.html',
  styleUrl: './formulaire-evenement.scss',
})
export class FormulaireEvenement {
  private readonly evenementService = inject(EvenementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly identifiantEvenement = signal<string | null>(null);
  protected readonly urlRetour = signal<string | null>(null);
  protected readonly urlOrigine = signal<string | null>(null);
  protected readonly modeEdition = computed(() => this.identifiantEvenement() !== null);
  protected readonly enChargement = signal(false);
  protected readonly chargementReussi = signal(true);
  protected readonly envoiEnCours = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly imageActuelle = signal<string | null>(null);
  protected readonly fichierImage = signal<File | null>(null);
  protected readonly apercuImage = signal<string | null>(null);
  protected readonly suppressionImage = signal(false);
  protected readonly erreurImage = signal<string | null>(null);
  private urlApercuTemporaire: string | null = null;
  protected readonly modele = signal<ModeleFormulaireEvenement>({
    titre: '', description: '', lieu: '', dateDebut: '', dateFin: '',
    audience: 'TOUS', nombrePlaces: '',
  });
  protected readonly formulaire = form(this.modele, (chemin) => {
    required(chemin.titre, { message: 'Le titre est obligatoire.' });
    maxLength(chemin.titre, 120, { message: 'Le titre ne peut pas dépasser 120 caractères.' });
    required(chemin.description, { message: 'La description est obligatoire.' });
    maxLength(chemin.description, 5000, { message: 'La description ne peut pas dépasser 5 000 caractères.' });
    required(chemin.lieu, { message: 'Le lieu est obligatoire.' });
    maxLength(chemin.lieu, 200, { message: 'Le lieu ne peut pas dépasser 200 caractères.' });
    required(chemin.dateDebut, { message: 'La date de début est obligatoire.' });
    required(chemin.dateFin, { message: 'La date de fin est obligatoire.' });
    required(chemin.audience, { message: 'Choisissez le public de cet événement.' });
    validate(chemin.titre, ({ value }) => value().trim().length === 0
      ? { kind: 'blank', message: 'Le titre est obligatoire.' }
      : undefined);
    validate(chemin.description, ({ value }) => value().trim().length === 0
      ? { kind: 'blank', message: 'La description est obligatoire.' }
      : undefined);
    validate(chemin.lieu, ({ value }) => value().trim().length === 0
      ? { kind: 'blank', message: 'Le lieu est obligatoire.' }
      : undefined);
    validate(chemin.dateFin, ({ value, valueOf }) => {
      const debut = valueOf(chemin.dateDebut);
      const fin = value();
      return debut && fin && new Date(fin).getTime() <= new Date(debut).getTime()
        ? { kind: 'chronologie', message: 'La fin doit être postérieure au début.' }
        : undefined;
    });
    validate(chemin.nombrePlaces, ({ value }) => value() !== '' && !/^[1-9]\d*$/.test(value())
      ? { kind: 'capacite', message: 'Indiquez un nombre entier de places supérieur à zéro.' }
      : undefined);
  });

  constructor() {
    const etat = etatNavigationEvenement();
    this.urlRetour.set(urlRetourInterne(etat.returnUrl));
    this.urlOrigine.set(urlRetourInterne(etat.originReturnUrl));
    this.destroyRef.onDestroy(() => this.libererApercu());
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      this.identifiantEvenement.set(id);
      if (id) void this.chargerEvenement(id);
      else {
        this.modele.set({
          titre: '', description: '', lieu: '', dateDebut: '', dateFin: '',
          audience: 'TOUS', nombrePlaces: '',
        });
        this.imageActuelle.set(null);
        this.fichierImage.set(null);
        this.suppressionImage.set(false);
        this.enChargement.set(false);
      }
    });
  }

  protected async soumettre(event: Event): Promise<void> {
    event.preventDefault();
    this.messageErreur.set(null);
    await submit(this.formulaire, async () => {
      if (this.envoiEnCours()) return;
      this.envoiEnCours.set(true);
      try {
        const valeurs = this.modele();
        const demande: EvenementRequest = {
          titre: valeurs.titre.trim(),
          description: valeurs.description.trim(),
          lieu: valeurs.lieu.trim(),
          dateDebut: new Date(valeurs.dateDebut).toISOString(),
          dateFin: new Date(valeurs.dateFin).toISOString(),
          audience: valeurs.audience,
          nombrePlaces: valeurs.nombrePlaces === '' ? null : Number(valeurs.nombrePlaces),
        };
        const id = this.identifiantEvenement();
        let evenement = id
          ? await firstValueFrom(this.evenementService.modifier(id, demande))
          : await firstValueFrom(this.evenementService.creer(demande));
        if (!id) this.identifiantEvenement.set(evenement.id);

        try {
          if (this.fichierImage()) {
            evenement = await firstValueFrom(this.evenementService.joindreImage(evenement.id, this.fichierImage()!));
          } else if (this.suppressionImage() && this.imageActuelle()) {
            evenement = await firstValueFrom(this.evenementService.supprimerImage(evenement.id));
          }
        } catch (erreurImage) {
          this.imageActuelle.set(evenement.urlImage);
          this.messageErreur.set(this.messageErreurImageApi(erreurImage));
          return;
        }
        this.imageActuelle.set(evenement.urlImage);
        this.reinitialiserSelectionImage();
        const destinationRetour = this.urlOrigine() ?? this.urlRetour() ?? '/evenements';
        await this.router.navigate(['/evenements', evenement.id], { state: { returnUrl: destinationRetour } });
      } catch (erreur) {
        this.messageErreur.set(this.messageErreurApi(erreur));
      } finally {
        this.envoiEnCours.set(false);
      }
    });
  }

  protected retourner(): void {
    const urlRetour = this.urlRetour();
    if (urlRetour) {
      void this.router.navigateByUrl(urlRetour);
      return;
    }
    const params = this.route.snapshot.queryParamMap;
    void this.router.navigate(['/evenements'], {
      queryParams: {
        periode: params.get('periode') === 'PASSES' ? 'PASSES' : 'AVENIR',
        page: this.lirePageRetour(params.get('page')),
        vue: this.modeEdition() || params.get('vue') === 'mes' ? 'mes' : null
      }
    });
  }

  private lirePageRetour(valeur: string | null): number {
    const page = Number(valeur);
    return Number.isSafeInteger(page) && page >= 0 ? page : 0;
  }

  protected selectionnerImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.item(0) ?? null;
    this.erreurImage.set(null);
    if (!fichier) return;
    if (!['image/jpeg', 'image/png'].includes(fichier.type)) {
      this.erreurImage.set('Choisissez une image JPEG ou PNG.');
      input.value = '';
      return;
    }
    if (fichier.size > 5 * 1024 * 1024) {
      this.erreurImage.set('L’image ne doit pas dépasser 5 Mo.');
      input.value = '';
      return;
    }
    this.suppressionImage.set(false);
    this.fichierImage.set(fichier);
    this.definirApercu(fichier);
  }

  protected annulerSelectionImage(input?: HTMLInputElement): void {
    this.fichierImage.set(null);
    this.libererApercu();
    this.apercuImage.set(this.suppressionImage() ? null : this.imageActuelle());
    this.erreurImage.set(null);
    if (input) input.value = '';
  }

  protected basculerSuppressionImage(): void {
    this.suppressionImage.update((supprimer) => !supprimer);
    this.apercuImage.set(this.suppressionImage() ? null : this.imageActuelle());
    this.erreurImage.set(null);
  }

  private definirApercu(fichier: File): void {
    this.libererApercu();
    this.urlApercuTemporaire = URL.createObjectURL(fichier);
    this.apercuImage.set(this.urlApercuTemporaire);
  }

  private libererApercu(): void {
    if (this.urlApercuTemporaire) URL.revokeObjectURL(this.urlApercuTemporaire);
    this.urlApercuTemporaire = null;
  }

  private reinitialiserSelectionImage(): void {
    this.fichierImage.set(null);
    this.suppressionImage.set(false);
    this.erreurImage.set(null);
    this.libererApercu();
    this.apercuImage.set(this.imageActuelle());
  }

  protected libelleErreur(champ: 'titre' | 'description' | 'lieu' | 'dateDebut' | 'dateFin' | 'audience' | 'nombrePlaces'):
    string | null {
    const erreur = this.formulaire[champ]().errors()[0];
    return erreur?.message ?? null;
  }

  private async chargerEvenement(id: string): Promise<void> {
    this.enChargement.set(true);
    this.chargementReussi.set(false);
    this.messageErreur.set(null);
    try {
      const evenement = await firstValueFrom(this.evenementService.obtenir(id));
      this.modele.set({
        titre: evenement.titre,
        description: evenement.description,
        lieu: evenement.lieu,
        dateDebut: this.versDateLocale(evenement.dateDebut),
        dateFin: this.versDateLocale(evenement.dateFin),
        audience: evenement.audience,
        nombrePlaces: evenement.nombrePlaces?.toString() ?? '',
      });
      this.imageActuelle.set(evenement.urlImage);
      this.fichierImage.set(null);
      this.suppressionImage.set(false);
      this.apercuImage.set(evenement.urlImage);
      this.chargementReussi.set(true);
    } catch (erreur) {
      this.messageErreur.set(erreur instanceof HttpErrorResponse && erreur.status === 404
        ? 'Cet événement ne peut pas être modifié ou n’est plus disponible.'
        : 'Impossible de charger cet événement. Vérifiez vos droits puis réessayez.');
    } finally {
      this.enChargement.set(false);
    }
  }

  protected reessayerChargement(): void {
    const id = this.identifiantEvenement();
    if (id) void this.chargerEvenement(id);
  }

  private versDateLocale(instant: string): string {
    const date = new Date(instant);
    const decalage = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - decalage).toISOString().slice(0, 16);
  }

  private messageErreurApi(erreur: unknown): string {
    if (erreur instanceof HttpErrorResponse) {
      if (erreur.status === 403 || erreur.status === 404) {
        return 'Vous ne disposez pas des droits nécessaires pour cette action.';
      }
      if (erreur.status === 400) {
        return erreur.error?.message ?? 'Vérifiez les informations et les dates saisies.';
      }
      if (erreur.status === 429) {
        return erreur.error?.message ?? 'La limite de création a été atteinte. Réessayez plus tard.';
      }
    }
    return 'Une erreur est survenue. Vos informations n’ont pas été enregistrées.';
  }

  private messageErreurImageApi(erreur: unknown): string {
    if (erreur instanceof HttpErrorResponse && erreur.status === 413) {
      return 'L’image dépasse la taille maximale de 5 Mo.';
    }
    if (erreur instanceof HttpErrorResponse && erreur.status === 400) {
      return erreur.error?.message ?? 'Cette image ne peut pas être utilisée.';
    }
    return 'L’événement est enregistré, mais l’image n’a pas été enregistrée. Réessayez.';
  }
}
