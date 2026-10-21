import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { EvenementService } from '../../../core/services/evenements/evenement';
import { Evenement } from '../../../core/services/models/evenement';
import { FormulaireEvenement } from './formulaire-evenement';

describe('FormulaireEvenement', () => {
  let fixture: ComponentFixture<FormulaireEvenement>;
  let routeParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let creer: ReturnType<typeof vi.fn>;
  let modifier: ReturnType<typeof vi.fn>;
  let obtenir: ReturnType<typeof vi.fn>;
  let joindreImage: ReturnType<typeof vi.fn>;
  let supprimerImage: ReturnType<typeof vi.fn>;
  let router: Router;

  beforeEach(async () => {
    routeParams = new BehaviorSubject(convertToParamMap({}));
    creer = vi.fn().mockReturnValue(of(evenement()));
    modifier = vi.fn().mockReturnValue(of(evenement()));
    obtenir = vi.fn().mockReturnValue(of(evenement()));
    joindreImage = vi.fn().mockImplementation(() => of(evenement({ urlImage: '/api/evenement-images/test.png' })));
    supprimerImage = vi.fn().mockReturnValue(of(evenement({ urlImage: null })));
    await TestBed.configureTestingModule({
      imports: [FormulaireEvenement],
      providers: [
        provideRouter([]),
        { provide: Location, useValue: { back: vi.fn(), getState: vi.fn(() => null) } },
        { provide: ActivatedRoute, useValue: { paramMap: routeParams } },
        { provide: EvenementService, useValue: { creer, modifier, obtenir, joindreImage, supprimerImage } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    window.history.replaceState({}, '', '/');
    fixture = TestBed.createComponent(FormulaireEvenement);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  it('signale les champs obligatoires et bloque une soumission vide', async () => {
    await fixture.componentInstance['soumettre'](new Event('submit'));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('.obligatoire')).toHaveLength(6);
    expect(creer).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Le titre est obligatoire.');
  });

  it('crée un événement valide avec une capacité facultative absente', async () => {
    fixture.componentInstance['modele'].set({
      titre: '  Rencontre Alumni  ', description: 'Description de la rencontre', lieu: 'Thiès',
      dateDebut: '2026-10-15T09:00', dateFin: '2026-10-15T12:00', audience: 'ALUMNI', nombrePlaces: '',
    });
    await fixture.componentInstance['soumettre'](new Event('submit'));

    expect(creer).toHaveBeenCalledWith(expect.objectContaining({
      titre: 'Rencontre Alumni', audience: 'ALUMNI', nombrePlaces: null,
      dateDebut: expect.stringMatching(/^2026-10-15T/),
    }));
  });

  it('bloque une fin antérieure au début avant l’appel réseau', async () => {
    fixture.componentInstance['modele'].set({
      titre: 'Rencontre', description: 'Description', lieu: 'Thiès',
      dateDebut: '2026-10-15T12:00', dateFin: '2026-10-15T09:00', audience: 'TOUS', nombrePlaces: '',
    });
    await fixture.componentInstance['soumettre'](new Event('submit'));
    await fixture.whenStable();

    expect(creer).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('La fin doit être postérieure au début.');
  });

  it('charge les valeurs existantes et envoie une modification sur l’identifiant demandé', async () => {
    routeParams.next(convertToParamMap({ id: 'event-1' }));
    await fixture.whenStable();
    expect(obtenir).toHaveBeenCalledWith('event-1');
    expect(fixture.componentInstance['modele']().titre).toBe('Rencontre des diplômés');

    fixture.componentInstance['modele'].update((valeurs) => ({ ...valeurs, titre: 'Titre modifié' }));
    await fixture.componentInstance['soumettre'](new Event('submit'));
    expect(modifier).toHaveBeenCalledWith('event-1', expect.objectContaining({ titre: 'Titre modifié' }));
  });

  it('prévisualise l’affiche datée tant qu’aucune image n’est choisie', async () => {
    await fixture.whenStable();

    const apercu = fixture.nativeElement.querySelector('.apercu-image') as HTMLElement;
    expect(apercu.querySelector('img')).toBeNull();
    expect(apercu.querySelector('.affiche')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input[type="file"]').getAttribute('accept'))
      .toBe('image/jpeg,image/png');
  });

  it('joint une image sélectionnée après avoir créé l’événement', async () => {
    const navigation = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const image = new File(['affiche'], 'affiche.png', { type: 'image/png' });
    fixture.componentInstance['modele'].set({
      titre: 'Rencontre Alumni', description: 'Une rencontre EPT', lieu: 'Thiès',
      dateDebut: '2026-10-15T09:00', dateFin: '2026-10-15T12:00', audience: 'ALUMNI', nombrePlaces: '',
    });
    fixture.componentInstance['fichierImage'].set(image);

    await fixture.componentInstance['soumettre'](new Event('submit'));

    expect(creer).toHaveBeenCalledOnce();
    expect(joindreImage).toHaveBeenCalledWith('event-1', image);
    expect(navigation).toHaveBeenCalledWith(['/evenements', 'event-1'], {
      replaceUrl: true,
      state: { returnUrl: '/evenements' },
    });
  });

  it('bloque un format non image et une image de plus de cinq mégaoctets côté navigateur', async () => {
    const fichier = vi.fn().mockReturnValue(new File(['x'], 'dessin.svg', { type: 'image/svg+xml' }));
    const input = { files: { item: fichier }, value: 'dessin.svg' } as unknown as HTMLInputElement;
    const evenementFichier = new Event('change');
    Object.defineProperty(evenementFichier, 'target', { value: input });
    await fixture.componentInstance['selectionnerImage'](evenementFichier);
    expect(fixture.componentInstance['erreurImage']()).toContain('JPEG ou PNG');
    expect(input.value).toBe('');

    fichier.mockReturnValue(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grande.png', {
      type: 'image/png',
    }));
    await fixture.componentInstance['selectionnerImage'](evenementFichier);
    expect(fixture.componentInstance['erreurImage']()).toContain('5 Mo');
    expect(fixture.componentInstance['imageARecadrer']()).toBeNull();
    expect(creer).not.toHaveBeenCalled();
  });

  it('retire une image existante uniquement après la modification', async () => {
    obtenir.mockReturnValueOnce(of(evenement({ urlImage: '/api/evenement-images/existante.png' })));
    routeParams.next(convertToParamMap({ id: 'event-1' }));
    await fixture.whenStable();
    fixture.componentInstance['basculerSuppressionImage']();
    fixture.componentInstance['modele'].update((valeurs) => ({ ...valeurs, titre: 'Titre édité' }));

    await fixture.componentInstance['soumettre'](new Event('submit'));

    expect(supprimerImage).toHaveBeenCalledWith('event-1');
    expect(fixture.componentInstance['imageActuelle']()).toBeNull();
  });

  it('retourne à la page d’origine en conservant ses paramètres', () => {
    const navigation = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.componentInstance['urlRetour'].set('/evenements?vue=mes&periode=PASSES&page=2');

    fixture.componentInstance['retourner']();

    expect(navigation).toHaveBeenCalledWith('/evenements?vue=mes&periode=PASSES&page=2');
  });

  it('ne présente pas un formulaire vide si le détail édité est inaccessible', async () => {
    obtenir.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 404 })));
    routeParams.next(convertToParamMap({ id: 'inaccessible' }));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Cet événement ne peut pas être modifié');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  function evenement(modifications: Partial<Evenement> = {}): Evenement {
    return {
      id: 'event-1', titre: 'Rencontre des diplômés', description: 'Description EPT', lieu: 'Thiès',
      urlImage: null,
      dateDebut: '2026-10-15T09:00:00Z', dateFin: '2026-10-15T12:00:00Z',
      audience: 'TOUS', nombrePlaces: null, officielEpt: false, statut: 'PUBLIE',
      organisateurId: 'organisateur-1', organisateurNom: 'Diop', organisateurPrenom: 'Awa',
      nombreParticipants: 0, maReponse: null, ...modifications,
    };
  }
});
