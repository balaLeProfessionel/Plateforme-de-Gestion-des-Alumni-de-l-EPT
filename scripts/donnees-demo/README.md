# Données de démonstration

Remplissent la base de **développement** avec des données réalistes : 32 membres (alumni, étudiants,
personnel, visiteurs) avec formations et expériences, 6 organismes, 15 événements (dont 6 avec
illustration 16:9 et 13 à venir) et leurs participations, 14 offres de mentorat et des mentorats
dans tous les états, avec séances et évaluations.

```bash
scripts/donnees-demo/charger.sh adresse.du.compte@modele
```

- La pile Docker doit tourner (`docker compose up`).
- Les comptes de démonstration (`…@demo.ept-alumni.invalid`) reprennent le mot de passe du compte
  modèle passé en argument ; sans argument, on ne peut pas s'y connecter.
- `admin@demo.ept-alumni.invalid` (Mame Diarra Ndour) est le compte d'administration : seul rôle qui
  crée et gère les programmes de mentorat et consulte leur tableau de bord.
- Deux programmes de mentorat, datés par rapport au jour du chargement : « Orientation des lycéens »
  (en cours ; Awa Thiam mentore volontaire, un mentorat accepté avec une étape franchie et une demande
  en attente) et « Préparation aux concours » (date de fin passée, encore ouvert : l'administration
  voit l'avertissement « pensez à clore »).
- Rejouable sans doublon : les identifiants sont stables. Les dates des événements sont calculées
  par rapport au jour du premier chargement.
- Données étendues (`donnees-demo-etendues.sql`, chargées après la base) : environ 120 membres de plus
  (alumni de 2002 à 2025 avec stages, postes successifs, masters et certifications ; étudiants ;
  personnel ; visiteurs), 16 organismes avec logo, 30 événements dont une vingtaine illustrés, une
  trentaine d'offres de mentorat, une soixantaine de mentorats dans tous les états (séances,
  évaluations) et deux programmes de plus. Trois membres sur quatre ont un portrait.
- Les portraits sont **dessinés** par `generer-visuels.py` (teint, coiffure, foulard, lunettes, tenue
  tirés au hasard) : aucune photo de personne réelle. Logos et visuels d'événements sont aussi générés.
- Pour modifier les données étendues : éditer `generer-sql-etendu.py` puis
  `python generer-sql-etendu.py donnees-demo-etendues.sql visuels-etendus.json`.
- Pour modifier les données, éditer `generer-sql.py` puis régénérer :
  `python generer-sql.py donnees-demo.sql`.
