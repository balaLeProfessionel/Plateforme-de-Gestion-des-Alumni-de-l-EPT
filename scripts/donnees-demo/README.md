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
- Pour modifier les données, éditer `generer-sql.py` puis régénérer :
  `python generer-sql.py donnees-demo.sql`.
