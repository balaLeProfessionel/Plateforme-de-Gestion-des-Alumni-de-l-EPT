-- Données de démonstration EPT Alumni (base de développement uniquement).
-- Généré par scripts/donnees-demo : identifiants stables, le script peut être rejoué sans doublon.
-- Variable psql attendue : compte_modele = e-mail d'un compte dont on recopie le mot de passe
-- (sinon les comptes de démonstration ne permettent pas de se connecter).
\set ON_ERROR_STOP on
begin;

insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, date_creation)
values ('9a407d0c-7bf8-5252-8fdd-29fc61c80b63', 'Kër Data', 'ENTREPRISE', 'Données et intelligence artificielle', 'Dakar, Plateau', 'Sénégal', 'ACTIF', false,
  'Kër Data accueille régulièrement des stagiaires et des diplômés de l’EPT.', date '2015-01-01' + (487 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, date_creation)
select '457a91ad-b197-58e1-a26a-1134b376b601', 'kerdata@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Kër Data', 'ORGANISME', 'ACTIF', '9a407d0c-7bf8-5252-8fdd-29fc61c80b63', now()
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, date_creation)
values ('ad907e30-c5ea-5d71-bcee-e646c8faba85', 'Baobab Énergie', 'ENTREPRISE', 'Énergies renouvelables', 'Thiès, Route de Mbour', 'Sénégal', 'ACTIF', false,
  'Baobab Énergie accueille régulièrement des stagiaires et des diplômés de l’EPT.', date '2015-01-01' + (1308 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, date_creation)
select '0c1e1751-b3b9-5cac-b111-d19aec3ffbac', 'baobab-energie@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Baobab Énergie', 'ORGANISME', 'ACTIF', 'ad907e30-c5ea-5d71-bcee-e646c8faba85', now()
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, date_creation)
values ('d4782754-5bbb-5a6c-8e1f-fff15176445b', 'Thiès Ingénierie Conseil', 'ENTREPRISE', 'Bureau d’études BTP', 'Thiès, Escale', 'Sénégal', 'ACTIF', false,
  'Thiès Ingénierie Conseil accueille régulièrement des stagiaires et des diplômés de l’EPT.', date '2015-01-01' + (2058 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, date_creation)
select '196d12d1-8159-5cc4-a8de-b59640a3e0b9', 'tic-conseil@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Thiès Ingénierie Conseil', 'ORGANISME', 'ACTIF', 'd4782754-5bbb-5a6c-8e1f-fff15176445b', now()
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, date_creation)
values ('16397ae4-872c-5909-a942-7f13d802f0bb', 'Sahel AgriTech', 'ENTREPRISE', 'Agriculture connectée', 'Saint-Louis', 'Sénégal', 'ACTIF', false,
  'Sahel AgriTech accueille régulièrement des stagiaires et des diplômés de l’EPT.', date '2015-01-01' + (2096 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, date_creation)
select '2b7b98d1-8d29-5250-908f-da8e3563cb58', 'sahel-agritech@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Sahel AgriTech', 'ORGANISME', 'ACTIF', '16397ae4-872c-5909-a942-7f13d802f0bb', now()
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, date_creation)
values ('24d6fa3c-1e78-5930-86c2-9db155558ef5', 'Atlantique Aéro Maintenance', 'ENTREPRISE', 'Maintenance aéronautique', 'Diass, AIBD', 'Sénégal', 'ACTIF', false,
  'Atlantique Aéro Maintenance accueille régulièrement des stagiaires et des diplômés de l’EPT.', date '2015-01-01' + (2650 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, date_creation)
select '25eef3b9-ad26-5a17-a8ae-c6b7de335aa2', 'aero-atlantique@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Atlantique Aéro Maintenance', 'ORGANISME', 'ACTIF', '24d6fa3c-1e78-5930-86c2-9db155558ef5', now()
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, date_creation)
values ('606f73f2-9b7f-53e0-bbdb-6de6191ccad4', 'Ingénieurs Solidaires du Sahel', 'ONG', 'Accès à l’eau et à l’énergie', 'Mbour', 'Sénégal', 'ACTIF', false,
  'Ingénieurs Solidaires du Sahel accueille régulièrement des stagiaires et des diplômés de l’EPT.', date '2015-01-01' + (420 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, date_creation)
select '67535720-bda8-5703-9f0f-65ddb8184dea', 'ingenieurs-solidaires@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ingénieurs Solidaires du Sahel', 'ORGANISME', 'ACTIF', '606f73f2-9b7f-53e0-bbdb-6de6191ccad4', now()
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '1538e22c-a2a9-5eee-9a99-7a5ac9d211be', 'aminata.sarr@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Aminata', 'Sarr', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2009, 2012, 'INGENIEUR', 'Dakar', 'Directrice technique', 'Diplômée de l’EPT, je travaille aujourd’hui comme directrice technique à Dakar. Toujours partante pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '124 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('3702a41b-2fdf-5907-ab6b-654feae8103c', '1538e22c-a2a9-5eee-9a99-7a5ac9d211be', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2009-10-01', date '2012-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('7a5c04cc-5c7f-51ff-812c-e92921ca59d7', '1538e22c-a2a9-5eee-9a99-7a5ac9d211be', '9a407d0c-7bf8-5252-8fdd-29fc61c80b63', 'Directrice technique', 'CDI', date '2014-09-01', null, false, true,
  'Poste actuel : directrice technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('a57a51ff-395c-5d40-9b5b-8f670a0ef004', '1538e22c-a2a9-5eee-9a99-7a5ac9d211be', '9a407d0c-7bf8-5252-8fdd-29fc61c80b63', 'Stage de fin d’études', 'STAGE', date '2012-02-01', date '2012-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select 'a6c84916-3462-5018-8e9c-bedaeb3b39bd', 'ousmane.ndiaye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ousmane', 'Ndiaye', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2013, 2016, 'INGENIEUR', 'Paris', 'Ingénieur logiciel senior', 'Diplômé de l’EPT, je travaille aujourd’hui comme ingénieur logiciel senior à Paris. Toujours partant pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '328 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('aae1222e-e317-5475-bbca-5a649966909e', 'a6c84916-3462-5018-8e9c-bedaeb3b39bd', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2013-10-01', date '2016-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('4b1d5744-16e1-5970-bc4b-5fa9b6d68c61', 'a6c84916-3462-5018-8e9c-bedaeb3b39bd', '9a407d0c-7bf8-5252-8fdd-29fc61c80b63', 'Ingénieur logiciel senior', 'CDI', date '2018-09-01', null, false, true,
  'Poste actuel : ingénieur logiciel senior.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('4fcf2ab6-69e1-55e5-a8d4-0df15c87d50d', 'a6c84916-3462-5018-8e9c-bedaeb3b39bd', '9a407d0c-7bf8-5252-8fdd-29fc61c80b63', 'Stage de fin d’études', 'STAGE', date '2016-02-01', date '2016-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select 'fd215a7e-7fbb-57c5-b04b-57f515003008', 'fatou.diagne@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Fatou', 'Diagne', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2016, 2019, 'INGENIEUR', 'Dakar', 'Data scientist', 'Diplômée de l’EPT, je travaille aujourd’hui comme data scientist à Dakar. Toujours partante pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '225 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('fc3c41a3-51d9-50f2-87d2-731f670363ca', 'fd215a7e-7fbb-57c5-b04b-57f515003008', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2016-10-01', date '2019-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('a35eaec0-c59f-5d54-a0e4-39a19398cf2b', 'fd215a7e-7fbb-57c5-b04b-57f515003008', '9a407d0c-7bf8-5252-8fdd-29fc61c80b63', 'Data scientist', 'CDI', date '2021-09-01', null, false, true,
  'Poste actuel : data scientist.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f30efe55-1615-593b-be4e-fbb4d0081318', 'fd215a7e-7fbb-57c5-b04b-57f515003008', '9a407d0c-7bf8-5252-8fdd-29fc61c80b63', 'Stage de fin d’études', 'STAGE', date '2019-02-01', date '2019-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select 'a4a8b788-bfdc-55b1-84d0-380654974580', 'mamadou.faye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mamadou', 'Faye', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2018, 2021, 'INGENIEUR', 'Montréal', 'Ingénieur DevOps', 'Diplômé de l’EPT, je travaille aujourd’hui comme ingénieur devops à Montréal. Toujours partant pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '290 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('7cf5aed6-e3ad-5c05-9ad3-d961e7e52462', 'a4a8b788-bfdc-55b1-84d0-380654974580', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2018-10-01', date '2021-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('e5bf47e4-309a-59ae-b00f-4dc0d5cb78a7', 'a4a8b788-bfdc-55b1-84d0-380654974580', '16397ae4-872c-5909-a942-7f13d802f0bb', 'Ingénieur DevOps', 'CDI', date '2023-09-01', null, false, true,
  'Poste actuel : ingénieur devops.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('8fa41cee-265a-5567-a61d-4a7e57ee9595', 'a4a8b788-bfdc-55b1-84d0-380654974580', '16397ae4-872c-5909-a942-7f13d802f0bb', 'Stage de fin d’études', 'STAGE', date '2021-02-01', date '2021-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '2a4cfd61-2f58-5671-b2ca-14cae9884932', 'khady.sow@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Khady', 'Sow', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2011, 2014, 'INGENIEUR', 'Dakar', 'Responsable cybersécurité', 'Diplômée de l’EPT, je travaille aujourd’hui comme responsable cybersécurité à Dakar. Toujours partante pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '261 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('c66204a9-da68-524c-b3b2-4c5135027c3d', '2a4cfd61-2f58-5671-b2ca-14cae9884932', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2011-10-01', date '2014-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('32bc594c-a591-5bb4-ad53-08fde01230c8', '2a4cfd61-2f58-5671-b2ca-14cae9884932', '9a407d0c-7bf8-5252-8fdd-29fc61c80b63', 'Responsable cybersécurité', 'CDI', date '2016-09-01', null, false, true,
  'Poste actuel : responsable cybersécurité.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('2bc329ab-9784-544c-952e-194204992638', '2a4cfd61-2f58-5671-b2ca-14cae9884932', '9a407d0c-7bf8-5252-8fdd-29fc61c80b63', 'Stage de fin d’études', 'STAGE', date '2014-02-01', date '2014-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select 'ac0b40a5-bfdc-534d-ab0c-e3afd44aab16', 'ibrahima.gueye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ibrahima', 'Gueye', 'ALUMNI', 'ACTIF', 'Génie Civil', 2007, 2010, 'INGENIEUR', 'Thiès', 'Directeur de projets BTP', 'Diplômé de l’EPT, je travaille aujourd’hui comme directeur de projets btp à Thiès. Toujours partant pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '235 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('4c831551-2a4c-58cf-9a6c-61a6285d2b31', 'ac0b40a5-bfdc-534d-ab0c-e3afd44aab16', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2007-10-01', date '2010-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('cbd0cd4f-6265-5b31-9a66-db8b3866866e', 'ac0b40a5-bfdc-534d-ab0c-e3afd44aab16', 'd4782754-5bbb-5a6c-8e1f-fff15176445b', 'Directeur de projets BTP', 'CDI', date '2010-09-01', null, false, true,
  'Poste actuel : directeur de projets btp.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('06262650-4b4b-5e8c-8453-613c2e8097a7', 'ac0b40a5-bfdc-534d-ab0c-e3afd44aab16', 'd4782754-5bbb-5a6c-8e1f-fff15176445b', 'Stage de fin d’études', 'STAGE', date '2010-02-01', date '2010-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select 'e220afa9-938c-526b-bca4-e7357e3d1208', 'mariama.ba@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mariama', 'Ba', 'ALUMNI', 'ACTIF', 'Génie Civil', 2012, 2015, 'INGENIEUR', 'Dakar', 'Ingénieure structures', 'Diplômée de l’EPT, je travaille aujourd’hui comme ingénieure structures à Dakar. Toujours partante pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '11 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('d652dbeb-8b3c-5978-bcee-f0c890592e2d', 'e220afa9-938c-526b-bca4-e7357e3d1208', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2012-10-01', date '2015-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('916707e3-28f4-5626-8671-d712c4c8dcae', 'e220afa9-938c-526b-bca4-e7357e3d1208', 'd4782754-5bbb-5a6c-8e1f-fff15176445b', 'Ingénieure structures', 'CDI', date '2017-09-01', null, false, true,
  'Poste actuel : ingénieure structures.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('4a0ba855-dfbf-540e-becc-356deb875b65', 'e220afa9-938c-526b-bca4-e7357e3d1208', 'd4782754-5bbb-5a6c-8e1f-fff15176445b', 'Stage de fin d’études', 'STAGE', date '2015-02-01', date '2015-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '3ec77c21-295a-5bcf-a1a1-662782624791', 'cheikh.mbaye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Cheikh', 'Mbaye', 'ALUMNI', 'ACTIF', 'Génie Civil', 2015, 2018, 'INGENIEUR', 'Saint-Louis', 'Conducteur de travaux', 'Diplômé de l’EPT, je travaille aujourd’hui comme conducteur de travaux à Saint-Louis. Toujours partant pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '51 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('5f954970-ce4d-54d3-a924-c583a7634df9', '3ec77c21-295a-5bcf-a1a1-662782624791', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2015-10-01', date '2018-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('21181a73-9a58-5da5-83db-b9f44dbb7ed7', '3ec77c21-295a-5bcf-a1a1-662782624791', 'd4782754-5bbb-5a6c-8e1f-fff15176445b', 'Conducteur de travaux', 'CDI', date '2018-09-01', null, false, true,
  'Poste actuel : conducteur de travaux.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('a1fee9c8-bc94-575c-8805-db059b9e80e8', '3ec77c21-295a-5bcf-a1a1-662782624791', 'd4782754-5bbb-5a6c-8e1f-fff15176445b', 'Stage de fin d’études', 'STAGE', date '2018-02-01', date '2018-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select 'cb4ae14b-a5ae-5be3-87f5-03bdebba98db', 'awa.thiam@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Awa', 'Thiam', 'ALUMNI', 'ACTIF', 'Génie Civil', 2019, 2022, 'INGENIEUR', 'Lyon', 'Ingénieure hydraulique', 'Diplômée de l’EPT, je travaille aujourd’hui comme ingénieure hydraulique à Lyon. Toujours partante pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '157 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('f8f77eac-dc23-55d3-8d8c-e7d0a4ec008d', 'cb4ae14b-a5ae-5be3-87f5-03bdebba98db', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2019-10-01', date '2022-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('9bf75838-37c5-5e8d-b844-ea6e1036ebfa', 'cb4ae14b-a5ae-5be3-87f5-03bdebba98db', '606f73f2-9b7f-53e0-bbdb-6de6191ccad4', 'Ingénieure hydraulique', 'CDI', date '2022-09-01', null, false, true,
  'Poste actuel : ingénieure hydraulique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('55d170ef-f20c-504e-a8ff-04db25fe9c61', 'cb4ae14b-a5ae-5be3-87f5-03bdebba98db', '606f73f2-9b7f-53e0-bbdb-6de6191ccad4', 'Stage de fin d’études', 'STAGE', date '2022-02-01', date '2022-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '217acb44-3d62-541a-ad55-20b393defe14', 'moussa.diop@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Moussa', 'Diop', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2008, 2011, 'INGENIEUR', 'Thiès', 'Responsable maintenance industrielle', 'Diplômé de l’EPT, je travaille aujourd’hui comme responsable maintenance industrielle à Thiès. Toujours partant pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '240 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('bdb3f669-fc21-5e03-b5c4-4e760d1f4017', '217acb44-3d62-541a-ad55-20b393defe14', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2008-10-01', date '2011-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('043b2db3-c0cd-507f-9461-d0031e4490cd', '217acb44-3d62-541a-ad55-20b393defe14', 'ad907e30-c5ea-5d71-bcee-e646c8faba85', 'Responsable maintenance industrielle', 'CDI', date '2011-09-01', null, false, true,
  'Poste actuel : responsable maintenance industrielle.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('66856482-4c4c-54f1-bed6-a329f05c9ec0', '217acb44-3d62-541a-ad55-20b393defe14', 'ad907e30-c5ea-5d71-bcee-e646c8faba85', 'Stage de fin d’études', 'STAGE', date '2011-02-01', date '2011-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '4ba85b20-f2d7-5b10-91aa-f71726a6c246', 'seynabou.ndour@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Seynabou', 'Ndour', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2014, 2017, 'INGENIEUR', 'Dakar', 'Ingénieure énergies solaires', 'Diplômée de l’EPT, je travaille aujourd’hui comme ingénieure énergies solaires à Dakar. Toujours partante pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '360 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('3b90f028-18b1-5241-8ed5-71aef2e3fd5f', '4ba85b20-f2d7-5b10-91aa-f71726a6c246', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2014-10-01', date '2017-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('7374f962-2db9-574f-904d-0424097cbd27', '4ba85b20-f2d7-5b10-91aa-f71726a6c246', 'ad907e30-c5ea-5d71-bcee-e646c8faba85', 'Ingénieure énergies solaires', 'CDI', date '2018-09-01', null, false, true,
  'Poste actuel : ingénieure énergies solaires.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('d93fad13-7808-510d-bcfc-043463e33458', '4ba85b20-f2d7-5b10-91aa-f71726a6c246', 'ad907e30-c5ea-5d71-bcee-e646c8faba85', 'Stage de fin d’études', 'STAGE', date '2017-02-01', date '2017-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select 'f43959e1-0009-5285-b7d8-1da0861fad73', 'abdoulaye.cisse@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Abdoulaye', 'Cissé', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2017, 2020, 'INGENIEUR', 'Mbour', 'Chef de projet électrification rurale', 'Diplômé de l’EPT, je travaille aujourd’hui comme chef de projet électrification rurale à Mbour. Toujours partant pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '357 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('5407e986-4cc8-51ad-a902-d1903d607c0f', 'f43959e1-0009-5285-b7d8-1da0861fad73', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2017-10-01', date '2020-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('acd05f09-b3b6-5825-8fc8-7b8377e4ea23', 'f43959e1-0009-5285-b7d8-1da0861fad73', '606f73f2-9b7f-53e0-bbdb-6de6191ccad4', 'Chef de projet électrification rurale', 'CDI', date '2021-09-01', null, false, true,
  'Poste actuel : chef de projet électrification rurale.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('5346f23c-f5f3-5273-8df1-97865f2505d9', 'f43959e1-0009-5285-b7d8-1da0861fad73', '606f73f2-9b7f-53e0-bbdb-6de6191ccad4', 'Stage de fin d’études', 'STAGE', date '2020-02-01', date '2020-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select 'caa7ac70-9b4e-5f0c-99b5-9261e81224f2', 'rokhaya.kane@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Rokhaya', 'Kane', 'ALUMNI', 'ACTIF', 'Génie Industriel', 2010, 2013, 'INGENIEUR', 'Abidjan', 'Responsable supply chain', 'Diplômée de l’EPT, je travaille aujourd’hui comme responsable supply chain à Abidjan. Toujours partante pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '117 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('895b77f3-47e5-5ae3-8fd0-2173211e7254', 'caa7ac70-9b4e-5f0c-99b5-9261e81224f2', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Industriel', 'DIPLOMANTE', date '2010-10-01', date '2013-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('37084d47-a2e1-54ff-90cd-c7b2fec36bab', 'caa7ac70-9b4e-5f0c-99b5-9261e81224f2', '16397ae4-872c-5909-a942-7f13d802f0bb', 'Responsable supply chain', 'CDI', date '2014-09-01', null, false, true,
  'Poste actuel : responsable supply chain.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('9bd2f23b-7624-568e-89a5-9d4a39e02673', 'caa7ac70-9b4e-5f0c-99b5-9261e81224f2', '16397ae4-872c-5909-a942-7f13d802f0bb', 'Stage de fin d’études', 'STAGE', date '2013-02-01', date '2013-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select 'f963c1e1-ddad-5c37-aeec-73a4a0871d57', 'pape.sy@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Pape', 'Sy', 'ALUMNI', 'ACTIF', 'Génie Industriel', 2016, 2019, 'INGENIEUR', 'Dakar', 'Consultant amélioration continue', 'Diplômé de l’EPT, je travaille aujourd’hui comme consultant amélioration continue à Dakar. Toujours partant pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '138 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('a4813fe7-880e-5728-b2f5-637120810840', 'f963c1e1-ddad-5c37-aeec-73a4a0871d57', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Industriel', 'DIPLOMANTE', date '2016-10-01', date '2019-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('bf887e5f-6b07-53b4-9ef6-c9f7540a3681', 'f963c1e1-ddad-5c37-aeec-73a4a0871d57', 'd4782754-5bbb-5a6c-8e1f-fff15176445b', 'Consultant amélioration continue', 'CDI', date '2020-09-01', null, false, true,
  'Poste actuel : consultant amélioration continue.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('ae6e273d-3544-5e77-9715-3124bfe8813c', 'f963c1e1-ddad-5c37-aeec-73a4a0871d57', 'd4782754-5bbb-5a6c-8e1f-fff15176445b', 'Stage de fin d’études', 'STAGE', date '2019-02-01', date '2019-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '346777f9-3a05-56ac-a532-17cb17f2d45b', 'ndeye.fall@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ndeye', 'Fall', 'ALUMNI', 'ACTIF', 'Génie Industriel', 2020, 2023, 'INGENIEUR', 'Thiès', 'Ingénieure qualité', 'Diplômée de l’EPT, je travaille aujourd’hui comme ingénieure qualité à Thiès. Toujours partante pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '192 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('9ac52d6a-a110-5c33-9244-34e8d26dfba7', '346777f9-3a05-56ac-a532-17cb17f2d45b', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Industriel', 'DIPLOMANTE', date '2020-10-01', date '2023-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('79634b36-9b4f-51b0-a480-b2943f839bbf', '346777f9-3a05-56ac-a532-17cb17f2d45b', 'ad907e30-c5ea-5d71-bcee-e646c8faba85', 'Ingénieure qualité', 'CDI', date '2024-09-01', null, false, true,
  'Poste actuel : ingénieure qualité.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('0f30de3c-607a-5d8b-871a-649cba34765b', '346777f9-3a05-56ac-a532-17cb17f2d45b', 'ad907e30-c5ea-5d71-bcee-e646c8faba85', 'Stage de fin d’études', 'STAGE', date '2023-02-01', date '2023-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '755dbf8a-d991-5272-97a1-ea495c4116fa', 'alioune.diallo@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Alioune', 'Diallo', 'ALUMNI', 'ACTIF', 'Génie Aéronautique et Aérospatial', 2015, 2018, 'INGENIEUR', 'Dakar', 'Ingénieur navigabilité', 'Diplômé de l’EPT, je travaille aujourd’hui comme ingénieur navigabilité à Dakar. Toujours partant pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '391 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('cd903318-cec0-52f5-a05a-5899e1042aff', '755dbf8a-d991-5272-97a1-ea495c4116fa', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Aéronautique et Aérospatial', 'DIPLOMANTE', date '2015-10-01', date '2018-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('b7db5c9a-b2a0-58a9-ad9b-9a2bf1ae40c7', '755dbf8a-d991-5272-97a1-ea495c4116fa', '24d6fa3c-1e78-5930-86c2-9db155558ef5', 'Ingénieur navigabilité', 'CDI', date '2020-09-01', null, false, true,
  'Poste actuel : ingénieur navigabilité.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('1a710746-2674-530b-b8ff-edb9b5e49e7d', '755dbf8a-d991-5272-97a1-ea495c4116fa', '24d6fa3c-1e78-5930-86c2-9db155558ef5', 'Stage de fin d’études', 'STAGE', date '2018-02-01', date '2018-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '28b42385-c305-5335-8c90-0cb2c1668b2f', 'coumba.seck@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Coumba', 'Seck', 'ALUMNI', 'ACTIF', 'Génie Aéronautique et Aérospatial', 2018, 2021, 'INGENIEUR', 'Paris', 'Ingénieure propulsion', 'Diplômée de l’EPT, je travaille aujourd’hui comme ingénieure propulsion à Paris. Toujours partante pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '336 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('736fdfb8-8c03-53c0-aabe-6e01e7a43bca', '28b42385-c305-5335-8c90-0cb2c1668b2f', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Aéronautique et Aérospatial', 'DIPLOMANTE', date '2018-10-01', date '2021-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('92eafc58-ff99-5779-ba06-62116b816fc1', '28b42385-c305-5335-8c90-0cb2c1668b2f', '24d6fa3c-1e78-5930-86c2-9db155558ef5', 'Ingénieure propulsion', 'CDI', date '2021-09-01', null, false, true,
  'Poste actuel : ingénieure propulsion.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('a5053764-0072-5e9d-99aa-de277cbd7275', '28b42385-c305-5335-8c90-0cb2c1668b2f', '24d6fa3c-1e78-5930-86c2-9db155558ef5', 'Stage de fin d’études', 'STAGE', date '2021-02-01', date '2021-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '8860b22b-057b-5a11-aa09-11335b1ef58f', 'babacar.niang@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Babacar', 'Niang', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2005, 2008, 'INGENIEUR', 'Dakar', 'Fondateur et CTO', 'Diplômé de l’EPT, je travaille aujourd’hui comme fondateur et cto à Dakar. Toujours partant pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '380 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('762a9c50-6f11-59e2-8220-8123a8b024de', '8860b22b-057b-5a11-aa09-11335b1ef58f', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2005-10-01', date '2008-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('827eb57f-5aee-5ae3-9cc1-08b23a4f86f7', '8860b22b-057b-5a11-aa09-11335b1ef58f', '9a407d0c-7bf8-5252-8fdd-29fc61c80b63', 'Fondateur et CTO', 'CDI', date '2009-09-01', null, false, true,
  'Poste actuel : fondateur et cto.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('97c733ed-3e5f-59c1-8187-1e7fe7746c35', '8860b22b-057b-5a11-aa09-11335b1ef58f', '9a407d0c-7bf8-5252-8fdd-29fc61c80b63', 'Stage de fin d’études', 'STAGE', date '2008-02-01', date '2008-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select 'c45d1c47-7542-5522-8a2e-ede85b53b2ae', 'astou.mbengue@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Astou', 'Mbengue', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2021, 2024, 'INGENIEUR', 'Ziguinchor', 'Ingénieure électricité', 'Diplômée de l’EPT, je travaille aujourd’hui comme ingénieure électricité à Ziguinchor. Toujours partante pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '55 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('a547bbad-31d1-514f-8812-9d7d45be7d69', 'c45d1c47-7542-5522-8a2e-ede85b53b2ae', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2021-10-01', date '2024-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f3d40adb-fdb8-5dab-84c5-f6c9b5492332', 'c45d1c47-7542-5522-8a2e-ede85b53b2ae', 'ad907e30-c5ea-5d71-bcee-e646c8faba85', 'Ingénieure électricité', 'CDI', date '2026-09-01', null, false, true,
  'Poste actuel : ingénieure électricité.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('7733f3b7-347a-53c3-a89b-8d8d7f3a50a1', 'c45d1c47-7542-5522-8a2e-ede85b53b2ae', 'ad907e30-c5ea-5d71-bcee-e646c8faba85', 'Stage de fin d’études', 'STAGE', date '2024-02-01', date '2024-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '70ef578a-181c-510a-9cf7-b6cf3ce5f99b', 'lamine.toure@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Lamine', 'Touré', 'ALUMNI', 'ACTIF', 'Génie Civil', 2006, 2009, 'INGENIEUR', 'Kaolack', 'Directeur régional des travaux', 'Diplômé de l’EPT, je travaille aujourd’hui comme directeur régional des travaux à Kaolack. Toujours partant pour échanger avec les étudiants et les jeunes diplômés.', '+221 77 000 00 00', now() - interval '285 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('d812396e-819a-5249-afe7-ddfec3d901f8', '70ef578a-181c-510a-9cf7-b6cf3ce5f99b', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2006-10-01', date '2009-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('dadd72c3-8817-59ef-854f-d5ca2ccb2a11', '70ef578a-181c-510a-9cf7-b6cf3ce5f99b', 'd4782754-5bbb-5a6c-8e1f-fff15176445b', 'Directeur régional des travaux', 'CDI', date '2010-09-01', null, false, true,
  'Poste actuel : directeur régional des travaux.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('7c570192-a653-5961-b228-a2e8653e4eec', '70ef578a-181c-510a-9cf7-b6cf3ce5f99b', 'd4782754-5bbb-5a6c-8e1f-fff15176445b', 'Stage de fin d’études', 'STAGE', date '2009-02-01', date '2009-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '6904214d-a1f0-5cf9-b47d-c8344e8ff2c0', 'yacine.diouf@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Yacine', 'Diouf', 'ETUDIANT', 'ACTIF', 'Génie Informatique et Télécommunications', 2024, 2027, null, 'Thiès', 'Élève ingénieur', 'Élève à l’EPT en Génie Informatique et Télécommunications. Je cherche un stage et des conseils pour préparer mon insertion.', '+221 77 000 00 00', now() - interval '157 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '4d33cf28-2592-56c3-b033-855cffb14776', 'bineta.camara@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Bineta', 'Camara', 'ETUDIANT', 'ACTIF', 'Génie Informatique et Télécommunications', 2025, 2028, null, 'Thiès', 'Élève ingénieure', 'Élève à l’EPT en Génie Informatique et Télécommunications. Je cherche un stage et des conseils pour préparer mon insertion.', '+221 77 000 00 00', now() - interval '244 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '0cd8c41f-b1bd-505f-b6dd-dad8da16380f', 'serigne.lo@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Serigne', 'Lo', 'ETUDIANT', 'ACTIF', 'Génie Civil', 2024, 2027, null, 'Thiès', 'Élève ingénieur', 'Élève à l’EPT en Génie Civil. Je cherche un stage et des conseils pour préparer mon insertion.', '+221 77 000 00 00', now() - interval '82 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '5caabf0a-289b-50a6-b714-75d251427d31', 'aida.sene@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Aïda', 'Sène', 'ETUDIANT', 'ACTIF', 'Génie Électromécanique', 2024, 2027, null, 'Thiès', 'Élève ingénieure', 'Élève à l’EPT en Génie Électromécanique. Je cherche un stage et des conseils pour préparer mon insertion.', '+221 77 000 00 00', now() - interval '340 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '57518406-14da-54a4-bab0-408d9f6bb421', 'modou.wade@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Modou', 'Wade', 'ETUDIANT', 'ACTIF', 'Génie Industriel', 2025, 2028, null, 'Thiès', 'Élève ingénieur', 'Élève à l’EPT en Génie Industriel. Je cherche un stage et des conseils pour préparer mon insertion.', '+221 77 000 00 00', now() - interval '370 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select 'd8ce4039-b9d4-5e06-8e8c-e5d507c9ea9c', 'penda.sall@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Penda', 'Sall', 'ETUDIANT', 'ACTIF', 'Génie Aéronautique et Aérospatial', 2024, 2027, null, 'Thiès', 'Élève ingénieure', 'Élève à l’EPT en Génie Aéronautique et Aérospatial. Je cherche un stage et des conseils pour préparer mon insertion.', '+221 77 000 00 00', now() - interval '376 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '438d8c6e-122a-501e-bf8a-a8db962e4337', 'omar.badji@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Omar', 'Badji', 'ETUDIANT', 'ACTIF', 'Génie Informatique et Télécommunications', 2026, 2029, null, 'Thiès', 'Élève ingénieur', 'Élève à l’EPT en Génie Informatique et Télécommunications. Je cherche un stage et des conseils pour préparer mon insertion.', '+221 77 000 00 00', now() - interval '305 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '8b0824f9-36fa-590f-8d99-227ff13aeb80', 'mareme.dieng@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Marème', 'Dieng', 'ETUDIANT', 'ACTIF', 'Génie Civil', 2025, 2028, null, 'Thiès', 'Élève ingénieure', 'Élève à l’EPT en Génie Civil. Je cherche un stage et des conseils pour préparer mon insertion.', '+221 77 000 00 00', now() - interval '168 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select 'af68381f-38ee-55b1-8ae5-65b149d6f4c8', 'saliou.ka@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Saliou', 'Ka', 'PERSONNEL', 'ACTIF', null, null, null, null, 'Thiès', 'Responsable des relations entreprises', 'Membre du personnel de l’École Polytechnique de Thiès, responsable des relations entreprises.', '+221 77 000 00 00', now() - interval '22 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '0f494f58-6c35-57f1-b27c-9d4b676f3b63', 'ndeye-astou.faye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ndèye Astou', 'Faye', 'PERSONNEL', 'ACTIF', null, null, null, null, 'Thiès', 'Chargée de la vie étudiante', 'Membre du personnel de l’École Polytechnique de Thiès, chargée de la vie étudiante.', '+221 77 000 00 00', now() - interval '373 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '51225c77-6d76-5efb-8d46-5e0ab767ae87', 'jean-marc.mendy@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Jean-Marc', 'Mendy', 'VISITEUR', 'ACTIF', null, null, null, null, 'Dakar', 'Recruteur indépendant', 'recruteur indépendant, en lien avec le réseau des ingénieurs de l’EPT.', '+221 77 000 00 00', now() - interval '198 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, date_creation)
select '99599b64-8426-5c71-9a67-7d8476b7d2eb', 'claire.dubois@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Claire', 'Dubois', 'VISITEUR', 'ACTIF', null, null, null, null, 'Lyon', 'Chargée de partenariats universitaires', 'chargée de partenariats universitaires, en lien avec le réseau des ingénieurs de l’EPT.', '+221 77 000 00 00', now() - interval '196 days'
on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('9f8711d5-e2e2-59ad-b35b-75672cf5274a', 'Forum entreprises EPT 2026', 'Forum entreprises EPT 2026. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants et les partenaires de l’école autour d’un programme préparé par Saliou Ka. Pensez à confirmer votre participation pour faciliter l’organisation.', 'Campus de l’EPT, Thiès',
  date_trunc('hour', now()) + interval '18 days' + interval '18 hours' - extract(hour from now()) * interval '1 hour',
  date_trunc('hour', now()) + interval '18 days' + interval '26 hours' - extract(hour from now()) * interval '1 hour',
  'TOUS', 400, true, 'PUBLIE', 'af68381f-38ee-55b1-8ae5-65b149d6f4c8', '/api/evenement-images/9f8711d5-e2e2-59ad-b35b-75672cf5274a.jpg', now(), now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1a6bbc3d-b205-530d-816a-22c99bf60086', '9f8711d5-e2e2-59ad-b35b-75672cf5274a', 'd8ce4039-b9d4-5e06-8e8c-e5d507c9ea9c', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fa5719c4-0dfb-5c7b-b488-8e08e85d641d', '9f8711d5-e2e2-59ad-b35b-75672cf5274a', 'af68381f-38ee-55b1-8ae5-65b149d6f4c8', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('09b6dc83-0b63-5eb5-b68d-41f60f864467', '9f8711d5-e2e2-59ad-b35b-75672cf5274a', 'c45d1c47-7542-5522-8a2e-ede85b53b2ae', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3a5db82a-eeef-5aab-8271-f439fced82cc', '9f8711d5-e2e2-59ad-b35b-75672cf5274a', '8860b22b-057b-5a11-aa09-11335b1ef58f', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6ec48ad8-877a-5a38-b12e-0a138cc02403', '9f8711d5-e2e2-59ad-b35b-75672cf5274a', '755dbf8a-d991-5272-97a1-ea495c4116fa', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('921d1b10-e8b2-5467-a47b-4ee61a331bc2', '9f8711d5-e2e2-59ad-b35b-75672cf5274a', 'a4a8b788-bfdc-55b1-84d0-380654974580', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3f32f36b-5da7-5041-8ea6-cd1d03d59bb4', '9f8711d5-e2e2-59ad-b35b-75672cf5274a', 'f963c1e1-ddad-5c37-aeec-73a4a0871d57', 'PARTICIPERA', now()) on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('3f870157-716c-539e-a90f-6c9ebf273532', 'Gala de remise des diplômes — promotion 2026', 'Gala de remise des diplômes — promotion 2026. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants et les partenaires de l’école autour d’un programme préparé par Saliou Ka. Pensez à confirmer votre participation pour faciliter l’organisation.', 'King Fahd Palace, Dakar',
  date_trunc('hour', now()) + interval '32 days' + interval '18 hours' - extract(hour from now()) * interval '1 hour',
  date_trunc('hour', now()) + interval '32 days' + interval '14 hours' - extract(hour from now()) * interval '1 hour',
  'TOUS', 250, true, 'PUBLIE', 'af68381f-38ee-55b1-8ae5-65b149d6f4c8', '/api/evenement-images/3f870157-716c-539e-a90f-6c9ebf273532.jpg', now(), now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5cab7a39-1ea0-58c7-8ef1-d4a42c71740f', '3f870157-716c-539e-a90f-6c9ebf273532', '346777f9-3a05-56ac-a532-17cb17f2d45b', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b8bae534-756b-56a9-acbc-0078054def02', '3f870157-716c-539e-a90f-6c9ebf273532', '57518406-14da-54a4-bab0-408d9f6bb421', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b20538b0-832f-50d4-9361-47c692c06d8f', '3f870157-716c-539e-a90f-6c9ebf273532', '2a4cfd61-2f58-5671-b2ca-14cae9884932', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2156a271-a40e-5ca5-9bb5-7b490c4114c6', '3f870157-716c-539e-a90f-6c9ebf273532', '438d8c6e-122a-501e-bf8a-a8db962e4337', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ecf481ab-fa64-51e6-8db4-30c061f1d9fd', '3f870157-716c-539e-a90f-6c9ebf273532', 'a6c84916-3462-5018-8e9c-bedaeb3b39bd', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b94a3e6a-ffb0-584c-909b-d20d6310d828', '3f870157-716c-539e-a90f-6c9ebf273532', '0cd8c41f-b1bd-505f-b6dd-dad8da16380f', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('435cfe7d-0b2c-5d37-860e-4ee52813acf4', '3f870157-716c-539e-a90f-6c9ebf273532', '28b42385-c305-5335-8c90-0cb2c1668b2f', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9d68ad57-b34a-54ff-a990-f63e3ab1cb0d', '3f870157-716c-539e-a90f-6c9ebf273532', '4d33cf28-2592-56c3-b033-855cffb14776', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('89a97ee8-e276-5869-89be-7a37d264f908', '3f870157-716c-539e-a90f-6c9ebf273532', 'a4a8b788-bfdc-55b1-84d0-380654974580', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9181465a-8a6e-5fb4-b509-9a95740b3901', '3f870157-716c-539e-a90f-6c9ebf273532', 'af68381f-38ee-55b1-8ae5-65b149d6f4c8', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e8c6b72a-6088-55a4-9484-4e9aae7b3a89', '3f870157-716c-539e-a90f-6c9ebf273532', '70ef578a-181c-510a-9cf7-b6cf3ce5f99b', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b987472f-14fc-5622-a823-e28f014c2d4f', '3f870157-716c-539e-a90f-6c9ebf273532', 'f963c1e1-ddad-5c37-aeec-73a4a0871d57', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ecca72b2-6ac0-53fb-bf7d-a7d5e5d8493a', '3f870157-716c-539e-a90f-6c9ebf273532', '755dbf8a-d991-5272-97a1-ea495c4116fa', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1a12ee22-dd96-5f01-a02d-f92cdbe4f62f', '3f870157-716c-539e-a90f-6c9ebf273532', '0f494f58-6c35-57f1-b27c-9d4b676f3b63', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c5ff7768-92fe-5cae-9847-9ebdf28b5262', '3f870157-716c-539e-a90f-6c9ebf273532', '51225c77-6d76-5efb-8d46-5e0ab767ae87', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('9938e3f0-5f5f-5f9d-97d9-981ccf9ae464', 'Hackathon IA et agriculture', 'Hackathon IA et agriculture. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants et les partenaires de l’école autour d’un programme préparé par Fatou Diagne. Pensez à confirmer votre participation pour faciliter l’organisation.', 'Kër Data, Dakar Plateau',
  date_trunc('hour', now()) + interval '25 days' + interval '18 hours' - extract(hour from now()) * interval '1 hour',
  date_trunc('hour', now()) + interval '25 days' + interval '48 hours' - extract(hour from now()) * interval '1 hour',
  'TOUS', 80, false, 'PUBLIE', 'fd215a7e-7fbb-57c5-b04b-57f515003008', '/api/evenement-images/9938e3f0-5f5f-5f9d-97d9-981ccf9ae464.jpg', now(), now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f8aaff9e-7aed-5e1c-acbd-52d542b4c805', '9938e3f0-5f5f-5f9d-97d9-981ccf9ae464', 'c45d1c47-7542-5522-8a2e-ede85b53b2ae', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('21a9b054-7713-592a-b10b-c66bcfb73e68', '9938e3f0-5f5f-5f9d-97d9-981ccf9ae464', '438d8c6e-122a-501e-bf8a-a8db962e4337', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('929fd7ec-d139-569a-887a-92e62422ef77', '9938e3f0-5f5f-5f9d-97d9-981ccf9ae464', 'cb4ae14b-a5ae-5be3-87f5-03bdebba98db', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('eaf5aa4a-fd43-507e-9c75-b881adf50d1f', '9938e3f0-5f5f-5f9d-97d9-981ccf9ae464', '1538e22c-a2a9-5eee-9a99-7a5ac9d211be', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('14ead465-90fe-5e2d-afbc-585193362237', '9938e3f0-5f5f-5f9d-97d9-981ccf9ae464', 'a6c84916-3462-5018-8e9c-bedaeb3b39bd', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f238376e-0f37-5c2b-817d-2fb206ea9dec', '9938e3f0-5f5f-5f9d-97d9-981ccf9ae464', '2a4cfd61-2f58-5671-b2ca-14cae9884932', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f74287b9-5e9b-5de4-b7d0-963ba1ef4e03', '9938e3f0-5f5f-5f9d-97d9-981ccf9ae464', '6904214d-a1f0-5cf9-b47d-c8344e8ff2c0', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2a1975d4-b92f-5512-b53a-22634abe7a96', '9938e3f0-5f5f-5f9d-97d9-981ccf9ae464', '70ef578a-181c-510a-9cf7-b6cf3ce5f99b', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a791ac48-3c0c-55e5-9d60-a1a06bd9c407', '9938e3f0-5f5f-5f9d-97d9-981ccf9ae464', '346777f9-3a05-56ac-a532-17cb17f2d45b', 'PARTICIPERA', now()) on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('0d4d1558-2dce-555b-a31e-d913d1d709ec', 'Afterwork des alumni de Dakar', 'Afterwork des alumni de Dakar. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants et les partenaires de l’école autour d’un programme préparé par Ousmane Ndiaye. Pensez à confirmer votre participation pour faciliter l’organisation.', 'Les Almadies, Dakar',
  date_trunc('hour', now()) + interval '9 days' + interval '9 hours' - extract(hour from now()) * interval '1 hour',
  date_trunc('hour', now()) + interval '9 days' + interval '17 hours' - extract(hour from now()) * interval '1 hour',
  'ALUMNI', 60, false, 'PUBLIE', 'a6c84916-3462-5018-8e9c-bedaeb3b39bd', null, now(), now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d64f2edf-ad63-526f-a57a-78e2e4ea01e3', '0d4d1558-2dce-555b-a31e-d913d1d709ec', '0f494f58-6c35-57f1-b27c-9d4b676f3b63', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ed134e3c-2ab9-5411-8ed2-17c57fea68ba', '0d4d1558-2dce-555b-a31e-d913d1d709ec', '99599b64-8426-5c71-9a67-7d8476b7d2eb', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9a7073dc-bbd5-5cd5-9e82-f3f12344f917', '0d4d1558-2dce-555b-a31e-d913d1d709ec', 'd8ce4039-b9d4-5e06-8e8c-e5d507c9ea9c', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d6ef21a6-c26e-5699-add1-45b6a106cfe1', '0d4d1558-2dce-555b-a31e-d913d1d709ec', 'a4a8b788-bfdc-55b1-84d0-380654974580', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('cb2c30bc-2861-5251-a085-9435eed4a0a1', '0d4d1558-2dce-555b-a31e-d913d1d709ec', '346777f9-3a05-56ac-a532-17cb17f2d45b', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3e55b3a3-2c63-5587-a57d-a099bc63f2f2', '0d4d1558-2dce-555b-a31e-d913d1d709ec', '0cd8c41f-b1bd-505f-b6dd-dad8da16380f', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3ec10988-873b-504c-8375-718aa22718b9', '0d4d1558-2dce-555b-a31e-d913d1d709ec', '438d8c6e-122a-501e-bf8a-a8db962e4337', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('73ebd767-9fd7-52da-893f-0d159dccee55', '0d4d1558-2dce-555b-a31e-d913d1d709ec', '28b42385-c305-5335-8c90-0cb2c1668b2f', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('025303e4-3d69-5ec6-85cd-ccb1e45b3297', '0d4d1558-2dce-555b-a31e-d913d1d709ec', 'cb4ae14b-a5ae-5be3-87f5-03bdebba98db', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1b72c4e7-5647-520a-8dd2-769d85855dea', '0d4d1558-2dce-555b-a31e-d913d1d709ec', '8b0824f9-36fa-590f-8d99-227ff13aeb80', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('01407bd1-7724-5b98-9587-f7cd41970a6f', '0d4d1558-2dce-555b-a31e-d913d1d709ec', 'ac0b40a5-bfdc-534d-ab0c-e3afd44aab16', 'PARTICIPERA', now()) on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('9f935a9c-eb0e-54b7-a83a-6908a78ce099', 'Visite de la centrale solaire de Kahone', 'Visite de la centrale solaire de Kahone. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants et les partenaires de l’école autour d’un programme préparé par Seynabou Ndour. Pensez à confirmer votre participation pour faciliter l’organisation.', 'Kahone, Kaolack',
  date_trunc('hour', now()) + interval '14 days' + interval '9 hours' - extract(hour from now()) * interval '1 hour',
  date_trunc('hour', now()) + interval '14 days' + interval '24 hours' - extract(hour from now()) * interval '1 hour',
  'ETUDIANTS', 35, false, 'PUBLIE', '4ba85b20-f2d7-5b10-91aa-f71726a6c246', '/api/evenement-images/9f935a9c-eb0e-54b7-a83a-6908a78ce099.jpg', now(), now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('89094eba-e023-5679-ab88-3979030ad04e', '9f935a9c-eb0e-54b7-a83a-6908a78ce099', 'd8ce4039-b9d4-5e06-8e8c-e5d507c9ea9c', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3de4292b-1097-551a-8720-063a5cc72a5f', '9f935a9c-eb0e-54b7-a83a-6908a78ce099', '51225c77-6d76-5efb-8d46-5e0ab767ae87', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('02baf615-6c34-5e06-a3a5-eb87421fe426', '9f935a9c-eb0e-54b7-a83a-6908a78ce099', '4d33cf28-2592-56c3-b033-855cffb14776', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fad08bd5-7e18-5183-909d-47e979c52ab1', '9f935a9c-eb0e-54b7-a83a-6908a78ce099', '6904214d-a1f0-5cf9-b47d-c8344e8ff2c0', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('de982c42-a752-5886-8c80-41cae229ba7b', 'Atelier CV et simulation d’entretien', 'Atelier CV et simulation d’entretien. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants et les partenaires de l’école autour d’un programme préparé par Ndèye Astou Faye. Pensez à confirmer votre participation pour faciliter l’organisation.', 'Amphithéâtre B, EPT',
  date_trunc('hour', now()) + interval '6 days' + interval '18 hours' - extract(hour from now()) * interval '1 hour',
  date_trunc('hour', now()) + interval '6 days' + interval '13 hours' - extract(hour from now()) * interval '1 hour',
  'ETUDIANTS', 50, true, 'PUBLIE', '0f494f58-6c35-57f1-b27c-9d4b676f3b63', null, now(), now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9ba7f98c-8698-5daa-aa3e-b78e316796b0', 'de982c42-a752-5886-8c80-41cae229ba7b', '0cd8c41f-b1bd-505f-b6dd-dad8da16380f', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('caff15a4-76e0-5b5f-ae93-f9ec3473766d', 'de982c42-a752-5886-8c80-41cae229ba7b', '4d33cf28-2592-56c3-b033-855cffb14776', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('55b3cef0-020d-59bc-9d30-7c03a038a224', 'de982c42-a752-5886-8c80-41cae229ba7b', 'af68381f-38ee-55b1-8ae5-65b149d6f4c8', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('aa737860-7d9a-5cf7-9259-ad06ecb21641', 'de982c42-a752-5886-8c80-41cae229ba7b', '0f494f58-6c35-57f1-b27c-9d4b676f3b63', 'PARTICIPERA', now()) on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('ecb4679a-9b5c-5b21-ac53-1f16baee6760', 'Conférence : construire durable au Sahel', 'Conférence : construire durable au Sahel. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants et les partenaires de l’école autour d’un programme préparé par Ibrahima Gueye. Pensez à confirmer votre participation pour faciliter l’organisation.', 'Thiès Ingénierie Conseil, Escale',
  date_trunc('hour', now()) + interval '21 days' + interval '10 hours' - extract(hour from now()) * interval '1 hour',
  date_trunc('hour', now()) + interval '21 days' + interval '21 hours' - extract(hour from now()) * interval '1 hour',
  'TOUS', 120, false, 'PUBLIE', 'ac0b40a5-bfdc-534d-ab0c-e3afd44aab16', '/api/evenement-images/ecb4679a-9b5c-5b21-ac53-1f16baee6760.jpg', now(), now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('143dbe21-3e8a-566e-87be-7f43f2670c89', 'ecb4679a-9b5c-5b21-ac53-1f16baee6760', 'e220afa9-938c-526b-bca4-e7357e3d1208', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ea15cfea-7410-571b-ac58-877e7013a6c2', 'ecb4679a-9b5c-5b21-ac53-1f16baee6760', 'caa7ac70-9b4e-5f0c-99b5-9261e81224f2', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f30b1581-e8c9-5943-84a7-64790c418486', 'ecb4679a-9b5c-5b21-ac53-1f16baee6760', 'af68381f-38ee-55b1-8ae5-65b149d6f4c8', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('677a89cd-01bd-54a0-8b32-18f2cac42421', 'ecb4679a-9b5c-5b21-ac53-1f16baee6760', 'fd215a7e-7fbb-57c5-b04b-57f515003008', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8133a287-0a9a-50ac-a351-5202a7a7dbe3', 'ecb4679a-9b5c-5b21-ac53-1f16baee6760', 'a6c84916-3462-5018-8e9c-bedaeb3b39bd', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('16deb5bb-23c3-5a81-840d-e301e981ba25', 'ecb4679a-9b5c-5b21-ac53-1f16baee6760', '438d8c6e-122a-501e-bf8a-a8db962e4337', 'PARTICIPERA', now()) on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('f26dd6d9-36d4-58fc-9760-a2e25beca31d', 'Webinaire : travailler comme ingénieur au Canada', 'Webinaire : travailler comme ingénieur au Canada. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants et les partenaires de l’école autour d’un programme préparé par Mamadou Faye. Pensez à confirmer votre participation pour faciliter l’organisation.', 'En ligne (lien envoyé aux inscrits)',
  date_trunc('hour', now()) + interval '11 days' + interval '14 hours' - extract(hour from now()) * interval '1 hour',
  date_trunc('hour', now()) + interval '11 days' + interval '20 hours' - extract(hour from now()) * interval '1 hour',
  'TOUS', null, false, 'PUBLIE', 'a4a8b788-bfdc-55b1-84d0-380654974580', null, now(), now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3baef999-0fa1-5ac0-85c1-927183f61ef8', 'f26dd6d9-36d4-58fc-9760-a2e25beca31d', '3ec77c21-295a-5bcf-a1a1-662782624791', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ce051653-6d77-5dd4-be79-57338c0ffe22', 'f26dd6d9-36d4-58fc-9760-a2e25beca31d', '755dbf8a-d991-5272-97a1-ea495c4116fa', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fd7874a8-ab45-56d6-a0e9-fae105d963b3', 'f26dd6d9-36d4-58fc-9760-a2e25beca31d', '346777f9-3a05-56ac-a532-17cb17f2d45b', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('33a45f45-fbca-5c9a-bacd-7667d28ae1e4', 'f26dd6d9-36d4-58fc-9760-a2e25beca31d', 'c45d1c47-7542-5522-8a2e-ede85b53b2ae', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('54ff3eab-da97-5750-a581-c57607940bba', 'f26dd6d9-36d4-58fc-9760-a2e25beca31d', '70ef578a-181c-510a-9cf7-b6cf3ce5f99b', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('158d456b-88c8-54ca-9d2c-bbe6dea72e12', 'f26dd6d9-36d4-58fc-9760-a2e25beca31d', 'd8ce4039-b9d4-5e06-8e8c-e5d507c9ea9c', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('29396d16-1cd3-55e8-aba8-bbb61e9d29c1', 'f26dd6d9-36d4-58fc-9760-a2e25beca31d', 'ac0b40a5-bfdc-534d-ab0c-e3afd44aab16', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d321b90c-0a0f-54ba-81b6-4c2c67ed95be', 'f26dd6d9-36d4-58fc-9760-a2e25beca31d', '2a4cfd61-2f58-5671-b2ca-14cae9884932', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('78716481-48d4-536b-ae0b-a6adefcd5107', 'f26dd6d9-36d4-58fc-9760-a2e25beca31d', 'af68381f-38ee-55b1-8ae5-65b149d6f4c8', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('097c568a-35d9-5787-be2f-5c829c2e9296', 'f26dd6d9-36d4-58fc-9760-a2e25beca31d', '28b42385-c305-5335-8c90-0cb2c1668b2f', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9a34d5be-5490-5c0d-8b68-51c3a7db677d', 'f26dd6d9-36d4-58fc-9760-a2e25beca31d', 'e220afa9-938c-526b-bca4-e7357e3d1208', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('fd843535-180f-5ae6-99b2-84adc0c08c89', 'Journée découverte des métiers de l’aéronautique', 'Journée découverte des métiers de l’aéronautique. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants et les partenaires de l’école autour d’un programme préparé par Alioune Diallo. Pensez à confirmer votre participation pour faciliter l’organisation.', 'AIBD, Diass',
  date_trunc('hour', now()) + interval '40 days' + interval '18 hours' - extract(hour from now()) * interval '1 hour',
  date_trunc('hour', now()) + interval '40 days' + interval '16 hours' - extract(hour from now()) * interval '1 hour',
  'ETUDIANTS', 40, false, 'PUBLIE', '755dbf8a-d991-5272-97a1-ea495c4116fa', '/api/evenement-images/fd843535-180f-5ae6-99b2-84adc0c08c89.jpg', now(), now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5d3daf7f-1dd8-5f48-98c2-d5f9b9393417', 'fd843535-180f-5ae6-99b2-84adc0c08c89', '6904214d-a1f0-5cf9-b47d-c8344e8ff2c0', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('473fb193-c69c-5b7e-8575-6a8376a836b2', 'fd843535-180f-5ae6-99b2-84adc0c08c89', 'd8ce4039-b9d4-5e06-8e8c-e5d507c9ea9c', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('68bd5263-c0b5-5830-9527-1a916fb4e322', 'fd843535-180f-5ae6-99b2-84adc0c08c89', 'af68381f-38ee-55b1-8ae5-65b149d6f4c8', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('81209e3f-5808-5ea2-aca4-5228bffc695a', 'fd843535-180f-5ae6-99b2-84adc0c08c89', '51225c77-6d76-5efb-8d46-5e0ab767ae87', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8945da45-23dc-56c4-a53f-841b276d55c3', 'fd843535-180f-5ae6-99b2-84adc0c08c89', '4d33cf28-2592-56c3-b033-855cffb14776', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('12b69d43-1b28-5be4-8073-6c697c9834fa', 'fd843535-180f-5ae6-99b2-84adc0c08c89', '5caabf0a-289b-50a6-b714-75d251427d31', 'PARTICIPERA', now()) on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('eb257261-054c-5491-808f-f0a09890bcd4', 'Tournoi de football inter-promotions', 'Tournoi de football inter-promotions. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants et les partenaires de l’école autour d’un programme préparé par Pape Sy. Pensez à confirmer votre participation pour faciliter l’organisation.', 'Stade Lat Dior, Thiès',
  date_trunc('hour', now()) + interval '28 days' + interval '18 hours' - extract(hour from now()) * interval '1 hour',
  date_trunc('hour', now()) + interval '28 days' + interval '25 hours' - extract(hour from now()) * interval '1 hour',
  'TOUS', null, false, 'PUBLIE', 'f963c1e1-ddad-5c37-aeec-73a4a0871d57', null, now(), now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('46982c0f-07cc-5f74-8f80-528786c569a3', 'eb257261-054c-5491-808f-f0a09890bcd4', '0f494f58-6c35-57f1-b27c-9d4b676f3b63', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('73d56e9a-fe4d-5a05-90e1-1549fcaae5ef', 'eb257261-054c-5491-808f-f0a09890bcd4', 'ac0b40a5-bfdc-534d-ab0c-e3afd44aab16', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ceed7994-f925-5aa0-9ffa-23e7d6be2858', 'eb257261-054c-5491-808f-f0a09890bcd4', '4ba85b20-f2d7-5b10-91aa-f71726a6c246', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('057ac6ed-ae77-5505-a013-c5c4a1d084b6', 'eb257261-054c-5491-808f-f0a09890bcd4', '28b42385-c305-5335-8c90-0cb2c1668b2f', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a63b2291-f80c-56c1-b260-9209fe857d91', 'eb257261-054c-5491-808f-f0a09890bcd4', '755dbf8a-d991-5272-97a1-ea495c4116fa', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a976a1f6-e540-5db4-b876-3eb49ec29f3b', 'eb257261-054c-5491-808f-f0a09890bcd4', '346777f9-3a05-56ac-a532-17cb17f2d45b', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e6aadcb9-616d-57b0-846a-97380bde700b', 'eb257261-054c-5491-808f-f0a09890bcd4', 'a4a8b788-bfdc-55b1-84d0-380654974580', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('513180f0-c081-53a3-b0b2-505de6efe5a4', 'eb257261-054c-5491-808f-f0a09890bcd4', 'af68381f-38ee-55b1-8ae5-65b149d6f4c8', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1346af89-c935-53c2-ba00-5c0e51ad353c', 'eb257261-054c-5491-808f-f0a09890bcd4', '57518406-14da-54a4-bab0-408d9f6bb421', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4d99602d-9f4b-5b77-981c-068fd0379dc7', 'eb257261-054c-5491-808f-f0a09890bcd4', 'cb4ae14b-a5ae-5be3-87f5-03bdebba98db', 'PARTICIPERA', now()) on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('9cb048dd-5d49-50c4-bce6-7d19a80aaec8', 'Lancement du programme de mentorat 2026-2027', 'Lancement du programme de mentorat 2026-2027. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants et les partenaires de l’école autour d’un programme préparé par Saliou Ka. Pensez à confirmer votre participation pour faciliter l’organisation.', 'Salle du conseil, EPT',
  date_trunc('hour', now()) + interval '4 days' + interval '9 hours' - extract(hour from now()) * interval '1 hour',
  date_trunc('hour', now()) + interval '4 days' + interval '16 hours' - extract(hour from now()) * interval '1 hour',
  'TOUS', 100, true, 'PUBLIE', 'af68381f-38ee-55b1-8ae5-65b149d6f4c8', null, now(), now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('71f8e1a9-9bd0-5dc8-8ca8-a3f9d8113beb', '9cb048dd-5d49-50c4-bce6-7d19a80aaec8', '0cd8c41f-b1bd-505f-b6dd-dad8da16380f', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('29040371-5162-5e76-9d7d-3b2e7e3b8f09', '9cb048dd-5d49-50c4-bce6-7d19a80aaec8', '8860b22b-057b-5a11-aa09-11335b1ef58f', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e76ff88b-47f8-5913-aae2-5b308fece7ff', '9cb048dd-5d49-50c4-bce6-7d19a80aaec8', '4d33cf28-2592-56c3-b033-855cffb14776', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2ab9c5ad-c3d8-5ec4-bce1-b09bc99002f5', '9cb048dd-5d49-50c4-bce6-7d19a80aaec8', 'c45d1c47-7542-5522-8a2e-ede85b53b2ae', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('43c907ee-a876-5d56-b32a-f9675a53e3fe', '9cb048dd-5d49-50c4-bce6-7d19a80aaec8', 'd8ce4039-b9d4-5e06-8e8c-e5d507c9ea9c', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('52088cde-67a6-5c52-960f-545aac8df5a4', '9cb048dd-5d49-50c4-bce6-7d19a80aaec8', '51225c77-6d76-5efb-8d46-5e0ab767ae87', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1613a4ca-eae6-5ced-9c7d-afa78cdeadfb', '9cb048dd-5d49-50c4-bce6-7d19a80aaec8', 'e220afa9-938c-526b-bca4-e7357e3d1208', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0b70740e-5bbc-5973-ba3d-9eb249067bd5', '9cb048dd-5d49-50c4-bce6-7d19a80aaec8', 'a4a8b788-bfdc-55b1-84d0-380654974580', 'PARTICIPERA', now()) on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('b11c07d1-5d62-573e-bdb0-6a5f7003b8e2', 'Atelier pratique : sécurité des applications web', 'Atelier pratique : sécurité des applications web. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants et les partenaires de l’école autour d’un programme préparé par Khady Sow. Pensez à confirmer votre participation pour faciliter l’organisation.', 'Laboratoire informatique, EPT',
  date_trunc('hour', now()) + interval '47 days' + interval '14 hours' - extract(hour from now()) * interval '1 hour',
  date_trunc('hour', now()) + interval '47 days' + interval '13 hours' - extract(hour from now()) * interval '1 hour',
  'ETUDIANTS', 30, false, 'PUBLIE', '2a4cfd61-2f58-5671-b2ca-14cae9884932', null, now(), now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('253462d3-d39b-59c3-820c-10b8b1d0887e', 'b11c07d1-5d62-573e-bdb0-6a5f7003b8e2', '4d33cf28-2592-56c3-b033-855cffb14776', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7cea2a75-11ed-5844-927c-f99c462be5b2', 'b11c07d1-5d62-573e-bdb0-6a5f7003b8e2', '57518406-14da-54a4-bab0-408d9f6bb421', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4b5b6281-1834-52ba-b514-d433ff79fe6c', 'b11c07d1-5d62-573e-bdb0-6a5f7003b8e2', '5caabf0a-289b-50a6-b714-75d251427d31', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('318baeb4-af78-5b2e-ba27-1db3fd34d49a', 'b11c07d1-5d62-573e-bdb0-6a5f7003b8e2', '6904214d-a1f0-5cf9-b47d-c8344e8ff2c0', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3668fad3-3dd6-52f9-a933-879d8ab2a72c', 'b11c07d1-5d62-573e-bdb0-6a5f7003b8e2', 'd8ce4039-b9d4-5e06-8e8c-e5d507c9ea9c', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4a4a964a-5779-518e-b69b-60dc0c9f015b', 'b11c07d1-5d62-573e-bdb0-6a5f7003b8e2', '51225c77-6d76-5efb-8d46-5e0ab767ae87', 'PARTICIPERA', now()) on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('15a8e064-2ed3-56c2-b78f-237daee69c40', 'Dix ans de la promotion 2016', 'Dix ans de la promotion 2016. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants et les partenaires de l’école autour d’un programme préparé par Ousmane Ndiaye. Pensez à confirmer votre participation pour faciliter l’organisation.', 'Saly Portudal, Mbour',
  date_trunc('hour', now()) + interval '60 days' + interval '9 hours' - extract(hour from now()) * interval '1 hour',
  date_trunc('hour', now()) + interval '60 days' + interval '24 hours' - extract(hour from now()) * interval '1 hour',
  'ALUMNI', 90, false, 'PUBLIE', 'a6c84916-3462-5018-8e9c-bedaeb3b39bd', null, now(), now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a9b66074-c5b8-5d06-a037-14c5c7e2cbba', '15a8e064-2ed3-56c2-b78f-237daee69c40', '28b42385-c305-5335-8c90-0cb2c1668b2f', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('db0ced7d-59aa-5dc6-ac2e-42e9167b7abe', '15a8e064-2ed3-56c2-b78f-237daee69c40', 'f963c1e1-ddad-5c37-aeec-73a4a0871d57', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d0c9c924-753d-5282-bae8-a220b4c49c24', '15a8e064-2ed3-56c2-b78f-237daee69c40', '1538e22c-a2a9-5eee-9a99-7a5ac9d211be', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a818b4b1-dd18-5a65-a0f3-f6138b55372c', '15a8e064-2ed3-56c2-b78f-237daee69c40', 'a6c84916-3462-5018-8e9c-bedaeb3b39bd', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6eccaca4-8e1f-5c37-abeb-ede869f9b3af', '15a8e064-2ed3-56c2-b78f-237daee69c40', 'a4a8b788-bfdc-55b1-84d0-380654974580', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('72866568-e02f-5c7e-be5b-16cee84a6df9', '15a8e064-2ed3-56c2-b78f-237daee69c40', '3ec77c21-295a-5bcf-a1a1-662782624791', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9a2306fd-c368-512f-a776-ef3275353799', '15a8e064-2ed3-56c2-b78f-237daee69c40', '0f494f58-6c35-57f1-b27c-9d4b676f3b63', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('78a2e932-5695-563e-8307-f35b8cd8b809', '15a8e064-2ed3-56c2-b78f-237daee69c40', '217acb44-3d62-541a-ad55-20b393defe14', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6b3b9e5e-4b6a-5da0-8d44-729705b31d36', '15a8e064-2ed3-56c2-b78f-237daee69c40', '8b0824f9-36fa-590f-8d99-227ff13aeb80', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('74a81a1b-3827-591b-8194-30717e93aecf', '15a8e064-2ed3-56c2-b78f-237daee69c40', '5caabf0a-289b-50a6-b714-75d251427d31', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('05138dc3-3d37-5d60-b7ed-b7b1e8c31888', '15a8e064-2ed3-56c2-b78f-237daee69c40', '4d33cf28-2592-56c3-b033-855cffb14776', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('366bc6b5-32b0-57be-83eb-a54edf138fef', '15a8e064-2ed3-56c2-b78f-237daee69c40', '8860b22b-057b-5a11-aa09-11335b1ef58f', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4bd74466-02a9-5e99-ab1b-7942b429265b', '15a8e064-2ed3-56c2-b78f-237daee69c40', 'c45d1c47-7542-5522-8a2e-ede85b53b2ae', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('006030c1-a684-563c-b41b-56b26b17be17', '15a8e064-2ed3-56c2-b78f-237daee69c40', 'f43959e1-0009-5285-b7d8-1da0861fad73', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5c6b8beb-435d-5ba3-aad7-fc83aa8cb0f1', '15a8e064-2ed3-56c2-b78f-237daee69c40', '4ba85b20-f2d7-5b10-91aa-f71726a6c246', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8ae0a181-a8b2-5762-a914-891576fa7d40', '15a8e064-2ed3-56c2-b78f-237daee69c40', '346777f9-3a05-56ac-a532-17cb17f2d45b', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('78ce19dc-851b-5a39-a1d8-5ff4339c9ced', '15a8e064-2ed3-56c2-b78f-237daee69c40', 'af68381f-38ee-55b1-8ae5-65b149d6f4c8', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('845546d6-c45f-5425-9f92-2a099f222ed0', '15a8e064-2ed3-56c2-b78f-237daee69c40', '99599b64-8426-5c71-9a67-7d8476b7d2eb', 'PARTICIPERA', now()) on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('6d32b726-ba8a-54ba-909d-7882a831ab62', 'Visite d’usine : maintenance prédictive', 'Visite d’usine : maintenance prédictive. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants et les partenaires de l’école autour d’un programme préparé par Moussa Diop. Pensez à confirmer votre participation pour faciliter l’organisation.', 'Baobab Énergie, Thiès',
  date_trunc('hour', now()) + interval '-12 days' + interval '9 hours' - extract(hour from now()) * interval '1 hour',
  date_trunc('hour', now()) + interval '-12 days' + interval '19 hours' - extract(hour from now()) * interval '1 hour',
  'ETUDIANTS', 30, false, 'PUBLIE', '217acb44-3d62-541a-ad55-20b393defe14', null, now(), now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('205cc063-cb3b-5983-ab01-8fd36ad1b888', '6d32b726-ba8a-54ba-909d-7882a831ab62', '438d8c6e-122a-501e-bf8a-a8db962e4337', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('82f1306f-09d6-5eec-abc9-27e88780847e', '6d32b726-ba8a-54ba-909d-7882a831ab62', 'af68381f-38ee-55b1-8ae5-65b149d6f4c8', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('30a390c8-28e8-5ea9-8e55-a33811e6e29c', '6d32b726-ba8a-54ba-909d-7882a831ab62', '51225c77-6d76-5efb-8d46-5e0ab767ae87', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5b56f47d-5b31-5432-b467-0d349e45dbd0', '6d32b726-ba8a-54ba-909d-7882a831ab62', '99599b64-8426-5c71-9a67-7d8476b7d2eb', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('716dc7bc-afc8-5cc9-b9f7-23eda4aac3c8', '6d32b726-ba8a-54ba-909d-7882a831ab62', '4d33cf28-2592-56c3-b033-855cffb14776', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c4493708-606e-55a0-a9a8-9244b584b934', '6d32b726-ba8a-54ba-909d-7882a831ab62', '0f494f58-6c35-57f1-b27c-9d4b676f3b63', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1d40acd8-d2e8-59b4-8a8b-cbd93e8c8b7b', '6d32b726-ba8a-54ba-909d-7882a831ab62', '0cd8c41f-b1bd-505f-b6dd-dad8da16380f', 'PARTICIPERA', now()) on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('b145ed21-8d9e-583a-910e-a2dd1c1739ae', 'Conférence : l’ingénieur face au numérique', 'Conférence : l’ingénieur face au numérique. Un moment d’échange ouvert à la communauté EPT : retrouvez les diplômés, les étudiants et les partenaires de l’école autour d’un programme préparé par Saliou Ka. Pensez à confirmer votre participation pour faciliter l’organisation.', 'Amphithéâtre A, EPT',
  date_trunc('hour', now()) + interval '-26 days' + interval '10 hours' - extract(hour from now()) * interval '1 hour',
  date_trunc('hour', now()) + interval '-26 days' + interval '21 hours' - extract(hour from now()) * interval '1 hour',
  'TOUS', null, true, 'PUBLIE', 'af68381f-38ee-55b1-8ae5-65b149d6f4c8', null, now(), now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('822f86d3-aff1-527b-9549-e8595239f6f5', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', '346777f9-3a05-56ac-a532-17cb17f2d45b', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('54025d97-6e4a-5653-829a-8e703df4724d', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', '57518406-14da-54a4-bab0-408d9f6bb421', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e2d7e20d-70e4-5009-a3f3-02b7b90d77fa', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', '2a4cfd61-2f58-5671-b2ca-14cae9884932', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('53641226-6bbd-56e7-a3ef-40042349ccff', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', 'ac0b40a5-bfdc-534d-ab0c-e3afd44aab16', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0d2e310f-f9c4-5260-9b74-ada67bb4b0af', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', '8860b22b-057b-5a11-aa09-11335b1ef58f', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('83baffdf-6f68-57eb-b205-e9ddab762179', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', '1538e22c-a2a9-5eee-9a99-7a5ac9d211be', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b40c33a4-49b0-5e48-80f3-2302f52bd8fb', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', '4d33cf28-2592-56c3-b033-855cffb14776', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('cfb25cb6-7772-51fe-9e60-b50d28ce931c', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', '0cd8c41f-b1bd-505f-b6dd-dad8da16380f', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('face3fbd-7ca4-51e3-8007-9472aae2cebc', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', '8b0824f9-36fa-590f-8d99-227ff13aeb80', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d1c496a7-1a6b-5080-95e7-b930bceace42', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', 'd8ce4039-b9d4-5e06-8e8c-e5d507c9ea9c', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('80618c02-0f07-5cfb-8991-c10818304830', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', '5caabf0a-289b-50a6-b714-75d251427d31', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1f45ebed-a1f1-5c32-9634-afabf40d5971', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', 'caa7ac70-9b4e-5f0c-99b5-9261e81224f2', 'NE_PARTICIPERA_PAS', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('daf78a43-7b72-55aa-9efa-771cae1aae5c', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', 'cb4ae14b-a5ae-5be3-87f5-03bdebba98db', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c4690e16-0bfb-53a5-974c-d0d44df6f742', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', '0f494f58-6c35-57f1-b27c-9d4b676f3b63', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7eb023b6-4354-5b76-9cb2-a9163b8c95f9', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', '3ec77c21-295a-5bcf-a1a1-662782624791', 'PARTICIPERA', now()) on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ea622e5b-b15a-5829-b2d0-472696abf5c6', 'b145ed21-8d9e-583a-910e-a2dd1c1739ae', '438d8c6e-122a-501e-bf8a-a8db962e4337', 'PARTICIPERA', now()) on conflict do nothing;
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('27475a65-b6f1-577d-b929-50e46fe82d60', '1538e22c-a2a9-5eee-9a99-7a5ac9d211be', 'Ingénieure génie informatique et télécommunications (promo 2012). J’accompagne volontiers les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 2, now(), now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '27475a65-b6f1-577d-b929-50e46fe82d60', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '27475a65-b6f1-577d-b929-50e46fe82d60' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '27475a65-b6f1-577d-b929-50e46fe82d60', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '27475a65-b6f1-577d-b929-50e46fe82d60' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '27475a65-b6f1-577d-b929-50e46fe82d60', d.id from domaines_mentorat d where d.code = 'CYBERSECURITE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '27475a65-b6f1-577d-b929-50e46fe82d60' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '27475a65-b6f1-577d-b929-50e46fe82d60', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '27475a65-b6f1-577d-b929-50e46fe82d60' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('5900cf20-0674-5c29-a51f-70cb6b6b00be', 'a6c84916-3462-5018-8e9c-bedaeb3b39bd', 'Ingénieur génie informatique et télécommunications (promo 2016). J’accompagne volontiers les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 3, now(), now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '5900cf20-0674-5c29-a51f-70cb6b6b00be', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '5900cf20-0674-5c29-a51f-70cb6b6b00be' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '5900cf20-0674-5c29-a51f-70cb6b6b00be', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '5900cf20-0674-5c29-a51f-70cb6b6b00be' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '5900cf20-0674-5c29-a51f-70cb6b6b00be', d.id from domaines_mentorat d where d.code = 'CYBERSECURITE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '5900cf20-0674-5c29-a51f-70cb6b6b00be' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('bea50895-9451-5faa-98c3-900526d4917f', 'fd215a7e-7fbb-57c5-b04b-57f515003008', 'Ingénieure génie informatique et télécommunications (promo 2019). J’accompagne volontiers les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 3, now(), now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'bea50895-9451-5faa-98c3-900526d4917f', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'bea50895-9451-5faa-98c3-900526d4917f' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'bea50895-9451-5faa-98c3-900526d4917f', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'bea50895-9451-5faa-98c3-900526d4917f' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'bea50895-9451-5faa-98c3-900526d4917f', d.id from domaines_mentorat d where d.code = 'CYBERSECURITE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'bea50895-9451-5faa-98c3-900526d4917f' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'bea50895-9451-5faa-98c3-900526d4917f', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'bea50895-9451-5faa-98c3-900526d4917f' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('d306496e-6d4a-534b-9b86-04bdaf9281a4', 'a4a8b788-bfdc-55b1-84d0-380654974580', 'Ingénieur génie informatique et télécommunications (promo 2021). J’accompagne volontiers les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 4, now(), now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'd306496e-6d4a-534b-9b86-04bdaf9281a4', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'd306496e-6d4a-534b-9b86-04bdaf9281a4' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'd306496e-6d4a-534b-9b86-04bdaf9281a4', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'd306496e-6d4a-534b-9b86-04bdaf9281a4' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'd306496e-6d4a-534b-9b86-04bdaf9281a4', d.id from domaines_mentorat d where d.code = 'CYBERSECURITE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'd306496e-6d4a-534b-9b86-04bdaf9281a4' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('1be24203-4709-57ec-9145-6dd9b4e5eeed', '2a4cfd61-2f58-5671-b2ca-14cae9884932', 'Ingénieure génie informatique et télécommunications (promo 2014). J’accompagne volontiers les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 1, now(), now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '1be24203-4709-57ec-9145-6dd9b4e5eeed', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '1be24203-4709-57ec-9145-6dd9b4e5eeed' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '1be24203-4709-57ec-9145-6dd9b4e5eeed', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '1be24203-4709-57ec-9145-6dd9b4e5eeed' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '1be24203-4709-57ec-9145-6dd9b4e5eeed', d.id from domaines_mentorat d where d.code = 'CYBERSECURITE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '1be24203-4709-57ec-9145-6dd9b4e5eeed' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '1be24203-4709-57ec-9145-6dd9b4e5eeed', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '1be24203-4709-57ec-9145-6dd9b4e5eeed' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('39068fb2-dc3c-5ecd-96f4-587ed2f2f817', 'ac0b40a5-bfdc-534d-ab0c-e3afd44aab16', 'Ingénieur génie civil (promo 2010). J’accompagne volontiers les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 2, now(), now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '39068fb2-dc3c-5ecd-96f4-587ed2f2f817', d.id from domaines_mentorat d where d.code = 'GENIE_CIVIL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '39068fb2-dc3c-5ecd-96f4-587ed2f2f817' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '39068fb2-dc3c-5ecd-96f4-587ed2f2f817', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '39068fb2-dc3c-5ecd-96f4-587ed2f2f817' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('7e01516a-3021-5653-b690-069daeeb0256', 'e220afa9-938c-526b-bca4-e7357e3d1208', 'Ingénieure génie civil (promo 2015). J’accompagne volontiers les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', false, 3, now(), now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '7e01516a-3021-5653-b690-069daeeb0256', d.id from domaines_mentorat d where d.code = 'GENIE_CIVIL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '7e01516a-3021-5653-b690-069daeeb0256' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '7e01516a-3021-5653-b690-069daeeb0256', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '7e01516a-3021-5653-b690-069daeeb0256' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '7e01516a-3021-5653-b690-069daeeb0256', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '7e01516a-3021-5653-b690-069daeeb0256' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('270ae719-3076-5fb3-9edd-ad9525430589', '3ec77c21-295a-5bcf-a1a1-662782624791', 'Ingénieur génie civil (promo 2018). J’accompagne volontiers les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 3, now(), now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '270ae719-3076-5fb3-9edd-ad9525430589', d.id from domaines_mentorat d where d.code = 'GENIE_CIVIL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '270ae719-3076-5fb3-9edd-ad9525430589' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '270ae719-3076-5fb3-9edd-ad9525430589', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '270ae719-3076-5fb3-9edd-ad9525430589' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('722cbf70-d0d5-5339-a1b4-f3dd9e3341e9', 'cb4ae14b-a5ae-5be3-87f5-03bdebba98db', 'Ingénieure génie civil (promo 2022). J’accompagne volontiers les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 4, now(), now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '722cbf70-d0d5-5339-a1b4-f3dd9e3341e9', d.id from domaines_mentorat d where d.code = 'GENIE_CIVIL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '722cbf70-d0d5-5339-a1b4-f3dd9e3341e9' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '722cbf70-d0d5-5339-a1b4-f3dd9e3341e9', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '722cbf70-d0d5-5339-a1b4-f3dd9e3341e9' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '722cbf70-d0d5-5339-a1b4-f3dd9e3341e9', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '722cbf70-d0d5-5339-a1b4-f3dd9e3341e9' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('78f20901-5dc7-5d3e-b03e-9d27a5ee0a89', '217acb44-3d62-541a-ad55-20b393defe14', 'Ingénieur génie électromécanique (promo 2011). J’accompagne volontiers les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 1, now(), now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '78f20901-5dc7-5d3e-b03e-9d27a5ee0a89', d.id from domaines_mentorat d where d.code = 'ELECTROMECANIQUE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '78f20901-5dc7-5d3e-b03e-9d27a5ee0a89' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '78f20901-5dc7-5d3e-b03e-9d27a5ee0a89', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '78f20901-5dc7-5d3e-b03e-9d27a5ee0a89' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('d38949a1-4c20-5252-9525-992a3df23a72', '4ba85b20-f2d7-5b10-91aa-f71726a6c246', 'Ingénieure génie électromécanique (promo 2017). J’accompagne volontiers les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 2, now(), now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'd38949a1-4c20-5252-9525-992a3df23a72', d.id from domaines_mentorat d where d.code = 'ELECTROMECANIQUE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'd38949a1-4c20-5252-9525-992a3df23a72' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'd38949a1-4c20-5252-9525-992a3df23a72', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'd38949a1-4c20-5252-9525-992a3df23a72' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'd38949a1-4c20-5252-9525-992a3df23a72', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'd38949a1-4c20-5252-9525-992a3df23a72' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('597de060-51fd-5fd2-a6f9-d1991c341172', 'f43959e1-0009-5285-b7d8-1da0861fad73', 'Ingénieur génie électromécanique (promo 2020). J’accompagne volontiers les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 3, now(), now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '597de060-51fd-5fd2-a6f9-d1991c341172', d.id from domaines_mentorat d where d.code = 'ELECTROMECANIQUE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '597de060-51fd-5fd2-a6f9-d1991c341172' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '597de060-51fd-5fd2-a6f9-d1991c341172', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '597de060-51fd-5fd2-a6f9-d1991c341172' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('48986117-a66b-54d1-91f2-f9f7b7144eb3', 'caa7ac70-9b4e-5f0c-99b5-9261e81224f2', 'Ingénieure génie industriel (promo 2013). J’accompagne volontiers les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 3, now(), now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '48986117-a66b-54d1-91f2-f9f7b7144eb3', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '48986117-a66b-54d1-91f2-f9f7b7144eb3' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '48986117-a66b-54d1-91f2-f9f7b7144eb3', d.id from domaines_mentorat d where d.code = 'ENTREPRENEURIAT'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '48986117-a66b-54d1-91f2-f9f7b7144eb3' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '48986117-a66b-54d1-91f2-f9f7b7144eb3', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '48986117-a66b-54d1-91f2-f9f7b7144eb3' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('942e5afd-b880-545a-9e84-cfdd80164f42', 'f963c1e1-ddad-5c37-aeec-73a4a0871d57', 'Ingénieur génie industriel (promo 2019). J’accompagne volontiers les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', false, 4, now(), now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '942e5afd-b880-545a-9e84-cfdd80164f42', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '942e5afd-b880-545a-9e84-cfdd80164f42' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '942e5afd-b880-545a-9e84-cfdd80164f42', d.id from domaines_mentorat d where d.code = 'ENTREPRENEURIAT'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '942e5afd-b880-545a-9e84-cfdd80164f42' and x.domaine_id = d.id);
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '9b9da464-618e-58aa-8601-aef0f2302526', '6904214d-a1f0-5cf9-b47d-c8344e8ff2c0', '27475a65-b6f1-577d-b929-50e46fe82d60', d.id, 'Préparer mon stage de fin d’études et mes entretiens.', 'ACCEPTEE', null, now() - interval '10 days', now() - interval '8 days', null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('f31637f9-ffbd-5460-873b-d21602bca40e', '9b9da464-618e-58aa-8601-aef0f2302526', date_trunc('hour', now()) + interval '-5 days', 45, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo', 'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '1538e22c-a2a9-5eee-9a99-7a5ac9d211be', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('ed640ccd-daea-53d8-9094-dd1bf239d158', '9b9da464-618e-58aa-8601-aef0f2302526', date_trunc('hour', now()) + interval '-4 days', 60, 'PRESENTIEL', 'Bibliothèque de l’EPT', 'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '1538e22c-a2a9-5eee-9a99-7a5ac9d211be', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('05a8b5cc-051c-50ae-b86d-f4e5b6df83f5', '9b9da464-618e-58aa-8601-aef0f2302526', date_trunc('hour', now()) + interval '7 days', 30, 'TELEPHONE', null, 'PLANIFIEE', null, '1538e22c-a2a9-5eee-9a99-7a5ac9d211be', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '031c8d85-af1b-5b65-ab6d-9d444802ab35', '4d33cf28-2592-56c3-b033-855cffb14776', '27475a65-b6f1-577d-b929-50e46fe82d60', d.id, 'Choisir une spécialisation et construire mon projet professionnel.', 'TERMINEE', null, now() - interval '14 days', now() - interval '12 days', now() - interval '3 days', 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('b4579589-5115-5d9c-abe6-14ba703e677a', '031c8d85-af1b-5b65-ab6d-9d444802ab35', date_trunc('hour', now()) + interval '-9 days', 45, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo', 'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '1538e22c-a2a9-5eee-9a99-7a5ac9d211be', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('334f5fc5-0bf4-5672-9d10-0a10bbbd6e40', '031c8d85-af1b-5b65-ab6d-9d444802ab35', date_trunc('hour', now()) + interval '-4 days', 60, 'PRESENTIEL', 'Bibliothèque de l’EPT', 'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '1538e22c-a2a9-5eee-9a99-7a5ac9d211be', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('53c135d6-e30b-5cb8-b53e-91fec1f0acc2', '031c8d85-af1b-5b65-ab6d-9d444802ab35', '4d33cf28-2592-56c3-b033-855cffb14776', 5, 'Des conseils concrets et une vraie disponibilité. Merci !', now()) on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '041512b9-578e-5205-8b50-f508ff17c6fa', '0cd8c41f-b1bd-505f-b6dd-dad8da16380f', '5900cf20-0674-5c29-a51f-70cb6b6b00be', d.id, 'Comprendre le métier au quotidien et préparer ma première candidature.', 'EN_ATTENTE', null, now() - interval '18 days', null, null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '7a29d226-62e0-5665-9139-735f97977ab1', '5caabf0a-289b-50a6-b714-75d251427d31', 'bea50895-9451-5faa-98c3-900526d4917f', d.id, 'Monter un projet entrepreneurial avec des camarades.', 'ACCEPTEE', null, now() - interval '22 days', now() - interval '20 days', null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('1f94e715-88ec-5a6b-b1be-e1a5270c65f7', '7a29d226-62e0-5665-9139-735f97977ab1', date_trunc('hour', now()) + interval '-17 days', 45, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo', 'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', 'fd215a7e-7fbb-57c5-b04b-57f515003008', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('76420c62-0870-5d22-addd-7230143e3c7d', '7a29d226-62e0-5665-9139-735f97977ab1', date_trunc('hour', now()) + interval '-4 days', 60, 'PRESENTIEL', 'Bibliothèque de l’EPT', 'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', 'fd215a7e-7fbb-57c5-b04b-57f515003008', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('5dd06bff-a3d4-5b60-a5bc-f33918c33a4f', '7a29d226-62e0-5665-9139-735f97977ab1', date_trunc('hour', now()) + interval '10 days', 30, 'TELEPHONE', null, 'PLANIFIEE', null, 'fd215a7e-7fbb-57c5-b04b-57f515003008', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '0c48fc05-9230-5f16-a089-b201c3603577', '57518406-14da-54a4-bab0-408d9f6bb421', 'bea50895-9451-5faa-98c3-900526d4917f', d.id, 'Préparer mon stage de fin d’études et mes entretiens.', 'REFUSEE', 'Mon agenda est complet ce semestre, je vous recommande un autre mentor du même domaine.', now() - interval '26 days', now() - interval '24 days', null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'dda77fb9-5ee0-52fd-91f0-7571425cec23', '0cd8c41f-b1bd-505f-b6dd-dad8da16380f', '39068fb2-dc3c-5ecd-96f4-587ed2f2f817', d.id, 'Choisir une spécialisation et construire mon projet professionnel.', 'ACCEPTEE', null, now() - interval '30 days', now() - interval '28 days', null, 0
from domaines_mentorat d where d.code = 'GENIE_CIVIL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('d74c6e0e-c18b-5b4e-98d7-70b45d295241', 'dda77fb9-5ee0-52fd-91f0-7571425cec23', date_trunc('hour', now()) + interval '-25 days', 45, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo', 'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', 'ac0b40a5-bfdc-534d-ab0c-e3afd44aab16', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('c1472048-36b8-529f-906a-8ca0e48552c5', 'dda77fb9-5ee0-52fd-91f0-7571425cec23', date_trunc('hour', now()) + interval '-4 days', 60, 'PRESENTIEL', 'Bibliothèque de l’EPT', 'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', 'ac0b40a5-bfdc-534d-ab0c-e3afd44aab16', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('79b78327-ffd4-52f8-b0bf-2210b4bc0ae9', 'dda77fb9-5ee0-52fd-91f0-7571425cec23', date_trunc('hour', now()) + interval '12 days', 30, 'TELEPHONE', null, 'PLANIFIEE', null, 'ac0b40a5-bfdc-534d-ab0c-e3afd44aab16', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'f9359ac2-efc6-59c2-ae4c-7956fe5947d3', '438d8c6e-122a-501e-bf8a-a8db962e4337', '270ae719-3076-5fb3-9edd-ad9525430589', d.id, 'Comprendre le métier au quotidien et préparer ma première candidature.', 'EN_ATTENTE', null, now() - interval '34 days', null, null, 0
from domaines_mentorat d where d.code = 'GENIE_CIVIL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'b6c992c3-e144-5fc7-897a-4fd98e41c636', '5caabf0a-289b-50a6-b714-75d251427d31', '78f20901-5dc7-5d3e-b03e-9d27a5ee0a89', d.id, 'Monter un projet entrepreneurial avec des camarades.', 'TERMINEE', null, now() - interval '38 days', now() - interval '36 days', now() - interval '3 days', 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('e381b5e1-ce42-503c-b35e-9f95365f4f93', 'b6c992c3-e144-5fc7-897a-4fd98e41c636', date_trunc('hour', now()) + interval '-33 days', 45, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo', 'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '217acb44-3d62-541a-ad55-20b393defe14', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('a8bfcd9a-4902-5b52-a5a4-fc355305f0fa', 'b6c992c3-e144-5fc7-897a-4fd98e41c636', date_trunc('hour', now()) + interval '-4 days', 60, 'PRESENTIEL', 'Bibliothèque de l’EPT', 'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '217acb44-3d62-541a-ad55-20b393defe14', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('30b7a8f0-4f7e-5ac6-bb88-56808992c764', 'b6c992c3-e144-5fc7-897a-4fd98e41c636', '5caabf0a-289b-50a6-b714-75d251427d31', 5, 'Des conseils concrets et une vraie disponibilité. Merci !', now()) on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '5df74f9e-4c38-5b58-b82e-25a0e7a505a3', 'd8ce4039-b9d4-5e06-8e8c-e5d507c9ea9c', 'd38949a1-4c20-5252-9525-992a3df23a72', d.id, 'Préparer mon stage de fin d’études et mes entretiens.', 'ACCEPTEE', null, now() - interval '42 days', now() - interval '40 days', null, 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('e7fb03f8-c241-516e-8b76-c32535d569fb', '5df74f9e-4c38-5b58-b82e-25a0e7a505a3', date_trunc('hour', now()) + interval '-37 days', 45, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo', 'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '4ba85b20-f2d7-5b10-91aa-f71726a6c246', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('3b3b0d72-ac00-57b7-a8fb-ebd11421c9ea', '5df74f9e-4c38-5b58-b82e-25a0e7a505a3', date_trunc('hour', now()) + interval '-4 days', 60, 'PRESENTIEL', 'Bibliothèque de l’EPT', 'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '4ba85b20-f2d7-5b10-91aa-f71726a6c246', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('8e35ccdd-77d7-5ea0-a3a0-5bf94d0a73ec', '5df74f9e-4c38-5b58-b82e-25a0e7a505a3', date_trunc('hour', now()) + interval '15 days', 30, 'TELEPHONE', null, 'PLANIFIEE', null, '4ba85b20-f2d7-5b10-91aa-f71726a6c246', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '2c4f7b88-c5ce-59db-a34a-ee70bf421081', '57518406-14da-54a4-bab0-408d9f6bb421', '48986117-a66b-54d1-91f2-f9f7b7144eb3', d.id, 'Choisir une spécialisation et construire mon projet professionnel.', 'EN_ATTENTE', null, now() - interval '46 days', null, null, 0
from domaines_mentorat d where d.code = 'GESTION_PROJET' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '83c232a0-bdd6-5f42-a61b-ea1e81caa358', 'd8ce4039-b9d4-5e06-8e8c-e5d507c9ea9c', '942e5afd-b880-545a-9e84-cfdd80164f42', d.id, 'Comprendre le métier au quotidien et préparer ma première candidature.', 'ACCEPTEE', null, now() - interval '50 days', now() - interval '48 days', null, 0
from domaines_mentorat d where d.code = 'GESTION_PROJET' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('b6f9ee5c-7a78-5ef1-a3a3-e56a9b34d5ed', '83c232a0-bdd6-5f42-a61b-ea1e81caa358', date_trunc('hour', now()) + interval '-45 days', 45, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo', 'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', 'f963c1e1-ddad-5c37-aeec-73a4a0871d57', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('ccfbbc5e-c8a5-551a-ab52-a5fa55e6c03b', '83c232a0-bdd6-5f42-a61b-ea1e81caa358', date_trunc('hour', now()) + interval '-4 days', 60, 'PRESENTIEL', 'Bibliothèque de l’EPT', 'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', 'f963c1e1-ddad-5c37-aeec-73a4a0871d57', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('ce4e4b76-feff-5622-a04d-448d3bd0f08e', '83c232a0-bdd6-5f42-a61b-ea1e81caa358', date_trunc('hour', now()) + interval '17 days', 30, 'TELEPHONE', null, 'PLANIFIEE', null, 'f963c1e1-ddad-5c37-aeec-73a4a0871d57', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'fefcfbb9-3709-5b95-a683-1a9c3f1a7bf9', '8b0824f9-36fa-590f-8d99-227ff13aeb80', '1be24203-4709-57ec-9145-6dd9b4e5eeed', d.id, 'Monter un projet entrepreneurial avec des camarades.', 'ANNULEE', null, now() - interval '54 days', null, now() - interval '3 days', 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '68a3441b-9d46-5939-9088-8f2511597db8', '6904214d-a1f0-5cf9-b47d-c8344e8ff2c0', 'd306496e-6d4a-534b-9b86-04bdaf9281a4', d.id, 'Préparer mon stage de fin d’études et mes entretiens.', 'EN_ATTENTE', null, now() - interval '58 days', null, null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, ville_residence, poste_actuel, bio, date_creation)
select 'f7de9858-2346-53fe-a544-d2cc267a6f17', 'admin@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mame Diarra', 'Ndour', 'ADMIN', 'ACTIF', 'Thiès', 'Administratrice de la plateforme', 'Administratrice de la plateforme EPT Alumni.', now() - interval '400 days'
on conflict do nothing;
insert into programmes_mentorat (id, titre, description, date_debut, date_fin, statut, responsable_id, cree_le)
values ('481f3bc0-b1fd-5fd9-b487-8b794889479b', 'Orientation des lycéens', 'Des élèves et étudiants de l’EPT accompagnent les lycéens dans leur choix d’orientation : filières, concours, vie à l’école.', current_date - 7, current_date + interval '6 months', 'OUVERT', 'f7de9858-2346-53fe-a544-d2cc267a6f17', now() - interval '30 days')
on conflict (id) do nothing;
insert into jalons_programme (id, programme_id, titre, description, ordre)
values ('1c9e7ba9-f390-56e3-a9b1-563749f7e848', '481f3bc0-b1fd-5fd9-b487-8b794889479b', 'Premier échange', 'Faire connaissance et cerner le projet du lycéen.', 1) on conflict (id) do nothing;
insert into jalons_programme (id, programme_id, titre, description, ordre)
values ('913fc772-f589-57fb-bd00-9439977de51f', '481f3bc0-b1fd-5fd9-b487-8b794889479b', 'Découverte des filières', null, 2) on conflict (id) do nothing;
insert into jalons_programme (id, programme_id, titre, description, ordre)
values ('b3c52294-f0f3-5d84-be98-dd50b6c1f8df', '481f3bc0-b1fd-5fd9-b487-8b794889479b', 'Préparation au concours', null, 3) on conflict (id) do nothing;
insert into programmes_mentorat (id, titre, description, date_debut, date_fin, statut, responsable_id, cree_le)
values ('fcf2fc0e-bb73-577c-a735-49fd499aa81f', 'Préparation aux concours', 'Accompagnement des candidats aux concours d’entrée de l’EPT.', current_date - interval '1 year', current_date - 60, 'OUVERT', 'f7de9858-2346-53fe-a544-d2cc267a6f17', now() - interval '30 days')
on conflict (id) do nothing;
insert into jalons_programme (id, programme_id, titre, description, ordre)
values ('5411dfc2-ce91-5534-833d-0043879723a6', 'fcf2fc0e-bb73-577c-a735-49fd499aa81f', 'Bilan de départ', null, 1) on conflict (id) do nothing;
insert into jalons_programme (id, programme_id, titre, description, ordre)
values ('d0477497-03e9-58fa-8951-19ade48f0704', 'fcf2fc0e-bb73-577c-a735-49fd499aa81f', 'Concours blanc', null, 2) on conflict (id) do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
select '49fe1e32-191b-5ee4-b7cb-2efb20e04b1e', '481f3bc0-b1fd-5fd9-b487-8b794889479b', (select id from profils_mentor where utilisateur_id = 'cb4ae14b-a5ae-5be3-87f5-03bdebba98db'), now() - interval '20 days'
on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, cree_le, repondu_le, version)
select 'a6af9efc-f2ca-5cef-8322-5ab0c9297475', '4d33cf28-2592-56c3-b033-855cffb14776', (select id from profils_mentor where utilisateur_id = 'cb4ae14b-a5ae-5be3-87f5-03bdebba98db'), d.id, '481f3bc0-b1fd-5fd9-b487-8b794889479b', 'Aider des lycéens de Thiès à choisir entre classes préparatoires et école d’ingénieur.', 'ACCEPTEE', now() - interval '12 days', now() - interval '11 days', 0
from domaines_mentorat d where d.code = 'GENIE_CIVIL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, cree_le, repondu_le, version)
select '1285041e-7619-5e93-a5e4-77ff825d18ba', '57518406-14da-54a4-bab0-408d9f6bb421', (select id from profils_mentor where utilisateur_id = 'cb4ae14b-a5ae-5be3-87f5-03bdebba98db'), d.id, '481f3bc0-b1fd-5fd9-b487-8b794889479b', 'Préparer une présentation de l’EPT pour mon ancien lycée.', 'EN_ATTENTE', now() - interval '2 days', null, 0
from domaines_mentorat d where d.code = 'GENIE_CIVIL' on conflict (id) do nothing;
insert into progression_jalons (id, mentorat_id, jalon_id, atteint_le, valide_par_id, commentaire)
values ('8c80ca3c-5ab4-5cc2-90dc-0c09d12b47ec', 'a6af9efc-f2ca-5cef-8322-5ab0c9297475', '1c9e7ba9-f390-56e3-a9b1-563749f7e848', now() - interval '5 days', 'cb4ae14b-a5ae-5be3-87f5-03bdebba98db',
  'Premier appel d’une heure : projet clarifié, vise les classes préparatoires.') on conflict do nothing;
commit;
