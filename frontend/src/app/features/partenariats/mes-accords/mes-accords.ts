import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Accord, LIBELLES_TYPE_ACCORD } from '../../../core/services/models/partenariat.model';
import { AccordsService } from '../../../core/services/partenariats/accords';
import { StatutAccordPastille } from '../statut-accord/statut-accord';

/** Accords de stage et de mobilité de l’organisme, ceux qui attendent sa réponse en premier. */
@Component({
  selector: 'app-mes-accords',
  imports: [DatePipe, RouterLink, StatutAccordPastille],
  templateUrl: './mes-accords.html',
  styleUrl: '../mes-conventions/mes-conventions.scss',
})
export class MesAccords implements OnInit {
  private readonly service = inject(AccordsService);

  protected readonly types = LIBELLES_TYPE_ACCORD;
  protected readonly accords = signal<Accord[] | null>(null);
  protected readonly erreurChargement = signal(false);

  ngOnInit(): void {
    this.charger();
  }

  protected charger(): void {
    this.erreurChargement.set(false);
    this.service.mesAccords().subscribe({
      next: (liste) => this.accords.set([...liste].sort((a, b) => Number(b.aRepondre) - Number(a.aRepondre))),
      error: () => this.erreurChargement.set(true),
    });
  }
}
