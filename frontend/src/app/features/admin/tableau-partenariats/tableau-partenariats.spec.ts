import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TableauPartenariats as Tableau } from '../../../core/services/models/partenariat.model';
import { TableauPartenariats } from './tableau-partenariats';

const chiffres = {
  partenaires: 4, conventionsActives: 5, demandesEnCours: 1, conventionsExpirees: 2, conventionsResiliees: 0, accordsStageEnVigueur: 3,
  accordsMobiliteEnVigueur: 1, accordsAVenir: 0, propositionsAExaminer: 2, expirentBientot: 1, resiliationsEnCours: 0,
};

describe('TableauPartenariats', () => {
  const afficher = (tableau: Tableau | null) => {
    TestBed.configureTestingModule({ imports: [TableauPartenariats], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TableauPartenariats);
    fixture.detectChanges();
    const requete = http.expectOne('/api/admin/partenariats/tableau-de-bord');
    if (tableau) requete.flush(tableau); else requete.flush({ message: 'Erreur' }, { status: 500, statusText: 'Erreur' });
    fixture.detectChanges();
    http.verify();
    return fixture.nativeElement as HTMLElement;
  };

  it('liste ce qui attend une action et mène à chaque fiche', () => {
    const racine = afficher({
      chiffres,
      aTraiter: [{ nature: 'ACCORD', id: 'a1', organismeNom: 'Sonatel', objet: 'Stages', motif: 'PROPOSITION', date: '2026-11-01', lien: '/admin/partenariats/accords/a1' }],
      partenairesParType: [{ cle: 'ENTREPRISE', nombre: 3 }, { cle: 'ONG', nombre: 1 }],
      parAnnee: [{ annee: 2026, conventionsSignees: 2, accordsStage: 3, accordsMobilite: 1 }],
    });
    expect(racine.querySelector('a[href="/admin/partenariats/accords/a1"]')?.textContent).toContain('Sonatel');
    expect(racine.textContent).toContain('Proposition d’accord');
    expect(racine.textContent).toContain('Organismes partenaires');
    expect(racine.textContent).toContain('Entreprises');
    const barres = [...racine.querySelectorAll<HTMLElement>('.barre span')].map((b) => b.style.width);
    expect(barres).toEqual(['100%', '33.33333333333333%']);
    expect(racine.querySelector('tbody th')?.textContent).toBe('2026');
  });

  it('dit quand rien n’attend et propose de réessayer en cas d’erreur', () => {
    const racine = afficher({ chiffres, aTraiter: [], partenairesParType: [], parAnnee: [] });
    expect(racine.textContent).toContain('Rien n’attend d’action');
    expect(racine.textContent).toContain('Aucun organisme partenaire');
  });

  it('affiche une erreur', () => {
    const racine = afficher(null);
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Chargement impossible');
  });
});
