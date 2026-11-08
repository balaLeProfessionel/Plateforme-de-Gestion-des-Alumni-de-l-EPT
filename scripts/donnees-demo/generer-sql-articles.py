"""Génère donnees-demo-articles.sql : articles de fond publiés par les membres de démonstration.

Chaque article publié a sa publication porteuse (type ARTICLE) dans le fil, comme dans l'application.
La couverture vient de photos-libres.json (« article:<clé> ») ; trois articles n'en ont pas, pour montrer
l'affichage sans image. Rejouable sans doublon. Usage : python generer-sql-articles.py donnees-demo-articles.sql
"""
import random
import sys
import uuid

import photos_libres

ESPACE = uuid.UUID("9c3f7e21-4b8a-4d6f-a2e5-71c0d8b4f613")
random.seed(20261108)
MOTS_PAR_MINUTE = 200  # comme ArticleService


def ident(*parties):
    return str(uuid.uuid5(ESPACE, "/".join(str(p) for p in parties)))


def membre(identifiant):
    return f"(select id from utilisateur where email = '{identifiant}@demo.ept-alumni.invalid')"


def texte(valeur):
    return "null" if valeur is None else "'" + valeur.replace("'", "''") + "'"


ALUMNI = """ramatoulaye.badji binta.gaye thierno.fall boubacar.samb nafissatou.toure assane.gueye mor.ba fatoumata.cisse
maimouna.camara mariama.barry seydou.tall lamine.toure ismaila.sy moussa.diop rokhaya.kane aminata.sarr mariama.ba
ousmane.ndiaye alioune.diallo djibril.diagne absa.ly elhadji.kebe coumba.seck mamadou.faye rama.coly ndeye.fall""".split()
ETUDIANTS = """bamba.coly assane.diouf aliou.barry malick.tall yacine.diouf aida.sene serigne.lo astou.toure codou.diallo
bineta.camara khadim.sall kine.sarr coumba.sarr mareme.dieng modou.wade aminata.thiam omar.badji""".split()
LECTEURS = {"TOUS": ALUMNI + ETUDIANTS, "ALUMNI": ALUMNI, "ETUDIANTS": ETUDIANTS}

