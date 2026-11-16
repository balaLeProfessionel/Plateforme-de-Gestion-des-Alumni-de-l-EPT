import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { ConversationDetail, MembreConversation, RoleParticipant } from '../../../core/services/models/messagerie.model';
import { DetailsGroupe } from './details-groupe';

const MOI = 'u-moi';
const membre = (id: string, prenom: string, roleParticipant: RoleParticipant): MembreConversation => ({
  id, prenom, nom: 'Diop', nomAffiche: `${prenom} Diop`, urlPhoto: null, role: 'ALUMNI', roleParticipant,
});
const groupe = (monRole: RoleParticipant, participants: MembreConversation[]): ConversationDetail => ({
  id: 'g-1', type: 'GROUPE', nom: 'Club IA', description: 'Veille et projets', urlPhoto: null, monRole,
  ecriture: 'OUVERTE', creeLe: '2026-11-14T09:00:00Z', participants,
});

describe('DetailsGroupe', () => {
  let fixture: ComponentFixture<DetailsGroupe>;
  let http: HttpTestingController;

  beforeEach(async () => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
    await TestBed.configureTestingModule({
      imports: [DetailsGroupe],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: AuthService, useValue: { utilisateur: signal({ id: MOI }) } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DetailsGroupe);
  });

  afterEach(() => http.verify());

  function ouvrir(detail: ConversationDetail): HTMLElement {
    fixture.componentRef.setInput('detail', detail);
    fixture.componentRef.setInput('ouvert', true);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const boutons = (racine: HTMLElement) => [...racine.querySelectorAll('button')];
  const bouton = (racine: HTMLElement, texte: string) =>
    boutons(racine).find((b) => b.textContent?.trim() === texte) as HTMLButtonElement | undefined;

  it('montre la description à un membre, sans aucune action d’administration', () => {
    const racine = ouvrir(groupe('MEMBRE', [membre(MOI, 'Awa', 'MEMBRE'), membre('u-2', 'Moussa', 'ADMINISTRATEUR')]));

    expect(racine.querySelector('.description')?.textContent).toContain('Veille et projets');
    expect(racine.querySelector('form')).toBeNull();
    expect(bouton(racine, 'Nommer admin')).toBeUndefined();
    expect(bouton(racine, 'Supprimer le groupe')).toBeUndefined();
    expect(racine.querySelector('label[for="photo-groupe"]')).toBeNull();
  });

  it('nomme un membre administrateur après confirmation', async () => {
    const racine = ouvrir(groupe('ADMINISTRATEUR', [membre(MOI, 'Awa', 'ADMINISTRATEUR'), membre('u-2', 'Moussa', 'MEMBRE')]));
    const modifie = vi.fn();
    fixture.componentInstance.modifie.subscribe(modifie);

    // Seul administrateur : je ne peux pas me retirer ce rôle.
    expect(bouton(racine, 'Retirer le rôle d’admin')).toBeUndefined();
    bouton(racine, 'Nommer admin')?.click();
    fixture.detectChanges();
    expect(racine.textContent).toContain('Nommer Moussa Diop administrateur ?');
    bouton(racine, 'Confirmer')?.click();

    const requete = http.expectOne('/api/messagerie/conversations/g-1/participants/u-2');
    expect(requete.request.method).toBe('PATCH');
    expect(requete.request.body).toEqual({ role: 'ADMINISTRATEUR' });
    const apres = groupe('ADMINISTRATEUR', [membre(MOI, 'Awa', 'ADMINISTRATEUR'), membre('u-2', 'Moussa', 'ADMINISTRATEUR')]);
    requete.flush(apres);
    await fixture.whenStable();
    expect(modifie).toHaveBeenCalledWith(apres);
  });

  it('enregistre le nom et la description modifiés', async () => {
    const racine = ouvrir(groupe('ADMINISTRATEUR', [membre(MOI, 'Awa', 'ADMINISTRATEUR')]));
    const enregistrer = bouton(racine, 'Enregistrer');
    expect(enregistrer?.disabled).toBe(true);

    const description = racine.querySelector('#description-groupe') as HTMLTextAreaElement;
    description.value = '  Projets du jeudi ';
    description.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(enregistrer?.disabled).toBe(false);
    enregistrer?.click();
    await fixture.whenStable();

    const requete = http.expectOne('/api/messagerie/conversations/g-1');
    expect(requete.request.method).toBe('PATCH');
    expect(requete.request.body).toEqual({ nom: 'Club IA', description: 'Projets du jeudi' });
    requete.flush({ ...groupe('ADMINISTRATEUR', [membre(MOI, 'Awa', 'ADMINISTRATEUR')]), description: 'Projets du jeudi' });
  });

  it('supprime le groupe après confirmation puis prévient le fil', async () => {
    const racine = ouvrir(groupe('ADMINISTRATEUR', [membre(MOI, 'Awa', 'ADMINISTRATEUR'), membre('u-2', 'Moussa', 'MEMBRE')]));
    const quitte = vi.fn();
    fixture.componentInstance.quitte.subscribe(quitte);

    bouton(racine, 'Supprimer le groupe')?.click();
    fixture.detectChanges();
    expect(racine.textContent).toContain('seront supprimés pour tous les participants');
    bouton(racine, 'Supprimer définitivement')?.click();

    const requete = http.expectOne('/api/messagerie/conversations/g-1');
    expect(requete.request.method).toBe('DELETE');
    requete.flush(null);
    await fixture.whenStable();
    expect(quitte).toHaveBeenCalled();
  });
});
