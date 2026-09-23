import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

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
