import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, inject, Injector, OnInit, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FilieresService } from '../../../core/services/filieres/filieres';
import {
  COMPETENCES_MAX, DUREE_MAX_MOIS, LIBELLES_TYPE_CONTRAT, OffreEmploi, OffreRelayeeRequete, TYPES_CONTRAT, TypeContrat,
} from '../../../core/services/models/offre-emploi.model';
import { OffresEmploiService } from '../../../core/services/offres-emploi/offres-emploi';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';
import { dateDans, decouper } from '../outils-formulaire';

const VIERGE = {
  titre: '', entreprise: '', typeContrat: '' as TypeContrat | '', lieu: '', dateExpiration: '', lienSource: '', source: '',
  description: '', competences: '', filieres: [] as string[],
};

/**
 * Relayer une offre vue ailleurs (#221), ou la modifier et la prolonger (route `:id/modifier`). L’offre est publiée
 * aussitôt ; le lien vers l’annonce d’origine et la date d’expiration (six mois au plus) sont obligatoires.
 */
@Component({
  selector: 'app-formulaire-offre-relayee',
  imports: [FormField, RouterLink, BoutonRetour],
  templateUrl: './formulaire-offre-relayee.html',
  styleUrl: './formulaire-offre-relayee.scss',
})
export class FormulaireOffreRelayee implements OnInit {
  private readonly service = inject(OffresEmploiService);
  private readonly router = inject(Router);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Identifiant de l’offre modifiée ; vide pour une nouvelle offre. */
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly types = TYPES_CONTRAT;
  protected readonly competencesMax = COMPETENCES_MAX;
  protected readonly libellesType = LIBELLES_TYPE_CONTRAT;
  protected readonly filieres = inject(FilieresService).proposees();
  protected readonly dateMin = dateDans(0);
  protected readonly dateMax = dateDans(DUREE_MAX_MOIS);
  protected readonly secours = this.id ? `/offres-emploi/${this.id}` : '/offres-emploi';

  protected readonly modele = signal({ ...VIERGE });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.titre, { message: 'Le titre est obligatoire.' });
    maxLength(champ.titre, 150, { message: '150 caractères au maximum.' });
    required(champ.entreprise, { message: 'Indiquez l’entreprise qui recrute.' });
    maxLength(champ.entreprise, 150, { message: '150 caractères au maximum.' });
    required(champ.typeContrat, { message: 'Choisissez le type de contrat.' });
    required(champ.lieu, { message: 'Le lieu est obligatoire.' });
    maxLength(champ.lieu, 150, { message: '150 caractères au maximum.' });
    required(champ.dateExpiration, { message: 'La date d’expiration est obligatoire.' });
    validate(champ.dateExpiration, ({ value }) => {
      if (!value()) return undefined;
      if (value() < this.dateMin) return { kind: 'passee', message: 'La date d’expiration ne peut pas être passée.' };
      return value() > this.dateMax
        ? { kind: 'lointaine', message: `Une offre reste en ligne ${DUREE_MAX_MOIS} mois au plus.` } : undefined;
    });
    required(champ.lienSource, { message: 'Le lien vers l’offre d’origine est obligatoire.' });
    maxLength(champ.lienSource, 500, { message: '500 caractères au maximum.' });
    validate(champ.lienSource, ({ value }) => value().trim() && !/^(https?:\/\/)?[^\s/]+\.[^\s]+$/i.test(value().trim())
      ? { kind: 'lien', message: 'Collez l’adresse web de l’annonce (https://…).' } : undefined);
    maxLength(champ.source, 60, { message: '60 caractères au maximum.' });
    required(champ.description, { message: 'Décrivez le poste.' });
    maxLength(champ.description, 5000, { message: '5000 caractères au maximum.' });
    validate(champ.competences, ({ value }) => {
      const liste = decouper(value());
      if (liste.length > COMPETENCES_MAX) return { kind: 'nombre', message: `${COMPETENCES_MAX} compétences au maximum.` };
      return liste.some((c) => c.length > 80) ? { kind: 'longueur', message: '80 caractères au maximum par compétence.' } : undefined;
    });
  });

  protected readonly chargement = signal(false);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly messageErreur = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.id) return;
    this.chargement.set(true);
    this.service.detail(this.id).subscribe({
      next: (offre) => {
        this.chargement.set(false);
        if (!offre.modifiable) {
          this.erreurChargement.set('Cette offre ne peut plus être modifiée.');
          return;
        }
        this.modele.set(this.versModele(offre));
      },
      error: (erreur: HttpErrorResponse) => {
        this.chargement.set(false);
        this.erreurChargement.set(erreur.status === 404 ? 'Cette offre est introuvable.' : erreur.error?.message ?? 'Impossible de charger l’offre.');
      },
    });
  }

  protected basculerFiliere(id: string, evenement: Event): void {
    const cochee = (evenement.target as HTMLInputElement).checked;
    this.modele.update((m) => ({ ...m, filieres: cochee ? [...m.filieres, id] : m.filieres.filter((f) => f !== id) }));
  }

  protected async envoyer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    this.messageErreur.set(null);
    await submit(this.formulaire, {
      action: async () => {
        try {
          const requete = this.versRequete();
          const offre = await firstValueFrom(this.id ? this.service.modifier(this.id, requete) : this.service.relayer(requete));
          await this.router.navigate(['/offres-emploi', offre.id]);
        } catch (erreur) {
          this.messageErreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
            ? erreur.error.message : 'L’enregistrement a échoué. Vérifiez les champs et réessayez.');
        }
        return undefined;
      },
      onInvalid: () => focaliserPremiereErreur(this.hote.nativeElement, this.injector),
    });
  }

  private versRequete(): OffreRelayeeRequete {
    const s = this.modele();
    return {
      titre: s.titre.trim(), entreprise: s.entreprise.trim(), typeContrat: s.typeContrat as TypeContrat, lieu: s.lieu.trim(),
      dateExpiration: s.dateExpiration, lienSource: s.lienSource.trim(), source: s.source.trim() || null,
      description: s.description.trim(), competences: decouper(s.competences), filieres: s.filieres,
    };
  }

  private versModele(offre: OffreEmploi): typeof VIERGE {
    return {
      titre: offre.titre, entreprise: offre.entreprise, typeContrat: offre.typeContrat, lieu: offre.lieu,
      dateExpiration: offre.dateExpiration, lienSource: offre.lienSource ?? '', source: offre.source ?? '',
      description: offre.description, competences: offre.competences.join(', '), filieres: offre.filieres.map((f) => f.id),
    };
  }
}
