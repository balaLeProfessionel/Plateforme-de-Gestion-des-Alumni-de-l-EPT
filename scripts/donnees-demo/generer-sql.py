"""Génère projet-alumni/scripts/donnees-demo/donnees-demo.sql (identifiants stables : rejouable)."""
import random
import sys
import uuid

random.seed(2026)
ESPACE = uuid.UUID('6f1c2a5e-9a3b-4e7d-8c11-0e9a7d3b2c40')


def uid(*parties):
    return str(uuid.uuid5(ESPACE, '/'.join(map(str, parties))))


def q(texte):
    return 'null' if texte is None else "'" + str(texte).replace("'", "''") + "'"


FILIERES = ['Génie Informatique et Télécommunications', 'Génie Civil', 'Génie Électromécanique',
            'Génie Industriel', 'Génie Aéronautique et Aérospatial']
VILLES = ['Dakar', 'Thiès', 'Saint-Louis', 'Mbour', 'Ziguinchor', 'Paris', 'Montréal', 'Lyon', 'Abidjan', 'Kaolack']

ORGANISMES = [
    ('kerdata', 'Kër Data', 'ENTREPRISE', 'Données et intelligence artificielle', 'Dakar, Plateau', 'Sénégal'),
    ('baobab-energie', 'Baobab Énergie', 'ENTREPRISE', 'Énergies renouvelables', 'Thiès, Route de Mbour', 'Sénégal'),
    ('tic-conseil', 'Thiès Ingénierie Conseil', 'ENTREPRISE', 'Bureau d’études BTP', 'Thiès, Escale', 'Sénégal'),
    ('sahel-agritech', 'Sahel AgriTech', 'ENTREPRISE', 'Agriculture connectée', 'Saint-Louis', 'Sénégal'),
    ('aero-atlantique', 'Atlantique Aéro Maintenance', 'ENTREPRISE', 'Maintenance aéronautique', 'Diass, AIBD', 'Sénégal'),
    ('ingenieurs-solidaires', 'Ingénieurs Solidaires du Sahel', 'ONG', 'Accès à l’eau et à l’énergie', 'Mbour', 'Sénégal'),
]

