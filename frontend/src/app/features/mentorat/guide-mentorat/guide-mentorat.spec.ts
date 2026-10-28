import { TestBed } from '@angular/core/testing';

import { GuideMentorat } from './guide-mentorat';

describe('GuideMentorat', () => {
  it('explique les deux rôles et les étapes, replié par défaut', () => {
    const fixture = TestBed.createComponent(GuideMentorat);
    fixture.detectChanges();
    const racine: HTMLElement = fixture.nativeElement;

    expect((racine.querySelector('details') as HTMLDetailsElement).open).toBe(false);
    expect(racine.querySelector('summary')?.textContent).toContain('Comment fonctionne le mentorat ?');
    expect([...racine.querySelectorAll('h3')].map((titre) => titre.textContent)).toEqual(['Le mentor', 'Le mentoré', 'Les étapes']);
    expect(racine.textContent).toContain('une seule demande en cours par mentor');

    fixture.componentRef.setInput('ouvert', true);
    fixture.detectChanges();
    expect((racine.querySelector('details') as HTMLDetailsElement).open).toBe(true);
  });
});
