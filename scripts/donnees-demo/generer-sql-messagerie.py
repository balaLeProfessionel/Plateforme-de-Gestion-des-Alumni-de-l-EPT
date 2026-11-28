"""Génère donnees-demo-messagerie.sql : communautés, groupes et conversations de la messagerie.

S'appuie sur les membres des données de démonstration (chargées avant) : chacun est désigné par son adresse,
et les communautés de ville ou de secteur réunissent les membres dont le profil correspond. Contenu :
- des communautés de ville, de secteur et d'intérêt créées par des membres (dont deux « sur demande ») ;
- des discussions dans ces communautés et dans les communautés de promo (rangées par l'application) ;
- des groupes privés (bureau de promo, projets, révisions…) ;
- beaucoup de conversations directes (conseils, stages, mentorat, retrouvailles).

Si la variable psql « compte_modele » désigne un compte (celui passé à charger.sh), ce compte est ajouté à
quelques communautés et groupes, et des membres lui écrivent : il voit des messages non lus en se connectant.

Rejouable sans doublon (identifiants stables, ON CONFLICT DO NOTHING) ; les dates sont relatives au premier
chargement. Usage : python generer-sql-messagerie.py donnees-demo-messagerie.sql
"""
import random
import sys
import uuid

ESPACE = uuid.UUID("8b1f6c2e-41d7-4f0a-9c3e-6a2d5e7f1b90")
random.seed(20261122)
DOMAINE = "@demo.ept-alumni.invalid"
INVITE = ":'compte_modele'"  # remplacé par psql ; vide : rien n'est créé pour ce compte
ARRIVEE = "a rejoint la communauté."


def ident(*parties):
    return str(uuid.uuid5(ESPACE, "/".join(str(p) for p in parties)))


def texte(valeur):
    return "null" if valeur is None else "'" + valeur.replace("'", "''") + "'"


def email(cle):
    return INVITE if cle == "@invite" else texte(cle + DOMAINE)


# clé | promo | ville | filière (GC génie civil, GEM électromécanique, GIT informatique et télécoms,
# GI industriel, GAE aéronautique). Rôle déduit de la section.
ALUMNI = """binta.gaye|2002|Dakar|GEM thierno.fall|2002|Toulouse|GIT ramatoulaye.badji|2002|Dakar|GC
boubacar.samb|2003|Dakar|GI assane.faye|2003|Dakar|GI nafissatou.toure|2003|Bamako|GC assane.gueye|2004|Saint-Louis|GIT
boubacar.gueye|2005|Touba|GIT mor.ba|2005|Dakar|GAE fatoumata.cisse|2006|Dakar|GEM maimouna.camara|2006|Nouakchott|GIT
youssou.cisse|2007|Thiès|GEM mariama.barry|2007|Dakar|GIT nene.mbengue|2007|Thiès|GIT seydou.tall|2007|Thiès|GIT
oumou.fall|2007|Thiès|GAE babacar.niang|2008|Dakar|GIT souleymane.mbengue|2009|Casablanca|GEM elhadji.mbengue|2009|Thiès|GI
lamine.toure|2009|Kaolack|GC thierno.sarr|2010|Dakar|GIT abdou.tall|2010|Thiès|GEM ismaila.sy|2010|Montréal|GEM
mariama.ndiaye|2010|Dakar|GIT ibrahima.gueye|2010|Thiès|GC youssou.diouf|2011|Ziguinchor|GC moussa.diop|2011|Thiès|GEM
alassane.sarr|2011|Paris|GI souleymane.toure|2011|Nouakchott|GIT fallou.sylla|2011|Ziguinchor|GI aminata.sarr|2012|Dakar|GIT
mame-diarra.diouf|2012|Dakar|GEM mbaye.ndour|2012|Abidjan|GC seydou.sene|2013|Touba|GI seydou.toure|2013|Paris|GEM
rokhaya.kane|2013|Abidjan|GI alassane.ka|2013|Dakar|GEM mariama.ka|2013|Saint-Louis|GIT aminata.barry|2013|Paris|GIT
marieme.ka|2014|Paris|GC penda.diatta|2014|Dakar|GIT samba.diagne|2014|Dakar|GC kine.kane|2014|Abidjan|GI
khady.sow|2014|Dakar|GIT mariama.ba|2015|Dakar|GC arame.diatta|2015|Dakar|GAE idrissa.sow|2016|Nouakchott|GI
mor.ka|2016|Thiès|GC ousmane.ndiaye|2016|Paris|GIT binta.cisse|2016|Dakar|GIT omar.diouf|2017|Touba|GIT
mame-diarra.cisse|2017|Kaolack|GIT demba.gueye|2017|Kaolack|GAE demba.sene|2017|Montréal|GEM seynabou.ndour|2017|Dakar|GEM
binta.sy|2018|Thiès|GC khadidiatou.samb|2018|Montréal|GIT djibril.diagne|2018|Abidjan|GIT assane.kebe|2018|Ziguinchor|GI
alassane.diouf|2018|Casablanca|GIT aissatou.diop|2018|Montréal|GI alioune.diallo|2018|Dakar|GAE mariama.cisse|2018|Dakar|GAE
samba.diatta|2018|Nouakchott|GC absa.ly|2018|Dakar|GC cheikh.mbaye|2018|Saint-Louis|GC pape.sy|2019|Dakar|GI
malick.mbengue|2019|Mbour|GIT alassane.diagne|2019|Dakar|GAE fatou.diagne|2019|Dakar|GIT elhadji.kebe|2019|Dakar|GIT
maimouna.gaye|2019|Kaolack|GEM alassane.faye|2020|Paris|GEM bamba.ndour|2020|Dakar|GC abdoulaye.cisse|2020|Mbour|GEM
ismaila.gueye|2020|Bamako|GIT mamadou.faye|2021|Montréal|GIT ndiaga.diatta|2021|Dakar|GIT coumba.seck|2021|Paris|GAE
khadim.cisse|2022|Kaolack|GC arame.sene|2022|Nouakchott|GC omar.seck|2022|Casablanca|GI awa.thiam|2022|Lyon|GC
alassane.diop|2022|Thiès|GC malick.coly|2022|Dakar|GIT rama.coly|2022|Dakar|GIT nafissatou.diop|2023|Mbour|GIT
seydou.barry|2023|Dakar|GC oumou.diop|2023|Thiès|GEM ndeye.fall|2023|Thiès|GI cheikh.sylla|2024|Thiès|GEM
astou.mbengue|2024|Ziguinchor|GEM ibrahima.kebe|2024|Dakar|GIT ramatoulaye.ndiaye|2024|Ziguinchor|GC
moustapha.kebe|2024|Abidjan|GC mor.mbaye|2024|Dakar|GC bamba.toure|2024|Dakar|GI absa.kebe|2025|Kaolack|GC"""
ETUDIANTS = """serigne.lo|2027|GC elhadji.barry|2027|GC aliou.camara|2027|GC assane.diouf|2027|GC aida.sene|2027|GEM
malick.tall|2027|GIT bamba.coly|2027|GC astou.toure|2027|GIT codou.diallo|2027|GC aliou.barry|2027|GEM
yacine.diouf|2027|GIT elhadji.kane|2027|GIT djibril.barry|2027|GEM samba.bodian|2028|GIT khadim.sall|2028|GEM
ibrahima.badji|2028|GC coumba.diagne|2028|GEM kine.sarr|2028|GI ibrahima.cisse|2028|GI bineta.camara|2028|GIT
mame-diarra.dieng|2028|GIT mareme.dieng|2028|GC alassane.diallo|2028|GEM djibril.niang|2028|GC coumba.sarr|2028|GEM
khoudia.seck|2028|GIT aminata.thiam|2028|GIT matar.toure|2028|GEM modou.wade|2028|GI massamba.cisse|2029|GEM
mor.tall|2029|GEM aissatou.seck|2029|GEM fallou.ndour|2029|GIT yacine.ndiaye|2029|GIT dieynaba.kebe|2029|GEM
oumou.dieng|2029|GIT mor.dia|2029|GIT omar.badji|2029|GIT penda.drame|2029|GEM"""
PERSONNEL = """fatou-binetou.ndiaye aissatou.dieng abdoulaye.sow saliou.ka ndeye-astou.faye rokhaya.gaye pierre.mendy
ousmane.badji""".split()

