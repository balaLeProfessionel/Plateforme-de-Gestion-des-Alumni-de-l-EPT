import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { MotDePasseOublie } from './mot-de-passe-oublie';

describe('MotDePasseOublie', () => {
  let component: MotDePasseOublie;
  let fixture: ComponentFixture<MotDePasseOublie>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MotDePasseOublie],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    fixture = TestBed.createComponent(MotDePasseOublie);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('normalise l email et ouvre l ecran du code', () => {
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigation = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component['modele'].set({ email: 'Awa.Diop@Example.com' });

    component['envoyerCode']();

    const requete = http.expectOne('/api/auth/mot-de-passe-oublie');
    expect(requete.request.body).toEqual({ email: 'awa.diop@example.com' });
    requete.flush({ message: 'Un code a été envoyé' });
    expect(navigation).toHaveBeenCalledWith(['/reinitialiser-mot-de-passe'], {
      queryParams: { email: 'awa.diop@example.com' }
    });
  });
});
