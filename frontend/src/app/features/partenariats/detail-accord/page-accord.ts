import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';
import { DetailAccord } from './detail-accord';

/** Page d’un accord dans l’espace de l’organisme. */
@Component({
  selector: 'app-page-accord',
  imports: [FilAriane, DetailAccord],
  template: `
    <div class="page-stages">
      <app-fil-ariane [etapes]="etapes" />
      <header class="entete"><h1>Accord avec l’EPT</h1></header>
      <app-detail-accord [id]="id" />
    </div>
  `,
  styleUrl: '../demande-convention/demande-convention.scss',
})
export class PageAccord {
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly etapes = [{ libelle: 'Partenariat avec l’EPT', lien: '/partenariats' }, { libelle: 'Accord' }];
}
