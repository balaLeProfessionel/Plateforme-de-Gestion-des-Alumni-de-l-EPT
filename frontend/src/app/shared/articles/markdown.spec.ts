import { TestBed } from '@angular/core/testing';
import { ContenuArticle } from './contenu-article';
import { analyserEnLigne, analyserMarkdown } from './markdown';

describe('Markdown des articles', () => {
  it('découpe intertitres, paragraphes, listes et citations', () => {
    const blocs = analyserMarkdown('## Cadrage\n\nPremière ligne\nsuite du paragraphe.\n\n- un\n- deux\n\n1. premier\n2. second\n\n> Une citation\n### Détail');
    expect(blocs.map((bloc) => bloc.type)).toEqual(['titre2', 'paragraphe', 'liste', 'liste-numerotee', 'citation', 'titre3']);
    expect(blocs[1]).toEqual({ type: 'paragraphe', segments: [{ texte: 'Première ligne suite du paragraphe.' }] });
    expect(blocs[2]).toEqual({ type: 'liste', elements: [[{ texte: 'un' }], [{ texte: 'deux' }]] });
  });

  it('reconnaît gras, italique et liens http(s) seulement', () => {
    expect(analyserEnLigne('Un **mot fort**, un *détail* et [le site](https://ept.sn).')).toEqual([
      { texte: 'Un ' }, { texte: 'mot fort', gras: true }, { texte: ', un ' }, { texte: 'détail', italique: true },
      { texte: ' et ' }, { texte: 'le site', lien: 'https://ept.sn' }, { texte: '.' },
    ]);
    expect(analyserEnLigne('[piège](javascript:alert(1))')).toEqual([{ texte: '[piège](javascript:alert(1))' }]);
  });

  it('affiche le HTML saisi comme du texte, sans l’interpréter', () => {
    const fixture = TestBed.createComponent(ContenuArticle);
    fixture.componentRef.setInput('contenu', '<script>alert(1)</script> <img src=x onerror=alert(1)>\n\n## Titre');
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('script, img')).toBeNull();
    expect(racine.querySelector('p')?.textContent).toContain('<script>alert(1)</script>');
    expect(racine.querySelector('h2')?.textContent).toBe('Titre');
  });

  it('ouvre les liens dans un nouvel onglet sans transmettre la page d’origine', () => {
    const fixture = TestBed.createComponent(ContenuArticle);
    fixture.componentRef.setInput('contenu', 'Voir [le rapport](https://example.org/rapport).');
    fixture.detectChanges();
    const lien = (fixture.nativeElement as HTMLElement).querySelector('a') as HTMLAnchorElement;
    expect(lien.href).toBe('https://example.org/rapport');
    expect(lien.target).toBe('_blank');
    expect(lien.rel).toContain('noopener');
  });
});