# prenom, nom, role, filiere (index), promo (annee_sortie), ville, poste, organisme d'expérience
MEMBRES = [
    ('Aminata', 'Sarr', 'ALUMNI', 0, 2012, 'Dakar', 'Directrice technique', 'kerdata'),
    ('Ousmane', 'Ndiaye', 'ALUMNI', 0, 2016, 'Paris', 'Ingénieur logiciel senior', 'kerdata'),
    ('Fatou', 'Diagne', 'ALUMNI', 0, 2019, 'Dakar', 'Data scientist', 'kerdata'),
    ('Mamadou', 'Faye', 'ALUMNI', 0, 2021, 'Montréal', 'Ingénieur DevOps', 'sahel-agritech'),
    ('Khady', 'Sow', 'ALUMNI', 0, 2014, 'Dakar', 'Responsable cybersécurité', 'kerdata'),
    ('Ibrahima', 'Gueye', 'ALUMNI', 1, 2010, 'Thiès', 'Directeur de projets BTP', 'tic-conseil'),
    ('Mariama', 'Ba', 'ALUMNI', 1, 2015, 'Dakar', 'Ingénieure structures', 'tic-conseil'),
    ('Cheikh', 'Mbaye', 'ALUMNI', 1, 2018, 'Saint-Louis', 'Conducteur de travaux', 'tic-conseil'),
    ('Awa', 'Thiam', 'ALUMNI', 1, 2022, 'Lyon', 'Ingénieure hydraulique', 'ingenieurs-solidaires'),
    ('Moussa', 'Diop', 'ALUMNI', 2, 2011, 'Thiès', 'Responsable maintenance industrielle', 'baobab-energie'),
    ('Seynabou', 'Ndour', 'ALUMNI', 2, 2017, 'Dakar', 'Ingénieure énergies solaires', 'baobab-energie'),
    ('Abdoulaye', 'Cissé', 'ALUMNI', 2, 2020, 'Mbour', 'Chef de projet électrification rurale', 'ingenieurs-solidaires'),
    ('Rokhaya', 'Kane', 'ALUMNI', 3, 2013, 'Abidjan', 'Responsable supply chain', 'sahel-agritech'),
    ('Pape', 'Sy', 'ALUMNI', 3, 2019, 'Dakar', 'Consultant amélioration continue', 'tic-conseil'),
    ('Ndeye', 'Fall', 'ALUMNI', 3, 2023, 'Thiès', 'Ingénieure qualité', 'baobab-energie'),
    ('Alioune', 'Diallo', 'ALUMNI', 4, 2018, 'Dakar', 'Ingénieur navigabilité', 'aero-atlantique'),
    ('Coumba', 'Seck', 'ALUMNI', 4, 2021, 'Paris', 'Ingénieure propulsion', 'aero-atlantique'),
    ('Babacar', 'Niang', 'ALUMNI', 0, 2008, 'Dakar', 'Fondateur et CTO', 'kerdata'),
    ('Astou', 'Mbengue', 'ALUMNI', 2, 2024, 'Ziguinchor', 'Ingénieure électricité', 'baobab-energie'),
    ('Lamine', 'Touré', 'ALUMNI', 1, 2009, 'Kaolack', 'Directeur régional des travaux', 'tic-conseil'),
    ('Yacine', 'Diouf', 'ETUDIANT', 0, 2027, 'Thiès', 'Élève ingénieur', None),
    ('Bineta', 'Camara', 'ETUDIANT', 0, 2028, 'Thiès', 'Élève ingénieure', None),
    ('Serigne', 'Lo', 'ETUDIANT', 1, 2027, 'Thiès', 'Élève ingénieur', None),
    ('Aïda', 'Sène', 'ETUDIANT', 2, 2027, 'Thiès', 'Élève ingénieure', None),
    ('Modou', 'Wade', 'ETUDIANT', 3, 2028, 'Thiès', 'Élève ingénieur', None),
    ('Penda', 'Sall', 'ETUDIANT', 4, 2027, 'Thiès', 'Élève ingénieure', None),
    ('Omar', 'Badji', 'ETUDIANT', 0, 2029, 'Thiès', 'Élève ingénieur', None),
    ('Marème', 'Dieng', 'ETUDIANT', 1, 2028, 'Thiès', 'Élève ingénieure', None),
    ('Saliou', 'Ka', 'PERSONNEL', None, None, 'Thiès', 'Responsable des relations entreprises', None),
    ('Ndèye Astou', 'Faye', 'PERSONNEL', None, None, 'Thiès', 'Chargée de la vie étudiante', None),
    ('Jean-Marc', 'Mendy', 'VISITEUR', None, None, 'Dakar', 'Recruteur indépendant', None),
    ('Claire', 'Dubois', 'VISITEUR', None, None, 'Lyon', 'Chargée de partenariats universitaires', None),
]

BIOS = {
    'ALUMNI': 'Diplômé{e} de l’EPT, je travaille aujourd’hui comme {poste} à {ville}. Toujours partant{e} pour échanger avec les étudiants et les jeunes diplômés.',
    'ETUDIANT': 'Élève à l’EPT en {filiere}. Je cherche un stage et des conseils pour préparer mon insertion.',
    'PERSONNEL': 'Membre du personnel de l’École Polytechnique de Thiès, {poste}.',
    'VISITEUR': '{poste}, en lien avec le réseau des ingénieurs de l’EPT.',
}
FEMININS = {'Aminata', 'Fatou', 'Khady', 'Mariama', 'Awa', 'Seynabou', 'Rokhaya', 'Ndeye', 'Coumba', 'Astou', 'Bineta',
            'Aïda', 'Penda', 'Marème', 'Ndèye Astou', 'Claire'}