MEMBRES = {}
for ligne in ALUMNI.split():
    cle, promo, ville, filiere = ligne.split("|")
    MEMBRES[cle] = {"role": "ALUMNI", "promo": int(promo), "ville": ville, "filiere": filiere}
for ligne in ETUDIANTS.split():
    cle, promo, filiere = ligne.split("|")
    MEMBRES[cle] = {"role": "ETUDIANT", "promo": int(promo), "ville": "Thiès", "filiere": filiere}
for cle in PERSONNEL:
    MEMBRES[cle] = {"role": "PERSONNEL", "promo": None, "ville": "Thiès", "filiere": None}


def selection(condition):
    return [cle for cle, m in MEMBRES.items() if condition(m)]


def alumni(condition=lambda m: True):
    return selection(lambda m: m["role"] == "ALUMNI" and condition(m))


def etudiants(condition=lambda m: True):
    return selection(lambda m: m["role"] == "ETUDIANT" and condition(m))


def prenom(cle):
    return cle.split(".")[0].split("-")[0].capitalize()


# ---------------------------------------------------------------------------------------------------------------
# Fils de discussion. Chaque ligne : « X: texte ». X est une lettre (A, B, C, D…) remplacée par un membre de la
# conversation, S par un étudiant, P par un membre du personnel. « +X » : message d'arrivée de X dans la communauté.
# « X: ~ » : message supprimé par son auteur. {A} dans un texte : prénom de la personne A.
# ---------------------------------------------------------------------------------------------------------------

FILS_VILLE = {
    "Dakar": [
        """A: Bonsoir à tous ! On relance l’afterwork EPT de fin de mois ? La dernière fois au Plateau on était une vingtaine.
B: Partant ! Le jeudi m’arrange mieux que le vendredi, avec les embouteillages de la VDN.
C: Jeudi 19 h c’est parfait. Quelqu’un a une adresse aux Almadies pas trop bruyante ?
A: Je propose le rooftop près du phare, ils font une salle privée à partir de 15 personnes.
D: Je m’occupe de prévenir la promo 2019 alors.
B: Top. {A}, tu crées un sondage pour compter les présents ?
A: C’est fait, je le partage demain matin.""",
        """A: Petite question logement : quelqu’un connaît une colocation correcte vers Mermoz ou Sacré-Cœur ? Un jeune de la promo 2024 arrive à Dakar le mois prochain.
B: Mon voisin libère un studio à Sacré-Cœur 3 fin du mois. Je t’envoie son numéro en privé.
C: Sinon regarde du côté de Liberté 6, c’est moins cher et bien desservi par le BRT.
A: Merci beaucoup, je transmets !""",
        """A: Info utile : le BRT passe maintenant toutes les 5 minutes aux heures de pointe. Gain de temps énorme pour ceux qui vont à Guédiawaye.
B: Confirmé, je mets 25 minutes au lieu d’une heure le matin.
C: Par contre bondé à 7 h 30, il faut partir avant 7 h.""",
        """A: Quelqu’un participe au salon des infrastructures au CICAD la semaine prochaine ?
B: Oui, je suis sur le stand de mon entreprise mercredi et jeudi. Passez dire bonjour !
C: J’y serai jeudi matin. On pourrait se retrouver pour un café vers 11 h ?
B: Avec plaisir, stand B12 à côté de l’entrée principale.
D: Je note, je viens avec deux collègues de la promo 2015.""",
        """A: Qui serait chaud pour une sortie à l’île de Gorée un samedi avec les familles ? Les enfants adorent.
B: Super idée ! Fin de mois ça irait pour nous.
C: On est partants, on sera quatre.
A: Je regarde les horaires de la chaloupe et je propose une date.""",
    ],
    "Thiès": [
        """A: Les alumni de Thiès, l’école organise une matinée portes ouvertes samedi. Ils cherchent des volontaires pour parler de leur métier aux lycéens.
D: Merci {A} de relayer, je coordonne côté alumni. Accueil à 9 h devant l’amphithéâtre, on prévoit une demi-heure par atelier.
B: Je peux venir présenter le métier d’automaticien.
C: Présente aussi pour le génie civil, j’apporte quelques maquettes de chantier.
D: Parfait, je vous inscris tous les deux. Merci !""",
        """A: Quelqu’un connaît un bon menuisier à Thiès ? Je refais la cuisine.
B: Le menuisier en face du marché central travaille bien, demande Pape de ma part.
A: Merci, je passe le voir samedi.""",
        """S: Bonjour ! Je suis en 2e année. Est-ce que des alumni sur Thiès accepteraient de nous recevoir pour une visite d’usine ? On prépare un projet sur la maintenance.
A: Avec plaisir. Envoie-moi la liste des étudiants et je fais la demande à la direction du site.
S: Merci beaucoup ! On serait 8 personnes, n’importe quel jeudi après-midi.
A: Je te confirme d’ici la fin de semaine.""",
        """A: Le match de gala alumni contre étudiants est confirmé au stade de l’école, dimanche 17 h.
B: Les étudiants vont souffrir cette année 😄
S: On verra bien ! On s’entraîne depuis trois semaines.
C: Je ramène des maillots, il en reste une quinzaine de l’an dernier.""",
    ],
    "France": [
        """A: Bonjour à tous les EPT de France ! On organise un dîner à Paris le mois prochain, vers Château-Rouge. Qui est dispo ?
B: Présente ! Je viens de Lyon pour l’occasion si c’est un samedi.
C: Samedi ça me va aussi. Je peux réserver chez Chez Fatou, ils ont une grande salle.
D: Je descends de Toulouse, je ferai l’aller-retour en train.
A: Génial, ça fait déjà une douzaine de réponses positives !""",
        """A: Question administrative : quelqu’un a récemment renouvelé son titre de séjour « talent » ? Les délais à la préfecture sont interminables.
B: Oui, compte 4 mois en Île-de-France. Prends rendez-vous dès que tu reçois la convocation en ligne.
C: Pense aussi à garder l’attestation de prolongation, mon employeur me l’a demandée.
A: Merci, très utile.""",
        """S: Bonjour ! J’ai été admis en double diplôme dans une école d’ingénieurs à Toulouse. Des conseils pour trouver un logement ?
A: Félicitations ! Fais tout de suite la demande au CROUS, et regarde les résidences étudiantes privées en parallèle.
B: Je suis à Toulouse, je peux te mettre en contact avec deux autres élèves EPT arrivés l’an dernier.
S: Merci énormément, ça me rassure !""",
        """A: Une offre intéressante chez nous à Paris : ingénieur méthodes en CDI, profil génie industriel, 3 à 5 ans d’expérience. Je peux recommander en interne.
B: Je suis intéressé, je t’envoie mon CV en privé.
C: Je connais quelqu’un de la promo 2018 qui cherche, je lui transmets.""",
    ],
    "Canada": [
        """A: Salut la gang EPT de Montréal ! Brunch dimanche à Côte-des-Neiges ?
B: Avec plaisir, il fait enfin un peu moins froid.
C: J’y serai, je viens avec mon conjoint.
A: Super, 11 h au café habituel.""",
        """A: Pour ceux qui viennent d’arriver : faites vite reconnaître votre diplôme par l’Ordre des ingénieurs du Québec, le processus est long.
B: Exact. Comptez environ un an entre le dépôt du dossier et le permis d’ingénieur junior.
C: Et l’examen professionnel n’est pas si difficile si on révise le guide de déontologie.
D: Merci pour les infos, je commence mon dossier ce mois-ci.""",
        """A: Quelqu’un a déjà vécu un hiver à Québec ? On me propose un poste là-bas.
B: Oui, trois hivers. Un bon manteau, des bottes et ça se passe très bien. La ville est magnifique.
A: Rassurant, merci !""",
    ],
    "Abidjan": [
        """A: Akwaba aux nouveaux arrivants à Abidjan ! On se voit samedi à la Riviera pour le déjeuner EPT ?
B: Présent. Je viens de rentrer d’un chantier à San-Pédro.
C: Je serai là avec un collègue ivoirien qui veut connaître le réseau.
A: Parfait, tous les amis sont bienvenus.""",
        """A: Beaucoup de projets d’infrastructures ici en ce moment : le métro, les ponts, les routes. Si des EPT cherchent, je partage les offres que je vois passer.
B: Merci {A}. Je cherche justement un poste de conducteur de travaux.
A: Envoie-moi ton CV, il y a deux postes ouverts chez un partenaire.""",
    ],
    "Maghreb": [
        """A: Bonjour les EPT du Maroc ! On est combien à Casablanca maintenant ?
B: Au moins cinq d’après l’annuaire. On devrait faire un dîner.
C: Je propose un vendredi soir à Maârif.
A: Va pour vendredi en quinze.""",
        """A: Quelqu’un connaît les démarches pour la carte de séjour au Maroc avec un contrat local ?
B: Oui, il faut le contrat visé par le ministère de l’Emploi, ensuite la préfecture. Compte deux mois environ.
A: Merci beaucoup !""",
    ],
    "Sud": [
        """A: Hello les EPT de Ziguinchor, Kaolack et Mbour ! On a créé ce groupe pour ceux qui travaillent hors de Dakar.
B: Excellente idée, on se sent parfois un peu isolés ici.
C: À Kaolack on est trois maintenant, on pourrait accueillir la prochaine rencontre.
D: Mbour est à mi-chemin pour tout le monde, je propose la plage de Saly.""",
        """A: Les chantiers d’électrification rurale en Casamance recrutent des techniciens. Si vous connaissez des profils, envoyez-les-moi.
B: Je connais deux diplômés de l’ISEP de Bignona, très bons. Je te mets en contact.
A: Merci beaucoup.""",
        """A: Quelqu’un descend à Ziguinchor par le bateau la semaine prochaine ? Je cherche à envoyer un colis.
B: Moi jeudi, avec plaisir. Donne-moi l’adresse.""",
    ],
}

