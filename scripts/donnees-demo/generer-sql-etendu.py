"""Génère donnees-demo-etendues.sql et la liste des visuels (portraits, logos, événements) à produire.

Complète donnees-demo.sql, chargé avant : environ 120 membres de plus avec de vrais parcours, une
quinzaine d'organismes, une trentaine d'événements, des offres et mentorats dans tous les états,
deux programmes. Identifiants stables, tirages reproductibles : le script peut être rejoué.
Usage : python generer-sql-etendu.py donnees-demo-etendues.sql visuels.json
"""
import json
import random
import sys
import unicodedata
import uuid

ESPACE = uuid.UUID('6f1c2a5e-9a3b-4e7d-8c11-0e9a7d3b2c40')
h = random.Random(2027)
MOT_DE_PASSE = "coalesce((select password from utilisateur where email = :'compte_modele'), '!')"
EPT = "(select id from organisme where etablissement_ept limit 1)"


def uid(*parties):
    return str(uuid.uuid5(ESPACE, '/'.join(map(str, parties))))


def q(texte):
    return 'null' if texte is None else "'" + str(texte).replace("'", "''") + "'"


def slug(texte):
    texte = unicodedata.normalize('NFKD', texte).encode('ascii', 'ignore').decode().lower()
    return ''.join(c if c.isalnum() else '-' for c in texte).strip('-').replace('--', '-')


FILIERES = ['Génie Informatique et Télécommunications', 'Génie Civil', 'Génie Électromécanique',
            'Génie Industriel', 'Génie Aéronautique et Aérospatial']
DOMAINES = {0: ['DEV_LOGICIEL', 'DATA_IA', 'CYBERSECURITE', 'RESEAUX_TELECOMS'], 1: ['GENIE_CIVIL', 'GESTION_PROJET'],
            2: ['ELECTROMECANIQUE', 'GESTION_PROJET'], 3: ['GESTION_PROJET', 'ENTREPRENEURIAT'],
            4: ['ELECTROMECANIQUE', 'CONCOURS_ETUDES']}
POSTES = {
    0: ['Ingénieur logiciel', 'Développeur full-stack', 'Data engineer', 'Architecte cloud', 'Ingénieur réseaux',
        'Responsable des systèmes d’information', 'Product manager', 'Ingénieur cybersécurité', 'Ingénieur télécoms', 'Data analyst'],
    1: ['Ingénieur structures', 'Conducteur de travaux', 'Ingénieur géotechnicien', 'Chef de projet infrastructures',
        'Ingénieur VRD', 'Ingénieur hydraulique', 'BIM manager', 'Ingénieur méthodes BTP'],
    2: ['Ingénieur maintenance', 'Ingénieur électricien', 'Ingénieur énergies renouvelables', 'Automaticien',
        'Ingénieur process', 'Responsable de production'],
    3: ['Ingénieur qualité', 'Responsable supply chain', 'Consultant lean', 'Ingénieur méthodes',
        'Chef de projet industriel', 'Contrôleur de gestion industriel'],
    4: ['Ingénieur navigabilité', 'Ingénieur maintenance aéronautique', 'Ingénieur structures aéronautiques',
        'Ingénieur systèmes embarqués', 'Ingénieur bureau d’études aéronautique'],
}
SENIORS = ['Directeur technique', 'Responsable d’équipe', 'Chef de service', 'Directeur de projets']
VILLES = ['Dakar'] * 6 + ['Thiès'] * 3 + ['Saint-Louis', 'Mbour', 'Ziguinchor', 'Kaolack', 'Touba', 'Paris', 'Lyon',
          'Toulouse', 'Montréal', 'Abidjan', 'Casablanca', 'Nouakchott', 'Bamako']

# cle, nom, type, secteur, adresse, pays, filières qui y travaillent
ORGANISMES = [
    ('teranga-telecom', 'Teranga Télécom', 'ENTREPRISE', 'Télécommunications', 'Dakar, Mermoz', 'Sénégal', [0]),
    ('dakar-cloud', 'Dakar Cloud Services', 'ENTREPRISE', 'Hébergement et services cloud', 'Dakar, Point E', 'Sénégal', [0]),
    ('jamm-pay', 'Jàmm Pay', 'ENTREPRISE', 'Paiement mobile', 'Dakar, Plateau', 'Sénégal', [0, 3]),
    ('cap-vert-construction', 'Cap-Vert Construction', 'ENTREPRISE', 'Bâtiment et travaux publics', 'Rufisque', 'Sénégal', [1]),
    ('ciments-petite-cote', 'Ciments de la Petite Côte', 'ENTREPRISE', 'Matériaux de construction', 'Bargny', 'Sénégal', [1, 2, 3]),
    ('sahel-energie', 'Sahel Énergie Distribution', 'ENTREPRISE', 'Distribution d’électricité', 'Dakar, Hann', 'Sénégal', [2]),
    ('mines-orientales', 'Mines du Sénégal oriental', 'ENTREPRISE', 'Industrie extractive', 'Kédougou', 'Sénégal', [2, 3]),
    ('atlantique-logistique', 'Atlantique Logistique Portuaire', 'ENTREPRISE', 'Logistique et transport', 'Dakar, Port autonome', 'Sénégal', [3]),
    ('agence-infra-thies', 'Agence des infrastructures de Thiès', 'INSTITUTION_PUBLIQUE', 'Infrastructures publiques', 'Thiès', 'Sénégal', [1, 2]),
    ('hydraulique-rurale', 'Direction régionale de l’hydraulique', 'INSTITUTION_PUBLIQUE', 'Eau et assainissement', 'Kaolack', 'Sénégal', [1]),
    ('eau-vive-sahel', 'Eau Vive Sahel', 'ONG', 'Accès à l’eau potable', 'Tambacounda', 'Sénégal', [1, 2]),
    ('aerotech-ingenierie', 'AéroTech Ingénierie', 'ENTREPRISE', 'Ingénierie aéronautique', 'Toulouse', 'France', [4]),
    ('lumen-conseil', 'Lumen Conseil', 'ENTREPRISE', 'Conseil en organisation', 'Paris', 'France', [0, 3]),
    ('genie-nord', 'Génie Nord Consultants', 'ENTREPRISE', 'Ingénierie et conseil', 'Montréal', 'Canada', [1, 2, 0]),
    ('institut-paris', 'Institut d’études supérieures de Paris', 'ETABLISSEMENT_ENSEIGNEMENT', 'Enseignement supérieur', 'Paris', 'France', []),
    ('universite-atlantique', 'Université du littoral Atlantique', 'ETABLISSEMENT_ENSEIGNEMENT', 'Enseignement supérieur', 'Saint-Louis', 'Sénégal', []),
]
EMPLOYEURS = {f: [o[0] for o in ORGANISMES if f in o[6]] for f in range(5)}
ECOLES = ['institut-paris', 'universite-atlantique']
MASTERS = {0: 'Master en science des données', 1: 'Master en génie urbain', 2: 'Master en énergies renouvelables',
           3: 'Master en management de la chaîne logistique', 4: 'Master en systèmes aéronautiques'}
