# Tests frontend (Vitest + TestBed)

Commande : `npx ng test --watch=false` (depuis `projet-alumni/frontend`).

## Gabarit d'une page qui appelle l'API et lit l'URL

```ts
describe('TrouverMentor', () => {
  let fixture: ComponentFixture<TrouverMentor>;
  let http: HttpTestingController;
  let parametres: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    parametres = new BehaviorSubject(convertToParamMap({}));
    await TestBed.configureTestingModule({
      imports: [TrouverMentor],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: parametres } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());   // aucune requête oubliée ni en trop
});
```

- Requête : `http.expectOne((req) => req.url === '/api/…')`, vérifier `request.params` / `request.body`,
  puis `flush(...)` ; erreur métier : `flush({ message: '…' }, { status: 409, statusText: 'Conflict' })`.
- Après un `flush` : `await fixture.whenStable()` (puis `fixture.detectChanges()` si besoin).
- Navigation par l'URL : vérifier `navigate` avec `expect.objectContaining({ queryParams, replaceUrl: true })`.
- Saisie dans un champ `[formField]` : modifier `input.value` puis `dispatchEvent(new Event('input'))`.
- Soumission : `form.dispatchEvent(new Event('submit', { cancelable: true }))`.
- Composant dont la configuration vient de la route :
  `{ provide: ActivatedRoute, useValue: { snapshot: { data: { vue } } } }`.
- Service à état partagé : le remplacer par un objet `{ nombre: signal(0), actualiser: vi.fn() }`.
- `<dialog>` : jsdom n'a pas `showModal`/`close` ; les définir dans `beforeEach` :
  ```ts
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
  ```
- Tester ce que voit l'utilisateur (texte, `disabled`, `aria-pressed`, rôles) plutôt que les signaux internes.

## Quoi tester en priorité
1. Les critères lus depuis l'URL et envoyés à l'API.
2. Une interaction qui change l'URL ou envoie une requête (avec le bon corps).
3. Les états désactivés et les messages d'erreur métier.
4. Les règles de saisie : valeur invalide non envoyée, erreur visible au bon moment.

Après tout changement de navigation, relancer toute la suite : `espace-membre.spec.ts` et
`navigation-mobile.spec.ts` vérifient la liste exacte des liens.
