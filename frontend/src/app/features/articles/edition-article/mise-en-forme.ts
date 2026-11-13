/** Outils de la barre de rédaction : chacun écrit le Markdown limité des articles autour de la sélection. */
export type OutilMiseEnForme = 'intertitre' | 'gras' | 'italique' | 'liste' | 'lien';

export interface Edition {
  texte: string;
  debut: number;
  fin: number;
}

const EXEMPLES: Record<'gras' | 'italique' | 'lien', string> = { gras: 'texte en gras', italique: 'texte en italique', lien: 'texte du lien' };
const URL_PROVISOIRE = 'https://';

/** Applique l’outil à la sélection [debut, fin[ et renvoie le texte et la nouvelle sélection. */
export function appliquerMiseEnForme(source: Edition, outil: OutilMiseEnForme): Edition {
  const { texte, debut, fin } = source;
  const selection = texte.slice(debut, fin);
  switch (outil) {
    case 'gras':
    case 'italique': {
      const marque = outil === 'gras' ? '**' : '*';
      const contenu = selection || EXEMPLES[outil];
      return {
        texte: texte.slice(0, debut) + marque + contenu + marque + texte.slice(fin),
        debut: debut + marque.length, fin: debut + marque.length + contenu.length,
      };
    }
    case 'lien': {
      const libelle = selection || EXEMPLES.lien;
      const insere = `[${libelle}](${URL_PROVISOIRE})`;
      // L’adresse est sélectionnée : il ne reste qu’à la coller.
      const debutUrl = debut + libelle.length + 3;
      return { texte: texte.slice(0, debut) + insere + texte.slice(fin), debut: debutUrl, fin: debutUrl + URL_PROVISOIRE.length };
    }
    case 'intertitre':
    case 'liste': {
      const prefixe = outil === 'intertitre' ? '## ' : '- ';
      const debutLigne = texte.lastIndexOf('\n', debut - 1) + 1;
      const finBloc = fin > debut && texte[fin - 1] === '\n' ? fin - 1 : fin;
      const lignes = texte.slice(debutLigne, finBloc).split('\n');
      const dejaFait = lignes.every((ligne) => ligne.startsWith(prefixe));
      // Un second clic retire la marque ; sinon elle remplace un intertitre ou une puce déjà présents.
      const bloc = lignes
        .map((ligne) => dejaFait ? ligne.slice(prefixe.length) : prefixe + ligne.replace(/^(#{1,4}\s+|[-*+]\s+)/, ''))
        .join('\n');
      const nouveau = texte.slice(0, debutLigne) + bloc + texte.slice(finBloc);
      return { texte: nouveau, debut: debutLigne, fin: debutLigne + bloc.length };
    }
  }
}
