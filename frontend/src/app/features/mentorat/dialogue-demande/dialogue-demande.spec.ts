import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { unMentor, unMentorat, saisir, simulerDialogue, soumettre } from '../testing/donnees-mentorat';
import { DialogueDemande } from './dialogue-demande';

describe('DialogueDemande', () => {
  let fixture: ComponentFixture<DialogueDemande>;
  let http: HttpTestingController;
  let racine: HTMLElement;

  beforeEach(() => {
    simulerDialogue();
    TestBed.configureTestingModule({
      imports: [DialogueDemande],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DialogueDemande);
    racine = fixture.nativeElement;
  });

  afterEach(() => http.verify());

  const dialogue = () => racine.querySelector('dialog') as HTMLDialogElement;
  const objectif = () => racine.querySelector('#demande-objectif') as HTMLTextAreaElement;
  const formulaire = () => racine.querySelector('form') as HTMLFormElement;

  it('reste fermée sans mentor, s’ouvre avec un mentor et se ferme quand il est retiré', () => {
    fixture.detectChanges();
    expect(dialogue().open).toBe(false);

    fixture.componentRef.setInput('mentor', unMentor());
    fixture.detectChanges();
    expect(dialogue().open).toBe(true);
    expect(racine.textContent).toContain('à Awa Diop');

    fixture.componentRef.setInput('mentor', null);
    fixture.detectChanges();
    expect(dialogue().open).toBe(false);
  });

  it('présélectionne le domaine unique et exige un objectif', async () => {
    fixture.componentRef.setInput('mentor', unMentor());
    fixture.detectChanges();
    expect((racine.querySelector('#demande-domaine') as HTMLSelectElement).value).toBe('d1');

    soumettre(formulaire());
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('#erreur-objectif')?.textContent).toContain('Décrivez ce que vous attendez');
    expect(objectif().getAttribute('aria-invalid')).toBe('true');
    await fixture.whenStable();
    expect(document.activeElement).toBe(objectif());

    saisir(objectif(), '     ');
    soumettre(formulaire());
    await fixture.whenStable();
    http.expectNone('/api/mentorat/mentorats');
  });

  it('demande de choisir un domaine quand le mentor en propose plusieurs', async () => {
    fixture.componentRef.setInput('mentor', unMentor({ domaines: [
      { id: 'd1', code: 'DATA_IA', libelle: 'Data & IA' },
      { id: 'd2', code: 'CARRIERE', libelle: 'Carrière' },
    ] }));
    fixture.detectChanges();
    saisir(objectif(), 'Préparer mon stage');
    soumettre(formulaire());
    await fixture.whenStable();
    fixture.detectChanges();

    expect(racine.querySelector('#erreur-domaine')?.textContent).toContain('Choisissez un domaine');
    http.expectNone('/api/mentorat/mentorats');
  });

  it('envoie la demande nettoyée et la signale au parent', async () => {
    const envoyees: string[] = [];
    fixture.componentInstance.envoyee.subscribe((mentorat) => envoyees.push(mentorat.id));
    fixture.componentRef.setInput('mentor', unMentor());
    fixture.detectChanges();
    saisir(objectif(), '  Préparer mon stage  ');
    fixture.detectChanges();
    expect(racine.querySelector('#aide-objectif')?.textContent).toContain('22 / 1000');

    soumettre(formulaire());
    const requete = http.expectOne('/api/mentorat/mentorats');
    expect(requete.request.body).toEqual({ profilMentorId: 'p1', domaineId: 'd1', objectif: 'Préparer mon stage' });
    requete.flush(unMentorat());
    await fixture.whenStable();

    expect(envoyees).toEqual(['m1']);
  });

  it('affiche le message métier renvoyé par le serveur et garde la saisie', async () => {
    fixture.componentRef.setInput('mentor', unMentor());
    fixture.detectChanges();
    saisir(objectif(), 'Préparer mon stage');
    soumettre(formulaire());
    http.expectOne('/api/mentorat/mentorats').flush(
      { message: 'Vous avez déjà une demande en cours avec ce mentor.' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(racine.querySelector('.erreur-api')?.textContent).toContain('déjà une demande en cours');
    expect(objectif().value).toBe('Préparer mon stage');
    expect(dialogue().open).toBe(true);
  });

  it('signale la fermeture par le bouton Annuler', () => {
    let fermetures = 0;
    fixture.componentInstance.fermee.subscribe(() => fermetures++);
    fixture.componentRef.setInput('mentor', unMentor());
    fixture.detectChanges();

    (racine.querySelector('footer .secondaire') as HTMLButtonElement).click();
    expect(dialogue().open).toBe(false);
    expect(fermetures).toBe(1);
  });
});
