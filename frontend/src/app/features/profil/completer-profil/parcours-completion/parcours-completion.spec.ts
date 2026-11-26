import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { ParcoursCompletion } from './parcours-completion';

@Component({ template: '<p>étape</p>' })
class EtapeFactice {}

describe('ParcoursCompletion', () => {
  async function ouvrir(chemin: string) {
    TestBed.configureTestingModule({
      providers: [provideRouter([{
        path: 'completer-profil',
        component: ParcoursCompletion,
        children: [
          { path: 'demarrer', data: { etape: 0 }, component: EtapeFactice },
          { path: 'cv', data: { etape: 0 }, component: EtapeFactice },
          { path: 'infos', data: { etape: 1 }, component: EtapeFactice },
          { path: 'formations', data: { etape: 2 }, component: EtapeFactice }
        ]
      }])]
    });
    const harnais = await RouterTestingHarness.create();
    await harnais.navigateByUrl(chemin);
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
});
