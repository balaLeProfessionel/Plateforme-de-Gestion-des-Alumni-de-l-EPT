"""Génère donnees-demo-publications.sql : publications, commentaires et « J'aime » du fil d'actualité.

S'appuie sur les membres des données de démonstration (chargées avant) : les auteurs sont désignés par
leur adresse. Rejouable sans doublon (identifiants stables, ON CONFLICT DO NOTHING) ; les dates sont
relatives au premier chargement. Usage : python generer-sql-publications.py donnees-demo-publications.sql
"""
import random
import sys
import uuid

ESPACE = uuid.UUID("5d0c1e4a-7f3b-4c55-9a51-2f6a0f1b9e01")
random.seed(20261104)


def ident(*parties):
    return str(uuid.uuid5(ESPACE, "/".join(str(p) for p in parties)))


def membre(identifiant):
    return f"(select id from utilisateur where email = '{identifiant}@demo.ept-alumni.invalid')"


def texte(valeur):
    return "null" if valeur is None else "'" + valeur.replace("'", "''") + "'"


ADMIN = "admin"
ALUMNI = """ramatoulaye.badji binta.gaye thierno.fall boubacar.samb nafissatou.toure assane.gueye mor.ba boubacar.gueye
fatoumata.cisse maimouna.camara nene.mbengue mariama.barry seydou.tall babacar.niang lamine.toure ismaila.sy thierno.sarr
mariama.ndiaye alassane.sarr moussa.diop rokhaya.kane aminata.sarr khady.sow mariama.ba ousmane.ndiaye seynabou.ndour
alioune.diallo djibril.diagne absa.ly fatou.diagne elhadji.kebe malick.mbengue bamba.ndour ismaila.gueye abdoulaye.cisse
coumba.seck mamadou.faye awa.thiam malick.coly rama.coly oumou.diop nafissatou.diop ndeye.fall mor.mbaye astou.mbengue
ibrahima.kebe bamba.toure absa.kebe""".split()
ETUDIANTS = """bamba.coly elhadji.barry assane.diouf aliou.barry malick.tall yacine.diouf aida.sene serigne.lo astou.toure
elhadji.kane codou.diallo bineta.camara khadim.sall ibrahima.cisse samba.bodian kine.sarr mame-diarra.dieng coumba.sarr
khoudia.seck mareme.dieng modou.wade aminata.thiam aissatou.seck omar.badji yacine.ndiaye fallou.ndour oumou.dieng""".split()
PERSONNEL = """ndeye-astou.faye abdoulaye.sow pierre.mendy aissatou.dieng ousmane.badji fatou-binetou.ndiaye saliou.ka""".split()

