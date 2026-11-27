import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { OffreAModerer } from '../../../../core/services/models/offre-emploi.model';
import { uneOffreEmploi, uneOffreGeree } from '../../../offres-emploi/testing/donnees-offres-emploi';
import { CarteOffreAModerer } from './carte-offre-a-moderer';

describe('CarteOffreAModerer', () => {
  let fixture: ComponentFixture<CarteOffreAModerer>;
  let http: HttpTestingController;
  let messages: string[];

  const afficher = (element: OffreAModerer) => {
    TestBed.configureTestingModule({
      imports: [CarteOffreAModerer], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CarteOffreAModerer);
    fixture.componentRef.setInput('element', element);
    messages = [];
    fixture.componentInstance.traitee.subscribe((m) => messages.push(m));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement | undefined;
  const saisirMotif = (racine: HTMLElement, id: string, motif: string) => {
    const champ = racine.querySelector(`#motif-${id}`) as HTMLTextAreaElement;
    champ.value = motif;
    champ.dispatchEvent(new Event('input'));
    champ.dispatchEvent(new Event('blur'));
  };

  afterEach(() => http.verify());

  it('publie une offre en attente et prévient la page', async () => {
    const racine = afficher({ offre: uneOffreGeree({ statut: 'SOUMISE' }), signalements: [] });
    expect(racine.querySelector('.statut')?.textContent).toBe('En attente de vérification');
    expect(racine.querySelector('.details')?.textContent).toContain('Publiée par Sonatel');
    bouton(racine, 'Publier')?.click();
    http.expectOne({ method: 'PATCH', url: '/api/admin/offres-emploi/g1/publier' })
      .flush({ offre: uneOffreGeree(), signalements: [] });
    await fixture.whenStable();
    expect(messages[0]).toContain('« Ingénieur réseaux » est publiée');
  });

  it('exige un motif pour refuser, puis l’envoie', async () => {
    const racine = afficher({ offre: uneOffreGeree({ statut: 'SOUMISE' }), signalements: [] });
    bouton(racine, 'Refuser…')?.click();
    fixture.detectChanges();
    bouton(racine, 'Refuser l’offre')?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    http.expectNone('/api/admin/offres-emploi/g1/refuser');
    expect(racine.querySelector('.decision .erreur-champ')?.textContent).toContain('Le motif est obligatoire');

    saisirMotif(racine, 'g1', '  Entreprise introuvable ');
    bouton(racine, 'Refuser l’offre')?.click();
    await fixture.whenStable();
    const requete = http.expectOne({ method: 'PATCH', url: '/api/admin/offres-emploi/g1/refuser' });
    expect(requete.request.body).toEqual({ motif: 'Entreprise introuvable' });
    requete.flush({ offre: uneOffreGeree({ statut: 'REFUSEE' }), signalements: [] });
    await fixture.whenStable();
    expect(messages[0]).toContain('est refusée');
  });

  it('montre les signalements d’une offre publiée, puis les classe', async () => {
    const racine = afficher({
      offre: uneOffreEmploi(),
      signalements: [{ id: 's1', motif: 'LIEN_MORT', commentaire: 'Page 404', creeLe: '2026-11-26T10:00:00', auteur: 'Moussa Ba' }],
    });
    expect(racine.querySelector('.details')?.textContent).toContain('Relayée par Awa Diop');
    expect(racine.querySelector('.signalements h3')?.textContent).toContain('1 signalement en attente');
    expect(racine.querySelector('.signalements li')?.textContent).toContain('Le lien ne fonctionne plus');
    expect(racine.querySelector('.signalements li')?.textContent).toContain('Moussa Ba');
    bouton(racine, 'Classer les signalements')?.click();
    http.expectOne({ method: 'PATCH', url: '/api/admin/offres-emploi/e1/classer-signalements' })
      .flush({ offre: uneOffreEmploi(), signalements: [] });
    await fixture.whenStable();
    expect(messages[0]).toContain('l’offre reste publiée');
  });

  it('retire une offre gérée en annonçant la clôture des candidatures, et affiche le refus du serveur', async () => {
    const racine = afficher({ offre: uneOffreGeree(), signalements: [] });
    expect(bouton(racine, 'Classer les signalements')).toBeUndefined();
    bouton(racine, 'Retirer…')?.click();
    fixture.detectChanges();
    expect(racine.querySelector('.decision .aide')?.textContent).toContain('candidatures sans décision seront closes');
    saisirMotif(racine, 'g1', 'Annonce trompeuse');
    bouton(racine, 'Retirer l’offre')?.click();
    await fixture.whenStable();
    http.expectOne('/api/admin/offres-emploi/g1/retirer')
      .flush({ message: 'Seule une offre publiée peut être retirée.' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Seule une offre publiée');
    expect(messages).toEqual([]);
  });
});
