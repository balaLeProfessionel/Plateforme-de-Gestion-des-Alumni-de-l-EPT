# Patrons de code du frontend EPT Alumni

Exemples réels du projet, réduits à l'essentiel. Fichiers d'origine entre parenthèses :
les relire quand on reproduit le patron.

## Sommaire
1. Liste avec filtres en temps réel
2. Les quatre états d'une zone de résultats
3. Formulaire Signal Forms
4. Fenêtre modale native
5. Actions sur une ligne de liste
6. Service HTTP et modèle
7. Routes d'une fonctionnalité par rôle

---

## 1. Liste avec filtres en temps réel
(`features/annuaire/annuaire.ts`, `features/mentorat/trouver-mentor/trouver-mentor.ts`)

Principes :
- **L'URL est la source de vérité** des critères : lien partageable, état retrouvé au retour.
- La saisie part après **300 ms** de pause ; **Entrée** applique tout de suite.
- Changer un critère **remplace** l'entrée d'historique (`replaceUrl: true`) et revient page 0 ;
  changer de page **ajoute** une entrée (le bouton Retour revient à la page précédente).
- Aucune requête si les critères n'ont pas changé ; `switchMap` annule la requête précédente.
- Ne pas écraser ce que l'utilisateur tape pendant le chargement.

```ts
const DELAI_SAISIE_MS = 300;

constructor() {
  this.route.queryParamMap.pipe(
    map((params) => this.criteresDepuis(params)),
    tap((criteres) => {
      this.criteres.set(criteres);
      if (this.modele().recherche.trim() !== criteres.recherche) this.modele.set({ recherche: criteres.recherche });
      this.enChargement.set(true);
      this.messageErreur.set(null);
    }),
    switchMap((criteres) => this.service.rechercher(criteres).pipe(
      map((page) => ({ page, erreur: null })),
      catchError((erreur: HttpErrorResponse) => of({ page: null, erreur: erreur.error?.message ?? 'Impossible de charger…' })))),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(({ page, erreur }) => { this.resultat.set(page); this.messageErreur.set(erreur); this.enChargement.set(false); });

  toObservable(this.modele).pipe(
    skip(1), debounceTime(DELAI_SAISIE_MS),
    map(({ recherche }) => recherche.trim()), distinctUntilChanged(),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe((recherche) => { if (recherche !== this.criteres().recherche) this.appliquer({ recherche }); });
}

private appliquer(changement: Partial<Criteres>): void {
  this.naviguer({ ...this.criteres(), ...changement, page: 0 }, true);
}

private naviguer(criteres: Criteres, remplacer: boolean): void {
  const queryParams: Record<string, string | number> = {};   // n'écrire que les critères non vides
  if (criteres.recherche) queryParams['recherche'] = criteres.recherche;
  if (criteres.page > 0) queryParams['page'] = criteres.page;
  void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: remplacer });
}
```

Template du champ :

```html
<label for="recherche" class="sr-only">Rechercher un mentor</label>
<input id="recherche" type="search" autocomplete="off" [formField]="formulaire.recherche"
  aria-describedby="aide-recherche" (keydown.enter)="$event.preventDefault(); appliquerRecherche()" />
<span id="aide-recherche" class="sr-only">Les résultats se mettent à jour automatiquement.</span>
```

Filtres en pastilles : `<div role="group" aria-label="Filtrer par domaine">` et chaque bouton
avec `[attr.aria-pressed]`. Case « disponibles uniquement » : `<label><input type="checkbox">…</label>`.

## 2. Les quatre états d'une zone de résultats

```html
<p class="resume" role="status"> <strong>{{ page.totalElements }}</strong> mentors trouvés </p>
<div aria-live="polite" [attr.aria-busy]="enChargement()">
  @if (enChargement() && !resultat()) {
    <div class="grille" aria-hidden="true">@for (i of [1,2,3,4,5,6]; track i) { <div class="squelette"></div> }</div>
  } @else if (messageErreur(); as message) {
    <div class="etat" role="alert"><h2>Chargement impossible</h2><p>{{ message }}</p></div>
  } @else if (resultat()?.contenu?.length === 0) {
    <div class="etat"><h2>Aucun résultat</h2><p>Conseil pour élargir la recherche.</p></div>
  } @else if (resultat(); as page) {
    <ul class="grille" [class.actualisation]="enChargement()"> … </ul>
  }
</div>
```

Les squelettes ne s'affichent qu'au **premier** chargement ; ensuite on garde les résultats
avec `.actualisation { opacity: .55 }` pour éviter le clignotement. Squelettes PrimeNG
(`p-skeleton`) disponibles pour les cartes de l'annuaire (`carte-membre-squelette.ts`).

## 3. Formulaire Signal Forms
(`features/mentorat/mon-offre/mon-offre.ts`, `features/evenements/formulaire-evenement/`)

