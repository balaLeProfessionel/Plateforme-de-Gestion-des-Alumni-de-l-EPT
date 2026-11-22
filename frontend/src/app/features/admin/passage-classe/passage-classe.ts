import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, computed, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { AdminComptesService } from '../../../core/services/admin/admin-comptes';
import { ClasseEtudiante, CompteAdmin, nomDuCompte, ResultatPassage } from '../../../core/services/models/admin.model';
import {
  Classe, CLASSE_SUIVANTE, CLASSES_PAR_CYCLE, LIBELLES_CLASSE,
} from '../../../core/services/models/classe.model';
import { PageAdmin } from '../page-admin/page-admin';

/** Groupe choisi : classe et filière (null : non renseignée) ; `choisi` distingue l’absence de choix. */
interface Choix { classe: Classe | null; filiere: string | null; choisi: boolean }

/** Valeur d’URL d’une classe ou d’une filière non renseignée. */
const AUCUNE = 'aucune';

/**
 * Passage annuel en masse : les étudiants d’une classe (et d’une filière) passent dans la classe suivante,
 * redoublants décochés. En fin de cycle (DIC3, Master 2, Doctorat 3), la page renvoie vers la diplomation.
 */
@Component({
  selector: 'app-passage-classe',
  imports: [RouterLink, PageAdmin],
  templateUrl: './passage-classe.html',
  styleUrls: ['../formulaire-admin.scss', '../diplomes/diplomes.scss', './passage-classe.scss'],
})
export class PassageClasse {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AdminComptesService);
  private readonly injector = inject(Injector);
  private readonly boutonConfirmer = viewChild<ElementRef<HTMLElement>>('boutonConfirmer');
  private readonly messageResultat = viewChild<ElementRef<HTMLElement>>('messageResultat');

  protected readonly nomDuCompte = nomDuCompte;
  protected readonly libelles = LIBELLES_CLASSE;
  protected readonly classesParCycle = CLASSES_PAR_CYCLE;
  private readonly version = signal(0);
  protected readonly groupes = signal<ClasseEtudiante[] | null>(null);
  protected readonly choix = toSignal(this.route.queryParamMap.pipe(map(choixDepuis)), {
    initialValue: choixDepuis(this.route.snapshot.queryParamMap),
  });
  protected readonly cleChoisie = computed(() => cle(this.choix()));
  protected readonly etudiants = signal<CompteAdmin[] | null>(null);
  protected readonly selection = signal<ReadonlySet<string>>(new Set());
  /** Classe d’arrivée : la suivante par défaut, modifiable (correction, admission parallèle). */
  protected readonly arrivee = signal<Classe | ''>('');
  protected readonly finDeCycle = computed(() => this.choix().classe !== null && CLASSE_SUIVANTE[this.choix().classe as Classe] === null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly confirmation = signal(false);
  protected readonly enCours = signal(false);
  protected readonly resultat = signal<{ arrivee: Classe; resultat: ResultatPassage } | null>(null);

  constructor() {
    toObservable(this.version).pipe(
      switchMap(() => this.service.classes().pipe(catchError(() => of([] as ClasseEtudiante[])))),
      takeUntilDestroyed(),
    ).subscribe((groupes) => this.groupes.set(groupes));

    toObservable(computed(() => ({ choix: this.choix(), version: this.version() }))).pipe(
      switchMap(({ choix }) => !choix.choisi ? of({ etudiants: null, erreur: null })
        : this.service.rechercher({
          recherche: '', role: 'ETUDIANT', statut: null,
          classe: choix.classe, sansClasse: choix.classe === null,
          filiere: choix.filiere, sansFiliere: choix.filiere === null,
        }, 0, 100).pipe(
          map((page) => ({ etudiants: page.contenu.filter((compte) => compte.statutCompte !== 'SUSPENDU'), erreur: null })),
          catchError((erreur: HttpErrorResponse) => of({ etudiants: null, erreur: erreur.error?.message ?? 'Impossible de charger les étudiants.' })))),
      takeUntilDestroyed(),
    ).subscribe(({ etudiants, erreur }) => {
      this.etudiants.set(etudiants);
      this.erreur.set(erreur);
      this.selection.set(new Set((etudiants ?? []).map((compte) => compte.id)));
      const depart = this.choix().classe;
      this.arrivee.set(depart ? CLASSE_SUIVANTE[depart] ?? '' : '');
      this.confirmation.set(false);
    });
  }

  protected libelleGroupe(groupe: ClasseEtudiante): string {
    return `${groupe.classe ? LIBELLES_CLASSE[groupe.classe] : 'Classe non renseignée'} · ${groupe.filiere ?? 'Filière non renseignée'}`
      + ` (${groupe.nombre} ${groupe.nombre > 1 ? 'étudiants' : 'étudiant'})`;
  }

  protected cleDe(groupe: ClasseEtudiante): string {
    return cle(groupe);
  }

  protected choisirGroupe(valeur: string): void {
    const groupe = this.groupes()?.find((g) => cle(g) === valeur);
    const queryParams: Record<string, string> = groupe
      ? { classe: groupe.classe ?? AUCUNE, filiere: groupe.filiere ?? AUCUNE }
      : {};
    this.resultat.set(null);
    void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }

  protected choisirArrivee(valeur: string): void {
    this.arrivee.set(valeur as Classe | '');
    this.confirmation.set(false);
  }

  protected basculer(id: string): void {
    this.selection.update((selection) => {
      const suivante = new Set(selection);
      if (suivante.has(id)) suivante.delete(id); else suivante.add(id);
      return suivante;
    });
  }

  protected toutBasculer(): void {
    const etudiants = this.etudiants() ?? [];
    this.selection.set(this.selection().size === etudiants.length ? new Set() : new Set(etudiants.map((compte) => compte.id)));
  }

  protected demanderConfirmation(): void {
    if (!this.arrivee() || this.selection().size === 0) return;
    this.confirmation.set(true);
    afterNextRender(() => this.boutonConfirmer()?.nativeElement.focus(), { injector: this.injector });
  }

  protected passer(): void {
    const arrivee = this.arrivee();
    if (this.enCours() || !arrivee) return;
    this.enCours.set(true);
    this.service.passerEnClasse([...this.selection()], this.choix().classe, arrivee).subscribe({
      next: (resultat) => {
        this.enCours.set(false);
        this.resultat.set({ arrivee, resultat });
        this.version.update((version) => version + 1);
        afterNextRender(() => this.messageResultat()?.nativeElement.focus(), { injector: this.injector });
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.confirmation.set(false);
        this.erreur.set(erreur.error?.message ?? 'Le passage n’a pas pu être enregistré. Réessayez.');
      },
    });
  }
}

function cle(choix: Pick<Choix, 'classe' | 'filiere'>): string {
  return `${choix.classe ?? ''}|${choix.filiere ?? ''}`;
}

function choixDepuis(params: ParamMap): Choix {
  const classe = params.get('classe');
  const filiere = params.get('filiere');
  return {
    classe: classe && classe in LIBELLES_CLASSE ? classe as Classe : null,
    filiere: filiere && filiere !== AUCUNE ? filiere : null,
    choisi: params.has('classe') || params.has('filiere'),
  };
}