CERTIFICATIONS = {0: ['Certification AWS Solutions Architect', 'Certification CISSP'], 1: ['Certification PMP', 'Formation BIM avancée'],
                  2: ['Habilitation électrique haute tension', 'Certification PMP'], 3: ['Lean Six Sigma Green Belt', 'Certification APICS CSCP'],
                  4: ['Formation réglementation Part-145', 'Certification PMP']}

PRENOMS_H = ['Mamadou', 'Abdou', 'Ousseynou', 'Cheikh', 'Ibrahima', 'Malick', 'Thierno', 'Alassane', 'Elhadji',
             'Souleymane', 'Djibril', 'Assane', 'Mor', 'Ismaïla', 'Moustapha', 'Omar', 'Boubacar', 'Idrissa', 'Aliou',
             'Demba', 'Samba', 'Massamba', 'Mbaye', 'Khadim', 'Youssou', 'Fallou', 'Matar', 'Bamba', 'Ndiaga', 'Seydou']
PRENOMS_F = ['Aminata', 'Fatoumata', 'Mariama', 'Khadidiatou', 'Aïssatou', 'Sokhna', 'Adama', 'Dieynaba', 'Astou',
             'Coumba', 'Rama', 'Binta', 'Fatou', 'Nafissatou', 'Mame Diarra', 'Maïmouna', 'Oumou', 'Yacine', 'Penda',
             'Ramatoulaye', 'Absa', 'Codou', 'Néné', 'Marième', 'Kiné', 'Arame', 'Ndèye Fatou', 'Khoudia']
NOMS = ['Diop', 'Ndiaye', 'Fall', 'Sow', 'Ba', 'Diallo', 'Sarr', 'Gueye', 'Faye', 'Mbaye', 'Ndour', 'Thiam', 'Cissé',
        'Kane', 'Sy', 'Seck', 'Niang', 'Diouf', 'Camara', 'Touré', 'Sène', 'Wade', 'Lo', 'Sall', 'Badji', 'Dieng',
        'Mendy', 'Diatta', 'Sagna', 'Ka', 'Sylla', 'Ndao', 'Tall', 'Kébé', 'Dramé', 'Coly', 'Dia', 'Gaye', 'Samb',
        'Ly', 'Barry', 'Bodian', 'Mbengue', 'Diagne', 'Ndoye']
VISITEURS = [('Julien', 'Moreau', 'Toulouse', 'Responsable recrutement en ingénierie', False),
             ('Sophie', 'Lambert', 'Paris', 'Chargée des relations écoles', True),
             ('Kwame', 'Mensah', 'Accra', 'Directeur d’un incubateur technologique', False),
             ('Aya', 'Kouassi', 'Abidjan', 'Consultante en transformation numérique', True),
             ('Moussa', 'Traoré', 'Bamako', 'Ingénieur conseil indépendant', False),
             ('Léa', 'Fontaine', 'Lyon', 'Journaliste scientifique', True),
             ('Hamidou', 'Sangaré', 'Nouakchott', 'Chef de projet énergie', False),
             ('Inès', 'Benali', 'Casablanca', 'Responsable partenariats universitaires', True),
             ('Daniel', 'Gomis', 'Ziguinchor', 'Professeur de mathématiques au lycée', False),
             ('Awa', 'Coulibaly', 'Montréal', 'Conseillère en immigration professionnelle', True)]
PERSONNEL = [('Ousmane', 'Badji', 'Chef du service de la scolarité', False),
             ('Aïssatou', 'Dieng', 'Responsable des relations internationales', True),
             ('Pierre', 'Mendy', 'Enseignant-chercheur en génie civil', False),
             ('Fatou Binetou', 'Ndiaye', 'Chargée de l’insertion professionnelle', True),
             ('Abdoulaye', 'Sow', 'Enseignant-chercheur en informatique', False),
             ('Rokhaya', 'Gaye', 'Bibliothécaire de l’école', True)]

