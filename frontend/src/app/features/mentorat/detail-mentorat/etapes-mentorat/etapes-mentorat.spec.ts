import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EtapeSuivie } from '../../../../core/services/models/mentorat.model';
import { saisir, soumettre, uneEtape } from '../../testing/donnees-mentorat';
import { EtapesMentorat } from './etapes-mentorat';

describe('EtapesMentorat', () => {
  let fixture: ComponentFixture<EtapesMentorat>;
  let http: HttpTestingController;
  let racine: HTMLElement;
  let modifications: number;

  function afficher(etapes: EtapeSuivie[], modifiable = true): void {
    TestBed.configureTestingModule({
      imports: [EtapesMentorat],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EtapesMentorat);
    fixture.componentRef.setInput('mentoratId', 'm1');
    fixture.componentRef.setInput('programme', { id: 'prog1', titre: 'Orientation lycée 2026' });
    fixture.componentRef.setInput('etapes', etapes);
    fixture.componentRef.setInput('modifiable', modifiable);
    modifications = 0;
    fixture.componentInstance.modifiee.subscribe(() => modifications++);
    racine = fixture.nativeElement;
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  const bouton = (texte: string) => [...racine.querySelectorAll('button')]
    .find((element) => element.textContent?.includes(texte)) as HTMLButtonElement | undefined;
  const deuxEtapes = () => [
    uneEtape({ franchieLe: '2026-10-20T10:00:00Z', valideePar: 'Awa Diop', commentaire: 'Bon premier contact.' }),
    uneEtape({ id: 'e2', ordre: 2, titre: 'Visite de l’EPT', description: 'Découvrir l’école.' }),
  ];

  it('montre l’avancement, les étapes franchies et le lien vers le programme', () => {
    afficher(deuxEtapes());
    expect(racine.querySelector('#libelle-avancement')?.textContent).toContain('1 / 2 étape franchie');
    expect((racine.querySelector('progress') as HTMLProgressElement).value).toBe(1);
    expect(racine.querySelector('header a')?.getAttribute('href')).toBe('/mentorat/programmes/prog1');
    const lignes = racine.querySelectorAll('.liste li');
    expect(lignes[0].classList).toContain('franchie');
    expect(lignes[0].querySelector('.validation')?.textContent).toContain('validée par Awa Diop');
    expect(lignes[0].querySelector('blockquote')?.textContent).toContain('Bon premier contact.');
    expect(lignes[1].querySelector('.description')?.textContent).toContain('Découvrir l’école.');
  });

  it('valide une étape avec un commentaire facultatif puis prévient la page', async () => {
    afficher(deuxEtapes());
    bouton('Valider l’étape')?.click();
    fixture.detectChanges();
    saisir(racine.querySelector('#commentaire-e2') as HTMLTextAreaElement, '  Visite faite.  ');
    soumettre(racine.querySelector('form.confirmation') as HTMLFormElement);
    await fixture.whenStable();

    const requete = http.expectOne('/api/mentorat/mentorats/m1/etapes/e2');
    expect(requete.request.method).toBe('PUT');
    expect(requete.request.body).toEqual({ commentaire: 'Visite faite.' });
    requete.flush(uneEtape({ id: 'e2', franchieLe: '2026-10-23T10:00:00Z' }));
    await fixture.whenStable();
    expect(modifications).toBe(1);
  });

  it('annule une validation et affiche le refus du serveur', async () => {
    afficher(deuxEtapes());
    bouton('Annuler la validation')?.click();
    const requete = http.expectOne('/api/mentorat/mentorats/m1/etapes/e1');
    expect(requete.request.method).toBe('DELETE');
    requete.flush({ message: 'Ce programme est clos : ses étapes ne se valident plus.' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Ce programme est clos');
    expect(modifications).toBe(0);
  });

  it('reste en lecture seule quand le mentorat n’est plus en cours', () => {
    afficher(deuxEtapes(), false);
    expect(racine.querySelectorAll('button')).toHaveLength(0);
    expect(racine.querySelector('.aide')).toBeNull();
  });
});
