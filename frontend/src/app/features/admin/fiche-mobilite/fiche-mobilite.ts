import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  etapesMobilite, EvenementHistorique, LIBELLES_ACTION, LIBELLES_SENS, LIBELLES_STATUT_MOBILITE, LIBELLES_TYPE_MOBILITE, Mobilite,
} from '../../../core/services/models/mobilite.model';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { Frise } from '../../../shared/frise/frise';
import { PageAdmin } from '../page-admin/page-admin';

/** Fiche d’une mobilité : avancement, personne, établissement, et l’historique de la mobilité, de sa candidature et de son offre. */
@Component({
  selector: 'app-fiche-mobilite',
  imports: [DatePipe, RouterLink, PageAdmin, Frise],
  templateUrl: './fiche-mobilite.html',
  styleUrls: ['../etats-admin.scss', './fiche-mobilite.scss'],
})
export class FicheMobilite implements OnInit {
  private readonly service = inject(OffresMobiliteService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly parents = [{ libelle: 'Suivi des mobilités', lien: '/admin/mobilites/suivi' }];
  protected readonly sens = LIBELLES_SENS;
  protected readonly statuts = LIBELLES_STATUT_MOBILITE;
  protected readonly types = LIBELLES_TYPE_MOBILITE;
  protected readonly actions = LIBELLES_ACTION;
  protected readonly frise = etapesMobilite;
  protected readonly mobilite = signal<Mobilite | null>(null);
  protected readonly historique = signal<EvenementHistorique[]>([]);
  protected readonly erreur = signal<string | null>(null);

  ngOnInit(): void {
    this.service.mobilite(this.id).subscribe({
      next: (m) => this.mobilite.set(m),
      error: (e: HttpErrorResponse) => this.erreur.set(e.status === 404 ? 'Cette mobilité n’existe pas.' : 'Impossible de charger la mobilité.'),
    });
    this.service.historique(this.id).subscribe({ next: (h) => this.historique.set(h), error: () => this.historique.set([]) });
  }
}