FILS_SECTEUR = {
    "Énergie": [
        """A: Mise en service ce matin d’une centrale solaire de 15 MWc dans la région de Kaffrine. Fierté de l’équipe !
B: Bravo ! Vous utilisez des onduleurs centraux ou string ?
A: String, plus simples à maintenir sur un site isolé.
C: Félicitations. Le stockage batterie est prévu ?
A: Deuxième phase l’an prochain, 20 MWh.""",
        """A: Débat intéressant : hydrogène vert au Sénégal, réaliste à 10 ans ou pas ?
B: Pour l’export peut-être, mais le coût de l’électrolyse reste élevé.
C: Je pense qu’on a d’abord besoin de renforcer le réseau et le stockage.
D: D’accord avec {C}. Le vrai sujet c’est la stabilité du réseau avec autant de solaire.
A: Je partagerai un article sur le sujet ce soir.""",
        """S: Bonjour, je cherche un stage de fin d’études en énergies renouvelables, idéalement dimensionnement photovoltaïque. Des pistes ?
A: Envoie-moi ton CV, on prend deux stagiaires en mars.
B: Regarde aussi les appels de l’agence d’électrification rurale, ils accueillent des stagiaires ingénieurs.
S: Merci beaucoup, je vous écris en privé.""",
        """A: Quelqu’un utilise PVsyst version récente ? Les licences ont beaucoup augmenté.
B: Oui, on a pris une licence partagée pour l’équipe. Sinon SAM est gratuit pour les premières études.
A: Bonne idée, merci.""",
    ],
    "BTP": [
        """A: Question technique : sur un sol argileux gonflant, vous préférez des pieux ou un radier ?
B: Pieux forés ancrés sous la zone active, c’est ce qu’on a fait à Diamniadio.
C: Ça dépend de la descente de charges. Pour du R+2, un radier bien drainé peut suffire.
A: R+4, donc je pars sur des pieux. Merci à vous deux.""",
        """A: La nouvelle version du règlement sur le béton armé est sortie. Quelqu’un a une synthèse des changements ?
B: J’ai préparé une note pour mon équipe, je la partage ici demain.
C: Merci {B}, ça va servir à beaucoup de monde.""",
        """A: On recrute un ingénieur VRD pour un projet de lotissement à Diamniadio, 3 ans d’expérience minimum.
B: Je transmets à un ami de la promo 2020.
C: Le poste est ouvert aux candidatures depuis l’étranger ?
A: Oui, prise de poste dans deux mois.""",
        """S: Bonjour, quelqu’un utilise Robot Structural Analysis ou plutôt Tekla ? On doit choisir pour notre projet de fin d’études.
A: Robot pour le calcul, Tekla pour les plans d’exécution. Les deux sont complémentaires.
B: Robot est gratuit pour les étudiants, commence par là.
S: Merci !""",
        """A: Retour d’expérience : le BIM sur un chantier de 200 logements, on a divisé par deux les conflits entre corps d’état.
B: Très intéressant. Vous avez eu du mal à former les sous-traitants ?
A: Oui, c’est le point faible. On a fait trois sessions de formation sur site.
C: Tu pourrais en faire une présentation pour les étudiants ?""",
    ],
    "Numérique": [
        """A: Petit sondage : vous déployez sur quel cloud pour vos clients sénégalais ? Hébergement local ou hyperscaler ?
B: Datacenter local pour les données sensibles, le reste sur un cloud public.
C: Pareil. La question de la souveraineté des données revient dans tous les appels d’offres.
D: On a eu de bonnes surprises avec un hébergeur local, latence bien meilleure.""",
        """A: Quelqu’un a déjà intégré l’API Wave pour les paiements ? La documentation est un peu légère.
B: Oui, attention au webhook de confirmation, il peut arriver avant la réponse de l’appel.
C: Et pensez à rendre vos traitements idempotents.
A: Merci, c’était exactement mon problème !""",
        """A: Retour sur la 5G : on a terminé les tests à Dakar, débits impressionnants mais la couverture reste limitée.
B: Le vrai enjeu ce sera la fibre en régions.
C: Les étudiants peuvent-ils visiter vos installations ?
A: Oui, faites une demande officielle via l’école.""",
        """S: Bonjour, pour un stage en développement, mieux vaut Java/Spring ou JavaScript/Node ?
A: Les deux recrutent. Mais maîtrise bien une pile plutôt que deux à moitié.
B: Beaucoup de banques et d’opérateurs ici sont en Java, les start-up plutôt en Node ou Python.
S: Merci, je vais approfondir Spring Boot alors.""",
    ],
    "Industrie": [
        """A: Vous utilisez quoi comme GMAO ? On remplace notre vieux système.
B: On est passés sur une solution en ligne, l’appli mobile pour les techniciens change tout.
C: Attention au coût des licences par utilisateur.
A: Merci, je vais faire un comparatif.""",
        """A: Démarche lean dans notre usine : on a réduit de 30 % les temps de changement de série en 6 mois.
B: Bravo ! Le SMED ?
A: Oui, avec beaucoup de formation des opérateurs.
C: Ça intéresserait les étudiants de génie industriel, tu pourrais faire un témoignage ?""",
        """A: Quelqu’un a une expérience de la certification ISO 45001 ?
B: Oui, on l’a obtenue l’an dernier. Le plus long a été l’évaluation des risques poste par poste.
A: On peut en parler cette semaine ?
B: Bien sûr, appelle-moi jeudi.""",
    ],
    "Aéronautique": [
        """A: Bonne nouvelle : notre atelier de maintenance à l’aéroport AIBD vient d’obtenir l’agrément Part-145.
B: Félicitations ! C’était un gros dossier.
C: Ça va créer des postes pour les jeunes diplômés ?
A: Une dizaine dans l’année.""",
        """S: Bonjour, quelles certifications conseillez-vous après le diplôme pour travailler en navigabilité ?
A: La licence Part-66 si tu veux être sur le terrain. Pour le bureau, une bonne connaissance de la réglementation suffit au départ.
B: Et apprends l’anglais technique, tout est en anglais.
S: Merci beaucoup !""",
        """A: Visite du hangar organisée pour les étudiants de 3e année le mois prochain. Qui peut aider à encadrer ?
B: Moi, je peux prendre un groupe.
C: Moi aussi, le matin seulement.""",
    ],
}