```ts
protected readonly modele = signal({ disponible: true, capaciteMax: 3, presentation: '', domaineIds: [] as string[] });
protected readonly formulaire = form(this.modele, (champ) => {
  min(champ.capaciteMax, 1, { message: 'Accompagnez au moins une personne.' });
  max(champ.capaciteMax, 10, { message: 'Au plus 10 mentorés en même temps.' });
  maxLength(champ.presentation, 600, { message: 'La présentation ne peut pas dépasser 600 caractères.' });
  validate(champ.domaineIds, ({ value }) => value().length === 0
    ? { kind: 'aucun', message: 'Choisissez au moins un domaine.' } : undefined);
});

protected async enregistrer(event: Event): Promise<void> {
  event.preventDefault();
  await submit(this.formulaire, async () => {
    try {
      await firstValueFrom(this.service.enregistrer(this.versRequete(this.modele())));
    } catch (erreur) {
      this.messageErreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
        ? erreur.error.message : 'L’enregistrement a échoué. Réessayez.');
    }
    return undefined;
  });
}
```

```html
<form (submit)="enregistrer($event)" novalidate>
  <label for="offre-capacite">Mentorés en même temps</label>
  <input id="offre-capacite" type="number" [formField]="formulaire.capaciteMax"
    [attr.aria-invalid]="formulaire.capaciteMax().touched() && formulaire.capaciteMax().invalid()"
    aria-describedby="erreur-capacite" />
  @if (formulaire.capaciteMax().touched() && formulaire.capaciteMax().errors()[0]; as erreur) {
    <small id="erreur-capacite" class="erreur-champ">{{ erreur.message }}</small>
  }
  <button type="submit" [disabled]="formulaire().submitting()">Enregistrer</button>
</form>
```

Le backend renvoie toujours `{ "message": "…" }` (ou `{ champ: message }` pour la validation) :
lire `erreur.error?.message`. Pour rattacher une erreur serveur à un champ, la renvoyer
depuis l'action de `submit` : `return { kind: 'serveur', message, fieldTree: this.formulaire.email }`.

Une année incomplète ne doit pas afficher d'erreur pendant la frappe : n'afficher l'erreur qu'une
fois le champ quitté ou la longueur attendue atteinte (voir `promotionEnErreur` dans l'annuaire).

## 4. Fenêtre modale native
(`features/mentorat/dialogue-demande/`)

`<dialog>` + `showModal()` gère le piège du focus, Échap et le retour du focus : pas de
bibliothèque. Le parent passe l'objet sélectionné ; `null` ferme.

```ts
readonly mentor = input<Mentor | null>(null);
readonly envoyee = output<Mentorat>();
readonly fermee = output<void>();
private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');

constructor() {
  effect(() => {
    const mentor = this.mentor();
    const dialogue = this.dialogue().nativeElement;
    if (mentor) { /* réinitialiser le modèle */ if (!dialogue.open) dialogue.showModal(); }
    else if (dialogue.open) dialogue.close();
  });
}
```

```html
<dialog #dialogue aria-labelledby="titre-demande" (close)="fermee.emit()"> … </dialog>
```

Dans les tests, jsdom n'implémente pas `showModal` : voir `tests.md`.

## 5. Actions sur une ligne de liste
(`features/mentorat/liste-mentorats/`)

- Un signal `actionEnCours` (id de la ligne) désactive ses boutons pendant la requête.
- Action destructive : panneau de confirmation **dans la ligne** (motif facultatif), pas de `confirm()`.
- Erreur métier affichée sur la ligne concernée (`role="alert"`), puis rechargement de la liste
  et des compteurs partagés (`CompteurDemandesMentorat.actualiser()`).
- La configuration d'un onglet (rôle, statuts, texte d'état vide) vient de `data` de la route,
  ce qui permet de réutiliser un seul composant pour plusieurs onglets.

## 6. Service HTTP et modèle

```ts
@Service()
export class MentoratService {
  private readonly http = inject(HttpClient);
  obtenir(id: string) { return this.http.get<MentoratDetail>(`/api/mentorat/mentorats/${encodeURIComponent(id)}`); }
  lister(role: RoleMentorat, statuts: readonly StatutMentorat[], page: number) {
    let params = new HttpParams().set('role', role).set('page', page);
    for (const statut of statuts) params = params.append('statut', statut);
    return this.http.get<Page<Mentorat>>('/api/mentorat/mentorats', { params });
  }
}
```

- Toujours `encodeURIComponent` sur un identifiant dans l'URL.
- Types des réponses = miroir exact des `record` Java ; dates en `string` ISO.
- Libellés affichés dans le modèle : `export const LIBELLES_STATUT: Record<Statut, string>`.
- État partagé entre composants (compteur de la barre latérale) : petit `@Service` avec un
  `signal` privé exposé en `asReadonly()` et une méthode `actualiser()`.
- `httpResource()` est stable en v22 et convient aux lectures simples sans critères d'URL.

## 7. Routes d'une fonctionnalité par rôle
(`features/mentorat/mentorat.routes.ts`)

Une page cadre (en-tête + onglets + `<router-outlet>`) et des enfants protégés par `roleGuard`.
La route vide redirige selon le rôle avec une fonction :

```ts
{ path: '', pathMatch: 'full', redirectTo: () => {
  const role = inject(AuthService).utilisateur()?.role;
  return role === 'ETUDIANT' ? 'trouver' : role === 'ALUMNI' ? 'recues' : 'presentation';
} }
```

Ajouter la rubrique à la navigation : `liensNavigation` dans `espace-membre.ts` (et la retirer
de `rubriquesAVenir`) pour la barre latérale, et `liensMenuMobile` pour le panneau « Menu » mobile.
La barre du bas reste à quatre entrées ; ajouter la page à `pageDuMenu` (`navigation-mobile.ts`)
pour que le bouton Menu soit marqué comme page courante.
