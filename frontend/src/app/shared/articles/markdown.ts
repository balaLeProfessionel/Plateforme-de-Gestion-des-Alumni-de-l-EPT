/**
 * Markdown limité des articles : intertitres (##, ###), paragraphes, listes, citations, gras, italique et liens
 * http(s). Le texte est découpé en blocs que le template affiche : aucun HTML n’est jamais interprété.
 */
export interface Segment {
  texte: string;
  gras?: boolean;
  italique?: boolean;
  lien?: string;
}

export type Bloc =
  | { type: 'titre2' | 'titre3' | 'paragraphe' | 'citation'; segments: Segment[] }
  | { type: 'liste' | 'liste-numerotee'; elements: Segment[][] };

const TITRE = /^(#{1,4})\s+(.*)$/;
const PUCE = /^\s*[-*+]\s+(.*)$/;
const NUMERO = /^\s*\d{1,3}[.)]\s+(.*)$/;
const CITATION = /^\s*>\s?(.*)$/;
const EN_LIGNE = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*\n]+?)\*\*|\*([^*\n]+?)\*|_([^_\n]+?)_/g;

export function analyserMarkdown(source: string): Bloc[] {
  const blocs: Bloc[] = [];
  const lignes = source.replace(/\r\n?/g, '\n').split('\n');
  let paragraphe: string[] = [];
  let citation: string[] = [];
  // Réaffectée par vider() : le type explicite évite que l’analyse de flux la croie toujours nulle.
  let liste = null as { type: 'liste' | 'liste-numerotee'; elements: string[] } | null;

  const vider = () => {
    if (paragraphe.length) blocs.push({ type: 'paragraphe', segments: analyserEnLigne(paragraphe.join(' ')) });
    if (citation.length) blocs.push({ type: 'citation', segments: analyserEnLigne(citation.join(' ')) });
    if (liste) blocs.push({ type: liste.type, elements: liste.elements.map((element) => analyserEnLigne(element)) });
    paragraphe = [];
    citation = [];
    liste = null;
  };

  for (const brute of lignes) {
    const ligne = brute.trimEnd();
    if (!ligne.trim()) { vider(); continue; }
    const titre = TITRE.exec(ligne);
    if (titre) {
      vider();
      blocs.push({ type: titre[1].length <= 2 ? 'titre2' : 'titre3', segments: analyserEnLigne(titre[2].trim()) });
      continue;
    }
    const cite = CITATION.exec(ligne);
    if (cite) {
      if (!citation.length) vider();
      citation.push(cite[1].trim());
      continue;
    }
    const puce = PUCE.exec(ligne);
    const numero = puce ? null : NUMERO.exec(ligne);
    if (puce || numero) {
      const type = puce ? 'liste' : 'liste-numerotee';
      if (liste?.type !== type) { vider(); liste = { type, elements: [] }; }
      liste.elements.push((puce ?? numero)![1].trim());
      continue;
    }
    if (liste) {
      // Une ligne qui suit un élément sans puce le prolonge.
      liste.elements[liste.elements.length - 1] += ' ' + ligne.trim();
      continue;
    }
    if (citation.length) vider();
    paragraphe.push(ligne.trim());
  }
  vider();
  return blocs;
}

export function analyserEnLigne(texte: string, styles: Omit<Segment, 'texte'> = {}): Segment[] {
  const segments: Segment[] = [];
  let debut = 0;
  for (const trouve of texte.matchAll(EN_LIGNE)) {
    const position = trouve.index ?? 0;
    if (position > debut) segments.push({ ...styles, texte: texte.slice(debut, position) });
    const [, libelle, url, gras, etoile, souligne] = trouve;
    if (libelle !== undefined) segments.push(...analyserEnLigne(libelle, { ...styles, lien: url }));
    else if (gras !== undefined) segments.push(...analyserEnLigne(gras, { ...styles, gras: true }));
    else segments.push({ ...styles, italique: true, texte: etoile ?? souligne ?? '' });
    debut = position + trouve[0].length;
  }
  if (debut < texte.length) segments.push({ ...styles, texte: texte.slice(debut) });
  return segments;
}
