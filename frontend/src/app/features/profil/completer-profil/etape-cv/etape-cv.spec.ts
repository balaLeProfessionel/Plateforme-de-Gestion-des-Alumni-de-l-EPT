import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { BrouillonCv } from '../../../../core/services/import-cv/brouillon-cv';
import { ImportCvService } from '../../../../core/services/import-cv/import-cv-service';
import { DisponibiliteImportCv, ImportCv } from '../../../../core/services/models/import-cv.model';
import { EtapeCv } from './etape-cv';

describe('EtapeCv', () => {
  let fixture: ComponentFixture<EtapeCv>;
  let composant: EtapeCv;
  let service: Record<string, ReturnType<typeof vi.fn>>;
  let brouillon: { definir: ReturnType<typeof vi.fn>; oublier: ReturnType<typeof vi.fn> };

  function creer(disponibilite: Partial<DisponibiliteImportCv> = {}): void {
    service = {
      disponibilite: vi.fn().mockReturnValue(of({
        disponible: true, imagesAcceptees: true, fournisseur: 'Claude', fichiersMax: 6,
        tailleMaxOctets: 10 * 1024 * 1024, ...disponibilite
      })),
      deposer: vi.fn().mockReturnValue(of(importCv('EN_COURS'))),
      consulter: vi.fn().mockReturnValue(of(importCv('PRET'))),
      appliquer: vi.fn().mockReturnValue(of(importCv('VALIDE'))),
      abandonner: vi.fn().mockReturnValue(of(undefined))
    };
    brouillon = { definir: vi.fn(), oublier: vi.fn() };
    TestBed.configureTestingModule({
      imports: [EtapeCv],
      providers: [
        provideRouter([]),
        { provide: ImportCvService, useValue: service },
        { provide: BrouillonCv, useValue: brouillon }
      ]
    });
    fixture = TestBed.createComponent(EtapeCv);
    composant = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renvoie vers la saisie manuelle quand l import est indisponible', () => {
    const navigation = vi.spyOn(Router.prototype, 'navigate').mockResolvedValue(true);
    creer({ disponible: false });
    expect(navigation).toHaveBeenCalledWith(['/completer-profil/infos'], { replaceUrl: true });
  });

  it('nomme le service d analyse dans la case d accord', () => {
    creer();
    const texte = (fixture.nativeElement as HTMLElement).querySelector('label[for="consentement-cv"]')?.textContent;
    expect(texte).toContain('Claude');
  });

  it('refuse un document mélangé à des images', () => {
    creer();
    choisir([fichier('cv.pdf', 'application/pdf'), fichier('capture.png', 'image/png')]);
    expect(composant['erreur']()).toContain('un seul PDF');
    expect(composant['fichiers']()).toEqual([]);
  });

  it('refuse les images quand le service ne les lit pas', () => {
    creer({ imagesAcceptees: false });
    choisir([fichier('capture.png', 'image/png')]);
    expect(composant['erreur']()).toContain('images ne sont pas acceptées');
  });

  it('refuse un fichier trop lourd', () => {
    creer({ tailleMaxOctets: 10 });
    choisir([fichier('cv.pdf', 'application/pdf', 20)]);
    expect(composant['erreur']()).toContain('au plus');
  });

  it('ne dépose rien sans accord', () => {
    creer();
    choisir([fichier('cv.pdf', 'application/pdf')]);
    expect(composant['peutEnvoyer']()).toBe(false);
    composant['envoyer']();
    expect(service['deposer']).not.toHaveBeenCalled();
  });

  it('dépose, suit l analyse, remplit le profil puis ouvre la page profil', () => {
    vi.useFakeTimers();
    creer();
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    choisir([fichier('cv.pdf', 'application/pdf')]);
    composant['consentement'].set(true);

    composant['envoyer']();
    expect(service['deposer']).toHaveBeenCalledWith([expect.any(File)], true);
    expect(composant['etat']()).toBe('analyse');

    vi.advanceTimersByTime(2000);
    expect(service['appliquer']).toHaveBeenCalledWith('import-1');
    expect(navigation).toHaveBeenCalledWith(['/profil'], { state: { depuisCv: true } });
  });

  it('repasse par la relecture si le profil n a pas pu être rempli', () => {
    vi.useFakeTimers();
    creer();
    service['appliquer'].mockReturnValue(throwError(() => new Error('réseau')));
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    choisir([fichier('cv.pdf', 'application/pdf')]);
    composant['consentement'].set(true);
    composant['envoyer']();

    vi.advanceTimersByTime(2000);
    expect(brouillon.definir).toHaveBeenCalledWith(expect.objectContaining({ statut: 'PRET' }));
    expect(navigation).toHaveBeenCalledWith(['/completer-profil/infos']);
  });

  it('affiche le message d échec et permet de recommencer', () => {
    vi.useFakeTimers();
    creer();
    service['consulter'].mockReturnValue(of({ ...importCv('ECHEC'), message: 'CV illisible.' }));
    choisir([fichier('cv.pdf', 'application/pdf')]);
    composant['consentement'].set(true);
    composant['envoyer']();

    vi.advanceTimersByTime(2000);
    expect(composant['etat']()).toBe('echec');
    expect(composant['erreur']()).toBe('CV illisible.');

    composant['recommencer']();
    expect(composant['etat']()).toBe('choix');
  });

  it('abandonne l import quand on annule pendant l analyse', () => {
    vi.useFakeTimers();
    creer();
    service['consulter'].mockReturnValue(of(importCv('EN_COURS')));
    choisir([fichier('cv.pdf', 'application/pdf')]);
    composant['consentement'].set(true);
    composant['envoyer']();

    composant['annuler']();
    expect(service['abandonner']).toHaveBeenCalledWith('import-1');
    expect(composant['etat']()).toBe('choix');
  });

  function choisir(fichiers: File[]): void {
    const champ = document.createElement('input');
    champ.type = 'file';
    Object.defineProperty(champ, 'files', { value: fichiers });
    composant['choisir']({ target: champ } as unknown as Event);
  }

  function fichier(nom: string, type: string, taille = 1000): File {
    return new File([new Uint8Array(taille)], nom, { type });
  }

  function importCv(statut: ImportCv['statut']): ImportCv {
    return { id: 'import-1', statut, typeSource: 'TEXTE', message: null, profil: null, expireLe: null };
  }
});
