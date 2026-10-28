import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutocompleteOrganisme } from './autocomplete-organisme';

describe('AutocompleteOrganisme', () => {
  let fixture: ComponentFixture<AutocompleteOrganisme>;
  let racine: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AutocompleteOrganisme] });
    fixture = TestBed.createComponent(AutocompleteOrganisme);
    fixture.componentRef.setInput('idChamp', 'organisme');
    fixture.componentRef.setInput('valeurInitiale', 'Ingénieurs Solidaires du Sahel');
    racine = fixture.nativeElement;
    fixture.detectChanges();
  });

  const saisir = (valeur: string) => {
    const champ = racine.querySelector('input') as HTMLInputElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  it('n’annonce pas de création pour l’organisme déjà lié à une carte existante', () => {
    expect(racine.querySelector('.aide-nouveau')).toBeNull();
  });

  it('annonce la création quand le texte ne correspond plus à aucun organisme connu', () => {
    saisir('Nouvelle entreprise');
    expect(racine.querySelector('.aide-nouveau')?.textContent).toContain('« Nouvelle entreprise » sera créé');
    saisir('Ingénieurs Solidaires du Sahel');
    expect(racine.querySelector('.aide-nouveau')).toBeNull();
  });
});
