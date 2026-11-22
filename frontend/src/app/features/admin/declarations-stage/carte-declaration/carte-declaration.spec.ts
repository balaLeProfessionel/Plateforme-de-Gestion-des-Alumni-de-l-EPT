import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { Declaration } from '../../../../core/services/models/stage.model';
import { CarteDeclaration } from './carte-declaration';

function uneDeclaration(changement: Partial<Declaration> = {}): Declaration {
  return {
    id: 'd1', etudiant: { id: 'e1', prenom: 'Awa', nom: 'Diop', filiere: 'Génie Civil', classe: 'DIC2', anneeEntree: 2023, urlPhoto: null },
    email: 'awa@ept.sn', organismeId: null, organisme: 'Startup', typeStage: 'MAITRISE', sujet: 'Application mobile', lieu: 'Thiès',
    dateDebut: '2027-02-01', dateFin: '2027-04-30', tuteurNom: 'Moussa Ndiaye', tuteurFonction: 'CTO', tuteurEmail: null, tuteurTelephone: null,
    statut: 'DECLARE', motif: null, creeLe: '2026-11-10T10:00:00Z', decideLe: null,
    ...changement,
  };
}

describe('CarteDeclaration', () => {
  let fixture: ComponentFixture<CarteDeclaration>;
  let http: HttpTestingController;
  let traitee: ReturnType<typeof vi.fn<(message: string) => void>>;

  const afficher = (declaration: Declaration) => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [CarteDeclaration], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CarteDeclaration);
    fixture.componentRef.setInput('declaration', declaration);
    traitee = vi.fn<(message: string) => void>();
    fixture.componentInstance.traitee.subscribe(traitee);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;
  const cliquer = (racine: HTMLElement, texte: string) => {
    bouton(racine, texte).click();
    fixture.detectChanges();
  };

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  it('montre la déclaration et valide en rattachant le nom proposé à un organisme connu', () => {
    const racine = afficher(uneDeclaration());
    expect(racine.querySelector('.details')?.textContent).toContain('DIC2 · Génie Civil');
    expect(racine.querySelector('.nouveau')?.textContent).toContain('nouveau, à enregistrer');
    expect(racine.querySelector('dl')?.textContent).toContain('Moussa Ndiaye , CTO');

    cliquer(racine, 'Valider…');
    vi.advanceTimersByTime(250);
    http.expectOne((r) => r.url === '/api/organisme/recherche' && r.params.get('q') === 'Startup').flush([{ id: 'org9', nom: 'Startup' }]);
    fixture.detectChanges();
    expect(racine.querySelector('.zone .aide')?.textContent).toContain('Organisme connu');
    cliquer(racine, 'Valider le stage');
    const requete = http.expectOne({ method: 'PATCH', url: '/api/admin/stages/declarations/d1/valider' });
    expect(requete.request.body).toEqual({ organismeId: 'org9' });
    requete.flush(uneDeclaration({ statut: 'CONFIRME' }));
    expect(traitee).toHaveBeenCalledWith('Le stage de Awa Diop chez Startup est validé. L’étudiant en est prévenu par e-mail.');
  });

  it('crée l’organisme nommé s’il est inconnu, et n’envoie rien de plus pour un organisme déjà rattaché', () => {
    let racine = afficher(uneDeclaration());
    cliquer(racine, 'Valider…');
    vi.advanceTimersByTime(250);
    http.expectOne((r) => r.url === '/api/organisme/recherche').flush([]);
    cliquer(racine, 'Valider le stage');
    expect(http.expectOne('/api/admin/stages/declarations/d1/valider').request.body).toEqual({ nomNouvelOrganisme: 'Startup' });

    TestBed.resetTestingModule();
    vi.useRealTimers();
    racine = afficher(uneDeclaration({ organismeId: 'org1', organisme: 'Kër Data' }));
    cliquer(racine, 'Valider…');
    vi.advanceTimersByTime(250);
    http.expectOne((r) => r.url === '/api/organisme/recherche').flush([]);
    cliquer(racine, 'Valider le stage');
    expect(http.expectOne('/api/admin/stages/declarations/d1/valider').request.body).toEqual({});
  });

  it('exige un motif pour refuser', () => {
    const racine = afficher(uneDeclaration());
    cliquer(racine, 'Refuser…');
    cliquer(racine, 'Refuser la déclaration');
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Le motif est obligatoire');
    const motif = racine.querySelector('textarea') as HTMLTextAreaElement;
    motif.value = 'Convention impossible';
    motif.dispatchEvent(new Event('input'));
    cliquer(racine, 'Refuser la déclaration');
    expect(http.expectOne({ method: 'PATCH', url: '/api/admin/stages/declarations/d1/refuser' }).request.body).toEqual({ motif: 'Convention impossible' });
  });

  it('ne propose aucune action sur une déclaration traitée', () => {
    const racine = afficher(uneDeclaration({ statut: 'REFUSE', motif: 'Hors cursus', decideLe: '2026-11-12T10:00:00Z' }));
    expect(racine.querySelector('.statut')?.textContent).toBe('Refusé');
    expect(racine.querySelector('dl')?.textContent).toContain('Hors cursus');
    expect(racine.querySelector('button')).toBeNull();
  });
});