BIOS_ALUMNI = [
    'Diplômé{e} de l’EPT en {filiere}, je suis aujourd’hui {poste_min} chez {employeur}. J’aime partager mon expérience avec les étudiants.',
    'Après mon cycle d’ingénieur à Thiès, j’ai rejoint {employeur} où j’occupe le poste de {poste_min}. Ouvert{e} aux échanges sur les métiers de la {filiere_min}.',
    '{poste} chez {employeur}, basé{e} à {ville}. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.',
    'Ingénieur{e} {filiere_min} (promo {promo}). Mon parcours m’a mené{e} de stages en entreprise à mon poste actuel de {poste_min} à {ville}.',
]
BIOS_ETUDIANT = [
    'Élève ingénieur{e} en {filiere}, promotion {promo}. Je cherche un stage pour l’été et des conseils sur les métiers de la filière.',
    'Étudiant{e} à l’EPT en {filiere}. Passionné{e} par les projets concrets, je prépare mon projet de fin d’études.',
    'En {annee}e année de {filiere_min} à l’EPT, je m’intéresse particulièrement à {interet}.',
]
INTERETS = {0: 'l’intelligence artificielle et le développement web', 1: 'la construction durable', 2: 'les énergies renouvelables',
            3: 'l’amélioration continue et la logistique', 4: 'la maintenance aéronautique'}

lignes = ["""-- Données de démonstration étendues EPT Alumni (base de développement uniquement).
-- Généré par scripts/donnees-demo/generer-sql-etendu.py ; à charger APRÈS donnees-demo.sql.
-- Variable psql attendue : compte_modele (voir donnees-demo.sql).
\\set ON_ERROR_STOP on
begin;
"""]
visuels = {'portraits': [], 'logos': [], 'evenements': []}
emails = set()


NOMS_BASE = {'Aminata Sarr', 'Ousmane Ndiaye', 'Fatou Diagne', 'Mamadou Faye', 'Khady Sow', 'Ibrahima Gueye', 'Mariama Ba',
             'Cheikh Mbaye', 'Awa Thiam', 'Moussa Diop', 'Seynabou Ndour', 'Abdoulaye Cissé', 'Rokhaya Kane', 'Pape Sy',
             'Ndeye Fall', 'Alioune Diallo', 'Coumba Seck', 'Babacar Niang', 'Astou Mbengue', 'Lamine Touré', 'Yacine Diouf',
             'Bineta Camara', 'Serigne Lo', 'Aïda Sène', 'Modou Wade', 'Penda Sall', 'Omar Badji', 'Marème Dieng',
             'Saliou Ka', 'Ndèye Astou Faye', 'Jean-Marc Mendy', 'Claire Dubois', 'Mame Diarra Ndour'}
noms_pris = set(NOMS_BASE) | {f'{p} {n}' for p, n, *_ in PERSONNEL + VISITEURS}


def nom_unique(feminin):
    """Prénom et nom tirés au hasard, jamais déjà portés dans l'annuaire de démonstration."""
    while True:
        prenom, nom = h.choice(PRENOMS_F if feminin else PRENOMS_H), h.choice(NOMS)
        if f'{prenom} {nom}' not in noms_pris:
            noms_pris.add(f'{prenom} {nom}')
            return prenom, nom


def email_unique(prenom, nom):
    base = f'{slug(prenom)}.{slug(nom)}'
    candidat, n = base, 2
    while candidat in emails:
        candidat, n = f'{base}{n}', n + 1
    emails.add(candidat)
    return f'{candidat}@demo.ept-alumni.invalid'


def photo(utilisateur_id, feminin, proportion=0.78):
    if h.random() > proportion:
        return None
    fichier = f"{uid('photo', utilisateur_id)}.jpg"
    visuels['portraits'].append({'id': utilisateur_id, 'feminin': feminin, 'fichier': fichier})
    return f'/api/photos/{fichier}'


def accorde(texte, feminin):
    return texte.format(e='e' if feminin else '')


# ---------------- Organismes, avec logo ----------------
for cle, nom, type_org, secteur, adresse, pays, _ in ORGANISMES:
    o = uid('org', cle)
    fichier = f"{uid('logo', cle)}.jpg"
    visuels['logos'].append({'id': cle, 'nom': nom, 'fichier': fichier})
    lignes.append(
        f"insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)\n"
        f"values ({q(o)}, {q(nom)}, {q(type_org)}, {q(secteur)}, {q(adresse)}, {q(pays)}, 'ACTIF', false,\n"
        f"  {q(nom + ' — ' + secteur.lower() + '. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.')},\n"
        f"  '/api/photos/{fichier}', {q('https://' + slug(nom) + '.example.org')}, date '2012-01-01' + ({h.randint(0, 4000)} * interval '1 day'))\n"
        f"on conflict (id) do nothing;")
    lignes.append(
        f"insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)\n"
        f"select {q(uid('compte-org', cle))}, {q(cle + '@demo.ept-alumni.invalid')}, true, {MOT_DE_PASSE}, false,\n"
        f"  {q(nom)}, 'ORGANISME', 'ACTIF', {q(o)}, '/api/photos/{fichier}', now() - interval '{h.randint(30, 600)} days'\n"
        f"on conflict do nothing;")
# Logos des organismes de la démo de base.
for cle, nom in [('kerdata', 'Kër Data'), ('baobab-energie', 'Baobab Énergie'), ('tic-conseil', 'Thiès Ingénierie Conseil'),
                 ('sahel-agritech', 'Sahel AgriTech'), ('aero-atlantique', 'Atlantique Aéro Maintenance'),
                 ('ingenieurs-solidaires', 'Ingénieurs Solidaires du Sahel')]:
    fichier = f"{uid('logo', cle)}.jpg"
    visuels['logos'].append({'id': cle, 'nom': nom, 'fichier': fichier})
    lignes.append(f"update organisme set logo_url = '/api/photos/{fichier}' where id = {q(uid('org', cle))} and logo_url is null;")
    lignes.append(f"update utilisateur set url_photo = '/api/photos/{fichier}' where id = {q(uid('compte-org', cle))} and url_photo is null;")


