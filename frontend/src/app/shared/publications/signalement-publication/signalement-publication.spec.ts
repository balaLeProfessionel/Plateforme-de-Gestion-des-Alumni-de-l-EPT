import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { simulerDialogue } from '../../../testing/dialogue';
import { SignalementPublication } from './signalement-publication';

describe('SignalementPublication', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    simulerDialogue();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  async function ouvrir() {
    const fixture = TestBed.createComponent(SignalementPublication);
    const transmis: string[] = [];
    let fermetures = 0;
    fixture.componentInstance.transmis.subscribe((message) => transmis.push(message));
    fixture.componentInstance.ferme.subscribe(() => fermetures++);
    fixture.componentRef.setInput('publicationId', 'p1');
    fixture.componentRef.setInput('ouvert', true);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, racine: fixture.nativeElement as HTMLElement, transmis, fermetures: () => fermetures };
  }

  function choisir(racine: HTMLElement, valeur: string) {
    const option = racine.querySelector(`input[value="${valeur}"]`) as HTMLInputElement;
    option.checked = true;
    option.dispatchEvent(new Event('change'));
  }

  it('exige un motif, puis une précision pour « Autre », avant d’envoyer', async () => {
    const { fixture, racine, transmis, fermetures } = await ouvrir();
    expect(racine.querySelector('dialog')?.open).toBe(true);
    const formulaire = racine.querySelector('form')!;
    formulaire.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(racine.textContent).toContain('Choisissez une raison.');

    choisir(racine, 'AUTRE');
    fixture.detectChanges();
    expect(racine.querySelector('.option.choisie')?.textContent).toContain('Autre raison');
    expect(racine.querySelector('.precisions label')?.textContent).toContain('obligatoire');
    formulaire.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(racine.textContent).toContain('Précisez la raison du signalement.');
    expect(racine.querySelector('textarea')?.getAttribute('aria-invalid')).toBe('true');

    const detail = racine.querySelector('textarea')!;
    detail.value = ' Usurpation d’identité ';
    detail.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(racine.querySelector('.compteur')?.textContent?.trim()).toBe('23 / 500');
    formulaire.dispatchEvent(new Event('submit', { cancelable: true }));
    const requete = http.expectOne('/api/publications/p1/signalements');
    expect(requete.request.body).toEqual({ motif: 'AUTRE', detail: 'Usurpation d’identité' });
    requete.flush(null, { status: 201, statusText: 'Created' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('dialog')).toBeNull();
    expect(transmis).toEqual(['Merci, votre signalement a été transmis à l’administration.']);
    expect(fermetures()).toBe(1);
  });

  it('considère un second signalement comme déjà transmis', async () => {
    const { fixture, racine, transmis } = await ouvrir();
    choisir(racine, 'SPAM');
    racine.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    const requete = http.expectOne('/api/publications/p1/signalements');
    expect(requete.request.body).toEqual({ motif: 'SPAM' });
    requete.flush({ message: 'Vous avez déjà signalé cette publication.' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    expect(transmis).toEqual(['Vous avez déjà signalé cette publication.']);
  });

  it('se ferme sans rien envoyer, par « Annuler » ou par la croix', async () => {
    const { fixture, racine, transmis, fermetures } = await ouvrir();
    (racine.querySelector('.annuler') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(racine.querySelector('dialog')).toBeNull();
    expect(fixture.componentInstance.ouvert()).toBe(false);
    fixture.componentInstance.ouvert.set(true);
    fixture.detectChanges();
    (racine.querySelector('.fermer') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(racine.querySelector('dialog')).toBeNull();
    expect(fermetures()).toBe(2);
    expect(transmis).toEqual([]);
  });
});
