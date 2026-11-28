import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { pageDOffresMobilite, uneOffreMobilite } from '../../mobilites/testing/donnees-mobilites';
import { OffresMobiliteAdmin } from './offres-mobilite';

describe('OffresMobiliteAdmin', () => {
  let fixture: ComponentFixture<OffresMobiliteAdmin>;
  let http: HttpTestingController;

  const demarrer = () => {
    TestBed.configureTestingModule({
      imports: [OffresMobiliteAdmin],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: new BehaviorSubject(convertToParamMap({})) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OffresMobiliteAdmin);
    fixture.detectChanges();
    const requete = http.expectOne((r) => r.url === '/api/admin/mobilites/offres');
    expect(requete.request.params.get('statut')).toBe('PUBLIEE');
    requete.flush(pageDOffresMobilite([uneOffreMobilite({ modifiable: true })]));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;

  afterEach(() => http.verify());

  it('exige un motif avant de retirer une offre, puis l’envoie', () => {
    const racine = demarrer();
    bouton(racine, 'Retirer…').click();
    fixture.detectChanges();
    bouton(racine, 'Retirer l’offre').click();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Le motif est obligatoire');

    const motif = racine.querySelector('textarea') as HTMLTextAreaElement;
    motif.value = 'Places non confirmées';
    motif.dispatchEvent(new Event('input'));
    bouton(racine, 'Retirer l’offre').click();
    const requete = http.expectOne('/api/admin/mobilites/offres/m1/retirer');
    expect(requete.request.body).toEqual({ motif: 'Places non confirmées' });
    requete.flush(uneOffreMobilite({ statut: 'RETIREE' }));
    http.expectOne((r) => r.url === '/api/admin/mobilites/offres').flush(pageDOffresMobilite([]));
    fixture.detectChanges();
    expect(racine.querySelector('.message')?.textContent).toContain('est retirée');
  });
});