def inserer_membre(m, prenom, nom, role, feminin, filiere, entree, sortie, ville, poste, bio, url_photo, jours, portfolio=None):
    diplome = "'INGENIEUR'" if role == 'ALUMNI' else 'null'
    lignes.append(
        f"insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)\n"
        f"select {q(m)}, {q(email_unique(prenom, nom))}, true, {MOT_DE_PASSE}, false,\n"
        f"  {q(prenom)}, {q(nom)}, '{role}', 'ACTIF', {q(filiere)}, {entree or 'null'}, {sortie or 'null'}, {diplome}, {q(ville)}, {q(poste)}, {q(bio)}, '+221 77 000 00 00', {q(url_photo)}, {q(portfolio)}, now() - interval '{jours} days'\n"
        f"on conflict do nothing;")


def experience(cle, m, org, poste, contrat, debut, fin, stage, description):
    lignes.append(
        f"insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)\n"
        f"values ({q(uid(cle, m))}, {q(m)}, {q(uid('org', org))}, {q(poste)}, '{contrat}', date '{debut}', {('date ' + q(fin)) if fin else 'null'}, {str(stage).lower()}, true,\n"
        f"  {q(description)}) on conflict (id) do nothing;")


def formation(cle, m, organisme_sql, libelle, type_f, debut, fin, description):
    lignes.append(
        f"insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)\n"
        f"values ({q(uid(cle, m))}, {q(m)}, {organisme_sql}, {q(libelle)}, '{type_f}', date '{debut}', {('date ' + q(fin)) if fin else 'null'}, false, true,\n"
        f"  {q(description)}) on conflict (id) do nothing;")


# ---------------- Alumni ----------------
ANNEE = 2026
membres = {}  # id -> dict
for n in range(78):
    feminin = h.random() < 0.42
    prenom, nom = nom_unique(feminin)
    fil = h.choices(range(5), weights=[34, 24, 18, 14, 10])[0]
    promo = h.randint(2002, 2025)
    entree = promo - 3
    anciennete = ANNEE - promo
    m = uid('membre-etendu', 'alumni', n)
    employeurs = h.sample(EMPLOYEURS[fil], k=min(len(EMPLOYEURS[fil]), 2))
    actuel = employeurs[0]
    poste = h.choice(POSTES[fil]) if anciennete < 8 or h.random() < 0.5 else h.choice(SENIORS)
    ville = h.choice(VILLES)
    nom_employeur = next(o[1] for o in ORGANISMES if o[0] == actuel)
    bio = h.choice(BIOS_ALUMNI).format(e='e' if feminin else '', filiere=FILIERES[fil], filiere_min=FILIERES[fil].lower().replace('génie ', ''),
                                      poste=poste, poste_min=poste[0].lower() + poste[1:], employeur=nom_employeur, ville=ville, promo=promo)
    portfolio = f'https://portfolio.example.org/{slug(prenom)}-{slug(nom)}' if fil == 0 and h.random() < 0.3 else None
    inserer_membre(m, prenom, nom, 'ALUMNI', feminin, FILIERES[fil], entree, promo, ville, poste, bio, photo(m, feminin),
                   h.randint(20, 900), portfolio)
    membres[m] = {'nom': f'{prenom} {nom}', 'role': 'ALUMNI', 'fil': fil, 'promo': promo, 'feminin': feminin}

    formation('formation-ept', m, EPT, f'Diplôme d’ingénieur de conception — {FILIERES[fil]}', 'DIPLOMANTE',
              f'{entree}-10-01', f'{promo}-07-31', 'Cycle ingénieur à l’École Polytechnique de Thiès.')
    stage_org = employeurs[-1]
    experience('stage-pfe', m, stage_org, 'Stage de fin d’études', 'STAGE', f'{promo}-02-01', f'{promo}-07-15', True,
               h.choice(['Projet de fin d’études encadré en entreprise.', 'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.',
                         'Stage de six mois au sein de l’équipe technique.']))
    debut_poste = promo
    if h.random() < 0.28 and anciennete >= 3:
        formation('master', m, f"{q(uid('org', h.choice(ECOLES)))}", MASTERS[fil], 'DIPLOMANTE',
                  f'{promo}-09-15', f'{promo + 1}-09-30', 'Spécialisation suivie après le diplôme d’ingénieur.')
        debut_poste = promo + 1
    if anciennete >= 5 and len(employeurs) > 1:
        fin_premier = min(ANNEE - 1, debut_poste + h.randint(2, 5))
        experience('premier-poste', m, employeurs[1], h.choice(POSTES[fil]), h.choice(['CDI', 'CDD']),
                   f'{debut_poste}-10-01', f'{fin_premier}-06-30', False,
                   'Premier poste après l’école : montée en compétences sur les projets de l’équipe.')
        debut_poste = fin_premier
    experience('poste-actuel', m, actuel, poste, h.choice(['CDI'] * 5 + ['FONCTION_PUBLIQUE', 'FREELANCE']),
               f'{debut_poste}-09-01', None, False, f'Poste actuel : {poste[0].lower() + poste[1:]}.')
    if h.random() < 0.3:
        annee_cert = h.randint(promo + 1, ANNEE)
        formation('certification', m, f"{q(uid('org', h.choice(ECOLES)))}", h.choice(CERTIFICATIONS[fil]), 'CERTIFICATION',
                  f'{annee_cert}-03-01', f'{annee_cert}-05-31', 'Certification professionnelle obtenue en cours de carrière.')

