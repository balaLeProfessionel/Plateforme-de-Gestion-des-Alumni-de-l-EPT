import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
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
    component['formulaire']().markAsTouched();
    fixture.detectChanges();

    expect(component['formulaire'].nomOrganisme().invalid()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Nom de l\'organisme');
    expect(fixture.nativeElement.querySelector('#nomOrganisme + small')?.textContent)
      .toContain("Le nom de l'organisme est obligatoire");
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
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ role: 'ALUMNI' }) } } },
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

  it('crée le compte avec le jeton Google, sans adresse ni mot de passe, puis ouvre l’accueil', async () => {
    const racine = fixture.nativeElement as HTMLElement;
    (racine.querySelector('.btn-ept') as HTMLButtonElement).click();

    const requete = http.expectOne('/api/auth/google/inscription');
    expect(requete.request.body).toEqual({ credential: 'jeton-google', nom: 'Diop', prenom: 'Awa', role: 'ALUMNI', filiere: '' });
    requete.flush({ accessToken: 'a', refreshToken: 'r', id: 'id', email: 'awa.diop@gmail.com', role: 'ALUMNI', doitChangerMotDePasse: false });

    expect(router.navigate).toHaveBeenCalledWith(['/accueil']);
    expect(TestBed.inject(InscriptionGoogle).enAttente()).toBeNull();
  });

  it('demande de repasser par Google quand le jeton a expiré', async () => {
    (fixture.nativeElement.querySelector('.btn-ept') as HTMLButtonElement).click();
    http.expectOne('/api/auth/google/inscription').flush({ message: 'expiré' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('La validation par Google a expiré');
    expect(TestBed.inject(InscriptionGoogle).enAttente()).toBeNull();
  });
});