FILS_INTERET = {
    "Entrepreneuriat": [
        """A: Bonjour ! On vient de lever 200 millions de FCFA pour notre start-up agritech. Je suis disponible pour partager l’expérience avec ceux qui se lancent.
B: Bravo ! Comment vous avez trouvé vos premiers investisseurs ?
A: Un réseau de business angels de la diaspora, puis un fonds régional.
C: Tu peux faire une session en ligne pour le groupe ?
A: Avec plaisir, je propose une date ce mois-ci.""",
        """A: Quelqu’un a déjà créé une SAS au Sénégal récemment ? Combien de temps ça prend ?
B: Une semaine avec l’APIX si le dossier est complet.
C: Prévoir un bon expert-comptable dès le départ.
A: Merci !""",
        """A: L’incubateur du campus accepte les candidatures jusqu’à la fin du mois. 6 mois d’accompagnement, un mentor alumni et des bureaux gratuits.
S: Est-ce ouvert aux étudiants ?
A: Oui, en équipe de deux minimum.
B: Je veux bien être mentor pour une équipe.""",
        """A: Question : pour une première embauche, CDD ou stage de pré-embauche ?
B: CDD, c’est plus clair et plus motivant pour la personne.
C: D’accord. Et prévoyez une vraie période d’intégration.""",
    ],
    "Data": [
        """A: Je partage un notebook sur la prévision de la demande d’électricité avec des modèles de séries temporelles. Retours bienvenus !
B: Super travail. Tu as essayé d’ajouter la température comme variable explicative ?
A: Pas encore, bonne idée.
C: Les données de consommation sont publiques ?
A: En partie, via le portail open data.""",
        """S: Bonjour, quel parcours conseillez-vous pour devenir data engineer ? Je suis en 2e année.
A: SQL avant tout, puis Python, puis un orchestrateur comme Airflow.
B: Et les bases du cloud. Un petit projet complet vaut mieux que dix certificats.
S: Merci beaucoup.""",
        """A: Quelqu’un utilise des modèles de langage en production ? Comment vous gérez les données personnelles ?
B: On anonymise avant envoi, et pour les cas sensibles on reste sur un modèle hébergé localement.
C: Pensez à la loi sénégalaise sur les données personnelles, la CDP est vigilante.
A: Merci pour les conseils.""",
        """A: Meetup data à Dakar jeudi prochain : retour d’expérience sur la détection de fraude dans le mobile money.
B: Je viendrai.
C: Il y aura une diffusion en ligne pour ceux de l’étranger ?
A: Oui, je mets le lien ici le jour J.""",
    ],
    "Cybersécurité": [
        """A: Attention, campagne de phishing en cours qui imite une banque sénégalaise. Prévenez vos proches.
B: Merci {A}. On en a reçu plusieurs au bureau aussi.
C: Le lien redirige vers un domaine en .xyz, facile à repérer.""",
        """S: Bonjour, quelle certification pour débuter en cybersécurité ?
A: Commence par des plateformes pratiques comme TryHackMe, puis une certification comme la Security+.
B: Et participe aux CTF de l’école, c’est très formateur.
S: Merci, je vais m’inscrire au prochain CTF.""",
        """A: Qui serait partant pour monter une équipe EPT pour le CTF national le mois prochain ?
B: Moi !
C: Moi aussi, je peux m’occuper de la partie forensique.
S: Est-ce que des étudiants peuvent rejoindre ?
A: Bien sûr, c’est même l’idée.""",
    ],
    "Mentors": [
        """A: Bienvenue aux nouveaux mentors ! N’hésitez pas à partager vos bonnes pratiques ici.
B: Ma règle : un rendez-vous fixe toutes les deux semaines, même court.
C: Et laisser le mentoré préparer l’ordre du jour.
D: Très bonne idée, je vais l’appliquer.""",
        """A: Comment vous gérez un mentoré qui ne donne plus de nouvelles ?
B: Un message bienveillant, puis on laisse la porte ouverte.
C: Souvent ce sont les examens. Il revient après.""",
    ],
    "Concours": [
        """S: Bonjour, quelqu’un a passé le concours d’entrée en master en France via Campus France ? Les délais ?
A: Dossier à déposer avant fin décembre en général. Commence tôt pour les lettres de recommandation.
B: Et prépare bien l’entretien, ils posent des questions sur ton projet professionnel.
S: Merci !""",
        """A: Les bourses Eiffel sont ouvertes. Plusieurs EPT les ont obtenues ces dernières années.
B: Je l’ai eue en 2019, je peux relire des dossiers.
S: Je veux bien, merci beaucoup !
B: Écris-moi en privé.""",
        """S: Master tout de suite ou expérience d’abord ? On en discute beaucoup avec ma promo.
A: Expérience d’abord, tu choisiras mieux ton master.
B: Pas d’accord, certaines bourses ont une limite d’âge. Tout dépend du domaine.
C: Les deux se défendent. L’important c’est d’avoir un projet clair.""",
    ],
    "Football": [
        """A: Match dimanche 9 h au terrain de l’école ! On a besoin d’un gardien.
B: Je viens, mais pas comme gardien 😄
C: Je peux garder une mi-temps.
D: Présent, j’amène les chasubles.""",
        """A: Résultat du dimanche : alumni 4, étudiants 3. Belle remontée en fin de match !
S: La revanche le mois prochain.
B: Toujours prêts.""",
        """A: Qui regarde le match des Lions ce soir ? On se retrouve au café près du rond-point ?
B: Partant.
C: Je vous rejoins à la mi-temps.""",
    ],
    "Femmes": [
        """A: Bonjour à toutes ! Ce groupe sert à s’entraider et à encourager les lycéennes à choisir l’ingénierie.
B: Merci {A} pour l’initiative.
C: On pourrait faire une tournée dans les lycées de Thiès et Dakar.
D: Je m’occupe de contacter le lycée de jeunes filles.""",
        """A: Comment vous avez concilié congé maternité et chantier ? Je m’interroge pour la suite.
B: J’ai négocié un poste au bureau d’études pendant six mois, ça s’est très bien passé.
C: En parler tôt avec la hiérarchie aide beaucoup.
A: Merci pour vos retours.""",
    ],
    "Offres": [
        """A: Offre : ingénieur électricien junior, Dakar, CDI. Profil GEM sorti depuis moins de 3 ans.
B: Je partage avec ma promo.
C: Le salaire est indiqué ?
A: Selon profil, mais dans la moyenne du marché.""",
        """A: Stage de 6 mois en data chez un opérateur télécom, démarrage janvier.
S: Bonjour, je suis intéressé. Comment postuler ?
A: Envoie ton CV en privé, je transmets à la RH.""",
        """A: Recherche ingénieur génie civil pour un chantier à Saint-Louis, 2 ans d’expérience.
B: J’ai un ami qui correspond, je lui envoie l’annonce.""",
    ],
}

