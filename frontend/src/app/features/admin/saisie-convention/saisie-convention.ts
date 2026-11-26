import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, Injector, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, form, maxLength, required, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { OrganismeSuggestion } from '../../../core/services/models/organisme.model';
import { ConventionsPartenariatService } from '../../../core/services/partenariats/conventions-partenariat';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';
import { PageAdmin } from '../page-admin/page-admin';

const AUJOURDHUI = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Africa/Dakar' }).format(new Date());

/**
 * Convention enregistrée par le service des Relations extérieures, sans demande de l’organisme : déjà signée (active,
 * dates obligatoires) ou en cours de négociation. L’organisme doit exister sur la plateforme.
 */
@Component({
  selector: 'app-saisie-convention',
  imports: [FormField, PageAdmin],
  templateUrl: './saisie-convention.html',
  styleUrls: ['../formulaire-admin.scss'],
  styles: `
    .statut { margin: 0; padding: 0; border: 0; legend { padding: 0; color: var(--ept-primary-dark); font-size: 0.85rem; font-weight: 600; } }
    .choix { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.3rem; .bouton[aria-pressed='true'] { background: var(--ept-primary); color: white; } }
  `,
})
export class SaisieConvention {
  private readonly service = inject(ConventionsPartenariatService);
  private readonly organismeService = inject(OrganismeService);
  private readonly router = inject(Router);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly parents = [{ libelle: 'Conventions de partenariat', lien: '/admin/partenariats/conventions' }];
  protected readonly aujourdhui = AUJOURDHUI;
  protected readonly modele = signal({
    organisme: '', objet: '', domaines: '', statut: 'ACTIVE' as 'ACTIVE' | 'EN_NEGOCIATION', dateSignature: '', dateDebut: '', dateFin: '',
  });
  protected readonly suggestions = signal<readonly OrganismeSuggestion[]>([]);
  protected readonly organismeConnu = computed(() => {
    const saisie = this.modele().organisme.trim().toLowerCase();
    return this.suggestions().find((s) => s.nom.toLowerCase() === saisie) ?? null;
  });
  private readonly signee = computed(() => this.modele().statut === 'ACTIVE');
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.organisme, { message: 'Choisissez l’organisme.' });
    validate(champ.organisme, ({ value }) => value().trim() && !this.organismeConnu()
      ? { kind: 'inconnu', message: 'Choisissez un organisme dans la liste proposée.' } : undefined);
    required(champ.objet, { message: 'L’objet est obligatoire.' });
    maxLength(champ.objet, 200, { message: '200 caractères au maximum.' });
    maxLength(champ.domaines, 1000, { message: '1 000 caractères au maximum.' });
    required(champ.dateSignature, { message: 'La date de signature est obligatoire.', when: () => this.signee() });
    validate(champ.dateSignature, ({ value }) => this.signee() && value() > AUJOURDHUI
      ? { kind: 'futur', message: 'La date de signature ne peut pas être dans le futur.' } : undefined);
    required(champ.dateDebut, { message: 'La date de début est obligatoire.', when: () => this.signee() });
    required(champ.dateFin, { message: 'La date de fin est obligatoire.', when: () => this.signee() });
    validate(champ.dateFin, ({ value, valueOf }) => {
      if (!this.signee() || !value()) return undefined;
      if (valueOf(champ.dateDebut) && value() < valueOf(champ.dateDebut)) return { kind: 'ordre', message: 'La fin doit suivre le début.' };
      return value() < AUJOURDHUI ? { kind: 'passee', message: 'La date de fin est déjà passée.' } : undefined;
    });
  });
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    toObservable(this.modele).pipe(
      map(({ organisme }) => organisme.trim()),
      distinctUntilChanged(),
      debounceTime(250),
      switchMap((saisie) => saisie.length < 2 ? of([]) : this.organismeService.rechercherOrganismes(saisie).pipe(catchError(() => of([])))),
      takeUntilDestroyed(),
    ).subscribe((liste) => this.suggestions.set(liste));
  }

  protected choisirStatut(statut: 'ACTIVE' | 'EN_NEGOCIATION'): void {
    this.modele.update((m) => ({ ...m, statut }));
  }

  protected envoyer(evenement: Event): void {
    evenement.preventDefault();
    this.formulaire().markAsTouched();
    const organisme = this.organismeConnu();
    if (this.formulaire().invalid() || !organisme) {
      focaliserPremiereErreur(this.hote.nativeElement, this.injector);
      return;
    }
    if (this.enCours()) return;
    const s = this.modele();
    this.enCours.set(true);
    this.erreur.set(null);
    this.service.saisir({
      organismeId: organisme.id, objet: s.objet.trim(), domaines: s.domaines.trim() || null, statut: s.statut,
      ...(s.statut === 'ACTIVE' ? { dateSignature: s.dateSignature, dateDebut: s.dateDebut, dateFin: s.dateFin } : {}),
    }).subscribe({
      next: (c) => void this.router.navigate(['/admin/partenariats/conventions', c.id], { state: { message: 'La convention est enregistrée ; l’organisme en est prévenu.' } }),
      error: (e: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(e.error?.message ?? 'L’enregistrement a échoué. Réessayez.');
      },
    });
  }

  protected annuler(): void {
    void this.router.navigate(['/admin/partenariats/conventions']);
  }
}
