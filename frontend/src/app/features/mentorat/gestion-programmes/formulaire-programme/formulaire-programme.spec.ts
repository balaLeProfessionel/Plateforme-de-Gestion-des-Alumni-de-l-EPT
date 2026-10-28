import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { saisir, soumettre, unProgramme } from '../../testing/donnees-mentorat';
import { FormulaireProgramme } from './formulaire-programme';

describe('FormulaireProgramme', () => {
  let fixture: ComponentFixture<FormulaireProgramme>;
  let http: HttpTestingController;
  let racine: HTMLElement;
  let navigation: ReturnType<typeof vi.fn>;

  function afficher(id: string | null): void {
    TestBed.configureTestingModule({
      imports: [FormulaireProgramme],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(FormulaireProgramme);
    racine = fixture.nativeElement;
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  /** Laisse finir l’action asynchrone de submit() (ou d’un bouton) après la réponse du serveur. */
  const terminer = async () => {
    await new Promise((fin) => setTimeout(fin));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const champ = (selecteur: string) => racine.querySelector(selecteur) as HTMLInputElement;
  const bouton = (texte: string) => [...racine.querySelectorAll('button')]
    .find((b) => b.textContent?.trim() === texte || b.getAttribute('aria-label') === texte) as HTMLButtonElement;

  async function charger(programme = unProgramme()): Promise<void> {
    http.expectOne('/api/mentorat/programmes/p1').flush(programme);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('crée un brouillon avec ses étapes dans l’ordre puis ouvre sa page de gestion', async () => {
    afficher(null);
    saisir(champ('#programme-titre'), '  Orientation lycée 2026 ');
    saisir(champ('#programme-debut'), '2026-11-01');
    saisir(champ('#programme-fin'), '2027-03-31');
    saisir(champ('#etape-titre-0'), 'Visite de l’EPT');
    bouton('Ajouter une étape').click();
    fixture.detectChanges();
    saisir(champ('#etape-titre-1'), 'Premier échange');
    fixture.detectChanges();
    bouton('Monter l’étape 2').click();
    fixture.detectChanges();
    soumettre(racine.querySelector('form') as HTMLFormElement);
    await fixture.whenStable();

    const requete = http.expectOne((r) => r.method === 'POST' && r.url === '/api/mentorat/programmes');
    expect(requete.request.body).toEqual({
      titre: 'Orientation lycée 2026', description: null, dateDebut: '2026-11-01', dateFin: '2027-03-31',
      etapes: [
        { id: null, titre: 'Premier échange', description: null },
        { id: null, titre: 'Visite de l’EPT', description: null },
      ],
    });
    requete.flush(unProgramme({ id: 'p9' }));
    await terminer();
    expect(navigation).toHaveBeenCalledWith(['/mentorat/gestion-programmes', 'p9'], { replaceUrl: true });
  });

  it('bloque une période inversée et une étape sans titre, avec le focus sur la première erreur', async () => {
    afficher(null);
    saisir(champ('#programme-titre'), 'Programme');
    saisir(champ('#programme-debut'), '2026-11-01');
    saisir(champ('#programme-fin'), '2026-10-01');
    fixture.detectChanges();
    soumettre(racine.querySelector('form') as HTMLFormElement);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(racine.querySelector('#erreur-fin')?.textContent).toContain('La date de fin doit suivre la date de début.');
    expect(racine.querySelector('#erreur-etape-0')?.textContent).toContain('Donnez un titre à cette étape.');
    http.expectNone('/api/mentorat/programmes');
  });

  it('limite à 10 étapes et permet d’en retirer', () => {
    afficher(null);
    for (let i = 0; i < 9; i++) { bouton('Ajouter une étape').click(); fixture.detectChanges(); }
    expect(racine.querySelectorAll('.etape')).toHaveLength(10);
    expect(bouton('Ajouter une étape')).toBeUndefined();
    bouton('Retirer l’étape 3').click();
    fixture.detectChanges();
    expect(racine.querySelectorAll('.etape')).toHaveLength(9);
  });

  it('modifie un programme existant en gardant l’identifiant de ses étapes', async () => {
    afficher('p1');
    await charger();
    expect(champ('#programme-titre').value).toBe('Orientation lycée 2026');
    expect(racine.querySelector('.statut')?.textContent).toContain('Brouillon');
    saisir(champ('#etape-titre-0'), 'Premier contact');
    fixture.detectChanges();
    soumettre(racine.querySelector('form') as HTMLFormElement);
    await fixture.whenStable();

    const requete = http.expectOne((r) => r.method === 'PUT' && r.url === '/api/mentorat/programmes/p1');
    expect(requete.request.body.etapes[0]).toEqual({ id: 'e1', titre: 'Premier contact', description: null });
    requete.flush(unProgramme());
    await terminer();
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('Programme enregistré.');
  });

  it('ouvre le programme et affiche l’erreur métier du serveur', async () => {
    afficher('p1');
    await charger();
    bouton('Ouvrir le programme').click();
    http.expectOne('/api/mentorat/programmes/p1/statut').flush(
      { message: 'Ajoutez au moins une étape avant d’ouvrir le programme.' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Ajoutez au moins une étape');
  });

  it('demande confirmation avant de clore, puis fige le formulaire', async () => {
    afficher('p1');
    await charger(unProgramme({ statut: 'OUVERT', nombreMentorats: 2 }));
    expect(bouton('Repasser en brouillon')).toBeUndefined();

    bouton('Clore le programme').click();
    fixture.detectChanges();
    http.expectNone('/api/mentorat/programmes/p1/statut');
    expect(racine.querySelector('.confirmer')?.textContent).toContain('Il ne pourra plus être modifié.');
    (racine.querySelector('.confirmer .danger') as HTMLButtonElement).click();

    const requete = http.expectOne('/api/mentorat/programmes/p1/statut');
    expect(requete.request.body).toEqual({ statut: 'CLOS' });
    requete.flush(unProgramme({ statut: 'CLOS', nombreMentorats: 2 }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect((racine.querySelector('fieldset') as HTMLFieldSetElement).disabled).toBe(true);
    expect(racine.querySelector('button[type="submit"]')).toBeNull();
  });

  it('supprime un brouillon après confirmation', async () => {
    afficher('p1');
    await charger();
    bouton('Supprimer le brouillon').click();
    fixture.detectChanges();
    bouton('Supprimer').click();
    http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/mentorat/programmes/p1').flush(null);
    await terminer();
    expect(navigation).toHaveBeenCalledWith(['/mentorat/gestion-programmes'], { replaceUrl: true });
  });

  it('explique qu’un programme d’un autre est introuvable', async () => {
    afficher('p1');
    http.expectOne('/api/mentorat/programmes/p1').flush({ message: 'introuvable' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('introuvable ou vous ne pouvez pas le gérer');
  });
});