# (clé, auteur, type, audience, titre, contenu, heures écoulées, date limite en jours, thème des commentaires)
PUBLICATIONS = [
    ("rentree-promo-2029", ADMIN, "ANNONCE_OFFICIELLE", "TOUS", "Bienvenue à la promotion 2029",
     "L'École polytechnique de Thiès accueille cette semaine sa nouvelle promotion. Alumni, n'hésitez pas à "
     "partager un conseil pour leur première année : vos messages leur seront transmis lors de la journée d'intégration.",
     6, None, "accueil"),
    ("fonds-innovation", ADMIN, "APPEL_PROJET", "TOUS", "Fonds d'innovation EPT 2027",
     "L'association des alumni ouvre son fonds d'amorçage aux projets portés par des étudiants ou de jeunes diplômés : "
     "jusqu'à 3 millions de FCFA, un mentor alumni et un accès aux laboratoires de l'école. Dossier en ligne : "
     "présentation du projet, équipe, budget prévisionnel.", 30, 40, "appel"),
    ("bourses-mobilite", ADMIN, "APPEL_PROJET", "ETUDIANTS", "Bourses de mobilité internationale",
     "Six bourses de mobilité d'un semestre sont proposées aux élèves de 2e année pour un échange avec nos écoles "
     "partenaires. Joignez un relevé de notes, une lettre de motivation et l'avis de votre chef de département.",
     52, 21, "appel"),
    ("maintenance-reseau", ADMIN, "ANNONCE_OFFICIELLE", "TOUS", "Maintenance de la plateforme samedi",
     "La plateforme sera indisponible samedi de 7 h à 9 h pour une mise à jour. Les messages et publications en "
     "cours de rédaction seront conservés.", 70, None, "merci"),
    ("stage-kerdata", "fatou.diagne", "PUBLICATION", "TOUS", None,
     "Kër Data recrute deux stagiaires data pour six mois à partir de janvier : nettoyage de données, tableaux de bord "
     "et premiers modèles de prévision. Profil GIT de 3e année idéalement. Envoyez-moi votre CV en message, je transmets "
     "directement à l'équipe.", 3, None, "offre"),
    ("retour-forum", "khady.sow", "PUBLICATION", "TOUS", None,
     "Très belle édition du forum entreprises hier ! Merci aux étudiants pour la qualité des échanges sur le stand "
     "cybersécurité. Pour celles et ceux qui m'ont demandé des ressources pour débuter : TryHackMe, les cours de "
     "l'ANSSI et surtout, montez un petit labo chez vous.", 20, None, "felicitations"),
    ("question-master", "malick.tall", "PUBLICATION", "TOUS", None,
     "Question aux alumni GIT : master en France juste après l'EPT, ou deux ans d'expérience d'abord ? J'hésite pour "
     "l'année prochaine et j'aimerais avoir des retours concrets.", 9, None, "conseil"),
    ("premier-pont", "bamba.ndour", "PUBLICATION", "TOUS", None,
     "Réception hier du premier ouvrage que j'ai suivi de bout en bout comme ingénieur méthodes : un pont de 48 m sur "
     "la route de Mbour. Quatre ans après la sortie de l'EPT, une vraie fierté. Merci aux enseignants de génie civil "
     "qui nous ont tant fait calculer à la main !", 28, None, "felicitations"),
    ("solaire-casamance", "seynabou.ndour", "PUBLICATION", "TOUS", None,
     "Mise en service de la centrale solaire de 2 MWc à Ziguinchor : 14 mois de chantier, une équipe à 60 % "
     "sénégalaise et trois anciens de l'EPT. On recrute encore deux ingénieurs électriciens pour l'exploitation.",
     44, None, "felicitations"),
    ("conseil-entretien", "alassane.sarr", "PUBLICATION", "TOUS", None,
     "Petit conseil aux étudiants avant la saison des stages : préparez trois exemples concrets de problèmes que vous "
     "avez résolus en projet, avec le résultat chiffré. C'est ce qui fait la différence en entretien, bien plus que la "
     "liste des cours suivis.", 60, None, "merci"),
    ("covoiturage-thies", "astou.toure", "PUBLICATION", "ETUDIANTS", None,
     "Quelqu'un descend sur Dakar vendredi soir après les cours ? On est trois à chercher un covoiturage, participation "
     "aux frais bien sûr.", 4, None, "pratique"),
    ("cdi-teranga", "djibril.diagne", "PUBLICATION", "ALUMNI", None,
     "Teranga Télécom ouvre un poste d'ingénieur radio 4G/5G à Abidjan, 3 à 5 ans d'expérience. Je peux recommander "
     "un ou une alumni : écrivez-moi avec votre parcours.", 12, None, "offre"),
    ("cloud-retour", "boubacar.gueye", "PUBLICATION", "TOUS", None,
     "Retour d'expérience : migration d'un système bancaire vers le cloud en 9 mois. Ce qui a marché : découper par "
     "domaine métier, automatiser les tests dès le début, former les équipes d'exploitation avant la bascule. Je "
     "présenterai le détail au prochain afterwork GIT.", 75, None, "technique"),
    ("projet-fin-etudes", "yacine.diouf", "PUBLICATION", "TOUS", None,
     "Notre projet de fin d'études sur la détection précoce des pannes de pompes solaires par capteurs vibratoires a "
     "été retenu pour le concours national d'innovation ! On cherche un alumni en maintenance industrielle pour "
     "relire notre dossier.", 16, None, "felicitations"),
    ("bibliotheque-horaires", "rokhaya.gaye", "PUBLICATION", "ETUDIANTS", None,
     "Pendant la période des examens, la bibliothèque reste ouverte jusqu'à 22 h du lundi au samedi. Les salles de "
     "travail en groupe se réservent à l'accueil.", 34, None, "merci"),
    ("insertion-chiffres", "fatou-binetou.ndiaye", "PUBLICATION", "TOUS", None,
     "Enquête d'insertion de la promotion 2025 : 87 % des diplômés en poste six mois après la sortie, dont 22 % à "
     "l'international. Merci aux alumni qui ont relayé les offres tout au long de l'année, votre réseau compte.",
     90, None, "felicitations"),
    ("aero-maintenance", "alioune.diallo", "PUBLICATION", "TOUS", None,
     "Atlantique Aéro Maintenance accueille cette année quatre stagiaires de l'EPT en navigabilité et en structures. "
     "Si vous êtes en génie aéronautique et curieux du métier, je fais une visite de l'atelier le mois prochain.",
     100, None, "offre"),
    ("devops-montreal", "mamadou.faye", "PUBLICATION", "TOUS", None,
     "Trois ans à Montréal comme ingénieur DevOps. Pour celles et ceux qui envisagent le Canada : l'équivalence du "
     "diplôme d'ingénieur prend du temps, commencez les démarches auprès de l'ordre avant de partir.",
     120, None, "conseil"),
    ("hackathon-equipe", "samba.bodian", "PUBLICATION", "ETUDIANTS", None,
     "On monte une équipe pour le hackathon agritech du mois prochain : il nous manque un profil électronique et un "
     "profil design. Écrivez-moi si ça vous tente !", 22, None, "pratique"),
    ("mentorat-merci", "aminata.thiam", "PUBLICATION", "TOUS", None,
     "Six mois de mentorat avec une alumni de Kër Data qui m'a aidée à choisir ma spécialité et à décrocher mon stage. "
     "Si vous hésitez à demander un mentor sur la plateforme : faites-le, ça change tout.", 40, None, "felicitations"),
    ("btp-securite", "ibrahima.gueye", "PUBLICATION", "TOUS", None,
     "Rappel utile pour les jeunes ingénieurs travaux : la sécurité sur chantier commence au planning. Un poste de "
     "travail mal préparé coûte toujours plus cher qu'une demi-journée de méthodes en plus.", 140, None, "technique"),
    ("telecoms-afterwork", "nafissatou.diop", "PUBLICATION", "ALUMNI", None,
     "Afterwork des alumni télécoms jeudi à Mbour : on parle 5G rurale et partage d'infrastructures. Ouvert à toutes "
     "les promotions, venez nombreux.", 26, None, "pratique"),
    ("lean-usine", "kine.kane", "PUBLICATION", "TOUS", None,
     "Premier chantier lean terminé dans une usine de jus à Abidjan : -30 % de temps de changement de série. La clé : "
     "laisser les opérateurs proposer les solutions plutôt que les imposer.", 160, None, "technique"),
    ("startup-paiement", "babacar.niang", "PUBLICATION", "TOUS", None,
     "Jàmm Pay passe le cap des 200 000 utilisateurs ! L'équipe technique compte maintenant cinq anciens de l'EPT. "
     "Nous ouvrons deux postes de développeurs backend à Dakar.", 50, None, "felicitations"),
    ("cours-python", "abdoulaye.sow", "PUBLICATION", "ETUDIANTS", None,
     "Séance de soutien Python ouverte à tous les départements mercredi 16 h en salle B12 : structures de données et "
     "manipulation de fichiers. Apportez vos questions.", 14, None, "merci"),
    ("eau-potable", "awa.thiam", "PUBLICATION", "TOUS", None,
     "Ingénieurs Solidaires du Sahel cherche des bénévoles pour concevoir trois forages dans la région de Matam. "
     "Missions de deux semaines, encadrées. Génie civil et électromécanique bienvenus.", 66, None, "offre"),
    ("question-logement", "codou.diallo", "PUBLICATION", "ETUDIANTS", None,
     "Des conseils pour trouver un logement à Dakar pour un stage de trois mois ? Les annonces que je vois sont hors de "
     "prix.", 7, None, "conseil"),
    ("relations-internationales", "aissatou.dieng", "PUBLICATION", "TOUS", None,
     "Nouveau partenariat signé avec une école d'ingénieurs de Lyon : doubles diplômes en génie civil et en énergie à "
     "partir de la rentrée prochaine. Réunion d'information le 20 à l'amphi A.", 110, None, "felicitations"),
    ("genie-civil-bim", "ramatoulaye.badji", "PUBLICATION", "TOUS", None,
     "Vingt ans de métier et le BIM a tout changé dans nos projets : moins de reprises, des maquettes partagées avec "
     "le client. Je propose deux ateliers d'initiation aux étudiants de génie civil ce semestre.", 85, None, "technique"),
    ("product-manager", "rama.coly", "PUBLICATION", "TOUS", None,
     "On me demande souvent comment passer d'ingénieure logicielle à product manager. Mon conseil : prenez en charge "
     "un petit produit interne, parlez aux utilisateurs chaque semaine et mesurez tout.", 190, None, "conseil"),
    ("stage-trouve", "khadim.sall", "PUBLICATION", "TOUS", None,
     "Stage trouvé chez Baobab Énergie grâce à une offre partagée ici ! Merci à la communauté, et bonne chance à "
     "toutes celles et ceux qui cherchent encore.", 11, None, "felicitations"),
    ("qualite-iso", "ndeye.fall", "PUBLICATION", "TOUS", None,
     "Certification ISO 9001 obtenue pour notre site de Thiès après un an de préparation. Trois ingénieurs qualité "
     "EPT dans l'équipe : la formation industrielle de l'école se voit sur le terrain.", 210, None, "felicitations"),
    ("vie-etudiante", "ndeye-astou.faye", "PUBLICATION", "ETUDIANTS", None,
     "Les inscriptions aux clubs sont ouvertes jusqu'à vendredi : robotique, théâtre, football, entrepreneuriat et "
     "le nouveau club d'astronomie. Passez au bureau de la vie étudiante.", 46, None, "merci"),
    ("aeronautique-propulsion", "coumba.seck", "PUBLICATION", "TOUS", None,
     "Je travaille depuis deux ans sur les essais de moteurs à Paris. Si des élèves du département aéronautique veulent "
     "comprendre le métier d'ingénieure propulsion, je réponds volontiers à vos questions ici.", 130, None, "conseil"),
    ("supply-chain", "rokhaya.kane", "PUBLICATION", "ALUMNI", None,
     "Je cherche un ou une alumni en logistique portuaire pour un échange sur la digitalisation des terminaux. "
     "Un café à Dakar ou un appel, comme vous préférez.", 58, None, "pratique"),
]

