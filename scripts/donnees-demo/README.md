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
- Témoignages (`donnees-demo-temoignages.sql`) : 3 témoignages **fictifs** de membres de démonstration pour la
  page d'accueil, à ne jamais charger en production. La table `temoignages` doit exister : le backend à jour
  doit avoir démarré au moins une fois.
- Pour modifier les données étendues : éditer `generer-sql-etendu.py` puis
  `python generer-sql-etendu.py donnees-demo-etendues.sql visuels-etendus.json`.
- Fil d'actualité (`donnees-demo-publications.sql`, chargé en dernier) : 35 publications des membres de
  démonstration sur les dix derniers jours (offres de stage et d'emploi, retours d'expérience, questions
  d'étudiants, annonces officielles et appels à projets de l'administration, publications réservées aux
  alumni ou aux étudiants), avec une centaine de commentaires dont des réponses de l'auteur et quelques
  centaines de « J'aime ». Pour les modifier : éditer `generer-sql-publications.py` puis
  `python generer-sql-publications.py donnees-demo-publications.sql`.
- Pour modifier les données, éditer `generer-sql.py` puis régénérer :
  `python generer-sql.py donnees-demo.sql`.
- Articles (`donnees-demo-articles.sql`, chargé après le fil) : 8 articles de fond publiés par des membres de
  démonstration (parcours, carrière, entrepreneuriat, recherche, vie de l'école), avec leur publication
  porteuse dans le fil et des « J'aime ». Pour les modifier : éditer `generer-sql-articles.py` puis
  `python generer-sql-articles.py donnees-demo-articles.sql`.
- Messagerie (`donnees-demo-messagerie.sql`) : 20 communautés créées par des membres (7 de ville, 5 de secteur,
  8 d'intérêt dont 2 « sur demande »), dont les membres sont choisis d'après leur profil (ville, filière) ; des
  discussions dans ces communautés et dans les communautés de promo ; 10 groupes privés (bureau de promo, chantier,
  révisions, start-up, gala…) ; une centaine de conversations directes (conseils d'alumni, stages, CV,
  recommandations, retrouvailles). Environ 1 000 messages étalés sur cinq semaines, jusqu'à quelques minutes avant
  le chargement. Le compte modèle passé à `charger.sh` rejoint six communautés et deux groupes, et huit membres lui
  écrivent : il voit des messages non lus. Aucune nouvelle table. Pour les modifier : éditer
  `generer-sql-messagerie.py` puis `python generer-sql-messagerie.py donnees-demo-messagerie.sql`.
- Photos (`photos-libres.json`) : 59 photos **libres de droits** (CC0 ou domaine public, Wikimedia Commons),
  sans personne reconnaissable. Elles illustrent la plupart des publications du fil, cinq articles sur huit et
  la plupart des événements (à la place des visuels dessinés). Une partie reste volontairement sans image
  pour montrer cet affichage. `telecharger-photos.py` les télécharge (cache local `.cache-photos/`, ignoré
  par Git), les recadre en 16:9 comme l'application et écrit le SQL qui les rattache. Chaque entrée garde
  l'adresse de la page source, l'auteur et la licence : pour changer une photo, remplacer son entrée.
- Module stages (`donnees-demo-stages.sql`, chargé en dernier, avec des PDF de démonstration pour les CV, les
  conventions signées et les rapports) :
  - `admin@demo.ept-alumni.invalid` devient super administrateur (responsabilité Stages comprise) ;
  - tous les étudiants de démonstration reçoivent une classe ; Aminata Thiam est doctorante (stage de recherche) ;
  - Ousmane Badji est chef du département Génie Électromécanique ; Abdoulaye Sow et Pierre Mendy encadrent des stages ;
  - offres : PFE et maîtrise de Kër Data, alternance de Teranga Télécom, stage ouvrier de Cap-Vert Construction
    (candidatures closes, liste définitive en préparation), maîtrise de Baobab Énergie (liste publiée), PFE de Sahel
    AgriTech à vérifier ;
  - stages à chaque étape : convention, évaluation et rapport complets (Coumba Diagne, Yacine Diouf l'an dernier),
    évaluation en brouillon et rapport attendu (Alassane Diallo), PFE en cours avec convention à compléter (Elhadji
    Kane), déclaration en attente (Khoudia Seck) ; une sollicitation dans l'historique.
