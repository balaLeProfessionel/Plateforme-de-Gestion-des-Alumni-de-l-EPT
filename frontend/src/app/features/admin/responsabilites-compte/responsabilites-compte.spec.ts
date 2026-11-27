import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthService } from '../../../core/services/auth/auth-service';
import { PermissionAdmin } from '../../../core/services/models/admin.model';
import { authAdmin } from '../testing/donnees-admin';
import { ResponsabilitesCompte } from './responsabilites-compte';

describe('ResponsabilitesCompte', () => {
  let fixture: ComponentFixture<ResponsabilitesCompte>;
  let http: HttpTestingController;

  const afficher = async (responsabilites: PermissionAdmin[], options: { auth?: ReturnType<typeof authAdmin>; compteId?: string } = {}) => {
    TestBed.configureTestingModule({
      imports: [ResponsabilitesCompte],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: options.auth ?? authAdmin() }],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ResponsabilitesCompte);
    fixture.componentRef.setInput('compteId', options.compteId ?? 'a2');
    fixture.componentRef.setInput('prenom', 'Fatou');
    fixture.componentRef.setInput('responsabilites', responsabilites);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };
  const cases = (racine: HTMLElement) => [...racine.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.includes(texte)) as HTMLButtonElement;

  afterEach(() => http.verify());

  it('affiche les responsabilités attribuées, sans bouton pour qui n’est pas super administrateur', async () => {
    const racine = await afficher(['GERER_STAGES', 'GERER_MOBILITES'], { auth: authAdmin(['CONSULTER_TABLEAU_DE_BORD', 'GERER_COMPTES']) });
    expect([...racine.querySelectorAll('.pastille')].map((p) => p.textContent?.trim())).toEqual(['Stages', 'Mobilités']);
    expect(bouton(racine, 'Modifier')).toBeUndefined();
  });

  it('dit qu’un compte sans responsabilité ne voit que le tableau de bord', async () => {
    const racine = await afficher([]);
    expect(racine.textContent).toContain('ne voit que le tableau de bord');
  });

  it('ne laisse pas un super administrateur modifier ses propres responsabilités', async () => {
    const racine = await afficher(['GERER_ADMINISTRATEURS'], { compteId: 'moi' });
    expect(racine.textContent).toContain('Super administrateur');
    expect(bouton(racine, 'Modifier')).toBeUndefined();
    expect(racine.textContent).toContain('Un autre super administrateur peut modifier vos responsabilités');
  });

  it('envoie les cases cochées et prévient le parent', async () => {
    const racine = await afficher(['GERER_STAGES']);
    const messages: string[] = [];
    fixture.componentInstance.modifie.subscribe((m) => messages.push(m));
    bouton(racine, 'Modifier').click();
    fixture.detectChanges();
    const [, comptes, stages] = cases(racine);
    expect(stages.checked).toBe(true);
    comptes.click();
    stages.click();
    fixture.detectChanges();
    bouton(racine, 'Enregistrer').click();

    const requete = http.expectOne('/api/admin/comptes/a2/responsabilites');
    expect(requete.request.method).toBe('PATCH');
    expect(requete.request.body).toEqual({ responsabilites: ['GERER_COMPTES'] });
    requete.flush({});
    expect(messages).toEqual(['Responsabilités enregistrées. La personne en est prévenue par e-mail.']);
  });

  it('coche et verrouille toutes les responsabilités d’un super administrateur, et n’envoie que ce statut', async () => {
    const racine = await afficher(['GERER_COMPTES']);
    bouton(racine, 'Modifier').click();
    fixture.detectChanges();
    const [superAdmin, ...autres] = cases(racine);
    superAdmin.click();
    fixture.detectChanges();
    expect(autres.every((c) => c.checked && c.disabled)).toBe(true);
    bouton(racine, 'Enregistrer').click();
    http.expectOne('/api/admin/comptes/a2/responsabilites').flush({});
  });

  it('montre le refus du serveur sans fermer le formulaire', async () => {
    const racine = await afficher([]);
    bouton(racine, 'Modifier').click();
    fixture.detectChanges();
    bouton(racine, 'Enregistrer').click();
    http.expectOne('/api/admin/comptes/a2/responsabilites')
      .flush({ message: 'Seul un super administrateur peut gérer les administrateurs.' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Seul un super administrateur');
    expect(cases(racine).length).toBe(10);
  });
});