FILS_PROMO = [
    """A: Salut la promo ! Ça fait plaisir de voir tout le monde ici.
B: Enfin un endroit pour se retrouver !
C: On pense à une soirée de retrouvailles ?
A: Oui, pour les {ans} ans de sortie. Je propose un sondage pour la date.""",
    """A: Bonne nouvelle : {A2} vient d’être nommé chef de projet. Félicitations !
B: Bravo ! Bien mérité.
C: Félicitations, on fête ça quand ?
D: Bravo à toi !""",
    """A: Qui a encore la photo de groupe de la remise des diplômes ? Je l’ai perdue en changeant de téléphone.
B: Je l’ai, je te l’envoie.
C: Moi aussi, en haute définition.""",
    """A: On lance une cotisation pour offrir du matériel au labo de l’école au nom de la promo ?
B: Bonne idée, je participe.
C: Moi aussi. Quel montant ?
A: Libre, objectif 500 000 FCFA.
D: Je m’occupe de la collecte par Wave.""",
    """A: Petite pensée pour nos professeurs de première année. Quelqu’un a des nouvelles du professeur de mécanique ?
B: Il est toujours à l’école, il prend sa retraite l’an prochain.
C: On pourrait lui organiser une petite cérémonie.""",
    """A: Mariage de {A2} samedi prochain à Thiès ! Toute la promo est invitée.
B: Félicitations ! On sera là.
C: Super nouvelle 🎉""",
]

FILS_PROMO_ETUDIANTS = [
    """A: Quelqu’un a le corrigé du partiel de résistance des matériaux de l’an dernier ?
B: Je l’ai en photo, je l’envoie ici ce soir.
C: Merci !
A: Révisions ensemble à la bibliothèque demain 15 h ?""",
    """A: Rappel : inscriptions aux options de 3e année avant vendredi sur le portail.
B: Merci pour le rappel !
C: Le portail plante depuis ce matin, d’autres ont le problème ?
A: Oui, la scolarité est prévenue.""",
    """A: Soirée d’intégration jeudi ! On a besoin de volontaires pour la décoration.
B: Je peux aider.
C: Moi aussi, après les TP.""",
    """A: Les stages d’été : quelqu’un a déjà une réponse ?
B: J’ai un entretien la semaine prochaine dans une entreprise de BTP.
C: Moi toujours rien, je relance demain.
D: Le forum entreprises est le mois prochain, ne lâchez rien.""",
]

GROUPES = [
    ("bureau-promo-2018", "Bureau de la promo 2018", "Organisation des 10 ans de la promo 2018.",
     alumni(lambda m: m["promo"] == 2018)[:7], [
         """A: Bonjour le bureau ! Les 10 ans approchent, il faut commencer à organiser.
B: Je propose un week-end à Saly, avec les familles.
C: On a combien de budget ?
A: Environ 25 000 FCFA par personne si on est 40.
D: Je contacte des hôtels cette semaine.""",
         """D: J’ai trois devis. Le moins cher est à 18 000 FCFA par personne, petit-déjeuner compris.
A: Parfait, on valide celui-là ?
B: Validé.
C: Validé aussi.""",
     ]),
    ("projet-pont-diamniadio", "Projet pont Diamniadio", "Coordination technique de l’ouvrage.",
     alumni(lambda m: m["filiere"] == "GC")[:6], [
         """A: Les résultats de l’étude géotechnique sont arrivés, je les dépose ce soir.
B: Merci. On a la confirmation du nombre de pieux ?
A: 24 pieux de 18 m.
C: Il faut revoir le planning du ferraillage alors.""",
         """B: Réunion de chantier demain 8 h, n’oubliez pas les EPI.
C: OK.
D: Je serai en retard de 15 minutes, embouteillages sur l’autoroute.""",
     ]),
    ("revisions-git-2028", "Révisions GIT 2028", "Préparation des examens du semestre.",
     etudiants(lambda m: m["promo"] == 2028 and m["filiere"] == "GIT"), [
         """A: Qui a compris l’exercice 3 du TD de réseaux ?
B: Moi, c’est le calcul du masque de sous-réseau. Je l’explique demain.
C: Merci, je bloquais aussi.""",
         """A: Session de révision bases de données samedi 10 h, salle 12.
B: Je viens.
C: J’apporte les annales.""",
     ]),
    ("startup-agritech", "Équipe Sahel Agritech", "Notre projet de capteurs pour l’irrigation.",
     alumni(lambda m: m["filiere"] in ("GIT", "GEM") and m["promo"] >= 2019)[:5], [
         """A: Les capteurs de test sont arrivés ! 20 unités.
B: Super, on les installe chez quel producteur ?
C: Celui de Mboro, il est très motivé.
A: Déplacement jeudi alors.""",
         """B: Le tableau de bord est en ligne, retours bienvenus.
C: Très clair. On pourrait ajouter une alerte SMS ?
A: Oui, c’est la priorité de la semaine prochaine.""",
     ]),
    ("gala-ept", "Organisation du gala EPT", "Comité d’organisation du gala annuel.",
     alumni(lambda m: m["ville"] == "Dakar")[:6] + PERSONNEL[:2], [
         """P: Le gala est fixé au dernier samedi du mois prochain. Il nous faut une salle de 300 personnes.
A: Je contacte deux hôtels.
B: Je m’occupe des sponsors, j’ai déjà deux entreprises intéressées.
C: Et l’animation ?
P: Un groupe de musique et la remise des prix des meilleurs projets étudiants.""",
         """A: L’hôtel du centre-ville accepte, 7 millions de FCFA tout compris.
B: Les sponsors couvrent déjà 5 millions.
P: Très bien, on valide.""",
     ]),
    ("mentors-orientation", "Mentors du programme orientation", "Coordination des mentors du programme lycéens.",
     alumni(lambda m: m["promo"] <= 2015)[:6] + ["fatou-binetou.ndiaye"], [
         """P: Merci à tous de rejoindre le programme. Première rencontre avec les lycéens le 15.
A: Combien de lycéens par mentor ?
P: Trois en moyenne.
B: Parfait, je suis disponible le samedi matin.""",
     ]),
    ("colloc-dakar", "Coloc Sacré-Cœur", "Organisation de la colocation.",
     alumni(lambda m: m["promo"] == 2024 and m["ville"] == "Dakar")[:4], [
         """A: La facture d’électricité est arrivée : 42 000 FCFA ce mois-ci.
B: Je fais le virement ce soir.
C: Pareil.
A: Merci ! Et on pense à racheter du gaz.""",
         """B: Qui est là ce week-end ? Je propose un thieb dimanche.
C: Moi !
A: Je ramène les boissons.""",
     ]),
    ("projet-fin-etudes-ge", "PFE maintenance prédictive", "Projet de fin d’études et encadrants.",
     etudiants(lambda m: m["promo"] == 2027 and m["filiere"] == "GEM") + ["abdoulaye.sow"], [
         """A: Bonjour monsieur, nous avons terminé l’acquisition des données de vibration.
P: Très bien. Quel est le volume ?
A: Environ trois semaines de mesures sur 4 moteurs.
P: Parfait, commencez l’analyse spectrale.
B: On vous envoie un premier rapport vendredi.""",
     ]),
    ("diaspora-canada", "Arrivants Canada 2026", "Entraide pour les nouveaux arrivants.",
     alumni(lambda m: m["ville"] == "Montréal"), [
         """A: Pour l’ouverture du compte bancaire, prenez rendez-vous dès l’arrivée, certaines banques offrent des forfaits nouveaux arrivants.
B: Merci ! Et pour le téléphone ?
C: Les forfaits prépayés sont les plus simples les premiers mois.""",
     ]),
    ("comite-cyber", "Équipe CTF EPT", "Préparation du CTF national.",
     ["khady.sow", "khadidiatou.samb", "malick.tall", "astou.toure", "elhadji.kane", "samba.bodian"], [
         """A: Entraînement ce soir 21 h en ligne sur les épreuves de l’an dernier.
B: J’y serai.
C: Je travaille la partie cryptographie.
D: Et moi le web.""",
         """A: On est classés 4e au tour de qualification ! Bravo l’équipe.
B: Super !
C: Rendez-vous en finale.""",
     ]),
]

