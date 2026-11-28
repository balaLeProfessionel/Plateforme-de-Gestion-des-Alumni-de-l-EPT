import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidatureRecueEmploi } from '../../../core/services/models/offre-emploi.model';
import { uneCandidatureRecue } from '../testing/donnees-offres-emploi';
import { CarteCandidatureRecue } from './candidature-recue-emploi';

describe('CarteCandidatureRecue', () => {
  let fixture: ComponentFixture<CarteCandidatureRecue>;
  let http: HttpTestingController;
  let emises: CandidatureRecueEmploi[];

  const afficher = (candidature = uneCandidatureRecue(), cloturee = false) => {
    TestBed.configureTestingModule({ imports: [CarteCandidatureRecue], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CarteCandidatureRecue);
    fixture.componentRef.setInput('candidature', candidature);
    fixture.componentRef.setInput('cloturee', cloturee);
    emises = [];
    fixture.componentInstance.modifiee.subscribe((c) => emises.push(c));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement | undefined;

  afterEach(() => http.verify());

  it('présente le profil vérifié, le CV, la lettre, les réponses et l’historique', () => {
    const racine = afficher();
    expect(racine.querySelector('h2')?.textContent).toContain('Awa Diop');
    expect(racine.querySelector('.profil')?.textContent).toContain('Alumni · Génie informatique · promo 2019');
    expect([...racine.querySelectorAll('.etiquettes li')].map((li) => li.textContent)).toEqual(['Java', 'Kubernetes']);
    expect(racine.querySelector('.cv button')?.textContent).toContain('cv-awa.pdf');
    expect(racine.querySelector('details')?.textContent).toContain('Je suis motivée.');
    expect(racine.querySelector('.reponses dd')?.textContent).toBe('Oui');
    expect(racine.querySelector('.historique')?.textContent).toContain('par le candidat');
  });

  it('fait avancer le statut et prévient le parent', () => {
    const racine = afficher();
    expect(['Présélectionner', 'Proposer un entretien', 'Retenir', 'Ne pas retenir'].every((t) => bouton(racine, t))).toBe(true);
    expect(racine.querySelectorAll('.decisions .principal')).toHaveLength(1);
    expect(bouton(racine, 'Présélectionner')?.classList).toContain('principal');
    bouton(racine, 'Présélectionner')?.click();
    const requete = http.expectOne({ method: 'PATCH', url: '/api/offres-emploi/candidatures/r1/statut' });
    expect(requete.request.body).toEqual({ statut: 'PRESELECTIONNEE' });
    const maj = uneCandidatureRecue({ statut: 'PRESELECTIONNEE', statutsSuivants: ['ENTRETIEN', 'RETENUE', 'NON_RETENUE'] });
    requete.flush(maj);
    fixture.detectChanges();
    expect(emises).toEqual([maj]);
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('le candidat est prévenu');
  });

  it('demande confirmation avant une décision définitive et affiche le refus du serveur', () => {
    const racine = afficher();
    bouton(racine, 'Ne pas retenir')?.click();
    fixture.detectChanges();
    http.expectNone('/api/offres-emploi/candidatures/r1/statut');
    expect(racine.querySelector('.confirmation')?.textContent).toContain('Cette décision est définitive');
    bouton(racine, 'Annuler')?.click();
    fixture.detectChanges();
    expect(racine.querySelector('.confirmation')).toBeNull();

    bouton(racine, 'Retenir')?.click();
    fixture.detectChanges();
    bouton(racine, 'Confirmer')?.click();
    http.expectOne('/api/offres-emploi/candidatures/r1/statut')
      .flush({ message: 'Cette candidature est déjà décidée : son statut ne change plus.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('déjà décidée');
    expect(emises).toEqual([]);
  });

  it('enregistre la note privée', async () => {
    const racine = afficher();
    expect(racine.querySelector('.note .aide')?.textContent).toContain('jamais par le candidat');
    const champ = racine.querySelector('#note-r1') as HTMLTextAreaElement;
    champ.value = 'Profil solide';
    champ.dispatchEvent(new Event('input'));
    racine.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    const requete = http.expectOne({ method: 'PUT', url: '/api/offres-emploi/candidatures/r1/note' });
    expect(requete.request.body).toEqual({ note: 'Profil solide' });
    requete.flush(uneCandidatureRecue({ notePrivee: 'Profil solide' }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('Note enregistrée.');
    expect(emises[0].notePrivee).toBe('Profil solide');
  });

  it('ne propose plus de décision une fois décidée ou le recrutement clôturé, et signale un CV effacé', () => {
    const decidee = afficher(uneCandidatureRecue({ statut: 'RETENUE', statutsSuivants: [], cvDisponible: false }));
    expect(decidee.querySelector('.decisions')).toBeNull();
    expect(decidee.querySelector('.cv')?.textContent).toContain('CV effacé');

    TestBed.resetTestingModule();
    const cloturee = afficher(uneCandidatureRecue(), true);
    expect(cloturee.querySelector('.decisions')).toBeNull();
  });
});