# ---------------- Étudiants ----------------
for n in range(34):
    feminin = h.random() < 0.45
    prenom, nom = nom_unique(feminin)
    fil = h.choices(range(5), weights=[34, 24, 18, 14, 10])[0]
    promo = h.randint(2027, 2029)
    entree = promo - 3
    annee = ANNEE - entree + 1
    m = uid('membre-etendu', 'etudiant', n)
    bio = h.choice(BIOS_ETUDIANT).format(e='e' if feminin else '', filiere=FILIERES[fil], filiere_min=FILIERES[fil].lower(),
                                        promo=promo, annee=annee, interet=INTERETS[fil])
    inserer_membre(m, prenom, nom, 'ETUDIANT', feminin, FILIERES[fil], entree, promo, 'Thiès',
                   f'Élève ingénieur{"e" if feminin else ""}', bio, photo(m, feminin, 0.7), h.randint(20, 500))
    membres[m] = {'nom': f'{prenom} {nom}', 'role': 'ETUDIANT', 'fil': fil, 'promo': promo, 'feminin': feminin}
    formation('formation-ept', m, EPT, f'Cycle ingénieur — {FILIERES[fil]}', 'DIPLOMANTE', f'{entree}-10-01', None,
              'Formation en cours à l’École Polytechnique de Thiès.')
    if annee >= 2 and h.random() < 0.6:
        org = h.choice(EMPLOYEURS[fil])
        experience('stage-ete', m, org, 'Stage ouvrier' if annee == 2 else 'Stage technicien', 'STAGE',
                   f'{ANNEE - 1}-07-01', f'{ANNEE - 1}-08-31', True, 'Stage d’été de deux mois.')

# ---------------- Personnel et visiteurs ----------------
for n, (prenom, nom, poste, feminin) in enumerate(PERSONNEL):
    m = uid('membre-etendu', 'personnel', n)
    inserer_membre(m, prenom, nom, 'PERSONNEL', feminin, None, None, None, 'Thiès', poste,
                   f'Membre du personnel de l’École Polytechnique de Thiès, {poste[0].lower() + poste[1:]}.', photo(m, feminin, 0.9), h.randint(100, 900))
    membres[m] = {'nom': f'{prenom} {nom}', 'role': 'PERSONNEL', 'fil': h.randint(0, 4), 'promo': None, 'feminin': feminin}
for n, (prenom, nom, ville, poste, feminin) in enumerate(VISITEURS):
    m = uid('membre-etendu', 'visiteur', n)
    inserer_membre(m, prenom, nom, 'VISITEUR', feminin, None, None, None, ville, poste,
                   f'{poste}, en lien avec le réseau des ingénieurs de l’EPT.', photo(m, feminin, 0.6), h.randint(10, 300))
    membres[m] = {'nom': f'{prenom} {nom}', 'role': 'VISITEUR', 'fil': None, 'promo': None, 'feminin': feminin}

# Portraits pour une partie des membres de la démo de base (identifiants de generer-sql.py).
BASE = [('Aminata', 'Sarr', True), ('Ousmane', 'Ndiaye', False), ('Fatou', 'Diagne', True), ('Mamadou', 'Faye', False),
        ('Khady', 'Sow', True), ('Ibrahima', 'Gueye', False), ('Mariama', 'Ba', True), ('Cheikh', 'Mbaye', False),
        ('Awa', 'Thiam', True), ('Moussa', 'Diop', False), ('Seynabou', 'Ndour', True), ('Abdoulaye', 'Cissé', False),
        ('Rokhaya', 'Kane', True), ('Pape', 'Sy', False), ('Ndeye', 'Fall', True), ('Alioune', 'Diallo', False),
        ('Coumba', 'Seck', True), ('Babacar', 'Niang', False), ('Astou', 'Mbengue', True), ('Lamine', 'Touré', False),
        ('Yacine', 'Diouf', False), ('Bineta', 'Camara', True), ('Serigne', 'Lo', False), ('Aïda', 'Sène', True),
        ('Modou', 'Wade', False), ('Penda', 'Sall', True), ('Omar', 'Badji', False), ('Marème', 'Dieng', True),
        ('Saliou', 'Ka', False), ('Ndèye Astou', 'Faye', True), ('Jean-Marc', 'Mendy', False), ('Claire', 'Dubois', True),
        ('Mame Diarra', 'Ndour', True)]
for prenom, nom, feminin in BASE:
    m = uid('membre', prenom, nom)
    url = photo(m, feminin, 0.85)
    if url:
        lignes.append(f"update utilisateur set url_photo = {q(url)} where id = {q(m)} and url_photo is null;")

# ---------------- Événements ----------------
alumni = [m for m, v in membres.items() if v['role'] == 'ALUMNI']
etudiants = [m for m, v in membres.items() if v['role'] == 'ETUDIANT']
personnel = [m for m, v in membres.items() if v['role'] == 'PERSONNEL']
tous = list(membres)
MOTIFS = {'conference': ((1, 67, 101), (115, 219, 242)), 'reseau': ((18, 22, 38), (169, 120, 47)),
          'atelier': ((10, 25, 35), (60, 220, 160)), 'visite': ((90, 98, 110), (245, 180, 60)),
          'sport': ((13, 80, 60), (190, 240, 160)), 'gala': ((40, 20, 60), (240, 200, 120))}
MOTIF_DESSIN = {'conference': 'forum-2026', 'reseau': 'gala-promo', 'atelier': 'hackathon-ia', 'visite': 'conf-btp',
                'sport': 'autre', 'gala': 'gala-promo'}
