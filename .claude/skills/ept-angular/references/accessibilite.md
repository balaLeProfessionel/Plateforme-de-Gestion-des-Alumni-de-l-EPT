# Liste de contrôle accessibilité (WCAG 2.2 AA, AXE)

À parcourir avant de considérer un écran terminé.

## Structure
- Un seul `<h1>` par page (il peut être `sr-only` si le titre visuel est une carte).
- Hiérarchie de titres sans saut (`h1` → `h2` → `h3`).
- Régions : `<main>`, `<nav aria-label>`, `<section aria-labelledby>`, `<aside>`.
- Le fil d'Ariane passe par `<app-fil-ariane>`.

## Formulaires
- Chaque champ a un `<label for>` visible, ou `sr-only` quand le placeholder suffit visuellement.
- Erreur : `aria-invalid="true"` sur le champ, message relié par `aria-describedby`,
  affiché après `touched()` (ou à la soumission). Une erreur qui apparaît pendant la saisie
  d'une valeur encore incomplète est une mauvaise pratique.
- Groupe de cases ou de boutons radio : `<fieldset>` + `<legend>`.
- Interrupteur : `<input type="checkbox" role="switch">` dans un `<label>`.
- Note en étoiles : vrais boutons radio dans des `<label>`, avec un texte `sr-only` « 4 sur 5 ».

## Interactions
- Tout est atteignable au clavier, dans un ordre logique ; aucun `tabindex` positif.
- Focus visible : `outline: 2px solid var(--ept-sky)` sur `:focus-visible` (contraste ≥ 3:1).
- Cibles tactiles d'au moins 2.5rem (40 px) ; 2.75rem pour la pagination.
- Bouton qui n'agit pas : `disabled` + un texte qui dit pourquoi (« Complet », « Demande envoyée »).
- Lien externe dans un nouvel onglet : `rel="noopener noreferrer"` + mention `sr-only` « (nouvel onglet) ».
  N'ouvrir que les URL `https://` saisies par un membre.
- Fenêtre modale : `<dialog>` natif avec `showModal()`, titre relié par `aria-labelledby`,
  bouton de fermeture avec `aria-label="Fermer"`.

## Contenu dynamique
- Résumé de résultats et confirmations : `role="status"`.
- Erreurs : `role="alert"`.
- Zone rechargée : `aria-live="polite"` + `[attr.aria-busy]`.
- Badges numériques décoratifs `aria-hidden="true"` doublés d'un texte `sr-only`
  (« 3 demandes en attente ») sur l'élément interactif.
- Navigation : `routerLinkActive` + `ariaCurrentWhenActive="page"`.

## Couleurs
- Contraste texte ≥ 4.5:1, grands textes et icônes ≥ 3:1.
- Le blanc sur l'or (`--ept-gold`) n'atteint pas AA : utiliser `--ept-gold-dark` sur `--ept-gold-light` (5.3:1).
- `--ept-success` sur `--ept-success-light` = 4.3:1 (échec) : utiliser `--ept-success-dark` (6.1:1).
- `--ept-text-secondary` (#536C7D) passe 4.5:1 sur blanc, `--ept-bg`, `--ept-primary-light` et `--ept-gold-light` ;
  ne pas l'éclaircir (l'ancienne valeur #5B7789 échouait sur `--ept-bg`).
- `aria-label` est interdit sur un `<p>` ou un `<span>` sans rôle : ajouter `role="img"` (ex. note en étoiles).
- Ne jamais coder une information par la couleur seule : un statut a toujours un libellé.

## Vérifier
- AXE dans le navigateur intégré : injecter `https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js`
  puis `axe.run(élément, { runOnly: ['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice'] })`.
  Charger chaque page dans une `iframe` hors écran pour en auditer plusieurs d'affilée.
- Après une soumission refusée, le focus doit aller au premier champ `aria-invalid="true"` :
  option `onInvalid` de `submit()` + `focaliserPremiereErreur()` (`shared/formulaires/`).
- Navigateur intégré : `read_page` pour l'arbre d'accessibilité, `find` pour vérifier les noms accessibles.
- Largeurs 375 px, 768 px et bureau ; zoom 200 % sans perte de contenu.