# Communautés créées par des membres : (clé, nom, description, catégorie, accès, créateur, membres, fils)
COMMUNAUTES = [
    ("ville-dakar", "Alumni EPT à Dakar", "Afterworks, entraide et bons plans pour les EPT qui vivent à Dakar.", "VILLE",
     "OUVERTE", alumni(lambda m: m["ville"] == "Dakar"), FILS_VILLE["Dakar"]),
    ("ville-thies", "EPT à Thiès", "Les alumni et les étudiants de Thiès : visites, sport, vie de l’école.",
     "VILLE", "OUVERTE", alumni(lambda m: m["ville"] == "Thiès") + etudiants()[::3], FILS_VILLE["Thiès"]),
    ("ville-france", "EPT en France", "Paris, Lyon, Toulouse : se retrouver, s’entraider, partager les offres.", "VILLE",
     "OUVERTE", alumni(lambda m: m["ville"] in ("Paris", "Lyon", "Toulouse")) + etudiants()[1::9], FILS_VILLE["France"]),
    ("ville-canada", "EPT au Canada", "Montréal, Québec et ailleurs : installation, équivalences, retrouvailles.", "VILLE",
     "OUVERTE", alumni(lambda m: m["ville"] == "Montréal") + alumni(lambda m: m["promo"] == 2023)[:2],
     FILS_VILLE["Canada"]),
    ("ville-abidjan", "EPT à Abidjan", "Le réseau EPT en Côte d’Ivoire.", "VILLE", "OUVERTE",
     alumni(lambda m: m["ville"] in ("Abidjan", "Bamako")), FILS_VILLE["Abidjan"]),
    ("ville-maghreb", "EPT au Maroc", "Casablanca, Rabat : le réseau EPT au Maghreb.", "VILLE", "OUVERTE",
     alumni(lambda m: m["ville"] in ("Casablanca", "Nouakchott")), FILS_VILLE["Maghreb"]),
    ("ville-sud", "EPT Petite-Côte et Sud", "Mbour, Kaolack, Ziguinchor : les EPT hors de Dakar.", "VILLE", "OUVERTE",
     alumni(lambda m: m["ville"] in ("Mbour", "Kaolack", "Ziguinchor", "Touba")), FILS_VILLE["Sud"]),
    ("secteur-energie", "Énergie et solaire", "Production, réseaux, renouvelables : les EPT de l’énergie.", "SECTEUR",
     "OUVERTE", alumni(lambda m: m["filiere"] == "GEM") + etudiants(lambda m: m["filiere"] == "GEM")[::2],
     FILS_SECTEUR["Énergie"]),
    ("secteur-btp", "BTP et infrastructures", "Bâtiment, routes, ouvrages d’art, géotechnique.", "SECTEUR", "OUVERTE",
     alumni(lambda m: m["filiere"] == "GC") + etudiants(lambda m: m["filiere"] == "GC")[::2], FILS_SECTEUR["BTP"]),
    ("secteur-numerique", "Numérique et télécoms", "Développement, cloud, réseaux et télécoms.", "SECTEUR", "OUVERTE",
     alumni(lambda m: m["filiere"] == "GIT") + etudiants(lambda m: m["filiere"] == "GIT")[::2],
     FILS_SECTEUR["Numérique"]),
    ("secteur-industrie", "Industrie et supply chain", "Production, maintenance, qualité et logistique.", "SECTEUR",
     "OUVERTE", alumni(lambda m: m["filiere"] == "GI") + etudiants(lambda m: m["filiere"] == "GI"),
     FILS_SECTEUR["Industrie"]),
    ("secteur-aero", "Aéronautique", "Maintenance, navigabilité, bureau d’études aéronautique.", "SECTEUR", "OUVERTE",
     alumni(lambda m: m["filiere"] == "GAE") + etudiants()[5::11], FILS_SECTEUR["Aéronautique"]),
    ("interet-entrepreneuriat", "Entrepreneuriat EPT", "Créer, financer et faire grandir son entreprise.", "INTERET",
     "OUVERTE", alumni()[::3] + etudiants()[::5], FILS_INTERET["Entrepreneuriat"]),
    ("interet-data", "Data et IA", "Science des données, ingénierie des données et intelligence artificielle.",
     "INTERET", "OUVERTE", alumni(lambda m: m["filiere"] in ("GIT", "GI"))[::2] + etudiants(lambda m: m["filiere"] == "GIT"),
     FILS_INTERET["Data"]),
    ("interet-cyber", "Cybersécurité", "Veille, CTF, certifications et bonnes pratiques.", "INTERET", "OUVERTE",
     alumni(lambda m: m["filiere"] == "GIT")[::3] + ["khady.sow", "khadidiatou.samb"]
     + etudiants(lambda m: m["filiere"] == "GIT")[::3], FILS_INTERET["Cybersécurité"]),
    ("interet-mentors", "Mentors EPT", "Échanges entre mentors du réseau : pratiques et retours d’expérience.", "INTERET",
     "SUR_DEMANDE", alumni(lambda m: m["promo"] <= 2016)[::2], FILS_INTERET["Mentors"]),
    ("interet-concours", "Masters, concours et mobilité", "Bourses, admissions et poursuite d’études à l’étranger.",
     "INTERET", "OUVERTE", alumni(lambda m: m["ville"] in ("Paris", "Lyon", "Toulouse", "Montréal"))
     + etudiants()[::2], FILS_INTERET["Concours"]),
    ("interet-foot", "EPT Football Club", "Le match du dimanche et les soirées foot.", "INTERET", "OUVERTE",
     alumni(lambda m: m["ville"] in ("Thiès", "Dakar"))[::2] + etudiants()[::4], FILS_INTERET["Football"]),
    ("interet-femmes", "Femmes ingénieures EPT", "Entraide et promotion des carrières scientifiques au féminin.",
     "INTERET", "SUR_DEMANDE", ["fatoumata.cisse", "mariama.barry", "aminata.sarr", "khady.sow", "mariama.ba",
                                "seynabou.ndour", "fatou.diagne", "absa.ly", "awa.thiam", "rama.coly", "ndeye.fall",
                                "astou.mbengue", "coumba.seck", "aissatou.diop", "astou.toure", "bineta.camara",
                                "khoudia.seck", "codou.diallo"], FILS_INTERET["Femmes"]),
    ("interet-offres", "Offres de stage et d’emploi", "Les offres partagées par les membres du réseau.", "INTERET",
     "OUVERTE", alumni()[1::2] + etudiants()[1::2], FILS_INTERET["Offres"]),
]

