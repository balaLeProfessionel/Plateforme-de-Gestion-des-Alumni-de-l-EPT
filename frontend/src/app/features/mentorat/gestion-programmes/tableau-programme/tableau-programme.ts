import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ProgrammeService } from '../../../../core/services/mentorat/programmes';
import {
  LIBELLES_STATUT_MENTORAT,
  LIBELLES_STATUT_PROGRAMME,
  Programme,
  StatutMentorat,
  TableauProgramme,
} from '../../../../core/services/models/mentorat.model';
import { BoutonRetour } from '../../../../shared/bouton-retour/bouton-retour';
import { AvatarMembre } from '../../../../shared/images/avatar-membre';
import { EtiquetteRole } from '../../../../shared/roles/etiquette-role';

type Filtre = 'TOUS' | 'EN_ATTENTE' | 'ACCEPTEE' | 'TERMINEE' | 'SANS_SUITE';

interface Etat {
  programme: Programme | null;
  tableau: TableauProgramme | null;
  erreur: string | null;
}

const SANS_SUITE: readonly StatutMentorat[] = ['REFUSEE', 'ANNULEE'];

/**
 * Tableau de bord d’un programme pour l’administration : où en sont les mentorats et leurs étapes.
 * Les objectifs, comptes rendus et évaluations restent entre mentor et mentoré.
 */
@Component({
  selector: 'app-tableau-programme',
  imports: [DatePipe, RouterLink, BoutonRetour, AvatarMembre, EtiquetteRole],
  templateUrl: './tableau-programme.html',
  styleUrl: './tableau-programme.scss',
})
export class TableauProgrammePage {
  private readonly programmeService = inject(ProgrammeService);

  protected readonly libellesStatut = LIBELLES_STATUT_MENTORAT;
  protected readonly libellesProgramme = LIBELLES_STATUT_PROGRAMME;
  protected readonly filtre = signal<Filtre>('TOUS');

  protected readonly etat = toSignal(inject(ActivatedRoute).paramMap.pipe(
    map((params) => params.get('id') ?? ''),
    switchMap((id) => forkJoin({
      programme: this.programmeService.obtenir(id),
      tableau: this.programmeService.tableau(id),
    }).pipe(
      map(({ programme, tableau }): Etat => ({ programme, tableau, erreur: null })),
      catchError((erreur: HttpErrorResponse) => of<Etat>({
        programme: null,
        tableau: null,
        erreur: erreur.status === 404
          ? 'Ce programme est introuvable.'
          : erreur.error?.message ?? 'Impossible de charger le tableau de bord.',
      }))))));

  protected readonly filtres = computed(() => {
    const tableau = this.etat()?.tableau;
    if (!tableau) return [];
    return [
      { valeur: 'TOUS' as const, libelle: 'Tous', nombre: tableau.mentorats.length },
      { valeur: 'EN_ATTENTE' as const, libelle: 'En attente', nombre: tableau.enAttente },
      { valeur: 'ACCEPTEE' as const, libelle: 'En cours', nombre: tableau.enCours },
      { valeur: 'TERMINEE' as const, libelle: 'Terminés', nombre: tableau.terminees },
      { valeur: 'SANS_SUITE' as const, libelle: 'Sans suite', nombre: tableau.sansSuite },
    ];
  });

  protected readonly mentoratsAffiches = computed(() => {
    const mentorats = this.etat()?.tableau?.mentorats ?? [];
    const filtre = this.filtre();
    if (filtre === 'TOUS') return mentorats;
    if (filtre === 'SANS_SUITE') return mentorats.filter((mentorat) => SANS_SUITE.includes(mentorat.statut));
    return mentorats.filter((mentorat) => mentorat.statut === filtre);
  });

  /** Largeur d’une barre d’avancement, en pourcentage. */
  protected part(franchies: number, total: number): number {
    return total === 0 ? 0 : Math.round((100 * franchies) / total);
  }
}
