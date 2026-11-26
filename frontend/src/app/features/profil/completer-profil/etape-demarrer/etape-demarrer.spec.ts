import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { BrouillonCv } from '../../../../core/services/import-cv/brouillon-cv';
import { ImportCvService } from '../../../../core/services/import-cv/import-cv-service';
import { ImportCv } from '../../../../core/services/models/import-cv.model';
import { EtapeDemarrer } from './etape-demarrer';

describe('EtapeDemarrer', () => {
  let service: { disponibilite: ReturnType<typeof vi.fn>; abandonner: ReturnType<typeof vi.fn> };
  let brouillon: {
    import: ReturnType<typeof signal<ImportCv | null>>;
    charger: ReturnType<typeof vi.fn>;
    oublier: ReturnType<typeof vi.fn>;
  };

  function creer(disponible: boolean | 'erreur', enAttente: ImportCv | null = null) {
    service = {
      disponibilite: vi.fn().mockReturnValue(
        disponible === 'erreur' ? throwError(() => new Error('réseau')) : of({ disponible })
      ),
      abandonner: vi.fn().mockReturnValue(of(undefined))
    };
    brouillon = {
      import: signal(enAttente),
      charger: vi.fn().mockReturnValue(of(enAttente)),
      oublier: vi.fn()
    };
    TestBed.configureTestingModule({
      imports: [EtapeDemarrer],
      providers: [
        provideRouter([]),
        { provide: ImportCvService, useValue: service },
        { provide: BrouillonCv, useValue: brouillon }
      ]
    });
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate');
    const fixture = TestBed.createComponent(EtapeDemarrer);
    fixture.detectChanges();
    return { fixture, navigation };
  }

  it('passe directement à la saisie quand l import est indisponible', () => {
    const { navigation } = creer(false);
    expect(navigation).toHaveBeenCalledWith(['/completer-profil/infos'], { replaceUrl: true });
  });

  it('passe aussi à la saisie si la disponibilité ne peut être lue', () => {
    const { navigation } = creer('erreur');
    expect(navigation).toHaveBeenCalledWith(['/completer-profil/infos'], { replaceUrl: true });
  });

  it('propose les deux façons de remplir le profil', () => {
    const { fixture } = creer(true);
    const texte = (fixture.nativeElement as HTMLElement).textContent;
    expect(texte).toContain('Importer mon CV');
    expect(texte).toContain('Remplir moi-même');
    expect(texte).not.toContain('Reprendre la relecture');
  });

  it('propose de reprendre un CV déjà analysé, et l abandonne si on choisit la saisie', () => {
    const enAttente: ImportCv = {
      id: 'import-1', statut: 'PRET', typeSource: 'TEXTE', message: null, profil: null, expireLe: null
    };
    const { fixture, navigation } = creer(true, enAttente);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Reprendre la relecture');

    fixture.componentInstance['remplirSoiMeme']();
    expect(service.abandonner).toHaveBeenCalledWith('import-1');
    expect(brouillon.oublier).toHaveBeenCalled();
    expect(navigation).toHaveBeenCalledWith(['/completer-profil/infos']);
  });
});