# Conversations directes : (lettre A = qui écrit en premier, lettre B = qui répond)
FILS_DIRECTS = [
    """A: Bonjour {B}, je suis en 3e année. J’ai vu dans l’annuaire que tu travailles dans le domaine qui m’intéresse. Aurais-tu 20 minutes pour un échange ?
B: Bonjour {A}, avec plaisir ! Jeudi soir en visio ?
A: Parfait, 19 h ?
B: Va pour 19 h, je t’envoie le lien.
A: Merci beaucoup !""",
    """A: Salut {B} ! Ça fait longtemps. Tu es toujours à {villeB} ?
B: Salut ! Oui, toujours. Et toi, quoi de neuf ?
A: Je viens de changer de poste. Je passe à {villeB} le mois prochain, on prend un café ?
B: Avec grand plaisir, préviens-moi quelques jours avant.""",
    """A: Bonjour {B}, est-ce que tu accepterais de relire mon CV avant que je postule ?
B: Bien sûr, envoie-le-moi.
A: Le voici en PDF. Je postule pour un poste d’ingénieur junior.
B: Bon CV. Mets tes projets en avant, avec des résultats chiffrés, et raccourcis la partie formation.
A: Merci beaucoup, je corrige ça ce soir !""",
    """A: Bonjour {B}, je cherche un stage de fin d’études. Ton entreprise accueille-t-elle des stagiaires ?
B: Oui, on en prend deux ou trois par an. Envoie-moi ton CV et une lettre courte.
A: C’est envoyé. Merci !
B: Je transmets à la RH avec un mot. Tiens-moi au courant.""",
    """A: Merci encore pour ton aide pour l’entretien, j’ai été retenu !
B: Félicitations, je suis vraiment content pour toi 🎉
A: Tes conseils sur l’étude de cas ont fait la différence.
B: Tout le mérite te revient. Bon courage pour la prise de poste !""",
    """A: Bonjour {B}, je prépare un dossier de bourse pour un master. Est-ce que tu pourrais me faire une lettre de recommandation ?
B: Oui, avec plaisir. Envoie-moi le formulaire et la date limite.
A: Date limite le 15. Je t’envoie tout ce soir.
B: OK, tu l’auras d’ici la fin de semaine.""",
    """A: Salut {B}, tu as des nouvelles de l’afterwork ? Je n’ai pas vu passer la date.
B: Jeudi prochain à 19 h, je crois. Regarde dans la communauté de ta ville.
A: Merci, je regarde.""",
    """A: Bonjour {B}, on cherche un ingénieur avec ton profil. Est-ce que tu serais ouvert à une opportunité ?
B: Bonjour, merci de penser à moi. Je suis bien dans mon poste, mais je veux bien en savoir plus.
A: Je t’envoie la fiche de poste. On peut en parler cette semaine ?
B: Mercredi midi si ça te va.
A: Parfait.""",
    """A: {B}, merci pour la présentation hier devant les étudiants, ils ont adoré.
B: Merci à toi pour l’invitation ! J’ai reçu plusieurs messages d’étudiants depuis.
A: On recommence au prochain semestre ?
B: Avec plaisir.""",
    """A: Bonjour {B}, petite question technique si tu as un moment : tu as déjà dimensionné un poste de transformation pour un site industriel ?
B: Oui, plusieurs fois. Quelle puissance ?
A: Environ 1 600 kVA.
B: Je t’envoie la note de calcul type qu’on utilise, tu pourras l’adapter.
A: Super, merci beaucoup !""",
    """A: Bonsoir {B}, tu viens au mariage samedi ?
B: Oui bien sûr ! On part ensemble de Dakar ?
A: Avec plaisir, départ 10 h ?
B: Parfait, je passe te prendre.""",
    """A: Salut {B} ! Tu peux me rappeler le nom du logiciel de planification que tu utilisais sur ton chantier ?
B: Primavera P6. Mais pour un petit projet, MS Project suffit largement.
A: Merci !""",
    """A: Bonjour {B}, j’ai vu ton article sur le fil, très intéressant. Tu accepterais d’en parler à notre club étudiant ?
B: Avec plaisir. Quel format ?
A: 30 minutes de présentation et des questions, un mardi soir.
B: Le premier mardi du mois prochain ?
A: Noté, merci !""",
    """A: Coucou {B}, tu as reçu le document que je t’ai envoyé ?
B: Oui, merci ! Je le lis ce soir.
A: ~
A: Pardon, mauvais fichier. Voici le bon : la version finale est dans la communauté.
B: Pas de souci, je regarde.""",
]

# Conversations directes entre membres de démonstration : (qui écrit en premier, qui répond, fil)
DIRECTS = []
_alumni = alumni()
_etudiants = etudiants()
for i, etudiant in enumerate(_etudiants):
    meme_filiere = [a for a in _alumni if MEMBRES[a]["filiere"] == MEMBRES[etudiant]["filiere"]]
    DIRECTS.append((etudiant, random.choice(meme_filiere), random.choice([0, 3, 5, 12, 0, 3])))
    if i % 3 == 0:
        DIRECTS.append((etudiant, random.choice(_alumni), random.choice([2, 6, 4])))
for i in range(45):
    a, b = random.sample(_alumni, 2)
    DIRECTS.append((a, b, random.choice([1, 2, 6, 7, 8, 9, 10, 11, 13])))
for i in range(6):
    DIRECTS.append((random.choice(PERSONNEL[:4]), random.choice(_alumni), 8))

# Ce que vit le compte invité (compte_modele) : communautés, groupes, conversations
INVITE_COMMUNAUTES = ["ville-dakar", "secteur-numerique", "interet-data", "interet-entrepreneuriat", "interet-foot",
                      "interet-offres"]
INVITE_GROUPES = ["gala-ept", "startup-agritech"]
# Numéros de FILS_DIRECTS : 0 conseil d'étudiant, 1 retrouvailles, 3 demande de stage, 6 afterwork, 7 recrutement,
# 8 remerciement du personnel, 9 question technique, 13 document envoyé.
INVITE_DIRECTS = [("fatou.diagne", 7), ("astou.toure", 0), ("khady.sow", 6), ("babacar.niang", 1),
                  ("malick.tall", 3), ("seynabou.ndour", 9), ("fatou-binetou.ndiaye", 8), ("bamba.ndour", 13)]


# ---------------------------------------------------------------------------------------------------------------
# Construction : chaque fil devient une suite de messages datés (jours précédents, ou les dernières heures).
# ---------------------------------------------------------------------------------------------------------------

conversations, participants, messages = [], [], []


def instant_jour(jours, minutes):
    return f"date_trunc('day', now()) - interval '{jours} days' + interval '{minutes} minutes'"


def instant_recent(minutes):
    return f"now() - interval '{minutes} minutes'"


def jours_des_fils(nombre, recent):
    """Jours (décroissants) où se déroulent les fils ; le dernier aujourd'hui si la conversation est active."""
    jours = sorted(random.sample(range(1, 34), nombre), reverse=True)
    if recent:
        jours[-1] = 0
    return jours


def attribuer(lettres, membres, imposes=None):
    """Associe chaque lettre d'un fil à un membre distinct ; S préfère un étudiant, P un membre du personnel."""
    roles = dict(imposes or {})
    restants = [m for m in membres if m not in roles.values()]
    random.shuffle(restants)
    for lettre in lettres:
        if lettre in roles:
            continue
        if lettre == "S":
            choix = [m for m in restants if MEMBRES.get(m, {}).get("role") == "ETUDIANT"]
        elif lettre == "P":
            choix = [m for m in restants if MEMBRES.get(m, {}).get("role") == "PERSONNEL"]
        else:
            choix = [m for m in restants if MEMBRES.get(m, {}).get("role") != "PERSONNEL"] or restants
        choix = choix or restants
        if not choix:
            return None
        roles[lettre] = choix[0]
        restants.remove(choix[0])
    return roles


def lignes(fil):
    for ligne in fil.strip().splitlines():
        if ligne.startswith("+"):
            yield ligne[1:].strip(), None, True
        else:
            lettre, contenu = ligne.split(":", 1)
            yield lettre.strip(), contenu.strip(), False


def derouler(conversation, fils, membres, recent, imposes=None, contexte=None):
    """Ajoute les messages des fils ; renvoie les auteurs effectifs et l'instant SQL de chaque message."""
    instants = []
    jours = jours_des_fils(len(fils), recent)
    for numero, (fil, jour) in enumerate(zip(fils, jours)):
        contenu_fil = list(lignes(fil))
        roles = attribuer(sorted({l for l, _, _ in contenu_fil}), membres, imposes)
        if roles is None:
            continue
        valeurs = dict(contexte or {})
        for lettre, cle in roles.items():
            # Le prénom du compte invité n'est connu qu'en base : remplacé au chargement.
            valeurs[lettre] = "{invite}" if cle == "@invite" else prenom(cle)
            valeurs["ville" + lettre] = MEMBRES.get(cle, {}).get("ville", "Dakar")
        ecarts = [random.choice([1, 2, 3, 4, 6, 9, 14, 25, 40]) for _ in contenu_fil]
        if jour == 0:
            debut = sum(ecarts) + random.randint(8, 150)
        else:
            debut = random.randint(8 * 60, 20 * 60)
        position = 0
        for index, ((lettre, contenu, systeme), ecart) in enumerate(zip(contenu_fil, ecarts)):
            position += ecart if index else 0
            instant = instant_recent(debut - position) if jour == 0 else instant_jour(jour, debut + position)
            supprime = contenu == "~"
            if systeme:
                contenu = ARRIVEE
            elif not supprime:
                contenu = contenu.format(**valeurs)
            messages.append((ident(conversation, numero, index), conversation, roles[lettre], "" if supprime else contenu,
                             instant, systeme, supprime))
            instants.append(instant)
    return instants


