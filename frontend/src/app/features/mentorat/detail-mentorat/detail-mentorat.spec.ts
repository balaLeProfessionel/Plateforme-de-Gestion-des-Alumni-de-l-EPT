import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { MentoratDetail } from '../../../core/services/models/mentorat.model';
import { unDetail, unMentorat } from '../testing/donnees-mentorat';
import { DetailMentorat } from './detail-mentorat';

describe('DetailMentorat', () => {
  let fixture: ComponentFixture<DetailMentorat>;
  let http: HttpTestingController;
  let racine: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DetailMentorat],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: {
          paramMap: of(convertToParamMap({ id: 'm1' })),
          snapshot: { paramMap: convertToParamMap({ id: 'm1' }) },
        } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DetailMentorat);
    racine = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  async function charger(detail: MentoratDetail): Promise<void> {
    http.expectOne('/api/mentorat/mentorats/m1').flush(detail);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const bouton = (texte: string) => [...racine.querySelectorAll('button')]
    .find((element) => element.textContent?.includes(texte)) as HTMLButtonElement | undefined;

  it('explique qu’un mentorat inaccessible est introuvable', async () => {
    http.expectOne('/api/mentorat/mentorats/m1').flush({ message: 'introuvable' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('introuvable ou ne vous concerne pas');
  });

  it('présente les deux participants, le statut et l’historique', async () => {
    await charger(unDetail({ mentorat: unMentorat({ statut: 'ACCEPTEE', reponduLe: '2026-10-04T10:00:00Z' }) }));
    const personnes = [...racine.querySelectorAll('.personne')];
    expect(personnes.map((p) => p.getAttribute('href'))).toEqual(['/profil/u1', '/profil/u2']);
    expect(racine.querySelector('.statut')?.textContent).toContain('En cours');
    expect(racine.querySelector('.explication')?.textContent).toContain('Vous accompagnez cet étudiant');
    expect(racine.querySelector('blockquote')?.textContent).toContain('Préparer mon stage');
    expect(racine.querySelectorAll('.jalons-statut li')).toHaveLength(2);
    expect(racine.querySelector('h1')?.textContent).toContain('Mentorat Data & IA');
  });

  it('demande une confirmation avant de terminer, puis recharge', async () => {
    await charger(unDetail({ mentorat: unMentorat({ statut: 'ACCEPTEE' }) }));
    bouton('Terminer le mentorat')?.click();
    fixture.detectChanges();
    expect(racine.querySelector('.confirmation')?.textContent).toContain('Clôturer ce mentorat');

    bouton('Garder en cours')?.click();
    fixture.detectChanges();
    expect(racine.querySelector('.confirmation')).toBeNull();

    bouton('Terminer le mentorat')?.click();
    fixture.detectChanges();
    racine.querySelector<HTMLButtonElement>('.confirmation .principal')?.click();
    http.expectOne('/api/mentorat/mentorats/m1/terminer').flush(unMentorat({ statut: 'TERMINEE' }));
    await charger(unDetail({ mentorat: unMentorat({ statut: 'TERMINEE' }), peutEvaluer: true }));
    expect(bouton('Terminer le mentorat')).toBeUndefined();
    expect(racine.textContent).toContain('Ce mentorat vous a-t-il été utile');
  });

  it('laisse l’étudiant annuler sa demande en attente', async () => {
    await charger(unDetail({ mentorat: unMentorat({ monRole: 'MENTORE' }) }));
    bouton('Annuler ma demande')?.click();
    http.expectOne('/api/mentorat/mentorats/m1/annuler').flush(unMentorat({ statut: 'ANNULEE' }));
    await charger(unDetail({ mentorat: unMentorat({ monRole: 'MENTORE', statut: 'ANNULEE' }) }));
    expect(bouton('Annuler ma demande')).toBeUndefined();
  });

  it('renvoie le mentor vers les demandes reçues pour répondre', async () => {
    await charger(unDetail());
    expect(racine.querySelector('a[href="/mentorat/recues"]')?.textContent).toContain('Répondre à la demande');
  });

  it('affiche le motif d’un refus et aucune action', async () => {
    await charger(unDetail({ mentorat: unMentorat({ statut: 'REFUSEE', motifRefus: 'Agenda complet' }) }));
    expect(racine.querySelector('.motif')?.textContent).toContain('Agenda complet');
    expect(bouton('Terminer le mentorat')).toBeUndefined();
    expect(bouton('Planifier une séance')).toBeUndefined();
  });

  it('affiche l’erreur d’une action refusée par le serveur', async () => {
    await charger(unDetail({ mentorat: unMentorat({ statut: 'ACCEPTEE' }) }));
    bouton('Terminer le mentorat')?.click();
    fixture.detectChanges();
    racine.querySelector<HTMLButtonElement>('.confirmation .principal')?.click();
    http.expectOne('/api/mentorat/mentorats/m1/terminer').flush(
      { message: 'Ce mentorat n\'est plus dans un état qui permet cette action.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(racine.querySelector('.erreur')?.textContent).toContain('plus dans un état');
  });
});
