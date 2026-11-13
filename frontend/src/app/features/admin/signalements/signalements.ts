import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, DestroyRef, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CompteurSignalements, ModerationService, Signalement } from '../../../core/services/publications/moderation';
import { MOTIFS_SIGNALEMENT, MotifSignalement } from '../../../core/services/publications/publication';
import { ImagePublication } from '../../../shared/images/image-publication/image-publication';
import { PageAdmin } from '../page-admin/page-admin';

/** File de modération : examiner un signalement, masquer la publication visée ou rejeter le signalement. */
@Component({
  selector: 'app-signalements',
  imports: [DatePipe, PageAdmin, ImagePublication],
  templateUrl: './signalements.html',
  styleUrls: ['../etats-admin.scss', './signalements.scss'],
})
export class Signalements {
  protected readonly compteur = inject(CompteurSignalements);
  protected readonly traites = signal(false);
  protected readonly signalements = signal<Signalement[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal(false);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly confirmation = signal('');
  protected readonly enCours = signal('');
  protected readonly erreurAction = signal<Record<string, string>>({});
  protected readonly message = signal('');
  private readonly boutonConfirmer = viewChild<ElementRef<HTMLButtonElement>>('boutonConfirmer');
  private readonly service = inject(ModerationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  constructor() {
    this.charger(0);
    this.compteur.actualiser();
  }

  protected libelleMotif(motif: MotifSignalement): string {
    return MOTIFS_SIGNALEMENT.find((option) => option.motif === motif)?.libelle ?? motif;
  }

  protected afficher(traites: boolean): void {
    if (this.traites() === traites) return;
    this.traites.set(traites);
    this.message.set('');
    this.signalements.set([]);
    this.charger(0);
  }

  protected charger(page: number): void {
    this.chargement.set(true);
    this.erreur.set(false);
    this.service.lister(this.traites(), page).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (resultat) => {
        this.signalements.update((liste) => page === 0 ? resultat.contenu
          : [...liste, ...resultat.contenu.filter((s) => !liste.some((deja) => deja.id === s.id))]);
        this.page.set(resultat.page);
        this.totalPages.set(resultat.totalPages);
        this.chargement.set(false);
      },
      error: () => { this.erreur.set(true); this.chargement.set(false); },
    });
  }

  protected demanderMasquage(id: string): void {
    this.confirmation.set(id);
    afterNextRender(() => this.boutonConfirmer()?.nativeElement.focus(), { injector: this.injector });
  }

  protected masquer(signalement: Signalement): void {
    this.agir(signalement, this.service.masquerPublication(signalement.id), () => {
      // Masquer clôt tous les signalements en attente de cette publication : ils quittent la file.
      this.signalements.update((liste) => liste.filter((s) => s.publication.id !== signalement.publication.id));
      this.message.set('La publication est masquée et ses signalements sont clos.');
    });
  }

  protected rejeter(signalement: Signalement): void {
    this.agir(signalement, this.service.rejeter(signalement.id), () => {
      this.signalements.update((liste) => liste.filter((s) => s.id !== signalement.id));
      this.message.set('Le signalement est rejeté ; la publication reste visible.');
    });
  }

  private agir(signalement: Signalement, requete: ReturnType<ModerationService['rejeter']>, succes: () => void): void {
    if (this.enCours()) return;
    this.enCours.set(signalement.id);
    this.erreurAction.update(({ [signalement.id]: _ancienne, ...autres }) => autres);
    requete.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.enCours.set('');
        this.confirmation.set('');
        succes();
        this.compteur.actualiser();
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set('');
        if (erreur.status === 409) {
          this.signalements.update((liste) => liste.filter((s) => s.id !== signalement.id));
          this.message.set('Ce signalement avait déjà été traité ; la liste est à jour.');
          this.compteur.actualiser();
          return;
        }
        this.erreurAction.update((erreurs) => ({ ...erreurs,
          [signalement.id]: 'L’action n’a pas abouti. Réessayez.' }));
      },
    });
  }
}