def participant(conversation, cle, role, rejoint, lu):
    participants.append((ident(conversation, "participant", cle), conversation, cle, role, rejoint, lu))


DEBUT = instant_jour(45, 9 * 60)

# Communautés créées par des membres
for cle, nom, description, categorie, acces, membres, fils in COMMUNAUTES:
    # Comme dans l’application : une communauté ne réunit que des alumni et des étudiants.
    membres = list(dict.fromkeys(m for m in membres if MEMBRES.get(m, {}).get("role") in ("ALUMNI", "ETUDIANT")))
    identifiant = ident("communaute", cle)
    conversations.append((identifiant, nom, description, categorie, acces))
    createur = membres[0]
    arrivees = "\n".join(f"+{l}" for l in "BCD")
    fils = [f"+A\n{arrivees}\n" + fils[0]] + fils[1:] if len(membres) > 4 else fils
    instants = derouler(identifiant, fils, membres, recent=random.random() < 0.7)
    dernier = instants[-1] if instants else DEBUT
    for m in membres:
        participant(identifiant, m, "ADMINISTRATEUR" if m == createur else "MEMBRE", DEBUT, dernier)
    if cle in INVITE_COMMUNAUTES:
        lu = instants[max(0, len(instants) - 1 - random.choice([0, 2, 3, 5]))] if instants else DEBUT
        participant(identifiant, "@invite", "MEMBRE", DEBUT, lu)

# Communautés de promo (créées par l'application : on n'y ajoute que des membres de la promo)
for promo in (2010, 2013, 2014, 2017, 2018, 2019, 2020, 2022, 2023, 2024, 2027, 2028, 2029):
    membres = [m for m, d in MEMBRES.items() if d["promo"] == promo]
    if len(membres) < 3:
        continue
    cle_conversation = f"(select id from conversations where cle_communaute = 'PROMO:{promo}')"
    fils_possibles = FILS_PROMO_ETUDIANTS if promo >= 2027 else FILS_PROMO
    fils = random.sample(fils_possibles, min(len(fils_possibles), 3 + len(membres) // 4))
    instants = derouler(cle_conversation, fils, membres, recent=random.random() < 0.5,
                        contexte={"ans": 2026 - promo, "A2": prenom(random.choice(membres))})
    dernier = instants[-1] if instants else DEBUT
    for m in membres:
        participant(cle_conversation, m, "MEMBRE", DEBUT, dernier)

# Groupes privés
for cle, nom, description, membres, fils in GROUPES:
    membres = list(dict.fromkeys(m for m in membres if m in MEMBRES))
    identifiant = ident("groupe", cle)
    conversations.append((identifiant, nom, description, None, None))
    instants = derouler(identifiant, fils, membres, recent=random.random() < 0.6)
    dernier = instants[-1] if instants else DEBUT
    for m in membres:
        participant(identifiant, m, "ADMINISTRATEUR" if m == membres[0] else "MEMBRE", DEBUT, dernier)
    if cle in INVITE_GROUPES:
        participant(identifiant, "@invite", "MEMBRE", DEBUT, instants[max(0, len(instants) - 3)] if instants else DEBUT)

# Conversations directes
directes = []
vues = set()
for premier, second, numero_fil in DIRECTS + [(m, "@invite", f) for m, f in INVITE_DIRECTS]:
    paire = frozenset((premier, second))
    if premier == second or paire in vues:
        continue
    vues.add(paire)
    identifiant = ident("directe", *sorted(paire))
    directes.append((identifiant, premier, second))
    instants = derouler(identifiant, [FILS_DIRECTS[numero_fil]], [premier, second], recent=random.random() < 0.35,
                        imposes={"A": premier, "B": second})
    tout_lu = instants[-1]
    # Qui répond a tout lu ; sinon l'invité n'a pas encore lu le dernier message une fois sur deux.
    dernier_auteur = messages[-1][2]
    lu_invite = tout_lu if dernier_auteur == "@invite" or random.random() < 0.5 else instants[-2]
    for cle in (premier, second):
        participant(identifiant, cle, "MEMBRE", instants[0], lu_invite if cle == "@invite" else tout_lu)


# ---------------------------------------------------------------------------------------------------------------
# Écriture du SQL
# ---------------------------------------------------------------------------------------------------------------

def ecrire(sortie):
    out = [
        "-- Généré par generer-sql-messagerie.py : ne pas modifier à la main.",
        "-- Communautés, groupes et conversations de démonstration. Variable psql : compte_modele (peut être vide).",
        "begin;",
    ]
    out.append("insert into conversations (id, type, nom, description, categorie, acces, cree_le, dernier_message_le)"
               " values")
    out.append(",\n".join(
        f"('{i}', 'GROUPE', {texte(n)}, {texte(d)}, {texte(c)}, {texte(a)}, {DEBUT}, {DEBUT})"
        for i, n, d, c, a in conversations) + "\non conflict do nothing;")

    # Directes : la clé réunit les deux identifiants triés comme le fait l'application (ordre binaire).
    out.append("insert into conversations (id, type, cle_directe, cree_le, dernier_message_le)\n"
               "select v.id::uuid, 'DIRECTE', least(a.id::text collate \"C\", b.id::text collate \"C\") || ':' ||"
               f" greatest(a.id::text collate \"C\", b.id::text collate \"C\"), {DEBUT}, {DEBUT}\nfrom (values")
    out.append(",\n".join(f"('{i}', {email(p)}, {email(s)})" for i, p, s in directes))
    out.append(") as v(id, premier, second)\njoin utilisateur a on a.email = v.premier\n"
               "join utilisateur b on b.email = v.second\non conflict do nothing;")

    out.append("insert into participants_conversation (id, conversation_id, utilisateur_id, role, rejoint_le,"
               " dernier_lu_le)\nselect v.id::uuid, v.conversation, u.id, v.role, v.rejoint, v.lu\nfrom (values")
    out.append(",\n".join(
        f"('{i}', {c if c.startswith('(') else repr(c) + '::uuid'}, {email(m)}, '{r}', {rj}, {lu})"
        for i, c, m, r, rj, lu in participants))
    out.append(") as v(id, conversation, email, role, rejoint, lu)\njoin utilisateur u on u.email = v.email\n"
               "join conversations c on c.id = v.conversation\non conflict do nothing;")

    out.append("insert into messages (id, conversation_id, auteur_id, contenu, envoye_le, systeme, supprime_le)\n"
               "select v.id::uuid, v.conversation, u.id,"
               f" replace(v.contenu, '{{invite}}', coalesce((select prenom from utilisateur where email = {INVITE}), '')),"
               " v.envoye, v.systeme,"
               " case when v.supprime then v.envoye + interval '2 minutes' end\nfrom (values")
    out.append(",\n".join(
        f"('{i}', {c if c.startswith('(') else repr(c) + '::uuid'}, {email(a)}, {texte(t)}, {e}, {str(s).lower()},"
        f" {str(sp).lower()})"
        for i, c, a, t, e, s, sp in messages))
    out.append(") as v(id, conversation, email, contenu, envoye, systeme, supprime)\n"
               "join utilisateur u on u.email = v.email\njoin conversations c on c.id = v.conversation\n"
               "on conflict do nothing;")

    # Une conversation se trie sur son dernier message.
    out.append("update conversations c set dernier_message_le = m.dernier\n"
               "from (select conversation_id, max(envoye_le) as dernier from messages group by conversation_id) m\n"
               "where m.conversation_id = c.id and m.dernier > c.dernier_message_le;")
    out.append("commit;")
    with open(sortie, "w", encoding="utf-8", newline="\n") as fichier:
        fichier.write("\n".join(out).replace("'@invite'", INVITE) + "\n")
    print(f"{len(conversations)} communautés et groupes, {len(directes)} conversations directes, "
          f"{len(participants)} participations, {len(messages)} messages")


if __name__ == "__main__":
    ecrire(sys.argv[1] if len(sys.argv) > 1 else "donnees-demo-messagerie.sql")