# (clé, auteur, thème, audience, jours écoulés, titre, résumé, contenu)
ARTICLES = [
    ("micro-reseaux", "seynabou.ndour", "PARCOURS", "TOUS", 2,
     "De l'amphi de Thiès aux réseaux électriques du Sahel : dix ans de terrain",
     "Sortie de l'EPT en génie électromécanique, j'ai passé dix ans à installer des micro-réseaux solaires dans des "
     "villages hors réseau. Voici ce que le terrain m'a appris, et ce que j'aurais aimé savoir en sortant de l'école.",
     """## Le départ

En sortant de l'École, je pensais que le plus dur serait technique : dimensionner les panneaux, choisir les batteries, calculer les pertes en ligne. Je me trompais. Le plus dur, c'était de comprendre **qui allait payer, qui allait entretenir, et qui allait décider**.

Mon premier chantier était un village de 400 habitants à une soixantaine de kilomètres de Tambacounda. Pas de route goudronnée, pas de réseau mobile stable, et un comité villageois qui avait déjà vu passer deux projets abandonnés.

## Ce que le terrain m'a appris

### La technique ne suffit jamais

Notre installation fonctionnait parfaitement sur le papier. Six mois plus tard, un tiers des compteurs étaient contournés. Le problème n'était pas électrique : les tarifs avaient été fixés sans tenir compte des revenus saisonniers des agriculteurs.

Nous avons revu le modèle avec le comité :

- un forfait plus bas pendant la saison sèche ;
- un paiement à l'avance après les récoltes ;
- un technicien formé dans le village plutôt qu'à Dakar.

Le taux de recouvrement est passé de 60 % à plus de 90 % en un an.

### Former, c'est construire

> Un micro-réseau sans technicien local est un micro-réseau qui s'arrête à la première panne.

Nous formons maintenant deux personnes par site, dont au moins une femme. Elles gèrent la maintenance courante et les relevés. Nous n'intervenons plus que pour les pannes lourdes.

## Ce que je dirais aux élèves-ingénieurs

1. Apprenez à lire un compte d'exploitation autant qu'un schéma unifilaire.
2. Passez du temps sur le terrain avant de concevoir quoi que ce soit.
3. Documentez tout : les bailleurs financent ce qu'ils peuvent mesurer.

Si vous travaillez sur l'électrification rurale, écrivez-moi dans les commentaires : je serais heureuse d'échanger, et nous accueillons des stagiaires chaque année."""),
    ("startup-agritech", "malick.mbengue", "ENTREPRENEURIAT", "TOUS", 4,
     "Monter une startup agritech à Thiès : nos trois premières années",
     "Avec deux camarades de promotion, nous avons lancé un service de conseil en irrigation pour les maraîchers des "
     "Niayes. Levée de fonds ratée, pivot, premiers clients fidèles : un retour honnête sur ce qui a marché et ce qui a échoué.",
     """## L'idée de départ

Tout est parti d'un projet de fin d'études. Nous avions conçu un capteur d'humidité du sol à bas coût, relié par SMS. Le jury avait aimé, un maraîcher de Mboro nous avait dit *« si ça marche, je le prends »*. Il ne nous en fallait pas plus.

## Année 1 : construire le mauvais produit

Nous avons passé huit mois à perfectionner le capteur : boîtier étanche, batterie de deux ans, application mobile. Résultat : **trois clients**, dont deux de nos familles.

Le vrai problème des maraîchers n'était pas de *mesurer* l'humidité. C'était de savoir **quand arroser et combien**, avec une pompe et un budget de carburant limités.

## Année 2 : le pivot

Nous avons arrêté de vendre un capteur pour vendre un conseil :

- un SMS chaque matin : « arrosez la parcelle 2 pendant 40 minutes » ;
- un abonnement mensuel plutôt qu'un achat ;
- une installation faite par nos soins, en une demi-journée.

Les économies de carburant ont convaincu bien plus vite que les courbes d'humidité.

## Année 3 : grandir sans se perdre

Nous avons aujourd'hui 120 exploitations abonnées et cinq salariés. Nous avons raté une levée de fonds en 2025 : les investisseurs voulaient une application, nos clients préféraient les SMS. Nous avons choisi nos clients.

### Ce que nous referions

1. Parler à vingt clients avant d'écrire une ligne de code.
2. Facturer dès le premier mois, même peu.
3. S'entourer d'anciens de l'École : notre premier comptable et notre premier mentor étaient des alumni.

> Le marché ne paie pas une bonne idée, il paie un problème réglé."""),
    ("these", "fatou.diagne", "RECHERCHE", "ETUDIANTS", 6,
     "Faire une thèse après l'EPT : mode d'emploi pour les élèves-ingénieurs",
     "Une thèse n'est pas réservée aux universitaires. Financements, choix du laboratoire, cotutelle, débouchés : un "
     "guide pratique pour les élèves qui hésitent à continuer en doctorat après leur diplôme d'ingénieur.",
     """## Pourquoi envisager une thèse

Beaucoup d'élèves pensent qu'un doctorat ferme les portes de l'industrie. C'est de moins en moins vrai. Les entreprises de l'énergie, des télécoms et de l'agro-industrie recrutent des docteurs pour leurs équipes de recherche et développement.

Une thèse, c'est **trois ans à devenir l'expert d'un sujet précis**, avec un salaire si elle est financée.

## Trouver un financement

C'est la première question à régler, avant même le sujet. Les pistes les plus courantes :

- les bourses de cotutelle entre une école sénégalaise et une université étrangère ;
- les contrats avec une entreprise, où le doctorant partage son temps entre le laboratoire et l'industriel ;
- les programmes des agences de coopération et des fondations.

> Ne commencez jamais une thèse sans financement sur trois ans : c'est la principale cause d'abandon.

## Choisir son directeur de thèse

Le sujet compte, mais le directeur compte davantage. Avant de vous engager :

1. Parlez à ses doctorants actuels et anciens.
2. Demandez combien de thèses il encadre en même temps.
3. Vérifiez où sont partis ses anciens doctorants.

### Les signaux d'alerte

- un directeur injoignable pendant l'entretien de recrutement ;
- aucun doctorant soutenu ces cinq dernières années ;
- un sujet flou, *« on verra en avançant »*.

## Et après ?

Les docteurs issus de l'EPT travaillent dans l'enseignement supérieur, les centres de recherche, mais aussi les directions techniques de grandes entreprises. Posez vos questions dans les commentaires : plusieurs alumni docteurs suivent cette rubrique."""),
    ("ingenieur-travaux", "bamba.ndour", "CARRIERE", "TOUS", 9,
     "Ingénieur travaux la première année : ce qu'on n'apprend pas en cours",
     "Planning, sous-traitants, sécurité, réunions de chantier : mon premier poste sur un ouvrage d'art m'a appris "
     "autant que mes trois années d'école. Cinq leçons pour celles et ceux qui démarrent sur un chantier.",
     """## Le premier jour

On m'a confié le suivi d'un pont de 48 mètres. J'avais en tête les calculs de béton armé ; on m'a tendu un planning de 300 lignes et la liste des sous-traitants.

## Cinq leçons

1. **Le planning est un outil de négociation**, pas un document figé. Chaque matin, on arbitre entre la météo, les livraisons et les équipes disponibles.
2. **La sécurité se prépare au bureau.** Un poste de travail mal pensé sur le papier devient dangereux sur le terrain.
3. **Écrivez tout.** Un compte rendu envoyé le soir même évite des semaines de désaccord.
4. **Écoutez les chefs d'équipe.** Ils ont vu plus de chantiers que vous n'en verrez avant dix ans.
5. **Gardez du temps pour apprendre** : j'ai repris mes cours de géotechnique le week-end pendant six mois.

> Un bon ingénieur travaux n'a pas toutes les réponses ; il sait à qui poser chaque question.

Si vous cherchez un stage en génie civil, l'entreprise accueille deux élèves de l'EPT chaque été."""),
    ("dessalement", "awa.thiam", "RECHERCHE", "TOUS", 12,
     "Dessaler l'eau avec le soleil : où en est notre prototype ?",
     "Depuis deux ans, une équipe d'alumni et d'élèves teste un petit dessalinisateur solaire dans le delta du Saloum. "
     "Premiers résultats, difficultés rencontrées et prochaines étapes du projet.",
     """## Le problème

Dans les îles du Saloum, l'eau des puits est de plus en plus salée. Les familles achètent de l'eau en bidons, à un prix qui pèse lourd dans les budgets.

## Notre approche

Nous testons une unité d'osmose inverse alimentée uniquement par des panneaux solaires, sans batterie :

- la pompe tourne quand le soleil brille et s'arrête la nuit ;
- l'eau produite est stockée dans un réservoir surélevé ;
- la maintenance tient sur une fiche de deux pages.

## Les premiers résultats

L'unité produit **1 200 litres par jour** en saison sèche. La qualité respecte les seuils de l'OMS. Le point faible reste l'encrassement des membranes : nous testons un pré-filtre en sable local.

## Rejoindre le projet

Nous cherchons des élèves en électromécanique pour l'instrumentation, et des alumni pour relire notre modèle économique. Écrivez-nous en commentaire."""),
    ("club-robotique", "samba.bodian", "VIE_ECOLE", "TOUS", 15,
     "Le club robotique de l'EPT à la coupe d'Afrique : récit d'une première participation",
     "Quatre mois de préparation, un robot reconstruit deux fois et une huitième place sur vingt-deux équipes. "
     "Les membres du club racontent leur première compétition internationale.",
     """## Tout est parti d'un tableau blanc

En septembre, nous étions six autour d'un tableau blanc avec le règlement de la compétition : un robot autonome qui trie des objets colorés en moins de trois minutes.

## La préparation

- **Octobre** : premier châssis, beaucoup trop lourd.
- **Décembre** : passage à des moteurs pas à pas et à une caméra simple.
- **Février** : réécriture complète du logiciel de vision la veille du départ.

## Le jour J

Le robot a calé lors du premier passage. Au deuxième, il a trié *quatorze objets sur vingt*. Nous terminons huitièmes, et premiers des écoles d'Afrique de l'Ouest.

> On a plus appris en quatre mois de club qu'en un an de travaux pratiques.

Le club recrute pour l'an prochain : toutes les filières sont les bienvenues, pas besoin d'avoir déjà programmé."""),
    ("journee-data", "khady.sow", "CARRIERE", "TOUS", 20,
     "Une journée de data scientist à Dakar",
     "Réunions, nettoyage de données, modèles et beaucoup de pédagogie : ce que fait vraiment une data scientist "
     "dans une entreprise sénégalaise, loin des clichés.",
     """## 8 h 30 : les chiffres de la nuit

Je commence par vérifier les tableaux de bord : si un chargement de données a échoué, toute l'entreprise travaille sur des chiffres faux.

## 10 h : la vraie partie du métier

Le plus gros de mon temps passe à **comprendre et nettoyer les données**. Les modèles viennent après, et ils sont souvent plus simples qu'on ne l'imagine.

## 14 h : expliquer

Une prévision ne sert à rien si personne ne la comprend. Je présente chaque semaine nos résultats aux équipes commerciales, sans jargon.

## Mes conseils

- maîtrisez SQL avant les réseaux de neurones ;
- apprenez à raconter une histoire avec un graphique ;
- choisissez une entreprise où les données servent vraiment à décider."""),
    ("souvenirs-promo", "ousmane.ndiaye", "VIE_ECOLE", "ALUMNI", 26,
     "Vingt ans après : ce que la promo 2006 a gardé de l'École",
     "À l'occasion de nos retrouvailles, nous avons demandé à nos camarades ce qui leur reste de leurs années à Thiès. "
     "Florilège de souvenirs, de conseils et de quelques regrets.",
     """## Les souvenirs qui reviennent

Les nuits de révision avant les partiels, les matchs du jeudi soir, la cantine et ses débats interminables. Et surtout **les amitiés**, intactes vingt ans plus tard.

## Ce que l'École nous a appris

- travailler en équipe sous pression ;
- ne pas avoir peur d'un problème qu'on ne sait pas encore résoudre ;
- garder le sens du concret.

## Nos regrets

Ne pas avoir assez parlé aux anciens quand nous étions élèves. C'est pour cela que beaucoup d'entre nous sont aujourd'hui mentors sur la plateforme.

Rendez-vous aux prochaines retrouvailles à Saly !"""),
]


