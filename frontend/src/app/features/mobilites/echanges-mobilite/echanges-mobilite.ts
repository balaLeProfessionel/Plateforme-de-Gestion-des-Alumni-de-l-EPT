import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  etapesMobilite, LIBELLES_STATUT_MOBILITE, LIBELLES_TYPE_MOBILITE, Mobilite,
} from '../../../core/services/models/mobilite.model';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';
import { Frise } from '../../../shared/frise/frise';
import { FormulaireAccueil } from '../formulaire-accueil/formulaire-accueil';

/**
 * Échanges de l’institut avec l’EPT : les étudiants qu’il envoie (proposés, acceptés ou refusés par l’école) et les
 * membres de l’EPT qu’il accueille. Une proposition se corrige tant que l’école ne l’a pas traitée.
 */
@Component({
  selector: 'app-echanges-mobilite',
  imports: [DatePipe, RouterLink, FilAriane, Frise, FormulaireAccueil],
  templateUrl: './echanges-mobilite.html',
  styleUrl: '../mes-offres-mobilite/mes-offres-mobilite.scss',
})
export class EchangesMobilite implements OnInit {
  private readonly service = inject(OffresMobiliteService);

  protected readonly etapes = [{ libelle: 'Mes offres de mobilité', lien: '/mobilites/mes-offres' }, { libelle: 'Échanges avec l’EPT' }];
  protected readonly statuts = LIBELLES_STATUT_MOBILITE;
  protected readonly types = LIBELLES_TYPE_MOBILITE;
  protected readonly frise = etapesMobilite;
  protected readonly mobilites = signal<Mobilite[] | null>(null);
  protected readonly erreurChargement = signal(false);
  /** null : formulaire fermé ; 'nouvelle' : proposer ; sinon la proposition corrigée. */
  protected readonly formulaire = signal<'nouvelle' | Mobilite | null>(null);
  protected readonly message = signal('');
  protected readonly envoyes = computed(() => this.mobilites()?.filter((m) => m.sens === 'ENTRANTE') ?? []);
  protected readonly accueillis = computed(() => this.mobilites()?.filter((m) => m.sens === 'SORTANTE') ?? []);

  ngOnInit(): void {
    this.charger();
  }

  protected charger(): void {
    this.erreurChargement.set(false);
    this.service.mesMobilites().subscribe({
      next: (liste) => this.mobilites.set(liste),
      error: () => this.erreurChargement.set(true),
    });
  }

  protected corrigee(): Mobilite | null {
    const f = this.formulaire();
    return f && f !== 'nouvelle' ? f : null;
  }

  protected enregistree(m: Mobilite): void {
    this.message.set(this.formulaire() === 'nouvelle'
      ? `${m.personne.prenom} ${m.personne.nom} est proposé à l’école, qui vous répondra.` : 'La proposition est corrigée.');
    this.formulaire.set(null);
    this.charger();
  }
}
