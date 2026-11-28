import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth-service';
import { OffreEmploi } from '../../../core/services/models/offre-emploi.model';
import { authEmploi, uneOffreEmploi, uneOffreGeree } from '../testing/donnees-offres-emploi';
import { DetailOffreEmploi } from './detail-offre-emploi';

describe('DetailOffreEmploi', () => {
  let fixture: ComponentFixture<DetailOffreEmploi>;
  let http: HttpTestingController;

  const afficher = (reponse: OffreEmploi | null, role = 'PERSONNEL') => {
    TestBed.configureTestingModule({
      imports: [DetailOffreEmploi],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]), { provide: AuthService, useValue: authEmploi(role) },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'e1' }) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DetailOffreEmploi);
    fixture.detectChanges();
    const requete = http.expectOne('/api/offres-emploi/e1');
    if (reponse) requete.flush(reponse);
    else requete.flush({ message: 'Cette offre d’emploi est introuvable.' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.includes(texte)) as HTMLButtonElement;

  afterEach(() => http.verify());

  it('dit qui a relayé l’offre, d’où elle vient, et mène à l’annonce d’origine dans un nouvel onglet', () => {
    const racine = afficher(uneOffreEmploi());
    expect(racine.querySelector('h1')?.textContent).toContain('Développeur Java');
    const provenance = racine.querySelector('.provenance') as HTMLElement;
    expect(provenance.textContent).toContain('Awa Diop, promo 2019');
    expect(provenance.textContent).toContain('vue sur LinkedIn');
    expect(provenance.textContent).toContain('L’EPT ne vérifie pas cette annonce');
    const lien = provenance.querySelector('a') as HTMLAnchorElement;
    expect(lien.href).toBe('https://emplois.example.sn/42');
    expect(lien.target).toBe('_blank');
    expect(lien.rel).toContain('noopener');
    expect(racine.textContent).toContain('Toutes les filières.');
    expect(racine.querySelector('.gestion')).toBeNull();
  });

  it('ne mène plus à l’annonce d’une offre expirée', () => {
    const racine = afficher(uneOffreEmploi({ expiree: true }));
    expect(racine.querySelector('.pastille.expiree')).not.toBeNull();
    expect(racine.querySelector('.provenance a')).toBeNull();
  });

  it('laisse l’auteur retirer son offre après confirmation', () => {
    const racine = afficher(uneOffreEmploi({ modifiable: true, signalable: false }));
    expect(racine.querySelector('a[href="/offres-emploi/e1/modifier"]')).not.toBeNull();
    expect(racine.querySelector('app-signaler-offre')).toBeNull();
    bouton(racine, 'Retirer').click();
    fixture.detectChanges();
    bouton(racine, 'Retirer l’offre').click();
    http.expectOne({ method: 'PATCH', url: '/api/offres-emploi/e1/retirer' }).flush(uneOffreEmploi({ statut: 'RETIREE' }));
    fixture.detectChanges();
    expect(racine.querySelector('.pastilles')?.textContent).toContain('Retirée');
    expect(racine.querySelector('.gestion')).toBeNull();
  });

  it('envoie un signalement puis remercie le membre', async () => {
    const racine = afficher(uneOffreEmploi());
    bouton(racine, 'Signaler un problème').click();
    fixture.detectChanges();
    const motif = racine.querySelector('#signalement-motif') as HTMLSelectElement;
    motif.value = 'LIEN_MORT';
    motif.dispatchEvent(new Event('input'));
    motif.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    racine.querySelector('.signalement form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    const requete = http.expectOne({ method: 'POST', url: '/api/offres-emploi/e1/signalements' });
    expect(requete.request.body).toEqual({ motif: 'LIEN_MORT', commentaire: null });
    requete.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('.signalement')?.textContent).toContain('Merci, l’école examinera votre signalement.');
  });

  it('dit qu’une offre introuvable n’est pas disponible', () => {
    const racine = afficher(null);
    expect(racine.querySelector('.etat')?.textContent).toContain('n’existe pas ou n’est plus publiée');
  });

  it('ouvre la candidature sur une offre gérée pour un alumni', () => {
    const racine = afficher(uneOffreGeree(), 'ALUMNI');
    expect(racine.querySelector('.pastille.plateforme')?.textContent).toContain('Candidature sur la plateforme');
    expect(racine.querySelector('.provenance')).toBeNull();
    http.expectOne('/api/offres-emploi/g1/ma-candidature').flush(null, { status: 204, statusText: 'No Content' });
    http.expectOne('/api/offres-emploi/mon-dernier-cv').flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    expect(racine.querySelector('app-candidature-offre-emploi form')).not.toBeNull();
  });

  it('explique à un membre du personnel qu’il ne peut pas postuler, et mène l’organisme vers sa modification', () => {
    const personnel = afficher(uneOffreGeree(), 'PERSONNEL');
    expect(personnel.querySelector('app-candidature-offre-emploi')).toBeNull();
    expect(personnel.textContent).toContain('Seuls les étudiants et les alumni de l’EPT peuvent postuler.');

    TestBed.resetTestingModule();
    const organisme = afficher(uneOffreGeree({ modifiable: true }), 'ORGANISME');
    expect(organisme.querySelector('a[href="/offres-emploi/g1/modifier-offre"]')).not.toBeNull();
  });

  it('mène le recruteur aux candidatures et signale un recrutement clôturé', () => {
    const racine = afficher(uneOffreGeree({ candidaturesConsultables: true, cloturee: true }), 'ORGANISME');
    expect(racine.querySelector('.pastille.expiree')?.textContent).toContain('Recrutement clôturé');
    expect(racine.querySelector('a.candidatures[href="/offres-emploi/g1/candidatures"]')?.textContent).toContain('Voir les candidatures');
    expect(racine.textContent).not.toContain('Seuls les étudiants et les alumni de l’EPT peuvent postuler.');
  });
});
