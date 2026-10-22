import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Programme } from '../../../../core/services/models/mentorat.model';
import { ProgrammesGeres } from './programmes-geres';
import { unProgramme } from '../../testing/donnees-mentorat';

describe('ProgrammesGeres', () => {
  let fixture: ComponentFixture<ProgrammesGeres>;
  let http: HttpTestingController;
  let racine: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProgrammesGeres],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProgrammesGeres);
    racine = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  async function repondre(programmes: Programme[]): Promise<void> {
    http.expectOne('/api/mentorat/programmes/geres').flush(programmes);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('liste mes programmes avec leur statut, leur période et leurs chiffres', async () => {
    await repondre([unProgramme(), unProgramme({ id: 'p2', titre: 'Insertion pro', statut: 'OUVERT', nombreMentorats: 3 })]);

    const lignes = [...racine.querySelectorAll('.programme')] as HTMLElement[];
    expect(lignes).toHaveLength(2);
    expect(lignes[0].querySelector('h2 a')?.getAttribute('href')).toBe('/mentorat/gestion-programmes/p1');
    expect(lignes[0].querySelector('.statut')?.textContent).toContain('Brouillon');
    expect(lignes[0].querySelector('.periode')?.textContent).toMatch(/Du 1 nov\.? 2026 au 31 mars? 2027/i);
    expect(lignes[1].querySelector('.chiffres')?.textContent).toContain('3 mentorats');
    expect(racine.querySelector('.action-principale')?.getAttribute('href')).toBe('/mentorat/gestion-programmes/nouveau');
  });

  it('invite à créer un premier programme', async () => {
    await repondre([]);
    expect(racine.querySelector('.etat')?.textContent).toContain('Aucun programme pour l’instant');
  });

  it('affiche le refus du serveur', async () => {
    http.expectOne('/api/mentorat/programmes/geres').flush(
      { message: 'Les programmes sont gérés par le personnel de l’EPT et l’administration.' },
      { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('gérés par le personnel');
  });
});