EVENEMENTS = [
    ('Conférence : l’intelligence artificielle dans l’industrie sénégalaise', 'conference', 'Amphithéâtre A, EPT', 'TOUS', 200, True),
    ('Rencontre alumni de Paris', 'reseau', 'La Défense, Paris', 'ALUMNI', 50, False),
    ('Atelier : préparer un entretien technique', 'atelier', 'Salle 12, EPT', 'ETUDIANTS', 40, True),
    ('Visite du chantier du pont de Rufisque', 'visite', 'Rufisque', 'ETUDIANTS', 30, False),
    ('Tournoi de basket des promotions', 'sport', 'Gymnase de l’EPT', 'TOUS', None, False),
    ('Soirée des 30 ans de l’association des diplômés', 'gala', 'Hôtel Radisson, Dakar', 'ALUMNI', 180, True),
    ('Webinaire : faire carrière dans les télécoms', 'conference', 'En ligne', 'TOUS', None, False),
    ('Hackathon énergie et climat', 'atelier', 'Dakar Cloud Services, Point E', 'TOUS', 60, False),
    ('Afterwork des ingénieurs de Thiès', 'reseau', 'Thiès, Escale', 'ALUMNI', 40, False),
    ('Journée portes ouvertes de l’EPT', 'conference', 'Campus de l’EPT', 'TOUS', 500, True),
    ('Visite de la cimenterie de Bargny', 'visite', 'Bargny', 'ETUDIANTS', 25, False),
    ('Atelier LinkedIn et marque professionnelle', 'atelier', 'En ligne', 'TOUS', 100, False),
    ('Conférence : la mobilité électrique en Afrique de l’Ouest', 'conference', 'Auditorium, Sahel Énergie Distribution', 'TOUS', 120, False),
    ('Marathon solidaire Thiès-Pout', 'sport', 'Départ : place de France, Thiès', 'TOUS', None, False),
    ('Petit-déjeuner des femmes ingénieures', 'reseau', 'Dakar, Almadies', 'TOUS', 45, False),
    ('Atelier : initiation au BIM', 'atelier', 'Laboratoire de génie civil, EPT', 'ETUDIANTS', 24, True),
    ('Visite du port autonome et de ses terminaux', 'visite', 'Port autonome de Dakar', 'ETUDIANTS', 30, False),
    ('Forum de l’entrepreneuriat technologique', 'conference', 'Jàmm Pay, Plateau', 'TOUS', 150, False),
    ('Dîner de la promotion 2006', 'gala', 'Saly Portudal', 'ALUMNI', 70, False),
    ('Atelier cybersécurité : capture du drapeau', 'atelier', 'Salle informatique, EPT', 'ETUDIANTS', 32, False),
    ('Conférence : l’hydrogène vert, une opportunité ?', 'conference', 'Amphithéâtre B, EPT', 'TOUS', 150, True),
    ('Rencontre alumni de Montréal', 'reseau', 'Montréal, Vieux-Port', 'ALUMNI', 35, False),
    ('Visite d’une ferme solaire à Diass', 'visite', 'Diass', 'ETUDIANTS', 30, False),
    ('Coupe de football des filières', 'sport', 'Stade Lat Dior, Thiès', 'TOUS', None, False),
    ('Atelier : rédiger son mémoire de fin d’études', 'atelier', 'Bibliothèque de l’EPT', 'ETUDIANTS', 40, True),
    ('Table ronde : ingénieures et leadership', 'conference', 'En ligne', 'TOUS', None, False),
    ('Retrouvailles de la promotion 2011', 'gala', 'Thiès', 'ALUMNI', 80, False),
    ('Journée découverte de la maintenance aéronautique', 'visite', 'AIBD, Diass', 'ETUDIANTS', 30, False),
    ('Conférence : villes durables et urbanisme', 'conference', 'Agence des infrastructures de Thiès', 'TOUS', 90, False),
    ('Atelier : créer son premier tableau de bord de données', 'atelier', 'En ligne', 'TOUS', 80, False),
]
for n, (titre, categorie, lieu, audience, places, officiel) in enumerate(EVENEMENTS):
    e = uid('evenement-etendu', n)
    jours = h.choice([h.randint(-150, -3), h.randint(2, 160), h.randint(2, 60)])
    avec_image = h.random() < 0.6
    if avec_image:
        fichier = f'{e}.jpg'
        debut, accent = MOTIFS[categorie]
        visuels['evenements'].append({'fichier': fichier, 'motif': MOTIF_DESSIN[categorie], 'couleurs': [debut, accent]})
    url = f"'/api/evenement-images/{e}.jpg'" if avec_image else 'null'
    organisateur = h.choice(personnel) if officiel else h.choice(alumni)
    heure, duree = h.choice([9, 10, 14, 15, 18]), h.choice([2, 3, 4, 6])
    description = (f'{titre}. {h.choice(["Un rendez-vous ouvert à toute la communauté EPT.", "Inscrivez-vous rapidement, les places sont limitées.", "Un moment d’échange entre diplômés, étudiants et partenaires."])} '
                   f'{h.choice(["Le programme détaillé sera envoyé aux inscrits.", "Une collation sera offerte à l’issue de la rencontre.", "Apportez vos questions : un temps d’échange est prévu."])}')
    lignes.append(
        f"insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)\n"
        f"values ({q(e)}, {q(titre)}, {q(description)}, {q(lieu)},\n"
        f"  date_trunc('day', now()) + interval '{jours} days' + interval '{heure} hours',\n"
        f"  date_trunc('day', now()) + interval '{jours} days' + interval '{heure + duree} hours',\n"
        f"  '{audience}', {places if places else 'null'}, {str(officiel).lower()}, 'PUBLIE', {q(organisateur)}, {url}, now() - interval '{abs(jours) + 10} days', now())\n"
        f"on conflict (id) do nothing;")
    candidats = [m for m in tous if not (audience == 'ETUDIANTS' and membres[m]['role'] == 'ALUMNI')
                 and not (audience == 'ALUMNI' and membres[m]['role'] == 'ETUDIANT')]
    for m in h.sample(candidats, min(len(candidats), h.randint(8, min(40, places or 40)))):
        reponse = 'PARTICIPERA' if h.random() < 0.82 else 'NE_PARTICIPERA_PAS'
        lignes.append(f"insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) "
                      f"values ({q(uid('participation', e, m))}, {q(e)}, {q(m)}, '{reponse}', now() - interval '{h.randint(1, 20)} days') on conflict do nothing;")

