import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeanceMentorat } from '../../../../core/services/models/mentorat.model';
import { saisir, soumettre, uneSeance } from '../../testing/donnees-mentorat';
import { SeancesMentorat } from './seances-mentorat';

describe('SeancesMentorat', () => {
  let fixture: ComponentFixture<SeancesMentorat>;
  let http: HttpTestingController;
  let racine: HTMLElement;
  let modifications: number;

  function afficher(seances: SeanceMentorat[], modifiable = true): void {
    fixture.componentRef.setInput('mentoratId', 'm1');
    fixture.componentRef.setInput('seances', seances);
    fixture.componentRef.setInput('modifiable', modifiable);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SeancesMentorat],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SeancesMentorat);
    racine = fixture.nativeElement;
    modifications = 0;
    fixture.componentInstance.modifiee.subscribe(() => modifications++);
  });

  afterEach(() => http.verify());

  const bouton = (texte: string) => [...racine.querySelectorAll('button')]
    .find((element) => element.textContent?.includes(texte)) as HTMLButtonElement | undefined;

  it('invite à planifier la première séance', () => {
    afficher([]);
    expect(racine.querySelector('.vide')?.textContent).toContain('Planifiez la première rencontre');
  });

  it('n’offre aucune action quand le mentorat n’est pas en cours', () => {
    afficher([uneSeance()], false);
    expect(bouton('Planifier une séance')).toBeUndefined();
    expect(bouton('Consigner la séance')).toBeUndefined();
  });

  it('exige une date et envoie la séance au format attendu', async () => {
    afficher([]);
    bouton('Planifier une séance')?.click();
    fixture.detectChanges();
    soumettre(racine.querySelector('.planification') as HTMLFormElement);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('#erreur-debut')?.textContent).toContain('Indiquez la date et l’heure');
    http.expectNone('/api/mentorat/mentorats/m1/seances');

    saisir(racine.querySelector('#seance-debut') as HTMLInputElement, '2026-10-28T18:00');
    saisir(racine.querySelector('#seance-duree') as HTMLSelectElement, '60');
    saisir(racine.querySelector('#seance-lieu') as HTMLInputElement, '  https://meet.example.test/a  ');
    fixture.detectChanges();
    soumettre(racine.querySelector('.planification') as HTMLFormElement);
    await fixture.whenStable();

    const requete = http.expectOne('/api/mentorat/mentorats/m1/seances');
    expect(requete.request.body).toEqual({
      debut: new Date('2026-10-28T18:00').toISOString(),
      dureeMinutes: 60,
      modalite: 'VISIO',
      lieuOuLien: 'https://meet.example.test/a',
    });
    requete.flush(uneSeance());
    await new Promise((fin) => setTimeout(fin));   // fin de la promesse de submit()
    fixture.detectChanges();
    expect(modifications).toBe(1);
    expect(racine.querySelector('.planification')).toBeNull();
  });

  it('adapte le libellé du lieu à la modalité', () => {
    afficher([]);
    bouton('Planifier une séance')?.click();
    fixture.detectChanges();
    expect(racine.querySelector('label[for="seance-lieu"]')?.textContent).toContain('Lien de la visio');
    saisir(racine.querySelector('#seance-modalite') as HTMLSelectElement, 'PRESENTIEL');
    fixture.detectChanges();
    expect(racine.querySelector('label[for="seance-lieu"]')?.textContent).toContain('Lieu ou précisions');
  });

  it('consigne une séance réalisée avec son compte rendu', async () => {
    afficher([uneSeance()]);
    bouton('Consigner la séance')?.click();
    fixture.detectChanges();
    saisir(racine.querySelector('#compte-rendu-s1') as HTMLTextAreaElement, '  CV relu.  ');
    fixture.detectChanges();
    bouton('Marquer comme réalisée')?.click();

    const requete = http.expectOne('/api/mentorat/mentorats/m1/seances/s1');
    expect(requete.request.body).toEqual({ statut: 'REALISEE', compteRendu: 'CV relu.' });
    requete.flush(uneSeance({ statut: 'REALISEE', compteRendu: 'CV relu.' }));
    await fixture.whenStable();
    expect(modifications).toBe(1);
  });

  it('annule une séance sans compte rendu et affiche une erreur serveur', async () => {
    afficher([uneSeance()]);
    bouton('Annuler la séance')?.click();
    const requete = http.expectOne('/api/mentorat/mentorats/m1/seances/s1');
    expect(requete.request.body).toEqual({ statut: 'ANNULEE', compteRendu: null });
    requete.flush({ message: 'Cette séance ne peut plus passer à ce statut.' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('ne peut plus passer');
    expect(modifications).toBe(0);
  });

  it('trie les séances à venir et n’ouvre que les liens https', () => {
    afficher([
      uneSeance({ id: 'tard', debut: '2026-11-10T10:00:00Z', lieuOuLien: 'javascript:alert(1)' }),
      uneSeance({ id: 'tot', debut: '2026-10-28T10:00:00Z' }),
      uneSeance({ id: 'faite', statut: 'REALISEE', compteRendu: 'Bilan' }),
      uneSeance({ id: 'annulee', statut: 'ANNULEE' }),
    ]);
    const seances = [...racine.querySelectorAll('.frise > li')];
    expect(seances).toHaveLength(4);
    expect(seances[0].querySelector('a.lien')?.getAttribute('href')).toBe('https://meet.example.test/a');
    expect(seances[1].querySelector('a.lien')).toBeNull();
    expect(seances[1].querySelector('.lieu')?.textContent).toContain('javascript:alert(1)');
    expect(seances[2].querySelector('details')?.textContent).toContain('Bilan');
    expect(seances[3].classList).toContain('annulee');
  });
});
