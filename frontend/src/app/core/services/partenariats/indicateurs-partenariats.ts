import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { MonPartenariat, TableauPartenariats } from '../models/partenariat.model';

/** Indicateurs des partenariats : tableau de bord des Relations extérieures, résumé d’un organisme. */
@Service()
export class IndicateursPartenariatsService {
  private readonly http = inject(HttpClient);

  tableau() {
    return this.http.get<TableauPartenariats>('/api/admin/partenariats/tableau-de-bord');
  }

  monPartenariat() {
    return this.http.get<MonPartenariat>('/api/partenariats/mon-partenariat');
  }
}
