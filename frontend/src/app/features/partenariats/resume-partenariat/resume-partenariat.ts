import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MonPartenariat } from '../../../core/services/models/partenariat.model';
import { IndicateursPartenariatsService } from '../../../core/services/partenariats/indicateurs-partenariats';

/** En tête de la page Partenariat : statut de partenaire, prochaine échéance, accords en vigueur, réponses attendues. */
@Component({
  selector: 'app-resume-partenariat',
  imports: [DatePipe, RouterLink],
  templateUrl: './resume-partenariat.html',
  styleUrl: './resume-partenariat.scss',
})
export class ResumePartenariat implements OnInit {
  private readonly service = inject(IndicateursPartenariatsService);
  protected readonly resume = signal<MonPartenariat | null>(null);

  ngOnInit(): void {
    // Le résumé complète la page : s’il échoue, la page reste utilisable avec ses listes.
    this.service.monPartenariat().subscribe({ next: (r) => this.resume.set(r), error: () => this.resume.set(null) });
  }
}