# ---------------- Mentorat : offres ----------------
PRESENTATIONS = [
    'J’accompagne les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.',
    'Je partage volontiers mon expérience de terrain : organisation du travail, montée en compétences, évolution de carrière.',
    'Disponible pour relire CV et lettres, simuler des entretiens et parler des métiers de ma filière.',
    'Ancien{ne} de l’EPT, j’aide à construire un projet professionnel réaliste et à préparer la mobilité à l’international.',
]
mentors = h.sample([m for m in alumni if membres[m]['promo'] <= 2022], 30) + h.sample(
    [m for m in etudiants if membres[m]['promo'] == 2027], 4) + personnel[:2]
capacites = {}
for index, m in enumerate(mentors):
    v = membres[m]
    p = uid('profil-mentor', m)
    capacite = h.choice([1, 2, 2, 3, 3, 4])
    capacites[m] = capacite
    disponible = h.random() < 0.88
    # « Ancien de l’EPT » ne convient qu’aux alumni.
    modeles = PRESENTATIONS if v['role'] == 'ALUMNI' else PRESENTATIONS[:3]
    presentation = h.choice(modeles).format(ne='ne' if v['feminin'] else '')
    if v['role'] == 'ALUMNI':
        presentation = f'Ingénieur{"e" if v["feminin"] else ""} {FILIERES[v["fil"]].lower()} (promo {v["promo"]}). ' + presentation
    lignes.append(f"insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)\n"
                  f"values ({q(p)}, {q(m)}, {q(presentation)}, {str(disponible).lower()}, {capacite}, now() - interval '{h.randint(5, 200)} days', now()) on conflict do nothing;")
    codes = list(DOMAINES[v['fil']][:2]) + (['CARRIERE_INSERTION'] if h.random() < 0.5 else []) + (['CONCOURS_ETUDES'] if v['role'] == 'ETUDIANT' else [])
    for code in dict.fromkeys(codes):
        lignes.append(f"insert into profil_mentor_domaines (profil_mentor_id, domaine_id)\n"
                      f"select {q(p)}, d.id from domaines_mentorat d where d.code = '{code}'\n"
                      f"  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = {q(p)} and x.domaine_id = d.id);")

# Un événement officiel de l'EPT est publié par l'administration (mise à jour pour garder les mêmes tirages).
lignes.append("update evenements set organisateur_id = " + q(uid('membre', 'Mame Diarra', 'Ndour'))
              + " where officiel_ept and id in (" + ", ".join(q(uid('evenement-etendu', n)) for n in range(len(EVENEMENTS))) + ");")

# ---------------- Programmes ----------------
admin = uid('membre', 'Mame Diarra', 'Ndour')
PROGRAMMES = [
    ('insertion', 'Insertion professionnelle des jeunes diplômés',
     'Des alumni confirmés accompagnent les diplômés de l’année dans leur recherche du premier emploi.',
     'current_date - 45', "current_date + interval '5 months'",
     [('Bilan du projet professionnel', 'Faire le point sur les envies, les compétences et les cibles.'), ('CV et profil en ligne', None),
      ('Simulation d’entretien', None), ('Premières candidatures', 'Au moins cinq candidatures ciblées envoyées.')]),
    ('femmes-ingenieures', 'Femmes ingénieures : leadership et carrière',
     'Un accompagnement entre ingénieures pour oser les postes à responsabilité et construire son réseau.',
     'current_date - 20', "current_date + interval '8 months'",
     [('Premier échange', None), ('Plan de développement personnel', None), ('Prise de parole en public', None)]),
]
programmes = {}
for cle, titre, description, debut, fin, etapes in PROGRAMMES:
    pg = uid('programme', cle)
    programmes[cle] = (pg, len(etapes))
    lignes.append(f"insert into programmes_mentorat (id, titre, description, date_debut, date_fin, statut, responsable_id, cree_le)\n"
                  f"values ({q(pg)}, {q(titre)}, {q(description)}, {debut}, {fin}, 'OUVERT', {q(admin)}, now() - interval '50 days') on conflict (id) do nothing;")
    for ordre, (t, dsc) in enumerate(etapes, start=1):
        lignes.append(f"insert into jalons_programme (id, programme_id, titre, description, ordre)\n"
                      f"values ({q(uid('jalon', cle, ordre))}, {q(pg)}, {q(t)}, {q(dsc)}, {ordre}) on conflict (id) do nothing;")
volontaires = {
    'insertion': [m for m in mentors if membres[m]['role'] == 'ALUMNI'][:9],
    'femmes-ingenieures': [m for m in mentors if membres[m]['role'] == 'ALUMNI' and membres[m]['feminin']][:6],
}
for cle, liste in volontaires.items():
    for m in liste:
        lignes.append(f"insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)\n"
                      f"values ({q(uid('participation', cle, m))}, {q(programmes[cle][0])}, {q(uid('profil-mentor', m))}, now() - interval '{h.randint(5, 40)} days') on conflict do nothing;")

# ---------------- Mentorats ----------------
OBJECTIFS = ['Préparer mon stage de fin d’études et mes entretiens.', 'Choisir une spécialisation et construire mon projet professionnel.',
             'Comprendre le métier au quotidien et préparer ma première candidature.', 'Monter un projet entrepreneurial avec des camarades.',
             'Préparer une candidature à un master à l’étranger.', 'Trouver mon premier emploi après le diplôme.',
             'Améliorer mon CV et mon profil professionnel.', 'Me réorienter vers la data après quelques années en industrie.']
COMPTES_RENDUS = ['Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.',
                  'Relecture du CV et de la lettre de motivation ; simulation d’entretien.',
                  'Point sur les offres repérées ; échange sur les attentes des recruteurs.',
                  'Présentation du métier au quotidien et des compétences recherchées.']
EVALUATIONS = [(5, 'Des conseils concrets et une vraie disponibilité. Merci !'), (5, 'Un accompagnement précieux, je recommande.'),
               (4, 'Très utile pour préparer mes entretiens.'), (4, 'Échanges riches, un peu espacés dans le temps.'),
               (3, 'Bons conseils, mais difficile de caler des créneaux.'), (5, 'Mentorat bienveillant et exigeant à la fois.')]