EVENEMENTS = [
    # cle, titre, jours depuis aujourd'hui, durée h, lieu, audience, places, officiel, organisateur, image
    ('forum-2026', 'Forum entreprises EPT 2026', 18, 8, 'Campus de l’EPT, Thiès', 'TOUS', 400, True, 'Saliou Ka', 'forum'),
    ('gala-promo', 'Gala de remise des diplômes — promotion 2026', 32, 5, 'King Fahd Palace, Dakar', 'TOUS', 250, True, 'Saliou Ka', 'gala'),
    ('hackathon-ia', 'Hackathon IA et agriculture', 25, 30, 'Kër Data, Dakar Plateau', 'TOUS', 80, False, 'Fatou Diagne', 'hackathon'),
    ('afterwork-dakar', 'Afterwork des alumni de Dakar', 9, 3, 'Les Almadies, Dakar', 'ALUMNI', 60, False, 'Ousmane Ndiaye', None),
    ('visite-solaire', 'Visite de la centrale solaire de Kahone', 14, 6, 'Kahone, Kaolack', 'ETUDIANTS', 35, False, 'Seynabou Ndour', 'solaire'),
    ('atelier-cv', 'Atelier CV et simulation d’entretien', 6, 3, 'Amphithéâtre B, EPT', 'ETUDIANTS', 50, True, 'Ndèye Astou Faye', None),
    ('conf-btp', 'Conférence : construire durable au Sahel', 21, 3, 'Thiès Ingénierie Conseil, Escale', 'TOUS', 120, False, 'Ibrahima Gueye', 'btp'),
    ('webinaire-montreal', 'Webinaire : travailler comme ingénieur au Canada', 11, 2, 'En ligne (lien envoyé aux inscrits)', 'TOUS', None, False, 'Mamadou Faye', None),
    ('aero-portes', 'Journée découverte des métiers de l’aéronautique', 40, 6, 'AIBD, Diass', 'ETUDIANTS', 40, False, 'Alioune Diallo', 'aero'),
    ('tournoi-foot', 'Tournoi de football inter-promotions', 28, 7, 'Stade Lat Dior, Thiès', 'TOUS', None, False, 'Pape Sy', None),
    ('mentorat-lancement', 'Lancement du programme de mentorat 2026-2027', 4, 2, 'Salle du conseil, EPT', 'TOUS', 100, True, 'Saliou Ka', None),
    ('cyber-atelier', 'Atelier pratique : sécurité des applications web', 47, 4, 'Laboratoire informatique, EPT', 'ETUDIANTS', 30, False, 'Khady Sow', None),
    ('retrouvailles-2016', 'Dix ans de la promotion 2016', 60, 6, 'Saly Portudal, Mbour', 'ALUMNI', 90, False, 'Ousmane Ndiaye', None),
    ('passe-industrie', 'Visite d’usine : maintenance prédictive', -12, 5, 'Baobab Énergie, Thiès', 'ETUDIANTS', 30, False, 'Moussa Diop', None),
    ('passe-conference', 'Conférence : l’ingénieur face au numérique', -26, 3, 'Amphithéâtre A, EPT', 'TOUS', None, True, 'Saliou Ka', None),
]

DOMAINES_PAR_FILIERE = {0: ['DEV_LOGICIEL', 'DATA_IA', 'CYBERSECURITE'], 1: ['GENIE_CIVIL', 'GESTION_PROJET'],
                        2: ['ELECTROMECANIQUE', 'GESTION_PROJET'], 3: ['GESTION_PROJET', 'ENTREPRENEURIAT'],
                        4: ['ELECTROMECANIQUE', 'CONCOURS_ETUDES']}


def email(prenom, nom):
    base = f'{prenom}.{nom}'.lower()
    for a, b in [('é', 'e'), ('è', 'e'), ('ï', 'i'), (' ', '-'), ('ë', 'e')]:
        base = base.replace(a, b)
    return f'{base}@demo.ept-alumni.invalid'


lignes = ["""-- Données de démonstration EPT Alumni (base de développement uniquement).
-- Généré par scripts/donnees-demo : identifiants stables, le script peut être rejoué sans doublon.
-- Variable psql attendue : compte_modele = e-mail d'un compte dont on recopie le mot de passe
-- (sinon les comptes de démonstration ne permettent pas de se connecter).
\\set ON_ERROR_STOP on
begin;
"""]

# Organismes et leurs comptes
for cle, nom, type_org, secteur, adresse, pays in ORGANISMES:
    lignes.append(
        f"insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, date_creation)\n"
        f"values ({q(uid('org', cle))}, {q(nom)}, {q(type_org)}, {q(secteur)}, {q(adresse)}, {q(pays)}, 'ACTIF', false,\n"
        f"  {q(nom + ' accueille régulièrement des stagiaires et des diplômés de l’EPT.')}, date '2015-01-01' + ({random.randint(0, 3000)} * interval '1 day'))\n"
        f"on conflict (id) do nothing;")
    lignes.append(
        f"insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, date_creation)\n"
        f"select {q(uid('compte-org', cle))}, {q(cle + '@demo.ept-alumni.invalid')}, true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,\n"
        f"  {q(nom)}, 'ORGANISME', 'ACTIF', {q(uid('org', cle))}, now()\n"
        f"on conflict do nothing;")