def main(sortie):
    photos = photos_libres.charger()
    lignes = ["-- Généré par generer-sql-articles.py : ne pas éditer à la main.", "begin;"]
    for (cle, auteur, theme, audience, jours, titre, resume, contenu) in ARTICLES:
        aid, pid = ident("article", cle), ident("publication", cle)
        cible = f"article:{cle}"
        image = f"stockage:{photos_libres.identifiant_stockage(cible)}" if cible in photos else None
        alt = photos[cible]["alt"] if cible in photos else None
        temps = max(1, (len(contenu.split()) + MOTS_PAR_MINUTE - 1) // MOTS_PAR_MINUTE)
        quand = f"now() - interval '{jours} days'"
        lignes.append(
            "insert into articles (id, auteur_id, titre, resume, contenu, theme, url_couverture, temps_lecture, audience, statut, cree_le, modifie_le, publie_le) "
            f"select '{aid}', {membre(auteur)}, {texte(titre)}, {texte(resume)}, {texte(contenu)}, '{theme}', {texte(image)}, {temps}, "
            f"'{audience}', 'PUBLIE', {quand} - interval '2 days', {quand}, {quand} where {membre(auteur)} is not null "
            "on conflict (id) do nothing;")
        lignes.append(
            "insert into publications (id, auteur_id, type, audience, titre, contenu, statut, publie_le, modifie_le, url_image, texte_alternatif, article_id) "
            f"select '{pid}', {membre(auteur)}, 'ARTICLE', '{audience}', {texte(titre)}, {texte(resume)}, 'PUBLIE', {quand}, {quand}, "
            f"{texte(image)}, {texte(alt)}, '{aid}' where exists (select 1 from articles where id = '{aid}') "
            "on conflict (id) do nothing;")
        public = [m for m in LECTEURS[audience] if m != auteur]
        for lecteur in random.sample(public, min(len(public), random.randint(4, 18))):
            lignes.append(
                "insert into jaimes_publication (id, publication_id, utilisateur_id, cree_le) "
                f"select '{ident('jaime', cle, lecteur)}', '{pid}', {membre(lecteur)}, {quand} + interval '{random.randint(1, 40)} hours' "
                f"where {membre(lecteur)} is not null and exists (select 1 from publications where id = '{pid}') "
                "on conflict do nothing;")
    lignes.append("commit;")
    with open(sortie, "w", encoding="utf-8", newline="\n") as fichier:
        fichier.write("\n".join(lignes) + "\n")
    print(f"{len(ARTICLES)} articles écrits dans {sortie}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "donnees-demo-articles.sql")
