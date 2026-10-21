---
name: ept-angular
description: Conventions et patrons du frontend Angular 22 de la plateforme EPT Alumni (projet-alumni/frontend). À utiliser dès qu'on crée ou modifie un composant, une page, un formulaire, un service, une route, un style ou un test sous projet-alumni/frontend — liste avec filtres, fenêtre modale, carte de membre, formulaire Signal Forms, navigation, responsive ou accessibilité — même si la demande ne cite pas Angular (« ajoute un bouton », « la page déborde sur mobile », « fais l'écran des offres »).
---

# Frontend EPT Alumni — Angular 22

Ce skill complète le skill officiel `angular-developer` de l'équipe Angular : lui décrit Angular
en général, celui-ci décrit **comment ce projet-ci l'utilise**. Pour le détail d'une API Angular,
lire la référence officielle (`angular-developer/references/<sujet>.md` s'il est installé, par
exemple dans `../.agents/skills/`) ou la page correspondante d'angular.dev.

Versions : Angular 22.0, PrimeNG 22, TypeScript 6, Vitest. Code, noms et textes **en français**.

## Règles de base (vérifiées dans le code existant)

- Composants standalone sans `standalone: true` ; pas de `changeDetection` (OnPush est le défaut en v22).
- `input()`, `output()`, `model()`, `computed()`, `linkedSignal()` ; jamais de décorateurs `@Input`/`@Output`.
- Services singleton : `@Service()` (pas `@Injectable({ providedIn: 'root' })`) ; injection par `inject()`.
- Contrôle de flux natif `@if`/`@for`/`@switch` ; `@let` pour une valeur locale de template.
- Pas de `ngClass`/`ngStyle`, pas de `CommonModule` : importer seulement `DatePipe`, `RouterLink`…
- `host: {}` dans le décorateur au lieu de `@HostBinding`/`@HostListener`.
- Pas de `any` (ni `$any()` dans les templates) : `unknown` puis rétrécissement, ou un Signal Form.
- Routes de fonctionnalité en chargement différé (`loadComponent` / `loadChildren`) avec
  `canActivate: [authGuard, changementInitialRequisGuard]` et `roleGuard` + `data: { roles }`.
- La locale `fr` est enregistrée globalement (`app.config.ts`) : `DatePipe` formate en français,
  ne pas forcer de majuscule sur les mois (`text-transform: capitalize` est à proscrire sur une date).

## Arborescence

```
src/app/
  core/services/<domaine>/<domaine>.ts   service HTTP (@Service), un fichier par domaine
  core/services/models/<domaine>.model.ts types + libellés (Record<Statut, string>)
  core/navigation/                        RetourNavigation, RestaurationDefilement
  features/<domaine>/<page>/<page>.ts|html|scss|spec.ts
  shared/                                 fil-ariane, bouton-retour…
```

Un composant = une responsabilité. Une page qui grossit se découpe en sous-composants
dans son dossier (ex. `detail-mentorat/seances-mentorat/`).

## Patrons du projet — lire `references/patrons.md` avant d'écrire une page

Le fichier contient le code de référence de chaque patron :

1. **Page liste avec filtres en temps réel** (annuaire, mentors) : critères dans l'URL, saisie
   appliquée après 300 ms, `replaceUrl: true`, Entrée applique tout de suite, pas de bouton
   « Rechercher »/« Appliquer », squelettes au premier chargement puis opacité réduite.
2. **États** chargement / erreur (`role="alert"`) / vide / résultats, toujours les quatre.
3. **Formulaire Signal Forms** : validation dans le schéma, erreurs affichées après `touched()`,
   `aria-invalid` + `aria-describedby`, erreur serveur `error.message`.
4. **Fenêtre modale** : `<dialog>` natif + `showModal()` piloté par un `input()`.
5. **Action sur une ligne** (accepter/refuser/annuler) avec confirmation en ligne et erreur locale.
6. **Bouton retour** : `<app-bouton-retour [secours]="…" />`, jamais un lien codé en dur.

## Signal Forms — pièges déjà rencontrés

- `NG8022` : ne pas poser `min`, `max`, `maxlength`, `required` sur un élément `[formField]` ;
  déclarer `min()`, `max()`, `maxLength()`, `required()` dans le schéma (Angular pose lui-même
  les attributs utiles à l'accessibilité).
- Valeurs initiales jamais `null` : `''`, `0`, `[]`.
- Champ « liste de cases » : garder un tableau dans le modèle et le basculer à la main,
  avec un `validate()` sur le tableau.
- Soumission : `submit(this.formulaire, async () => { … })` (ou `[formRoot]` + option
  `submission`) ; utiliser `formulaire().submitting()` plutôt qu'un signal maison quand c'est possible ;
  `onInvalid` pour mettre le focus sur la première erreur.

## Styles

- Jetons dans `src/styles.scss` : `--ept-primary` #014365, `--ept-primary-dark`, `--ept-primary-light`,
  `--ept-sky` (#73DBF2, focus et alumni), `--ept-gold` / `-light` / `-dark` (étudiants, « en attente »),
  `--ept-success` / `-light` / `-dark` (texte vert sur fond vert clair : toujours `-dark`), `--ept-error*`, `--ept-border`, `--ept-bg`, `--ept-text-secondary`.
- Couleurs de rôle (bandeau des cartes) : étudiant or, alumni bleu ciel, visiteur gris,
  personnel bleu marine, organisme bleu foncé + liseré ciel.
- Focus visible partout : `outline: 2px solid var(--ept-sky)`.
- Budget : 6 kB d'avertissement, **8 kB d'erreur** par feuille de composant → rester compact,
  découper le composant plutôt que dépasser.
- Anti-débordement : `minmax(0, 1fr)` au lieu de `1fr`, `min-width: 0` sur les enfants flex/grid,
  grilles `repeat(auto-fill, minmax(min(100%, 16rem), 1fr))`, `aspect-ratio` toujours avec `width: 100%`.
- Mobile ≤ 560 px : onglets en largeur égale, pastilles de filtres sur une ligne défilante,
  champs en pleine largeur. La barre de navigation mobile occupe le bas : laisser de la marge.
- `.sr-only` n'est pas global : le redéclarer dans la feuille du composant qui l'utilise.
- Une page enfant de l'espace membre n'utilise **pas** `<main>` : le cadre (`espace-membre.html`)
  en fournit déjà un ; un second `<main>` imbriqué échoue à AXE. Racine de page : `<div class="…-page">`.

## Accessibilité (WCAG AA, AXE)

Lire `references/accessibilite.md` pour la liste de contrôle. L'essentiel : chaque champ a un
`<label for>`, les groupes de boutons ont `role="group"` + `aria-label` et `aria-pressed`,
l'onglet courant `ariaCurrentWhenActive="page"`, les messages dynamiques `role="status"` ou
`role="alert"`, les zones qui se rechargent `aria-live="polite"` + `aria-busy`.

## Tests et vérification

Lire `references/tests.md` pour les gabarits Vitest. Avant de dire « c'est fait » :

```bash
npx ng test --watch=false
```

```bash
npx ng build
```

puis vérifier la page dans le navigateur intégré sur `http://localhost:4200`, en largeur
bureau **et** 375 px (aucun `scrollWidth > innerWidth`). Mettre à jour les tests existants
quand la navigation ou un libellé change (ex. `espace-membre.spec.ts`, `navigation-mobile.spec.ts`).
