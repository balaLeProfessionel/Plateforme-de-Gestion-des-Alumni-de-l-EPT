import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SuiviStage } from '../../../../core/services/models/stage.model';
import { unSuivi } from '../../../stages/testing/donnees-stages';
import { ActionsSuivi } from './actions-suivi';

describe('ActionsSuivi', () => {
  let fixture: ComponentFixture<ActionsSuivi>;
  let http: HttpTestingController;
  let modifie: ReturnType<typeof vi.fn<(e: { stage: SuiviStage; message: string }) => void>>;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [ActionsSuivi], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ActionsSuivi);
    fixture.componentRef.setInput('stage', unSuivi());
    modifie = vi.fn();
    fixture.componentInstance.modifie.subscribe(modifie);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  const racine = () => fixture.nativeElement as HTMLElement;
  const cliquer = (texte: string) => {
    ([...racine().querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement).click();
    fixture.detectChanges();
  };
  const saisir = (selecteur: string, valeur: string) => {
    const champ = racine().querySelector(selecteur) as HTMLInputElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  it('cherche un membre du personnel et le désigne encadrant', () => {
    cliquer('Désigner l’encadrant');
    saisir('#personnel-s1', 'sow');
    vi.advanceTimersByTime(300);
    http.expectOne((r) => r.url === '/api/admin/stages/personnel' && r.params.get('q') === 'sow')
      .flush([{ id: 'p1', prenom: 'Ibrahima', nom: 'Sow', email: 'isow@ept.sn', urlPhoto: null }]);
    fixture.detectChanges();
    (racine().querySelector('[aria-label="Désigner Ibrahima Sow"]') as HTMLButtonElement).click();
    const requete = http.expectOne({ method: 'PATCH', url: '/api/admin/stages/suivi/s1/encadrant' });
    expect(requete.request.body).toEqual({ encadrantId: 'p1' });
    const stage = unSuivi({ encadrant: { id: 'p1', prenom: 'Ibrahima', nom: 'Sow', email: 'isow@ept.sn' } });
    requete.flush(stage);
    expect(modifie).toHaveBeenCalledWith({ stage, message: 'Ibrahima Sow encadre le stage de Awa Diop. Ils en sont prévenus par e-mail.' });
  });

  it('corrige le maître de stage et refuse un nom vide ou une adresse invalide', () => {
    cliquer('Maître de stage');
    expect((racine().querySelector('#tuteur-nom-s1') as HTMLInputElement).value).toBe('Moussa Ndiaye');
    saisir('#tuteur-nom-s1', ' ');
    cliquer('Enregistrer');
    expect(racine().querySelector('[role="alert"]')?.textContent).toContain('Le nom du maître de stage est obligatoire.');
    saisir('#tuteur-nom-s1', 'Fatou Sarr');
    saisir('#tuteur-email-s1', 'pas-une-adresse');
    cliquer('Enregistrer');
    expect(racine().querySelector('[role="alert"]')?.textContent).toContain('n’est pas valide');
    saisir('#tuteur-email-s1', 'fatou@example.sn');
    cliquer('Enregistrer');
    expect(http.expectOne({ method: 'PATCH', url: '/api/admin/stages/suivi/s1/tuteur' }).request.body)
      .toEqual({ nom: 'Fatou Sarr', fonction: 'CTO', email: 'fatou@example.sn', telephone: null });
  });
});
