import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Convention, STATUTS_EN_COURS } from '../../../core/services/models/partenariat.model';
import { ConventionsPartenariatService } from '../../../core/services/partenariats/conventions-partenariat';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';
import { StatutConventionPastille } from '../statut-convention/statut-convention';

/** Conventions de l’organisme connecté, de la plus récente à la plus ancienne ; une seule demande en cours à la fois. */
@Component({
  selector: 'app-mes-conventions',
  imports: [DatePipe, RouterLink, FilAriane, StatutConventionPastille],
  templateUrl: './mes-conventions.html',
  styleUrl: './mes-conventions.scss',
})
export class MesConventions implements OnInit {
  private readonly service = inject(ConventionsPartenariatService);

  protected readonly etapes = [{ libelle: 'Accueil', lien: '/accueil' }, { libelle: 'Partenariat avec l’EPT' }];
  protected readonly conventions = signal<Convention[] | null>(null);
  protected readonly erreurChargement = signal(false);
  protected readonly demandeEnCours = computed(() => this.conventions()?.find((c) => STATUTS_EN_COURS.includes(c.statut)) ?? null);
  protected readonly partenaire = computed(() => this.conventions()?.some((c) => c.statut === 'ACTIVE') ?? false);

  ngOnInit(): void {
    this.charger();
  }

  protected charger(): void {
    this.erreurChargement.set(false);
    this.service.mesConventions().subscribe({
      next: (liste) => this.conventions.set(liste),
      error: () => this.erreurChargement.set(true),
    });
  }
}
