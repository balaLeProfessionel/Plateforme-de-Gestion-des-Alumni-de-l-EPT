import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { fournirFilieres } from '../../../../core/services/filieres/filieres.testing';
import { ListeDefinitive } from '../../../../core/services/models/stage.model';
import { AjoutEtudiant } from './ajout-etudiant';

describe('AjoutEtudiant', () => {
  let fixture: ComponentFixture<AjoutEtudiant>;
  let http: HttpTestingController;
  const URL = '/api/admin/stages/etudiants';

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [AjoutEtudiant], providers: [provideHttpClient(), provideHttpClientTesting(), fournirFilieres()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AjoutEtudiant);
    fixture.componentRef.setInput('offreId', 'o1');
    fixture.componentRef.setInput('exclus', new Set(['e2']));
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  const racine = () => fixture.nativeElement as HTMLElement;
  const saisir = (texte: string) => {
    const champ = racine().querySelector('#recherche-etudiant') as HTMLInputElement;
    champ.value = texte;
    champ.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(300);
  };
  const choisir = (id: string, valeur: string) => {
    const liste = racine().querySelector(id) as HTMLSelectElement;
    liste.value = valeur;
    liste.dispatchEvent(new Event('change'));
    vi.advanceTimersByTime(0);
  };

  it('propose les classes par cycle et les filières de l’école', () => {
    const groupes = [...racine().querySelectorAll('#recherche-classe optgroup')].map((g) => g.getAttribute('label'));
    expect(groupes).toEqual(['Cycle ingénieur', 'Master', 'Doctorat']);
    expect(racine().querySelector('#recherche-classe')?.textContent).toContain('Master 1');
    expect(racine().querySelectorAll('#recherche-filiere option')).toHaveLength(6);
  });

  it('filtre par classe et filière sans nom, puis affine par nom', () => {
    choisir('#recherche-classe', 'DIC2');
    http.expectOne((r) => r.url === URL && r.params.get('classe') === 'DIC2' && !r.params.has('q')).flush([]);
    choisir('#recherche-filiere', 'f-git');
    http.expectOne((r) => r.url === URL && r.params.get('classe') === 'DIC2' && r.params.get('filiere') === 'f-git').flush([]);
    fixture.detectChanges();
    expect(racine().textContent).toContain('Aucun étudiant actif ne correspond à ces critères.');

    saisir('a');
    http.expectOne((r) => r.url === URL && !r.params.has('q') && r.params.get('filiere') === 'f-git').flush([]);
    saisir('diop');
    http.expectOne((r) => r.url === URL && r.params.get('q') === 'diop' && r.params.get('classe') === 'DIC2').flush([]);
  });

  it('ne cherche pas sans critère, signale les étudiants déjà sur la liste et ajoute les autres', () => {
    const ajoute = vi.fn();
    fixture.componentInstance.ajoute.subscribe(ajoute);
    saisir('a');
    http.expectNone((r) => r.url === URL);

    saisir('diop');
    http.expectOne((r) => r.url === URL && r.params.get('q') === 'diop').flush([
      { id: 'e1', prenom: 'Awa', nom: 'Diop', filiere: 'Génie Civil', classe: 'DIC1', anneeEntree: 2022, urlPhoto: null },
      { id: 'e2', prenom: 'Moussa', nom: 'Diop', filiere: null, classe: null, anneeEntree: 2021, urlPhoto: null },
    ]);
    fixture.detectChanges();
    const lignes = racine().querySelectorAll('.suggestions li');
    expect(lignes).toHaveLength(2);
    expect(lignes[0].textContent).toContain('DIC1 · Génie Civil');
    expect(lignes[1].textContent).toContain('Classe non renseignée');
    expect(lignes[1].textContent).toContain('Déjà sur la liste');

    (racine().querySelector('[aria-label="Ajouter Awa Diop à la liste"]') as HTMLButtonElement).click();
    const requete = http.expectOne({ method: 'POST', url: '/api/admin/stages/offres/o1/liste' });
    expect(requete.request.body).toEqual({ etudiantId: 'e1', dateDebut: null, dateFin: null });
    const liste = { offreId: 'o1', lignes: [] } as unknown as ListeDefinitive;
    requete.flush(liste);
    expect(ajoute).toHaveBeenCalledWith(liste);
  });
});
