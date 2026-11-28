import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DetailAccord } from '../../partenariats/detail-accord/detail-accord';
import { PageAdmin } from '../page-admin/page-admin';

/** Fiche d’un accord pour le service des Relations extérieures : réponse, résiliation, documents, historique. */
@Component({
  selector: 'app-fiche-accord',
  imports: [PageAdmin, DetailAccord],
  template: `
    <app-page-admin titre="Accord" [parents]="parents">
      <app-detail-accord [id]="id" [admin]="true" />
    </app-page-admin>
  `,
})
export class FicheAccord {
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly parents = [{ libelle: 'Accords de stage et de mobilité', lien: '/admin/partenariats/accords' }];
}
