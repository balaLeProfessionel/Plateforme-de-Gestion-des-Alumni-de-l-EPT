import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { InscriptionGoogle } from '../../../../core/services/auth/inscription-google';
import { Formulaire } from './formulaire';

describe('Formulaire', () => {
  let component: Formulaire;
  let fixture: ComponentFixture<Formulaire>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Formulaire],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Formulaire);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rend le nom de l’organisme obligatoire uniquement pour ce type de compte', () => {
    component['role'].set('ORGANISME');
    component['modele'].set({
      nom: 'Contact', prenom: 'Test', nomOrganisme: '', email: 'test@example.invalid',
      password: 'MotDePasse123', filiere: '', anneeSortie: '', telephone: ''
    });
    component['continuer']();
    fixture.detectChanges();

    expect(component['formulaire'].nomOrganisme().invalid()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Nom de l\'organisme');
    expect(fixture.nativeElement.querySelector('#nomOrganisme-message')?.textContent)
      .toContain("Le nom de l'organisme est obligatoire");
  });

  it('renvoie au choix du profil quand le profil de l adresse est inconnu', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Formulaire],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ role: 'ETUDIANT' }) },
            paramMap: of(convertToParamMap({ role: 'ETUDIANT' }))
          }
        }
      ],
    }).compileComponents();
    const routeur = TestBed.inject(Router);
    const nav = vi.spyOn(routeur, 'navigate').mockResolvedValue(true);
    TestBed.createComponent(Formulaire);
    expect(nav).toHaveBeenCalledWith(['/inscription']);
  });

  it('n affiche aucune erreur avant que les champs soient quittés', () => {
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.champ-formulaire__message--erreur').length).toBe(0);
    expect(element.querySelectorAll('[aria-invalid="true"]').length).toBe(0);
  });

  it('ne met pas en erreur un champ vide simplement traversé au clavier', () => {
    component['formulaire'].prenom().markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#prenom-message')).toBeNull();

    component['continuer']();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#prenom-message')?.textContent).toContain('Le prénom est obligatoire');
  });

  it('reste sur la première étape tant qu elle est incomplète', () => {
    component['continuer']();
    fixture.detectChanges();

    expect(component['etape']()).toBe('identite');
    expect(fixture.nativeElement.querySelector('#email-message')?.textContent).toContain("L'email est obligatoire");
  });

  it('passe à l étape du compte puis peut revenir sans perdre la saisie', () => {
    component['modele'].update((m) => ({ ...m, prenom: 'Awa', nom: 'Diop', email: 'awa@example.invalid' }));
    component['continuer']();
    fixture.detectChanges();

    expect(component['etape']()).toBe('compte');
    expect(fixture.nativeElement.querySelector('#password')).toBeTruthy();

    component['retour']();
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('#prenom') as HTMLInputElement).value).toBe('Awa');
  });

  it('indique ce qui manque au mot de passe pendant la saisie', () => {
    expect(component['aideMotDePasse']()).toBe('Au moins 8 caractères');
    component['modele'].update((m) => ({ ...m, password: 'abcde' }));
    expect(component['aideMotDePasse']()).toBe('Encore 3 caractères');
    component['modele'].update((m) => ({ ...m, password: 'abcdefgh' }));
    expect(component['aideMotDePasse']()).toBe('Longueur suffisante');
  });

  it('propose Google en tête de l’étape d’identité, une fois le profil choisi', () => {
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('app-bouton-google')).not.toBeNull();

    component['continuer']();
    component['modele'].update((m) => ({ ...m, prenom: 'Awa', nom: 'Diop', email: 'awa@example.invalid' }));
    component['continuer']();
    fixture.detectChanges();
    expect(racine.querySelector('app-bouton-google')).toBeNull();
  });

  it('pré-remplit avec Google sans perdre la saisie, puis peut revenir à une autre adresse', () => {
    component['modele'].update((m) => ({ ...m, telephone: '77 123 45 67', email: 'autre@example.invalid' }));
    TestBed.inject(InscriptionGoogle).retenir({ credential: 'jeton', email: 'awa.diop@gmail.com', prenom: 'Awa', nom: '' });
    component['preRemplirAvecGoogle']();
    fixture.detectChanges();

    const m = component['modele']();
    expect(m.email).toBe('awa.diop@gmail.com');
    expect(m.prenom).toBe('Awa');
    expect(m.telephone).toBe('77 123 45 67');
    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('.bandeau-google')?.textContent).toContain('awa.diop@gmail.com');
    expect((racine.querySelector('#email') as HTMLInputElement).readOnly).toBe(true);

    (racine.querySelector('.lien-annuler') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(TestBed.inject(InscriptionGoogle).enAttente()).toBeNull();
    expect(component['modele']().email).toBe('');
    expect(racine.querySelector('app-bouton-google')).not.toBeNull();
  });
});