mentores = etudiants + [m for m in alumni if membres[m]['promo'] >= 2024] + [m for m in membres if membres[m]['role'] == 'VISITEUR'][:4]
acceptes = {m: 0 for m in mentors}
en_attente = {m: 0 for m in mentores}
ouverts = set()
STATUTS = ['ACCEPTEE'] * 20 + ['TERMINEE'] * 16 + ['EN_ATTENTE'] * 12 + ['REFUSEE'] * 6 + ['ANNULEE'] * 6
for n, statut in enumerate(STATUTS):
    for _ in range(40):
        mentor, mentore = h.choice(mentors), h.choice(mentores)
        if mentor == mentore or (mentor, mentore) in ouverts:
            continue
        if statut == 'ACCEPTEE' and acceptes[mentor] >= capacites[mentor]:
            continue
        if statut == 'EN_ATTENTE' and en_attente[mentore] >= 3:
            continue
        break
    else:
        continue
    if statut in ('ACCEPTEE', 'EN_ATTENTE'):
        ouverts.add((mentor, mentore))
    acceptes[mentor] += statut == 'ACCEPTEE'
    en_attente[mentore] += statut == 'EN_ATTENTE'
    programme = None
    for cle, liste in volontaires.items():
        if mentor in liste and h.random() < 0.5 and (cle != 'femmes-ingenieures' or membres[mentore]['feminin']):
            programme = cle
            break
    mt = uid('mentorat-etendu', n)
    fil = membres[mentor]['fil'] if membres[mentor]['fil'] is not None else 0
    domaine = DOMAINES[fil][0]
    jours = h.randint(3, 160) if statut != 'EN_ATTENTE' else h.randint(1, 20)
    repondu = f"now() - interval '{max(1, jours - h.randint(1, 3))} days'" if statut in ('ACCEPTEE', 'REFUSEE', 'TERMINEE') else 'null'
    cloture = f"now() - interval '{h.randint(1, max(1, jours // 3))} days'" if statut in ('TERMINEE', 'ANNULEE') else 'null'
    motif = q(h.choice(['Mon agenda est complet ce semestre, je vous recommande un autre mentor du même domaine.',
                        'Je ne suis pas la bonne personne pour ce sujet ; un mentor de la filière vous aidera mieux.'])) if statut == 'REFUSEE' else 'null'
    lignes.append(
        f"insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)\n"
        f"select {q(mt)}, {q(mentore)}, {q(uid('profil-mentor', mentor))}, d.id, {q(programmes[programme][0]) if programme else 'null'}, {q(h.choice(OBJECTIFS))}, '{statut}', {motif},\n"
        f"  now() - interval '{jours} days', {repondu}, {cloture}, 0\n"
        f"from domaines_mentorat d where d.code = '{domaine}' on conflict (id) do nothing;")
    if statut in ('ACCEPTEE', 'TERMINEE'):
        nombre = h.randint(1, 4)
        for k in range(nombre):
            planifiee = statut == 'ACCEPTEE' and k == nombre - 1 and h.random() < 0.6
            decalage = h.randint(2, 20) if planifiee else -h.randint(1, max(2, jours - 1))
            modalite = h.choice(['VISIO', 'PRESENTIEL', 'TELEPHONE'])
            lieu = {'VISIO': 'https://meet.jit.si/ept-mentorat-demo', 'PRESENTIEL': h.choice(['Bibliothèque de l’EPT', 'Café du campus', 'Bureaux de l’entreprise']), 'TELEPHONE': None}[modalite]
            lignes.append(
                f"insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)\n"
                f"values ({q(uid('seance', mt, k))}, {q(mt)}, date_trunc('hour', now()) + interval '{decalage} days', {h.choice([30, 45, 60, 90])}, '{modalite}', {q(lieu)},\n"
                f"  '{'PLANIFIEE' if planifiee else 'REALISEE'}', {'null' if planifiee else q(h.choice(COMPTES_RENDUS))}, {q(mentor)}, now(), now())\n"
                f"on conflict (id) do nothing;")
        if programme:
            franchies = programmes[programme][1] if statut == 'TERMINEE' else h.randint(0, programmes[programme][1] - 1)
            for ordre in range(1, franchies + 1):
                lignes.append(
                    f"insert into progression_jalons (id, mentorat_id, jalon_id, atteint_le, valide_par_id, commentaire)\n"
                    f"values ({q(uid('progression', mt, ordre))}, {q(mt)}, {q(uid('jalon', programme, ordre))}, now() - interval '{h.randint(1, 30)} days',\n"
                    f"  {q(h.choice([mentor, mentore]))}, {q(h.choice([None, 'Étape franchie lors de la dernière séance.', 'Objectif atteint, on passe à la suite.']))}) on conflict do nothing;")
    if statut == 'TERMINEE':
        for auteur in ([mentore, mentor] if h.random() < 0.6 else [mentore]):
            note, commentaire = h.choice(EVALUATIONS)
            lignes.append(f"insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)\n"
                          f"values ({q(uid('evaluation', mt, auteur))}, {q(mt)}, {q(auteur)}, {note}, {q(commentaire)}, now() - interval '{h.randint(1, 10)} days') on conflict do nothing;")

lignes.append('commit;\n')
open(sys.argv[1], 'w', encoding='utf-8', newline='\n').write('\n'.join(lignes))
open(sys.argv[2], 'w', encoding='utf-8').write(json.dumps(visuels, ensure_ascii=False))
print(len(membres), 'membres,', len(ORGANISMES), 'organismes,', len(EVENEMENTS), 'événements,',
      len(visuels['portraits']), 'portraits,', len(visuels['logos']), 'logos,', len(visuels['evenements']), 'visuels d’événements')
