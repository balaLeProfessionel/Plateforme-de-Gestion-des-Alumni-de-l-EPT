import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Signalement } from '../../../core/services/publications/moderation';
import { Signalements } from './signalements';

const signalement = (id: string, publicationId: string, motif: Signalement['motif'] = 'SPAM'): Signalement => ({
  id, motif, detail: motif === 'AUTRE' ? 'Usurpation' : null, statut: 'EN_ATTENTE', creeLe: '2026-11-01T10:00:00Z',
  traiteLe: null, signaleParPrenom: 'Fatou', signaleParNom: 'Sarr', traiteParPrenom: null, traiteParNom: null,
  publication: { id: publicationId, type: 'PUBLICATION', titre: null, contenu: 'Achetez maintenant', urlImage: null,
    statut: 'PUBLIE', publieLe: '2026-10-31T10:00:00Z', auteurId: 'a', auteurPrenom: 'Awa', auteurNom: 'Diop' },
});

describe('Signalements', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  async function afficher(liste: Signalement[], enAttente = liste.length) {
    const fixture = TestBed.createComponent(Signalements);
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/admin/signalements' && r.params.get('traites') === 'false')
      .flush({ contenu: liste, page: 0, taille: 20, totalElements: liste.length, totalPages: 1 });
    http.expectOne('/api/admin/signalements/compteur').flush({ enAttente });
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, racine: fixture.nativeElement as HTMLElement };
  }

  const bouton = (racine: HTMLElement, libelle: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.includes(libelle)) as HTMLButtonElement;

  it('montre le motif, la précision, l’auteur du signalement et la publication visée', async () => {
    const { racine } = await afficher([signalement('s1', 'p1', 'AUTRE')]);
    expect(racine.querySelector('.motif')?.textContent).toContain('Autre raison');
    expect(racine.querySelector('.detail')?.textContent).toContain('Usurpation');
    expect(racine.querySelector('.quand')?.textContent).toContain('Signalé par Fatou Sarr');
    expect(racine.querySelector('figcaption')?.textContent).toContain('Publication de Awa Diop');
    expect(racine.querySelector('.onglets [aria-pressed="true"]')?.textContent).toContain('En attente');
    expect(racine.querySelector('.onglets .nombre')?.textContent).toBe('1');
  });

  it('demande confirmation avant de masquer, puis retire tous les signalements de la publication', async () => {
    const { fixture, racine } = await afficher([signalement('s1', 'p1'), signalement('s2', 'p1'), signalement('s3', 'p2')]);
    bouton(racine, 'Masquer la publication').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(racine.querySelector('.confirmation')?.textContent).toContain('pour tous les membres');
    expect(document.activeElement?.textContent).toContain('Oui, masquer');
    bouton(racine, 'Oui, masquer').click();
    const requete = http.expectOne('/api/admin/signalements/s1/masquer');
    expect(requete.request.method).toBe('PATCH');
    requete.flush({ ...signalement('s1', 'p1'), statut: 'PUBLICATION_MASQUEE' });
    http.expectOne('/api/admin/signalements/compteur').flush({ enAttente: 1 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelectorAll('.signalement')).toHaveLength(1);
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('La publication est masquée');
  });

  it('rejette un signalement sans toucher aux autres', async () => {
    const { fixture, racine } = await afficher([signalement('s1', 'p1'), signalement('s2', 'p1')]);
    bouton(racine, 'Rejeter le signalement').click();
    http.expectOne('/api/admin/signalements/s1/rejeter').flush({ ...signalement('s1', 'p1'), statut: 'REJETE' });
    http.expectOne('/api/admin/signalements/compteur').flush({ enAttente: 1 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelectorAll('.signalement')).toHaveLength(1);
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('la publication reste visible');
  });

  it('affiche l’historique des décisions et l’état vide', async () => {
    const { fixture, racine } = await afficher([]);
    expect(racine.textContent).toContain('Aucun signalement à examiner');
    bouton(racine, 'Traités').click();
    http.expectOne((r) => r.params.get('traites') === 'true').flush({ contenu: [{ ...signalement('s9', 'p9'),
      statut: 'PUBLICATION_MASQUEE', traiteLe: '2026-11-02T09:00:00Z', traiteParPrenom: 'Admin', traiteParNom: 'EPT' }],
      page: 0, taille: 20, totalElements: 1, totalPages: 1 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('.decision')?.textContent?.replace(/\s+/g, ' ')).toContain('Publication masquée par Admin EPT');
    expect(racine.querySelector('.actions')).toBeNull();
  });
});
