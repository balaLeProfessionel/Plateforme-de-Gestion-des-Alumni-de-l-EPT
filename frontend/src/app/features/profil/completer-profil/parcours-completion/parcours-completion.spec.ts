import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AuthService } from '../../../../core/services/auth/auth-service';
import { EtatArriveeParcours, ParcoursCompletion } from './parcours-completion';

@Component({ template: '<p>étape</p>' })
class EtapeFactice {}

describe('ParcoursCompletion', () => {
  async function ouvrir(chemin: string, options: { role?: string; etat?: EtatArriveeParcours } = {}) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{
          path: 'completer-profil',
          component: ParcoursCompletion,
          children: [
            { path: 'demarrer', data: { etape: 0 }, component: EtapeFactice },
            { path: 'cv', data: { etape: 0 }, component: EtapeFactice },
            { path: 'infos', data: { etape: 1 }, component: EtapeFactice },
            { path: 'formations', data: { etape: 2 }, component: EtapeFactice }
          ]
        }]),
        { provide: AuthService, useValue: { utilisateur: () => (options.role ? { role: options.role } : null) } }
      ]
    });
    const harnais = await RouterTestingHarness.create();
    if (options.etat) {
      // Comme la première connexion : l'état accompagne la navigation vers le parcours.
      await TestBed.inject(Router).navigateByUrl(chemin, { state: options.etat });
    } else {
      await harnais.navigateByUrl(chemin);
    }
    harnais.detectChanges();
    const element = harnais.routeNativeElement!.ownerDocument.body;
    return {
      harnais,
      element,
      etapes: () => [...element.querySelectorAll('.etapes .libelle')].map((e) => e.textContent!.replace('(terminée)', '').trim()),
      courante: () => element.querySelector('.etapes [aria-current="step"] .libelle')?.textContent?.trim()
    };
  }

  it('au démarrage, les deux premières étapes sont franchies et le mode de remplissage est en cours', async () => {
    const { etapes, courante, element } = await ouvrir('/completer-profil/demarrer');
    expect(etapes()).toEqual(['Compte créé', 'Email vérifié', 'Mode de remplissage',
      'Informations', 'Formations', 'Expériences', 'Compétences']);
    expect(courante()).toBe('Mode de remplissage');
    expect(element.querySelectorAll('.etapes li.faite')).toHaveLength(2);
    expect(element.querySelector('app-indicateur-etapes')).toBeNull();
  });

  it('sur le chemin du CV, le parcours se réduit à l import puis la relecture', async () => {
    const { etapes, courante } = await ouvrir('/completer-profil/cv');
    expect(etapes()).toEqual(['Compte créé', 'Email vérifié', 'Import du CV', 'Relecture du profil']);
    expect(courante()).toBe('Import du CV');
  });

  it('suit les étapes de la saisie manuelle et garde l indicateur pour les petits écrans', async () => {
    const { etapes, courante, element, harnais } = await ouvrir('/completer-profil/infos');
    expect(etapes()).toHaveLength(7);
    expect(courante()).toBe('Informations');
    expect(element.querySelector('app-indicateur-etapes')).not.toBeNull();

    await harnais.navigateByUrl('/completer-profil/formations');
    harnais.detectChanges();
    expect(courante()).toBe('Formations');
    expect(element.querySelectorAll('.etapes li.faite')).toHaveLength(4);
  });

  it('pour un compte ouvert par l école, le mot de passe défini remplace l email vérifié', async () => {
    const { etapes, courante, element, harnais } = await ouvrir('/completer-profil/demarrer', {
      role: 'ALUMNI',
      etat: { compteDeLEcole: true }
    });
    expect(etapes().slice(0, 3)).toEqual(['Compte créé par l’école', 'Mot de passe défini', 'Mode de remplissage']);
    expect(courante()).toBe('Mode de remplissage');
    expect(element.querySelectorAll('.etapes li.faite')).toHaveLength(2);

    // L'état n'accompagne que la première navigation : les étapes suivantes gardent ces libellés.
    await harnais.navigateByUrl('/completer-profil/infos');
    harnais.detectChanges();
    expect(etapes().slice(0, 2)).toEqual(['Compte créé par l’école', 'Mot de passe défini']);
  });

  it('un étudiant garde ces libellés sans état de navigation, par exemple après un rechargement', async () => {
    const { etapes } = await ouvrir('/completer-profil/cv', { role: 'ETUDIANT' });
    expect(etapes()).toEqual(['Compte créé par l’école', 'Mot de passe défini', 'Import du CV', 'Relecture du profil']);
  });

  it('un membre inscrit lui-même garde « Compte créé » et « Email vérifié »', async () => {
    const { etapes } = await ouvrir('/completer-profil/demarrer', { role: 'ALUMNI' });
    expect(etapes().slice(0, 2)).toEqual(['Compte créé', 'Email vérifié']);
  });
});