EPT = "(select id from organisme where etablissement_ept limit 1)"
membres_ids = {}
for prenom, nom, role, fil, promo, ville, poste, org in MEMBRES:
    i = uid('membre', prenom, nom)
    membres_ids[f'{prenom} {nom}'] = (i, role, fil, promo, org)
    feminin = prenom in FEMININS
    filiere = FILIERES[fil] if fil is not None else None
    bio = BIOS[role].format(e='e' if feminin else '', poste=poste.lower(), ville=ville, filiere=filiere)
    entree = promo - 3 if promo else None
    diplome = "'INGENIEUR'" if role == 'ALUMNI' else 'null'
    lignes.append(
        f"insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)\n"
        f"select {q(i)}, {q(email(prenom, nom))}, true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,\n"
        f"  {q(prenom)}, {q(nom)}, '{role}', 'ACTIF', {q(filiere)}, {entree if entree else 'null'}, {promo if promo else 'null'}, {diplome}, {q(ville)}, {q(poste)}, {q(bio)}, '+221 77 000 00 00', now() - interval '{random.randint(10, 400)} days'\n"
        f"on conflict do nothing;")
    if role == 'ALUMNI':
        lignes.append(
            f"insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)\n"
            f"values ({q(uid('formation', i))}, {q(i)}, {EPT}, {q('Diplôme d’ingénieur de conception — ' + filiere)}, 'DIPLOMANTE', date '{entree}-10-01', date '{promo}-07-31', false, true,\n"
            f"  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;")
        debut = promo + random.randint(0, 2)
        lignes.append(
            f"insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)\n"
            f"values ({q(uid('experience', i))}, {q(i)}, {q(uid('org', org))}, {q(poste)}, 'CDI', date '{debut}-09-01', null, false, true,\n"
            f"  {q('Poste actuel : ' + poste.lower() + '.')}) on conflict (id) do nothing;")
        lignes.append(
            f"insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)\n"
            f"values ({q(uid('stage', i))}, {q(i)}, {q(uid('org', org))}, 'Stage de fin d’études', 'STAGE', date '{promo}-02-01', date '{promo}-07-15', true, true,\n"
            f"  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;")

# Événements
for cle, titre, jours, duree, lieu, audience, places, officiel, organisateur, image in EVENEMENTS:
    e = uid('evenement', cle)
    url = f"'/api/evenement-images/{e}.jpg'" if image else 'null'
    description = (f'{titre}. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants '
                   f'et les partenaires de l’école autour d’un programme préparé par {organisateur}. '
                   'Pensez à confirmer votre participation pour faciliter l’organisation.')
    lignes.append(
        f"insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)\n"
        f"values ({q(e)}, {q(titre)}, {q(description)}, {q(lieu)},\n"
        f"  date_trunc('hour', now()) + interval '{jours} days' + interval '{random.choice([9, 10, 14, 18])} hours' - extract(hour from now()) * interval '1 hour',\n"
        f"  date_trunc('hour', now()) + interval '{jours} days' + interval '{random.choice([9, 10, 14, 18]) + duree} hours' - extract(hour from now()) * interval '1 hour',\n"
        f"  '{audience}', {places if places else 'null'}, {str(officiel).lower()}, 'PUBLIE', {q(membres_ids[organisateur][0])}, {url}, now(), now())\n"
        f"on conflict (id) do nothing;")
    participants = random.sample(list(membres_ids.items()), random.randint(6, 18))
    for (nom_complet, (m, role, *_)) in participants:
        if audience == 'ETUDIANTS' and role == 'ALUMNI':
            continue
        reponse = 'PARTICIPERA' if random.random() < 0.8 else 'NE_PARTICIPERA_PAS'
        lignes.append(
            f"insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) "
            f"values ({q(uid('participation', e, m))}, {q(e)}, {q(m)}, '{reponse}', now()) on conflict do nothing;")

# Mentorat : offres des alumni
alumni = [(n, v) for n, v in membres_ids.items() if v[1] == 'ALUMNI']
etudiants = [(n, v) for n, v in membres_ids.items() if v[1] == 'ETUDIANT']
mentors = alumni[:14]
for index, (nom_complet, (m, _, fil, promo, _org)) in enumerate(mentors):
    p = uid('profil-mentor', m)
    disponible = index % 7 != 6
    capacite = [2, 3, 3, 4, 1][index % 5]
    presentation = (f'Ingénieur{"e" if nom_complet.split()[0] in FEMININS else ""} {FILIERES[fil].lower()} (promo {promo}). '
                    'J’accompagne volontiers les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.')
    lignes.append(
        f"insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)\n"
        f"values ({q(p)}, {q(m)}, {q(presentation)}, {str(disponible).lower()}, {capacite}, now(), now()) on conflict do nothing;")
    for code in DOMAINES_PAR_FILIERE[fil] + (['CARRIERE_INSERTION'] if index % 2 == 0 else []):
        lignes.append(
            f"insert into profil_mentor_domaines (profil_mentor_id, domaine_id)\n"
            f"select {q(p)}, d.id from domaines_mentorat d where d.code = '{code}'\n"
            f"  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = {q(p)} and x.domaine_id = d.id);")