COMMENTAIRES = {
    "accueil": ["Bienvenue à toutes et à tous ! Profitez de chaque projet, c'est là qu'on apprend le plus.",
                "Mon conseil : engagez-vous dans un club dès la première année.",
                "Bienvenue ! Le réseau des alumni est là pour vous, n'hésitez pas à écrire.",
                "Bonne rentrée à la promotion 2029 !"],
    "appel": ["Est-ce qu'un projet déjà incubé ailleurs peut candidater ?",
              "Super initiative, je partage avec ma promotion.",
              "Peut-on candidater à deux ou faut-il une équipe de trois ?",
              "Merci, le dossier est-il à déposer en ligne uniquement ?"],
    "merci": ["Merci pour l'information !", "Merci, c'est noté.", "Très utile, merci.", "Parfait, merci !"],
    "offre": ["Je vous envoie mon CV en message, merci !", "Est-ce ouvert aux étudiants de 2e année ?",
              "Partagé avec mes camarades de promotion.", "Merci pour le relais, c'est précieux.",
              "Le stage peut-il se faire à distance une partie du temps ?"],
    "felicitations": ["Félicitations, bravo à toute l'équipe !", "Quelle fierté, bravo !",
                      "Bravo, ça donne envie !", "Magnifique, félicitations.",
                      "Belle réussite, continuez comme ça !"],
    "conseil": ["Je dirais deux ans d'expérience d'abord : on choisit mieux son master ensuite.",
                "J'ai fait le master directement et je ne le regrette pas, ça dépend du domaine visé.",
                "Merci pour ce retour, c'est exactement ce que je me demandais.",
                "Très bon conseil, j'aurais aimé l'avoir plus tôt.",
                "On peut en parler en message si tu veux, j'ai vécu la même hésitation."],
    "pratique": ["Je suis partant !", "Envoie-moi un message, ça m'intéresse.",
                 "Je ne peux pas cette fois, mais bonne idée !", "Compte sur moi."],
    "technique": ["Très intéressant, tu partagerais tes supports ?", "Merci pour ce retour d'expérience concret.",
                  "Exactement ce qu'on vit aussi sur nos projets.", "Je serai là pour la présentation !"],
}
REPONSES = ["Merci beaucoup !", "Avec plaisir, écris-moi en message.", "Oui, tout à fait.",
            "Bonne question, je me renseigne et je reviens vers toi.", "Merci pour ton message !"]


