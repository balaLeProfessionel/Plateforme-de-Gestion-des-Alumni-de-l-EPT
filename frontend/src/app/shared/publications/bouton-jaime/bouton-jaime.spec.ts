import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BoutonJaime } from './bouton-jaime';

describe('BoutonJaime', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function creer(nombre: number, jaime: boolean) {
    const fixture = TestBed.createComponent(BoutonJaime);
    fixture.componentRef.setInput('publicationId', 'p1');
    fixture.componentRef.setInput('nombre', nombre);
    fixture.componentRef.setInput('jaime', jaime);
    fixture.detectChanges();
    const bouton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    return { fixture, bouton };
  }

  it('aime tout de suite puis garde le décompte du serveur', () => {
    const { fixture, bouton } = creer(2, false);
    bouton.click();
    fixture.detectChanges();
    expect(bouton.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.componentInstance.nombre()).toBe(3);
    const requete = http.expectOne('/api/publications/p1/jaime');
    expect(requete.request.method).toBe('PUT');
    requete.flush({ nombre: 5, jaime: true });
    expect(fixture.componentInstance.nombre()).toBe(5);
  });

  it('retire le « J’aime » et revient en arrière si le serveur échoue', () => {
    const { fixture, bouton } = creer(1, true);
    bouton.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.jaime()).toBe(false);
    const requete = http.expectOne('/api/publications/p1/jaime');
    expect(requete.request.method).toBe('DELETE');
    requete.flush(null, { status: 500, statusText: 'Erreur' });
    fixture.detectChanges();
    expect(fixture.componentInstance.jaime()).toBe(true);
    expect(fixture.componentInstance.nombre()).toBe(1);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('pas été enregistré');
  });
});