# Mentorats dans tous les états (au plus la capacité de chaque mentor en ACCEPTEE)
SCENARIOS = [
    (0, 0, 'ACCEPTEE'), (0, 1, 'TERMINEE'), (1, 2, 'EN_ATTENTE'), (2, 3, 'ACCEPTEE'), (2, 4, 'REFUSEE'),
    (5, 2, 'ACCEPTEE'), (7, 6, 'EN_ATTENTE'), (9, 3, 'TERMINEE'), (10, 5, 'ACCEPTEE'), (12, 4, 'EN_ATTENTE'),
    (13, 5, 'ACCEPTEE'), (4, 7, 'ANNULEE'), (3, 0, 'EN_ATTENTE'),
]
OBJECTIFS = ['Préparer mon stage de fin d’études et mes entretiens.', 'Choisir une spécialisation et construire mon projet professionnel.',
             'Comprendre le métier au quotidien et préparer ma première candidature.', 'Monter un projet entrepreneurial avec des camarades.']
for n, (i_mentor, i_etudiant, statut) in enumerate(SCENARIOS):
    _, (m, _, fil, _, _) = alumni[i_mentor]
    _, (e, *_rest) = etudiants[i_etudiant]
    p = uid('profil-mentor', m)
    mt = uid('mentorat', m, e)
    domaine = DOMAINES_PAR_FILIERE[fil][0]
    jours = 10 + n * 4
    repondu = "now() - interval '%d days'" % (jours - 2) if statut in ('ACCEPTEE', 'REFUSEE', 'TERMINEE') else 'null'
    cloture = "now() - interval '3 days'" if statut in ('TERMINEE', 'ANNULEE') else 'null'
    motif = q('Mon agenda est complet ce semestre, je vous recommande un autre mentor du même domaine.') if statut == 'REFUSEE' else 'null'
    lignes.append(
        f"insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)\n"
        f"select {q(mt)}, {q(e)}, {q(p)}, d.id, {q(OBJECTIFS[n % 4])}, '{statut}', {motif}, now() - interval '{jours} days', {repondu}, {cloture}, 0\n"
        f"from domaines_mentorat d where d.code = '{domaine}' on conflict (id) do nothing;")
    if statut in ('ACCEPTEE', 'TERMINEE'):
        seances = [(-jours + 5, 'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.'),
                   (-4, 'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.')]
        if statut == 'ACCEPTEE':
            seances.append((7 + n, 'PLANIFIEE', None))
        for k, (decalage, s_statut, compte_rendu) in enumerate(seances):
            modalite = ['VISIO', 'PRESENTIEL', 'TELEPHONE'][k % 3]
            lieu = {'VISIO': 'https://meet.jit.si/ept-mentorat-demo', 'PRESENTIEL': 'Bibliothèque de l’EPT', 'TELEPHONE': None}[modalite]
            lignes.append(
                f"insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)\n"
                f"values ({q(uid('seance', mt, k))}, {q(mt)}, date_trunc('hour', now()) + interval '{decalage} days', {[45, 60, 30][k % 3]}, '{modalite}', {q(lieu)}, '{s_statut}', {q(compte_rendu)}, {q(m)}, now(), now())\n"
                f"on conflict (id) do nothing;")
    if statut == 'TERMINEE':
        lignes.append(
            f"insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)\n"
            f"values ({q(uid('evaluation', mt, e))}, {q(mt)}, {q(e)}, 5, 'Des conseils concrets et une vraie disponibilité. Merci !', now()) on conflict do nothing;")

lignes.append('commit;\n')
open(sys.argv[1], 'w', encoding='utf-8', newline='\n').write('\n'.join(lignes))
print('lignes', len(lignes), 'événements avec image', [(uid('evenement', e[0]), e[9]) for e in EVENEMENTS if e[9]])
