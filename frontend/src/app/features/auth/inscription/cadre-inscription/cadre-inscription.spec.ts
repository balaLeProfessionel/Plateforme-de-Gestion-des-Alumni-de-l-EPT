import { TestBed } from '@angular/core/testing';

import { CadreInscription } from './cadre-inscription';

describe('CadreInscription', () => {
  function creer(entrees: Record<string, unknown>) {
    TestBed.configureTestingModule({ imports: [CadreInscription] });
    const fixture = TestBed.createComponent(CadreInscription);
    for (const [cle, valeur] of Object.entries(entrees)) fixture.componentRef.setInput(cle, valeur);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const libelles = (element: HTMLElement) =>
    [...element.querySelectorAll('.etapes li .libelle')].map((e) => e.textContent!.replace('(terminée)', '').trim());

  it('montre par défaut les quatre étapes de l inscription', () => {
    const element = creer({ etape: 2 });
    expect(libelles(element)).toEqual(['Votre profil', 'Vos informations', 'Votre compte', 'Vérification de l’email']);
    expect(element.querySelector('[aria-current="step"]')?.textContent).toContain('Vos informations');
    expect(element.querySelectorAll('li.faite')).toHaveLength(1);
    expect(element.querySelector('.cadre')?.classList.contains('large')).toBe(false);
  });

  it('accepte des étapes, une accroche et un libellé propres', () => {
    const element = creer({
      etape: 3, etapes: ['Compte créé', 'Email vérifié', 'Import du CV', 'Relecture du profil'],
      accroche: 'Votre compte est prêt.', libellePanneau: 'Progression de votre arrivée', large: true
    });
    expect(libelles(element)).toEqual(['Compte créé', 'Email vérifié', 'Import du CV', 'Relecture du profil']);
    expect(element.querySelector('[aria-current="step"]')?.textContent).toContain('Import du CV');
    expect(element.querySelector('.accroche')?.textContent).toBe('Votre compte est prêt.');
    expect(element.querySelector('aside')?.getAttribute('aria-label')).toBe('Progression de votre arrivée');
    expect(element.querySelector('.cadre')?.classList.contains('large')).toBe(true);
  });
});
