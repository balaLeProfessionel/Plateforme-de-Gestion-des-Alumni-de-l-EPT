import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { InscriptionGoogle } from '../../../../core/services/auth/inscription-google';
import { ChoixRole } from './choix-role';

describe('ChoixRole', () => {
  let component: ChoixRole;
  let fixture: ComponentFixture<ChoixRole>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChoixRole],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  async function creer(): Promise<void> {
    fixture = TestBed.createComponent(ChoixRole);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('should create', async () => {
    await creer();
    expect(component).toBeTruthy();
  });

  it('explique le cas des etudiants et ne promet pas d offres d emploi', async () => {
    await creer();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.note-etudiant')?.textContent).toContain('créé par l’administration');
    expect(element.textContent).not.toContain('Publiez des offres');
  });

  it('propose Google sous les profils tant qu’aucun compte Google n’est retenu', async () => {
    await creer();
    expect(http.match('/api/auth/google/configuration')).toHaveLength(1);
    expect((fixture.nativeElement as HTMLElement).querySelector('app-bouton-google')).not.toBeNull();
  });

  it('rappelle le compte Google retenu et permet de changer d’adresse', async () => {
    const google = TestBed.inject(InscriptionGoogle);
    google.retenir({ credential: 'jeton', email: 'awa.diop@gmail.com', prenom: 'Awa', nom: 'Diop' });
    await creer();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.bandeau-google')?.textContent).toContain('awa.diop@gmail.com');
    expect(element.querySelector('app-bouton-google')).toBeNull();

    (element.querySelector('.lien-annuler') as HTMLButtonElement).click();
    expect(google.enAttente()).toBeNull();
  });
});
