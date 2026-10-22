import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ProgrammeService } from '../../../../core/services/mentorat/programmes';
import { LIBELLES_STATUT_PROGRAMME, Programme } from '../../../../core/services/models/mentorat.model';
import { FilAriane } from '../../../../shared/fil-ariane/fil-ariane';

interface EtatListe {
  programmes: Programme[] | null;
  erreur: string | null;
}

/** Les programmes que je gère : les miens pour le personnel, tous pour l’administration. */
@Component({
  selector: 'app-programmes-geres',
  imports: [DatePipe, RouterLink, FilAriane],
  templateUrl: './programmes-geres.html',
  styleUrl: './programmes-geres.scss',
})
export class ProgrammesGeres {
  protected readonly libellesStatut = LIBELLES_STATUT_PROGRAMME;
  protected readonly etat = toSignal(inject(ProgrammeService).listerGeres().pipe(
    map((programmes): EtatListe => ({ programmes, erreur: null })),
    catchError((erreur: HttpErrorResponse) => of<EtatListe>({
      programmes: null,
      erreur: erreur.error?.message ?? 'Impossible de charger les programmes.',
    }))));
}
