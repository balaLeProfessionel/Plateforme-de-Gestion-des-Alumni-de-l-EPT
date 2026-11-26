import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

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
});
