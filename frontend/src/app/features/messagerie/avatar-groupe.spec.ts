import { TestBed } from '@angular/core/testing';
import { AvatarGroupe, initialesGroupe } from './avatar-groupe';

describe('AvatarGroupe', () => {
  it('tire deux initiales du nom, sans les petits mots ni les chiffres', () => {
    expect(initialesGroupe('Promo 2018 · Télécoms')).toBe('PT');
    expect(initialesGroupe('Groupe de vérification')).toBe('GV');
    expect(initialesGroupe('Club IA')).toBe('CI');
    expect(initialesGroupe('équipe d’accueil')).toBe('ÉA');
    expect(initialesGroupe("Amicale de l'EPT")).toBe('AE');
    expect(initialesGroupe('Mentorat')).toBe('M');
    expect(initialesGroupe('Les')).toBe('L');
    expect(initialesGroupe('2018 !')).toBe('');
  });

  it('affiche les initiales sans photo, l’icône des groupes sans lettre', () => {
    const fixture = TestBed.createComponent(AvatarGroupe);
    fixture.componentRef.setInput('nom', 'Promo 2018 · Télécoms');
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('.carre')?.textContent?.trim()).toBe('PT');
    expect(racine.querySelector('.carre')?.getAttribute('aria-hidden')).toBe('true');

    fixture.componentRef.setInput('nom', '2018');
    fixture.detectChanges();
    expect(racine.querySelector('.carre .pi-users')).not.toBeNull();
  });
});