describe('Formulaire avec Google', () => {
  let fixture: ComponentFixture<Formulaire>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Formulaire],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ role: 'ALUMNI' }) },
            paramMap: of(convertToParamMap({ role: 'ALUMNI' }))
          }
        },
      ],
    }).compileComponents();
    TestBed.inject(InscriptionGoogle).retenir({ credential: 'jeton-google', email: 'awa.diop@gmail.com', prenom: 'Awa', nom: 'Diop' });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(Formulaire);
    fixture.detectChanges();
    // Liste des filières proposées (FilieresService), chargée à l'ouverture du formulaire
    http.match((r) => r.url.endsWith('/api/public/filieres')).forEach((r) => r.flush([]));
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('pré-remplit l’identité Google, fige l’adresse et ne demande pas de mot de passe', () => {
    const racine = fixture.nativeElement as HTMLElement;
    expect((racine.querySelector('#prenom') as HTMLInputElement).value).toBe('Awa');
    expect((racine.querySelector('#nom') as HTMLInputElement).value).toBe('Diop');
    const adresse = racine.querySelector('#email') as HTMLInputElement;
    expect(adresse.value).toBe('awa.diop@gmail.com');
    expect(adresse.readOnly).toBe(true);
    expect(racine.querySelector('#password')).toBeNull();
    expect(racine.textContent).toContain('Adresse vérifiée par Google');
  });

  it('retire l’étape de vérification de l’email du parcours', () => {
    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('.etape')?.textContent).toContain('Étape 2 sur 3');
    expect(racine.querySelectorAll('.segment').length).toBe(3);
    expect(racine.textContent).not.toContain('Vérification de l’email');

    (racine.querySelector('.btn-ept') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(racine.querySelector('.etape')?.textContent).toContain('Étape 3 sur 3');
    expect(racine.querySelector('.sous-titre')?.textContent).toContain('votre compte sera créé avec votre adresse Google');
    expect(racine.textContent).not.toContain('vérification de votre email');
  });

  /** Passe l'étape « identité » (pré-remplie par Google) puis valide l'étape « compte ». */
  function creerLeCompte(): void {
    const racine = fixture.nativeElement as HTMLElement;
    (racine.querySelector('.btn-ept') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(racine.querySelector('#password')).toBeNull();
    (racine.querySelector('.btn-ept') as HTMLButtonElement).click();
  }

  it('crée le compte avec le jeton Google, sans adresse ni mot de passe, puis mène à la complétion du profil', async () => {
    creerLeCompte();

    const requete = http.expectOne('/api/auth/google/inscription');
    expect(requete.request.body).toEqual({ credential: 'jeton-google', nom: 'Diop', prenom: 'Awa', role: 'ALUMNI', filiere: '' });
    requete.flush({ accessToken: 'a', refreshToken: 'r', id: 'id', email: 'awa.diop@gmail.com', role: 'ALUMNI', doitChangerMotDePasse: false });

    expect(router.navigate).toHaveBeenCalledWith(['/completer-profil']);
    expect(TestBed.inject(InscriptionGoogle).enAttente()).toBeNull();
  });

  it('demande de repasser par Google quand le jeton a expiré', async () => {
    creerLeCompte();
    http.expectOne('/api/auth/google/inscription').flush({ message: 'expiré' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('La validation par Google a expiré');
    expect(TestBed.inject(InscriptionGoogle).enAttente()).toBeNull();
  });
});
