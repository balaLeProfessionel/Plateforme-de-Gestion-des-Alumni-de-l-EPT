import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MembreOrganisme, OrganismePublic } from '../../../core/services/models/organisme.model';
import { EnteteOrganisme } from './entete-organisme';

const FICHE: OrganismePublic = {
  id: 'org-1', nom: 'Société Exemple', description: null, secteurActivite: 'Numérique', typeOrganisme: 'ENTREPRISE',
  adresse: 'Dakar', pays: 'Sénégal', siteWeb: 'https://www.exemple.sn/', logoUrl: null, statutJuridique: null,
  trancheEffectif: null, dateCreation: null, statutCompte: 'ACTIF',
};

function membre(id: string): MembreOrganisme {
  return { id, prenom: 'P', nom: id, urlPhoto: null, role: 'ALUMNI', poste: null, actuel: true, anneeDebut: 2020, anneeFin: null };
}

describe('En-tête de la fiche organisme', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [EnteteOrganisme], providers: [provideRouter([])] }));

  function creer(entrees: Record<string, unknown>) {
    const fixture = TestBed.createComponent(EnteteOrganisme);
    fixture.componentRef.setInput('fiche', FICHE);
    for (const [nom, valeur] of Object.entries(entrees)) fixture.componentRef.setInput(nom, valeur);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('présente l’organisme, son site et sa place dans le réseau', () => {
    const racine = creer({
      typeLibelle: 'Entreprise', siteWeb: 'https://www.exemple.sn/',
      reseau: { actuels: 6, anciens: 19, apercu: ['a', 'b', 'c', 'd', 'e', 'f'].map(membre) },
    });

    expect(racine.querySelector('h1')?.textContent).toBe('Société Exemple');
    expect(racine.querySelector('.resume')?.textContent).toContain('Dakar, Sénégal');
    const site = racine.querySelector<HTMLAnchorElement>('.bouton.principal');
    expect(site?.getAttribute('href')).toBe('https://www.exemple.sn/');
    expect(site?.textContent).toContain('exemple.sn, nouvel onglet');
    expect(racine.querySelector('.reseau p')?.textContent).toBe('6 membres de la communauté y travaillent, 19 y sont passés.');
    expect(racine.querySelectorAll('.visages app-avatar-membre')).toHaveLength(5);
    expect(racine.querySelector('.autres')?.textContent).toBe('+20');
    expect(racine.querySelector('a[href="/organisme/parametres"]')).toBeNull();
  });

  it('propose la modification à l’organisme et masque le réseau vide', () => {
    const racine = creer({ estMaFiche: true, reseau: { actuels: 0, anciens: 0, apercu: [] } });
    expect(racine.querySelector('a[href="/organisme/parametres"]')?.textContent).toContain('Modifier la fiche');
    expect(racine.querySelector('.bouton.principal')).toBeNull();
    expect(racine.querySelector('.reseau')).toBeNull();
  });

  it('accorde la phrase quand personne n’y travaille plus', () => {
    const racine = creer({ reseau: { actuels: 0, anciens: 1, apercu: [membre('a')] } });
    expect(racine.querySelector('.reseau p')?.textContent).toBe('1 membre de la communauté y est passé.');
  });
});