def lecteurs_possibles(audience):
    if audience == "ALUMNI":
        return ALUMNI
    if audience == "ETUDIANTS":
        return ETUDIANTS + PERSONNEL
    return ALUMNI + ETUDIANTS + PERSONNEL


def main(sortie):
    lignes = ["-- Généré par generer-sql-publications.py : ne pas éditer à la main.", "begin;"]
    for (cle, auteur, type_, audience, titre, contenu, heures, limite, theme) in PUBLICATIONS:
        pid = ident("publication", cle)
        date_limite = "null" if limite is None else f"(current_date + {limite})"
        lignes.append(
            "insert into publications (id, auteur_id, type, audience, titre, contenu, statut, publie_le, modifie_le, date_limite) "
            f"select '{pid}', {membre(auteur)}, '{type_}', '{audience}', {texte(titre)}, {texte(contenu)}, 'PUBLIE', "
            f"now() - interval '{heures} hours', now() - interval '{heures} hours', {date_limite} where {membre(auteur)} is not null "
            "on conflict (id) do nothing;")

        public = [m for m in lecteurs_possibles(audience) if m != auteur]
        # Les publications récentes et marquantes ont plus de réactions : de 2 à 24 « J'aime ».
        nombre_jaimes = random.randint(2, 24 if theme in ("felicitations", "offre", "appel") else 12)
        for i, lecteur in enumerate(random.sample(public, min(nombre_jaimes, len(public)))):
            delai = round(random.uniform(0.2, max(0.5, heures * 0.9)), 1)
            lignes.append(
                "insert into jaimes_publication (id, publication_id, utilisateur_id, cree_le) "
                f"select '{ident('jaime', cle, lecteur)}', '{pid}', {membre(lecteur)}, "
                f"now() - interval '{heures} hours' + interval '{delai} hours' "
                f"where {membre(lecteur)} is not null and exists (select 1 from publications where id = '{pid}') "
                "on conflict do nothing;")

        textes = COMMENTAIRES[theme]
        commentateurs = random.sample(public, min(random.randint(0, 5), len(public), len(textes)))
        for i, commentateur in enumerate(commentateurs):
            cid = ident("commentaire", cle, i)
            delai = round(random.uniform(0.3, max(0.6, heures * 0.8)), 1)
            lignes.append(
                "insert into commentaires_publication (id, publication_id, auteur_id, parent_id, contenu, cree_le) "
                f"select '{cid}', '{pid}', {membre(commentateur)}, null, {texte(textes[i])}, "
                f"now() - interval '{heures} hours' + interval '{delai} hours' "
                f"where {membre(commentateur)} is not null and exists (select 1 from publications where id = '{pid}') "
                "on conflict (id) do nothing;")
            # L'auteur répond à une question sur deux.
            if random.random() < 0.45:
                delai_reponse = round(min(heures - 0.1, delai + random.uniform(0.2, 3)), 1)
                lignes.append(
                    "insert into commentaires_publication (id, publication_id, auteur_id, parent_id, contenu, cree_le) "
                    f"select '{ident('reponse', cle, i)}', '{pid}', {membre(auteur)}, '{cid}', "
                    f"{texte(random.choice(REPONSES))}, now() - interval '{heures} hours' + interval '{delai_reponse} hours' "
                    f"where exists (select 1 from commentaires_publication where id = '{cid}') "
                    "on conflict (id) do nothing;")
    lignes.append("commit;")
    with open(sortie, "w", encoding="utf-8", newline="\n") as fichier:
        fichier.write("\n".join(lignes) + "\n")
    print(f"{len(PUBLICATIONS)} publications écrites dans {sortie}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "donnees-demo-publications.sql")
