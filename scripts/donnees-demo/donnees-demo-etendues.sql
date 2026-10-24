-- Données de démonstration étendues EPT Alumni (base de développement uniquement).
-- Généré par scripts/donnees-demo/generer-sql-etendu.py ; à charger APRÈS donnees-demo.sql.
-- Variable psql attendue : compte_modele (voir donnees-demo.sql).
\set ON_ERROR_STOP on
begin;

insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Teranga Télécom', 'ENTREPRISE', 'Télécommunications', 'Dakar, Mermoz', 'Sénégal', 'ACTIF', false,
  'Teranga Télécom — télécommunications. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/03d1a964-c4ed-547c-9320-a75ac847de7a.jpg', 'https://teranga-telecom.example.org', date '2012-01-01' + (443 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select '7ee14b84-8b71-5ceb-bd54-3e79cbe5da18', 'teranga-telecom@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Teranga Télécom', 'ORGANISME', 'ACTIF', '8846e4dc-1afe-5f34-91f5-2262f76f4006', '/api/photos/03d1a964-c4ed-547c-9320-a75ac847de7a.jpg', now() - interval '505 days'
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('efde041e-342d-5712-90fc-0cd90c79985a', 'Dakar Cloud Services', 'ENTREPRISE', 'Hébergement et services cloud', 'Dakar, Point E', 'Sénégal', 'ACTIF', false,
  'Dakar Cloud Services — hébergement et services cloud. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/fd44917a-de68-55c3-a760-41ac74c1197a.jpg', 'https://dakar-cloud-services.example.org', date '2012-01-01' + (325 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select 'f9153b57-ae68-5a25-acdd-2eb196b9b0f0', 'dakar-cloud@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Dakar Cloud Services', 'ORGANISME', 'ACTIF', 'efde041e-342d-5712-90fc-0cd90c79985a', '/api/photos/fd44917a-de68-55c3-a760-41ac74c1197a.jpg', now() - interval '43 days'
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('ef43641a-d71b-5aee-ba0f-7725c094609d', 'Jàmm Pay', 'ENTREPRISE', 'Paiement mobile', 'Dakar, Plateau', 'Sénégal', 'ACTIF', false,
  'Jàmm Pay — paiement mobile. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/9907ed07-da1c-5d19-8e68-920947d75b1a.jpg', 'https://jamm-pay.example.org', date '2012-01-01' + (2683 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select '6d0c0f03-9f8d-5572-b645-98ccb21a2b77', 'jamm-pay@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Jàmm Pay', 'ORGANISME', 'ACTIF', 'ef43641a-d71b-5aee-ba0f-7725c094609d', '/api/photos/9907ed07-da1c-5d19-8e68-920947d75b1a.jpg', now() - interval '360 days'
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('3e4bf4ab-5b3a-5436-8e8f-4cd7f25b802f', 'Cap-Vert Construction', 'ENTREPRISE', 'Bâtiment et travaux publics', 'Rufisque', 'Sénégal', 'ACTIF', false,
  'Cap-Vert Construction — bâtiment et travaux publics. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/d39bab98-1c42-5939-9c46-c2126e15ffef.jpg', 'https://cap-vert-construction.example.org', date '2012-01-01' + (3246 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select 'b2560540-5763-5382-980d-719b1fc20579', 'cap-vert-construction@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Cap-Vert Construction', 'ORGANISME', 'ACTIF', '3e4bf4ab-5b3a-5436-8e8f-4cd7f25b802f', '/api/photos/d39bab98-1c42-5939-9c46-c2126e15ffef.jpg', now() - interval '445 days'
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('d9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Ciments de la Petite Côte', 'ENTREPRISE', 'Matériaux de construction', 'Bargny', 'Sénégal', 'ACTIF', false,
  'Ciments de la Petite Côte — matériaux de construction. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/f0851337-4112-516c-ae6a-ae1bdbed4273.jpg', 'https://ciments-de-la-petite-cote.example.org', date '2012-01-01' + (2562 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select 'c402625b-d467-5cc1-90b3-2a98dc528df6', 'ciments-petite-cote@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ciments de la Petite Côte', 'ORGANISME', 'ACTIF', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', '/api/photos/f0851337-4112-516c-ae6a-ae1bdbed4273.jpg', now() - interval '217 days'
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('eb348294-3725-52e1-8093-d20746ed097d', 'Sahel Énergie Distribution', 'ENTREPRISE', 'Distribution d’électricité', 'Dakar, Hann', 'Sénégal', 'ACTIF', false,
  'Sahel Énergie Distribution — distribution d’électricité. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/d3be3e10-a65e-50e0-a5ed-a22cb3a2e030.jpg', 'https://sahel-energie-distribution.example.org', date '2012-01-01' + (1633 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select '241fbb6a-365f-596f-9abb-591496029405', 'sahel-energie@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Sahel Énergie Distribution', 'ORGANISME', 'ACTIF', 'eb348294-3725-52e1-8093-d20746ed097d', '/api/photos/d3be3e10-a65e-50e0-a5ed-a22cb3a2e030.jpg', now() - interval '214 days'
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('d646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Mines du Sénégal oriental', 'ENTREPRISE', 'Industrie extractive', 'Kédougou', 'Sénégal', 'ACTIF', false,
  'Mines du Sénégal oriental — industrie extractive. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/39de0851-1926-522e-be25-2fe3d4cde743.jpg', 'https://mines-du-senegal-oriental.example.org', date '2012-01-01' + (1424 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select '8a057388-25a9-5405-8771-ebc256ead9ae', 'mines-orientales@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mines du Sénégal oriental', 'ORGANISME', 'ACTIF', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', '/api/photos/39de0851-1926-522e-be25-2fe3d4cde743.jpg', now() - interval '213 days'
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('8fb67a87-4ec4-56b8-a021-1ab27b84d9b1', 'Atlantique Logistique Portuaire', 'ENTREPRISE', 'Logistique et transport', 'Dakar, Port autonome', 'Sénégal', 'ACTIF', false,
  'Atlantique Logistique Portuaire — logistique et transport. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/9a5d4ae8-73f9-5c29-8439-448a8863fdd0.jpg', 'https://atlantique-logistique-portuaire.example.org', date '2012-01-01' + (1133 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select '3cc3470f-efa6-588b-b6f2-c2c5518a91e5', 'atlantique-logistique@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Atlantique Logistique Portuaire', 'ORGANISME', 'ACTIF', '8fb67a87-4ec4-56b8-a021-1ab27b84d9b1', '/api/photos/9a5d4ae8-73f9-5c29-8439-448a8863fdd0.jpg', now() - interval '325 days'
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Agence des infrastructures de Thiès', 'INSTITUTION_PUBLIQUE', 'Infrastructures publiques', 'Thiès', 'Sénégal', 'ACTIF', false,
  'Agence des infrastructures de Thiès — infrastructures publiques. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/021f80f8-8480-5f37-906d-08a32c4c6a53.jpg', 'https://agence-des-infrastructures-de-thies.example.org', date '2012-01-01' + (2813 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select '7691c744-2175-5f8e-bdb1-9a95450bd125', 'agence-infra-thies@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Agence des infrastructures de Thiès', 'ORGANISME', 'ACTIF', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', '/api/photos/021f80f8-8480-5f37-906d-08a32c4c6a53.jpg', now() - interval '108 days'
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('4dbcd1bc-ac2d-5628-86a2-b70890077276', 'Direction régionale de l’hydraulique', 'INSTITUTION_PUBLIQUE', 'Eau et assainissement', 'Kaolack', 'Sénégal', 'ACTIF', false,
  'Direction régionale de l’hydraulique — eau et assainissement. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/9bcbfa46-18f3-5930-98b1-629246701583.jpg', 'https://direction-regionale-de-lhydraulique.example.org', date '2012-01-01' + (2619 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select '54a27d50-1541-5aa7-b4e4-34e13142ef1e', 'hydraulique-rurale@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Direction régionale de l’hydraulique', 'ORGANISME', 'ACTIF', '4dbcd1bc-ac2d-5628-86a2-b70890077276', '/api/photos/9bcbfa46-18f3-5930-98b1-629246701583.jpg', now() - interval '379 days'
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('408e11af-95d6-5c5b-b250-4b62f4609084', 'Eau Vive Sahel', 'ONG', 'Accès à l’eau potable', 'Tambacounda', 'Sénégal', 'ACTIF', false,
  'Eau Vive Sahel — accès à l’eau potable. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/aa36cc3b-2937-5825-870d-c1ce3434bda5.jpg', 'https://eau-vive-sahel.example.org', date '2012-01-01' + (1237 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select '4d5e79eb-69e4-55d3-8bd4-209dfa65564c', 'eau-vive-sahel@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Eau Vive Sahel', 'ORGANISME', 'ACTIF', '408e11af-95d6-5c5b-b250-4b62f4609084', '/api/photos/aa36cc3b-2937-5825-870d-c1ce3434bda5.jpg', now() - interval '98 days'
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('0a080697-5a47-5150-8a7c-d22c53494978', 'AéroTech Ingénierie', 'ENTREPRISE', 'Ingénierie aéronautique', 'Toulouse', 'France', 'ACTIF', false,
  'AéroTech Ingénierie — ingénierie aéronautique. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/5c73205a-d9b4-5d07-8185-930f90d80d0a.jpg', 'https://aerotech-ingenierie.example.org', date '2012-01-01' + (1043 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select '80bddae9-001a-5dc5-b3f4-b21ec3148d33', 'aerotech-ingenierie@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'AéroTech Ingénierie', 'ORGANISME', 'ACTIF', '0a080697-5a47-5150-8a7c-d22c53494978', '/api/photos/5c73205a-d9b4-5d07-8185-930f90d80d0a.jpg', now() - interval '291 days'
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('7e73cd92-6749-510c-964c-c90065024e4a', 'Lumen Conseil', 'ENTREPRISE', 'Conseil en organisation', 'Paris', 'France', 'ACTIF', false,
  'Lumen Conseil — conseil en organisation. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/48e4fbcf-ea26-5da1-9441-2fb2508ca685.jpg', 'https://lumen-conseil.example.org', date '2012-01-01' + (1741 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select 'acb70a33-b57e-5aec-a1eb-2e6f9ee22dfd', 'lumen-conseil@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Lumen Conseil', 'ORGANISME', 'ACTIF', '7e73cd92-6749-510c-964c-c90065024e4a', '/api/photos/48e4fbcf-ea26-5da1-9441-2fb2508ca685.jpg', now() - interval '548 days'
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Génie Nord Consultants', 'ENTREPRISE', 'Ingénierie et conseil', 'Montréal', 'Canada', 'ACTIF', false,
  'Génie Nord Consultants — ingénierie et conseil. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/6852c457-df7b-533b-98d7-52a8bbbab863.jpg', 'https://genie-nord-consultants.example.org', date '2012-01-01' + (935 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select 'b9fd253f-4abe-5f97-ac14-58614fc59b26', 'genie-nord@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Génie Nord Consultants', 'ORGANISME', 'ACTIF', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', '/api/photos/6852c457-df7b-533b-98d7-52a8bbbab863.jpg', now() - interval '190 days'
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Institut d’études supérieures de Paris', 'ETABLISSEMENT_ENSEIGNEMENT', 'Enseignement supérieur', 'Paris', 'France', 'ACTIF', false,
  'Institut d’études supérieures de Paris — enseignement supérieur. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/79e049a8-1e4e-5577-9c94-4e806d52c3fa.jpg', 'https://institut-detudes-superieures-de-paris.example.org', date '2012-01-01' + (3006 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select '7b13261e-f6cc-5faa-b957-ec25931e111d', 'institut-paris@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Institut d’études supérieures de Paris', 'ORGANISME', 'ACTIF', '6ef782e2-a6e1-52da-81bb-4120ac83526d', '/api/photos/79e049a8-1e4e-5577-9c94-4e806d52c3fa.jpg', now() - interval '375 days'
on conflict do nothing;
insert into organisme (id, nom, type_organisme, secteur_activite, adresse, pays, statut_validation, etablissement_ept, description, logo_url, site_web, date_creation)
values ('5e286ac3-a41a-50dc-972c-8435932fba81', 'Université du littoral Atlantique', 'ETABLISSEMENT_ENSEIGNEMENT', 'Enseignement supérieur', 'Saint-Louis', 'Sénégal', 'ACTIF', false,
  'Université du littoral Atlantique — enseignement supérieur. Partenaire de l’EPT pour les stages, les projets de fin d’études et le recrutement des jeunes diplômés.',
  '/api/photos/ef8bf0f1-fa3c-59ac-bd67-a145d2b25f18.jpg', 'https://universite-du-littoral-atlantique.example.org', date '2012-01-01' + (3450 * interval '1 day'))
on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, nom, role, statut_compte, organisme_id, url_photo, date_creation)
select '9b39c930-9176-56b1-95dc-1942b9cbcf97', 'universite-atlantique@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Université du littoral Atlantique', 'ORGANISME', 'ACTIF', '5e286ac3-a41a-50dc-972c-8435932fba81', '/api/photos/ef8bf0f1-fa3c-59ac-bd67-a145d2b25f18.jpg', now() - interval '384 days'
on conflict do nothing;
update organisme set logo_url = '/api/photos/9bbc3743-5029-5567-b49b-1b23c8115f30.jpg' where id = '9a407d0c-7bf8-5252-8fdd-29fc61c80b63' and logo_url is null;
update utilisateur set url_photo = '/api/photos/9bbc3743-5029-5567-b49b-1b23c8115f30.jpg' where id = '457a91ad-b197-58e1-a26a-1134b376b601' and url_photo is null;
update organisme set logo_url = '/api/photos/4172af73-9fa9-5a8e-a6d9-07b00fbc2fd7.jpg' where id = 'ad907e30-c5ea-5d71-bcee-e646c8faba85' and logo_url is null;
update utilisateur set url_photo = '/api/photos/4172af73-9fa9-5a8e-a6d9-07b00fbc2fd7.jpg' where id = '0c1e1751-b3b9-5cac-b111-d19aec3ffbac' and url_photo is null;
update organisme set logo_url = '/api/photos/8a6f2e9b-6aaa-5927-a07f-65e047b5fe83.jpg' where id = 'd4782754-5bbb-5a6c-8e1f-fff15176445b' and logo_url is null;
update utilisateur set url_photo = '/api/photos/8a6f2e9b-6aaa-5927-a07f-65e047b5fe83.jpg' where id = '196d12d1-8159-5cc4-a8de-b59640a3e0b9' and url_photo is null;
update organisme set logo_url = '/api/photos/78d878b5-c055-5480-ad75-9be679b98a29.jpg' where id = '16397ae4-872c-5909-a942-7f13d802f0bb' and logo_url is null;
update utilisateur set url_photo = '/api/photos/78d878b5-c055-5480-ad75-9be679b98a29.jpg' where id = '2b7b98d1-8d29-5250-908f-da8e3563cb58' and url_photo is null;
update organisme set logo_url = '/api/photos/f302bb8c-9922-5ee4-a85b-2aae4d692fb8.jpg' where id = '24d6fa3c-1e78-5930-86c2-9db155558ef5' and logo_url is null;
update utilisateur set url_photo = '/api/photos/f302bb8c-9922-5ee4-a85b-2aae4d692fb8.jpg' where id = '25eef3b9-ad26-5a17-a8ae-c6b7de335aa2' and url_photo is null;
update organisme set logo_url = '/api/photos/da42f2a5-6676-5300-97d6-c398698c2cd7.jpg' where id = '606f73f2-9b7f-53e0-bbdb-6de6191ccad4' and logo_url is null;
update utilisateur set url_photo = '/api/photos/da42f2a5-6676-5300-97d6-c398698c2cd7.jpg' where id = '67535720-bda8-5703-9f0f-65ddb8184dea' and url_photo is null;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', 'mor.ka@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mor', 'Ka', 'ALUMNI', 'ACTIF', 'Génie Civil', 2013, 2016, 'INGENIEUR', 'Thiès', 'Directeur technique', 'Diplômé de l’EPT en Génie Civil, je suis aujourd’hui directeur technique chez Agence des infrastructures de Thiès. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/d6e4e8c1-2550-5598-b048-a580872c9387.jpg', null, now() - interval '284 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('520460fa-3f8d-5f64-bb7e-70d523956a29', 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2013-10-01', date '2016-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('27d77e6f-8a89-52f0-99a0-3f1edad583ba', 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage de fin d’études', 'STAGE', date '2016-02-01', date '2016-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('05c78d00-383b-5260-b5ad-431228cef96a', 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Master en génie urbain', 'DIPLOMANTE', date '2016-09-15', date '2017-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('458e724e-a7ee-5f3f-b001-897df2131d19', 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Conducteur de travaux', 'CDI', date '2017-10-01', date '2022-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('636b8d67-0490-5830-a27b-d58ac240e649', 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Directeur technique', 'CDI', date '2022-09-01', null, false, true,
  'Poste actuel : directeur technique.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'fee119d8-46ac-5ea5-995c-bd2becc002ae', 'absa.ly@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Absa', 'Ly', 'ALUMNI', 'ACTIF', 'Génie Civil', 2015, 2018, 'INGENIEUR', 'Dakar', 'Chef de projet infrastructures', 'Diplômée de l’EPT en Génie Civil, je suis aujourd’hui chef de projet infrastructures chez Direction régionale de l’hydraulique. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/20b41115-d336-5711-8c64-d5b67778736a.jpg', null, now() - interval '665 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('960a7831-58fa-5871-8e42-10d450a9e486', 'fee119d8-46ac-5ea5-995c-bd2becc002ae', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2015-10-01', date '2018-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f761ac39-e6ac-5964-9793-d7fcef80c53d', 'fee119d8-46ac-5ea5-995c-bd2becc002ae', '3e4bf4ab-5b3a-5436-8e8f-4cd7f25b802f', 'Stage de fin d’études', 'STAGE', date '2018-02-01', date '2018-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('2247ce4c-b0d9-556b-8e61-bb1be9a557c6', 'fee119d8-46ac-5ea5-995c-bd2becc002ae', '3e4bf4ab-5b3a-5436-8e8f-4cd7f25b802f', 'Conducteur de travaux', 'CDI', date '2018-10-01', date '2020-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('fbc2669d-ab88-581d-b191-515566ffb847', 'fee119d8-46ac-5ea5-995c-bd2becc002ae', '4dbcd1bc-ac2d-5628-86a2-b70890077276', 'Chef de projet infrastructures', 'CDI', date '2020-09-01', null, false, true,
  'Poste actuel : chef de projet infrastructures.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'e3b60172-18f3-5bf7-9823-b8b6edfdb350', 'aminata.barry@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Aminata', 'Barry', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2010, 2013, 'INGENIEUR', 'Paris', 'Directeur de projets', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Génie Nord Consultants où j’occupe le poste de directeur de projets. Ouverte aux échanges sur les métiers de la informatique et télécommunications.', '+221 77 000 00 00', '/api/photos/05b97d3f-424b-5e32-b35a-cb4f16601c6e.jpg', null, now() - interval '210 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('1abf9b9b-a3eb-5788-b260-30292a5be4c5', 'e3b60172-18f3-5bf7-9823-b8b6edfdb350', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2010-10-01', date '2013-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('0b969768-3ffd-55b7-b2e5-c68d546fef18', 'e3b60172-18f3-5bf7-9823-b8b6edfdb350', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Stage de fin d’études', 'STAGE', date '2013-02-01', date '2013-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('2b442231-997c-5a43-ad7c-b75261a46ee3', 'e3b60172-18f3-5bf7-9823-b8b6edfdb350', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Master en science des données', 'DIPLOMANTE', date '2013-09-15', date '2014-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('d8103179-5aee-59a8-8f82-1cbbeb85f525', 'e3b60172-18f3-5bf7-9823-b8b6edfdb350', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Ingénieur réseaux', 'CDI', date '2014-10-01', date '2019-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('abbe662b-e129-5c75-b584-0d6d8340e9ff', 'e3b60172-18f3-5bf7-9823-b8b6edfdb350', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Directeur de projets', 'CDI', date '2019-09-01', null, false, true,
  'Poste actuel : directeur de projets.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '4a73bb2a-d738-5997-a201-df09d1c31953', 'alassane.sarr@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Alassane', 'Sarr', 'ALUMNI', 'ACTIF', 'Génie Industriel', 2008, 2011, 'INGENIEUR', 'Paris', 'Consultant lean', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Atlantique Logistique Portuaire où j’occupe le poste de consultant lean. Ouvert aux échanges sur les métiers de la industriel.', '+221 77 000 00 00', null, null, now() - interval '747 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('56a0aa5f-9042-567f-b383-f59c2b97d824', '4a73bb2a-d738-5997-a201-df09d1c31953', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Industriel', 'DIPLOMANTE', date '2008-10-01', date '2011-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('a931db03-95a1-53e4-8d8f-4400689f39d7', '4a73bb2a-d738-5997-a201-df09d1c31953', '7e73cd92-6749-510c-964c-c90065024e4a', 'Stage de fin d’études', 'STAGE', date '2011-02-01', date '2011-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('af45f1ad-5279-51f3-a936-96e9fdb3c962', '4a73bb2a-d738-5997-a201-df09d1c31953', '7e73cd92-6749-510c-964c-c90065024e4a', 'Responsable supply chain', 'CDD', date '2011-10-01', date '2015-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('735b6abe-1615-524e-bbdb-dd3eec4423e1', '4a73bb2a-d738-5997-a201-df09d1c31953', '8fb67a87-4ec4-56b8-a021-1ab27b84d9b1', 'Consultant lean', 'FREELANCE', date '2015-09-01', null, false, true,
  'Poste actuel : consultant lean.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '89629841-a5b6-5eee-be22-e550bc5d33fb', 'khadim.cisse@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Khadim', 'Cissé', 'ALUMNI', 'ACTIF', 'Génie Civil', 2019, 2022, 'INGENIEUR', 'Kaolack', 'Ingénieur géotechnicien', 'Ingénieur géotechnicien chez Agence des infrastructures de Thiès, basé à Kaolack. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/fbc96241-6eaf-538e-bbe1-a139557eed43.jpg', null, now() - interval '386 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('cdc0c295-9fc6-5876-b3ee-40434fcc997a', '89629841-a5b6-5eee-be22-e550bc5d33fb', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2019-10-01', date '2022-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('913929c5-2e63-5ef5-bc84-3647b2044854', '89629841-a5b6-5eee-be22-e550bc5d33fb', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Stage de fin d’études', 'STAGE', date '2022-02-01', date '2022-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('2644b9e7-1388-57a7-9f80-66c1a8db72dc', '89629841-a5b6-5eee-be22-e550bc5d33fb', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Master en génie urbain', 'DIPLOMANTE', date '2022-09-15', date '2023-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('a348e4ff-0465-5114-8027-f4f274205e12', '89629841-a5b6-5eee-be22-e550bc5d33fb', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Ingénieur géotechnicien', 'CDI', date '2023-09-01', null, false, true,
  'Poste actuel : ingénieur géotechnicien.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '2767c1e8-a06b-5908-8fdc-b872bb7dfd48', 'thierno.sarr@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Thierno', 'Sarr', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2007, 2010, 'INGENIEUR', 'Dakar', 'Ingénieur logiciel', 'Diplômé de l’EPT en Génie Informatique et Télécommunications, je suis aujourd’hui ingénieur logiciel chez Lumen Conseil. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/02be9a2f-33b8-5dfd-ac39-068ef3bea426.jpg', null, now() - interval '337 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('2655ce1d-c36c-59c2-9017-126587b217a5', '2767c1e8-a06b-5908-8fdc-b872bb7dfd48', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2007-10-01', date '2010-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('133c4a5b-014b-5889-90de-c346e14b3722', '2767c1e8-a06b-5908-8fdc-b872bb7dfd48', '8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Stage de fin d’études', 'STAGE', date '2010-02-01', date '2010-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('6b98c9d6-985c-5bf4-bb8f-49ade0d252bb', '2767c1e8-a06b-5908-8fdc-b872bb7dfd48', '8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Développeur full-stack', 'CDI', date '2010-10-01', date '2015-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('b0664cc0-74d4-54f5-af12-530b353ccefe', '2767c1e8-a06b-5908-8fdc-b872bb7dfd48', '7e73cd92-6749-510c-964c-c90065024e4a', 'Ingénieur logiciel', 'CDI', date '2015-09-01', null, false, true,
  'Poste actuel : ingénieur logiciel.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '2b34d94e-66b2-5292-8f66-8cde42ae3106', 'mariama.cisse@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mariama', 'Cissé', 'ALUMNI', 'ACTIF', 'Génie Aéronautique et Aérospatial', 2015, 2018, 'INGENIEUR', 'Dakar', 'Responsable d’équipe', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint AéroTech Ingénierie où j’occupe le poste de responsable d’équipe. Ouverte aux échanges sur les métiers de la aéronautique et aérospatial.', '+221 77 000 00 00', '/api/photos/58134e66-1a30-5ab3-b0a9-82e2db3ebd13.jpg', null, now() - interval '360 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('6781085a-1726-57c6-88fc-17e10ed1921b', '2b34d94e-66b2-5292-8f66-8cde42ae3106', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Aéronautique et Aérospatial', 'DIPLOMANTE', date '2015-10-01', date '2018-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('b8a8a237-9a60-5e74-b33e-7d5fc1d4dd0e', '2b34d94e-66b2-5292-8f66-8cde42ae3106', '0a080697-5a47-5150-8a7c-d22c53494978', 'Stage de fin d’études', 'STAGE', date '2018-02-01', date '2018-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('34dda8e1-e568-5ac5-8d5c-d274c3359415', '2b34d94e-66b2-5292-8f66-8cde42ae3106', '0a080697-5a47-5150-8a7c-d22c53494978', 'Responsable d’équipe', 'FREELANCE', date '2018-09-01', null, false, true,
  'Poste actuel : responsable d’équipe.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('5d27bf66-86a5-555c-8508-59a0e91c6643', '2b34d94e-66b2-5292-8f66-8cde42ae3106', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Formation réglementation Part-145', 'CERTIFICATION', date '2019-03-01', date '2019-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '2ce655c2-b971-5cdf-8afd-9049eb1b237f', 'seydou.tall@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Seydou', 'Tall', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2004, 2007, 'INGENIEUR', 'Thiès', 'Architecte cloud', 'Diplômé de l’EPT en Génie Informatique et Télécommunications, je suis aujourd’hui architecte cloud chez Jàmm Pay. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/2d3570d2-8a10-59b4-bf16-32fc32321f3c.jpg', null, now() - interval '505 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('948d4fa6-fe9f-5112-94ae-e0fd90976a6a', '2ce655c2-b971-5cdf-8afd-9049eb1b237f', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2004-10-01', date '2007-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('fa7c7355-6baa-5a33-a37a-c9431584b52f', '2ce655c2-b971-5cdf-8afd-9049eb1b237f', '8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Stage de fin d’études', 'STAGE', date '2007-02-01', date '2007-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('9ff56c60-02aa-5b87-b662-5bd9b64500d4', '2ce655c2-b971-5cdf-8afd-9049eb1b237f', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Master en science des données', 'DIPLOMANTE', date '2007-09-15', date '2008-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('8d83861d-9a67-52f2-9c65-df62a97e4645', '2ce655c2-b971-5cdf-8afd-9049eb1b237f', '8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Développeur full-stack', 'CDD', date '2008-10-01', date '2013-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('151f7272-b393-5f2e-8656-43ba67195992', '2ce655c2-b971-5cdf-8afd-9049eb1b237f', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Architecte cloud', 'CDI', date '2013-09-01', null, false, true,
  'Poste actuel : architecte cloud.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '58a64778-e962-5167-9c0b-5216c2e855d6', 'idrissa.sow@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Idrissa', 'Sow', 'ALUMNI', 'ACTIF', 'Génie Industriel', 2013, 2016, 'INGENIEUR', 'Nouakchott', 'Responsable supply chain', 'Diplômé de l’EPT en Génie Industriel, je suis aujourd’hui responsable supply chain chez Ciments de la Petite Côte. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/8d0fbde1-dbcc-5a2e-ae47-e27b0206b7c0.jpg', null, now() - interval '598 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('1b462156-38ce-5118-85ab-2585b57ba524', '58a64778-e962-5167-9c0b-5216c2e855d6', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Industriel', 'DIPLOMANTE', date '2013-10-01', date '2016-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('329146d5-a5c9-5d72-ab48-0b2eea27e194', '58a64778-e962-5167-9c0b-5216c2e855d6', '7e73cd92-6749-510c-964c-c90065024e4a', 'Stage de fin d’études', 'STAGE', date '2016-02-01', date '2016-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('adf8feba-09eb-5746-97c2-fb07083316a7', '58a64778-e962-5167-9c0b-5216c2e855d6', '7e73cd92-6749-510c-964c-c90065024e4a', 'Responsable supply chain', 'CDI', date '2016-10-01', date '2018-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('6e1ceda4-fe50-5624-9589-1104dbb8e07f', '58a64778-e962-5167-9c0b-5216c2e855d6', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Responsable supply chain', 'CDI', date '2018-09-01', null, false, true,
  'Poste actuel : responsable supply chain.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '29191454-c4cc-5485-9e68-e24aad0ba23f', 'bamba.ndour@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Bamba', 'Ndour', 'ALUMNI', 'ACTIF', 'Génie Civil', 2017, 2020, 'INGENIEUR', 'Dakar', 'Ingénieur méthodes BTP', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Eau Vive Sahel où j’occupe le poste de ingénieur méthodes BTP. Ouvert aux échanges sur les métiers de la civil.', '+221 77 000 00 00', null, null, now() - interval '677 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('772d681b-e891-57a6-a974-9b2331f20ea6', '29191454-c4cc-5485-9e68-e24aad0ba23f', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2017-10-01', date '2020-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('015285c7-4b21-5b5f-bbe9-6778649b8aec', '29191454-c4cc-5485-9e68-e24aad0ba23f', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Stage de fin d’études', 'STAGE', date '2020-02-01', date '2020-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('c1ca0c35-cd51-5d33-8c11-cb19726d7c83', '29191454-c4cc-5485-9e68-e24aad0ba23f', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Ingénieur VRD', 'CDI', date '2020-10-01', date '2023-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('857aef08-d8ad-5ccb-a89c-6a6594cf9979', '29191454-c4cc-5485-9e68-e24aad0ba23f', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Ingénieur méthodes BTP', 'CDI', date '2023-09-01', null, false, true,
  'Poste actuel : ingénieur méthodes BTP.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('637ea973-f055-5fc1-870c-c75372db9515', '29191454-c4cc-5485-9e68-e24aad0ba23f', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Formation BIM avancée', 'CERTIFICATION', date '2022-03-01', date '2022-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', 'maimouna.camara@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Maïmouna', 'Camara', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2003, 2006, 'INGENIEUR', 'Nouakchott', 'Data engineer', 'Diplômée de l’EPT en Génie Informatique et Télécommunications, je suis aujourd’hui data engineer chez Teranga Télécom. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/bd322fcb-4b22-5c24-9cc8-39953d9d5795.jpg', null, now() - interval '279 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('121526e8-1386-5db9-9418-e896022f6cd4', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2003-10-01', date '2006-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('b252cdba-2356-59b3-a0e4-24eeca7f9211', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage de fin d’études', 'STAGE', date '2006-02-01', date '2006-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('9cf80a15-1a03-519f-9326-f5642526010f', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Master en science des données', 'DIPLOMANTE', date '2006-09-15', date '2007-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('369121ca-3c70-5058-a4f0-d974d97f77eb', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Data analyst', 'CDI', date '2007-10-01', date '2011-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('bce15216-3c35-5abc-9cd0-22c14a7f4abb', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', '8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Data engineer', 'CDI', date '2011-09-01', null, false, true,
  'Poste actuel : data engineer.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '6c56f510-f428-5542-8194-1dedc960b84e', 'bamba.toure@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Bamba', 'Touré', 'ALUMNI', 'ACTIF', 'Génie Industriel', 2021, 2024, 'INGENIEUR', 'Dakar', 'Ingénieur qualité', 'Ingénieur qualité chez Atlantique Logistique Portuaire, basé à Dakar. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/54389f79-55a3-59f2-9cb3-99039b6c76cd.jpg', null, now() - interval '490 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('1d8b1c06-5060-5861-978c-86357400e752', '6c56f510-f428-5542-8194-1dedc960b84e', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Industriel', 'DIPLOMANTE', date '2021-10-01', date '2024-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('0e7b7426-45a3-5acc-86e9-f6270a5ee9e3', '6c56f510-f428-5542-8194-1dedc960b84e', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Stage de fin d’études', 'STAGE', date '2024-02-01', date '2024-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('ed2be68c-06e9-55ed-8475-76ab0d679aca', '6c56f510-f428-5542-8194-1dedc960b84e', '8fb67a87-4ec4-56b8-a021-1ab27b84d9b1', 'Ingénieur qualité', 'FONCTION_PUBLIQUE', date '2024-09-01', null, false, true,
  'Poste actuel : ingénieur qualité.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('4a1cb0bd-4960-5df4-949d-7d72671b2c74', '6c56f510-f428-5542-8194-1dedc960b84e', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Certification APICS CSCP', 'CERTIFICATION', date '2025-03-01', date '2025-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '47dbc521-229b-5806-be71-eb7d9f24fb1e', 'mame-diarra.diouf@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mame Diarra', 'Diouf', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2009, 2012, 'INGENIEUR', 'Dakar', 'Directeur technique', 'Diplômée de l’EPT en Génie Électromécanique, je suis aujourd’hui directeur technique chez Eau Vive Sahel. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/b16263e7-a51b-5051-9f91-88cb74ab2d03.jpg', null, now() - interval '476 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('50faa88f-8b29-5930-a9bf-2e6bb6794c84', '47dbc521-229b-5806-be71-eb7d9f24fb1e', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2009-10-01', date '2012-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('74de37c6-d5fe-5e47-995d-48396519b2a3', '47dbc521-229b-5806-be71-eb7d9f24fb1e', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Stage de fin d’études', 'STAGE', date '2012-02-01', date '2012-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('e8331c0f-7942-5927-a385-0da0409ede05', '47dbc521-229b-5806-be71-eb7d9f24fb1e', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Automaticien', 'CDD', date '2012-10-01', date '2015-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('3d934b33-cafe-5216-a764-dc2eee33a098', '47dbc521-229b-5806-be71-eb7d9f24fb1e', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Directeur technique', 'FONCTION_PUBLIQUE', date '2015-09-01', null, false, true,
  'Poste actuel : directeur technique.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('9a1e21ad-a57a-5c33-91b2-24c6abc570fd', '47dbc521-229b-5806-be71-eb7d9f24fb1e', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Certification PMP', 'CERTIFICATION', date '2014-03-01', date '2014-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '7a73d349-98d3-5966-9d16-3da7f3700741', 'youssou.diouf@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Youssou', 'Diouf', 'ALUMNI', 'ACTIF', 'Génie Civil', 2008, 2011, 'INGENIEUR', 'Ziguinchor', 'BIM manager', 'Ingénieur civil (promo 2011). Mon parcours m’a mené de stages en entreprise à mon poste actuel de bIM manager à Ziguinchor.', '+221 77 000 00 00', null, null, now() - interval '885 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('a2a26982-3c14-546a-809b-17a1e2c81783', '7a73d349-98d3-5966-9d16-3da7f3700741', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2008-10-01', date '2011-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('685e0270-a04d-55d8-ab94-29d1e39c9f10', '7a73d349-98d3-5966-9d16-3da7f3700741', '4dbcd1bc-ac2d-5628-86a2-b70890077276', 'Stage de fin d’études', 'STAGE', date '2011-02-01', date '2011-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('c1724150-a567-5d1f-a849-0535c8492fc9', '7a73d349-98d3-5966-9d16-3da7f3700741', '4dbcd1bc-ac2d-5628-86a2-b70890077276', 'Ingénieur géotechnicien', 'CDD', date '2011-10-01', date '2013-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('836987ab-b501-51ce-aeaa-9226c25f356b', '7a73d349-98d3-5966-9d16-3da7f3700741', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'BIM manager', 'CDI', date '2013-09-01', null, false, true,
  'Poste actuel : bIM manager.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'd657f819-3789-584f-ab12-f814e2e66008', 'binta.gaye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Binta', 'Gaye', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 1999, 2002, 'INGENIEUR', 'Dakar', 'Ingénieur maintenance', 'Diplômée de l’EPT en Génie Électromécanique, je suis aujourd’hui ingénieur maintenance chez Eau Vive Sahel. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/d084e8c3-905e-5b76-8e4b-940dafff4874.jpg', null, now() - interval '158 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('4c7d1c80-eb7a-5fc0-8b2f-c30a784348a8', 'd657f819-3789-584f-ab12-f814e2e66008', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '1999-10-01', date '2002-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f2d60f74-21bc-5c03-9a24-e0005f7f688d', 'd657f819-3789-584f-ab12-f814e2e66008', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Stage de fin d’études', 'STAGE', date '2002-02-01', date '2002-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('2fb337d6-d5e0-56cb-ad19-5b3702d3ac1c', 'd657f819-3789-584f-ab12-f814e2e66008', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Responsable de production', 'CDI', date '2002-10-01', date '2007-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('bed3fbeb-3391-5760-9bb3-83890db11301', 'd657f819-3789-584f-ab12-f814e2e66008', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Ingénieur maintenance', 'CDI', date '2007-09-01', null, false, true,
  'Poste actuel : ingénieur maintenance.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '848f10d0-ecf4-597a-9bb8-a4a950cf2294', 'ramatoulaye.ndiaye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ramatoulaye', 'Ndiaye', 'ALUMNI', 'ACTIF', 'Génie Civil', 2021, 2024, 'INGENIEUR', 'Ziguinchor', 'Ingénieur géotechnicien', 'Ingénieure civil (promo 2024). Mon parcours m’a menée de stages en entreprise à mon poste actuel de ingénieur géotechnicien à Ziguinchor.', '+221 77 000 00 00', '/api/photos/0ecc1a4a-e234-5dc3-b36c-4791d7a6fd38.jpg', null, now() - interval '149 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('e447b9b7-afee-500e-9a5e-520b023978d4', '848f10d0-ecf4-597a-9bb8-a4a950cf2294', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2021-10-01', date '2024-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('33257ce6-e099-5848-b45e-aa11a75754a7', '848f10d0-ecf4-597a-9bb8-a4a950cf2294', '4dbcd1bc-ac2d-5628-86a2-b70890077276', 'Stage de fin d’études', 'STAGE', date '2024-02-01', date '2024-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('acebf1dc-26e0-5973-95a1-78bd8393a2bf', '848f10d0-ecf4-597a-9bb8-a4a950cf2294', '3e4bf4ab-5b3a-5436-8e8f-4cd7f25b802f', 'Ingénieur géotechnicien', 'CDI', date '2024-09-01', null, false, true,
  'Poste actuel : ingénieur géotechnicien.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('482483b2-60b1-545a-80a4-7d9a25583c82', '848f10d0-ecf4-597a-9bb8-a4a950cf2294', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Certification PMP', 'CERTIFICATION', date '2025-03-01', date '2025-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'aa9de02b-b819-5dcb-9fed-e994479e6b7f', 'moustapha.kebe@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Moustapha', 'Kébé', 'ALUMNI', 'ACTIF', 'Génie Civil', 2021, 2024, 'INGENIEUR', 'Abidjan', 'Chef de projet infrastructures', 'Ingénieur civil (promo 2024). Mon parcours m’a mené de stages en entreprise à mon poste actuel de chef de projet infrastructures à Abidjan.', '+221 77 000 00 00', '/api/photos/bd9b6b08-a241-5aed-81ab-e8d9695fd3b1.jpg', null, now() - interval '530 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('3442f1f7-7ad5-54df-b281-cc15bc9de18a', 'aa9de02b-b819-5dcb-9fed-e994479e6b7f', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2021-10-01', date '2024-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('9ab879ea-3d32-5130-882c-c27fc2b36d81', 'aa9de02b-b819-5dcb-9fed-e994479e6b7f', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Stage de fin d’études', 'STAGE', date '2024-02-01', date '2024-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('aa90e454-af50-55fc-b4c3-1dd93825a311', 'aa9de02b-b819-5dcb-9fed-e994479e6b7f', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Chef de projet infrastructures', 'CDI', date '2024-09-01', null, false, true,
  'Poste actuel : chef de projet infrastructures.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'c2e25360-dece-5880-89c5-b86ba7ded0e3', 'absa.kebe@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Absa', 'Kébé', 'ALUMNI', 'ACTIF', 'Génie Civil', 2022, 2025, 'INGENIEUR', 'Kaolack', 'Ingénieur structures', 'Ingénieure civil (promo 2025). Mon parcours m’a menée de stages en entreprise à mon poste actuel de ingénieur structures à Kaolack.', '+221 77 000 00 00', '/api/photos/95558200-b746-521d-9cac-8900c1fd83e1.jpg', null, now() - interval '521 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('e5aa5883-5275-5287-8299-5860c8e124fa', 'c2e25360-dece-5880-89c5-b86ba7ded0e3', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2022-10-01', date '2025-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('24957f71-69bf-5a9f-8de5-ee44d26fe2bb', 'c2e25360-dece-5880-89c5-b86ba7ded0e3', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage de fin d’études', 'STAGE', date '2025-02-01', date '2025-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f4e68e6f-149a-5ae2-810d-d744f70ad205', 'c2e25360-dece-5880-89c5-b86ba7ded0e3', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Ingénieur structures', 'FONCTION_PUBLIQUE', date '2025-09-01', null, false, true,
  'Poste actuel : ingénieur structures.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '235c7b1c-4170-52c0-9469-475b0210cb78', 'maimouna.gaye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Maïmouna', 'Gaye', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2016, 2019, 'INGENIEUR', 'Kaolack', 'Ingénieur maintenance', 'Diplômée de l’EPT en Génie Électromécanique, je suis aujourd’hui ingénieur maintenance chez Ciments de la Petite Côte. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/4cc13418-9b41-5664-baca-f69a67680e9c.jpg', null, now() - interval '130 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('c83551a1-904b-5ec0-ab73-a507c3ad3d6b', '235c7b1c-4170-52c0-9469-475b0210cb78', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2016-10-01', date '2019-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('1bbda75b-c7de-5eea-96ab-46abe3fd52da', '235c7b1c-4170-52c0-9469-475b0210cb78', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Stage de fin d’études', 'STAGE', date '2019-02-01', date '2019-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('6183f24a-d224-5a64-8cd9-a48376301ff1', '235c7b1c-4170-52c0-9469-475b0210cb78', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Ingénieur électricien', 'CDD', date '2019-10-01', date '2023-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('cc7435a7-00de-5f19-b684-ea2ba29ec0a8', '235c7b1c-4170-52c0-9469-475b0210cb78', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Ingénieur maintenance', 'CDI', date '2023-09-01', null, false, true,
  'Poste actuel : ingénieur maintenance.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('7532d673-ddc1-56a6-b805-53b74a2e9a4e', '235c7b1c-4170-52c0-9469-475b0210cb78', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Habilitation électrique haute tension', 'CERTIFICATION', date '2022-03-01', date '2022-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'db11a9f9-a998-50ee-9a16-dba7266089bb', 'thierno.fall@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Thierno', 'Fall', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 1999, 2002, 'INGENIEUR', 'Toulouse', 'Product manager', 'Product manager chez Lumen Conseil, basé à Toulouse. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/509cd2e9-62e1-550a-8feb-4d80c55adee9.jpg', null, now() - interval '629 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('2dd7b0af-3b36-57eb-ad33-4c1ed8124787', 'db11a9f9-a998-50ee-9a16-dba7266089bb', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '1999-10-01', date '2002-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('32b36081-7deb-5d74-9f1f-7f62dedd9d20', 'db11a9f9-a998-50ee-9a16-dba7266089bb', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage de fin d’études', 'STAGE', date '2002-02-01', date '2002-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('2cd35230-643f-5676-a332-bcce7096ea8b', 'db11a9f9-a998-50ee-9a16-dba7266089bb', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Responsable des systèmes d’information', 'CDD', date '2002-10-01', date '2007-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('11bbb71b-c3d8-5a6f-86ec-db774602a5e7', 'db11a9f9-a998-50ee-9a16-dba7266089bb', '7e73cd92-6749-510c-964c-c90065024e4a', 'Product manager', 'CDI', date '2007-09-01', null, false, true,
  'Poste actuel : product manager.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '577385a3-9946-557b-be83-a8afaf69835f', 'samba.diagne@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Samba', 'Diagne', 'ALUMNI', 'ACTIF', 'Génie Civil', 2011, 2014, 'INGENIEUR', 'Dakar', 'Ingénieur VRD', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Génie Nord Consultants où j’occupe le poste de ingénieur VRD. Ouvert aux échanges sur les métiers de la civil.', '+221 77 000 00 00', '/api/photos/0ccdc156-6477-5241-a16a-53e5f3f5ac07.jpg', null, now() - interval '271 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('77d34e5b-f826-5e7e-bc95-1d26d5be1559', '577385a3-9946-557b-be83-a8afaf69835f', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2011-10-01', date '2014-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f8c49667-884e-549d-8e54-59b8f6b43783', '577385a3-9946-557b-be83-a8afaf69835f', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Stage de fin d’études', 'STAGE', date '2014-02-01', date '2014-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('2d6958b1-f506-5abb-8c11-3063c36c4265', '577385a3-9946-557b-be83-a8afaf69835f', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Master en génie urbain', 'DIPLOMANTE', date '2014-09-15', date '2015-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('4107f17f-d02e-5f09-9fdd-86270c119077', '577385a3-9946-557b-be83-a8afaf69835f', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Ingénieur structures', 'CDI', date '2015-10-01', date '2017-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('46f7e3a4-41b8-5e92-b187-77c97c774571', '577385a3-9946-557b-be83-a8afaf69835f', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Ingénieur VRD', 'FONCTION_PUBLIQUE', date '2017-09-01', null, false, true,
  'Poste actuel : ingénieur VRD.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'd634be2e-9272-5970-944b-55be40fef00b', 'assane.gueye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Assane', 'Gueye', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2001, 2004, 'INGENIEUR', 'Saint-Louis', 'Directeur de projets', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Teranga Télécom où j’occupe le poste de directeur de projets. Ouvert aux échanges sur les métiers de la informatique et télécommunications.', '+221 77 000 00 00', '/api/photos/d022ca7e-2654-5af0-bada-23dabd0b6cf3.jpg', null, now() - interval '659 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('be96f95a-e6d6-5db3-844f-dfcdb87d7bcd', 'd634be2e-9272-5970-944b-55be40fef00b', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2001-10-01', date '2004-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('1b3b5833-2314-5ebf-a17c-a284c856592b', 'd634be2e-9272-5970-944b-55be40fef00b', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Stage de fin d’études', 'STAGE', date '2004-02-01', date '2004-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('5e5655cb-43dc-553e-886e-6a92d46e5305', 'd634be2e-9272-5970-944b-55be40fef00b', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Ingénieur logiciel', 'CDD', date '2004-10-01', date '2009-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('7e6f0a76-a80a-5215-92a6-9fe4953fb60c', 'd634be2e-9272-5970-944b-55be40fef00b', '8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Directeur de projets', 'CDI', date '2009-09-01', null, false, true,
  'Poste actuel : directeur de projets.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', 'alassane.ka@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Alassane', 'Ka', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2010, 2013, 'INGENIEUR', 'Dakar', 'Responsable d’équipe', 'Ingénieur électromécanique (promo 2013). Mon parcours m’a mené de stages en entreprise à mon poste actuel de responsable d’équipe à Dakar.', '+221 77 000 00 00', '/api/photos/244cbcb7-3958-520c-9f0a-9d1cd30852f4.jpg', null, now() - interval '650 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('25040d6c-b78c-53d0-afa5-2c4d1ff47b77', '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2010-10-01', date '2013-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('74be4ba0-52c9-53d0-b501-97d32a2d0716', '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Stage de fin d’études', 'STAGE', date '2013-02-01', date '2013-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('606b06ea-7ffc-5706-a8b9-8198571a04ee', '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Ingénieur électricien', 'CDD', date '2013-10-01', date '2018-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('a01a2473-7123-50e7-9f1b-bcdd37669cba', '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Responsable d’équipe', 'CDI', date '2018-09-01', null, false, true,
  'Poste actuel : responsable d’équipe.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('50d95b3a-43ab-5a2d-8279-1308f17b4b3b', '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Habilitation électrique haute tension', 'CERTIFICATION', date '2014-03-01', date '2014-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'a0363ce2-7f2e-5b3c-94c4-2f3a7a94d0ca', 'mariama.barry@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mariama', 'Barry', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2004, 2007, 'INGENIEUR', 'Dakar', 'Directeur technique', 'Ingénieure informatique et télécommunications (promo 2007). Mon parcours m’a menée de stages en entreprise à mon poste actuel de directeur technique à Dakar.', '+221 77 000 00 00', null, null, now() - interval '698 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('4a1c1ede-7072-5ef0-bac2-85b7ac9f3dc0', 'a0363ce2-7f2e-5b3c-94c4-2f3a7a94d0ca', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2004-10-01', date '2007-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f3550083-a806-5614-b211-2311d8fde4dc', 'a0363ce2-7f2e-5b3c-94c4-2f3a7a94d0ca', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Stage de fin d’études', 'STAGE', date '2007-02-01', date '2007-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('81b3eac4-977c-54cc-bd8e-f8a777c34a89', 'a0363ce2-7f2e-5b3c-94c4-2f3a7a94d0ca', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Master en science des données', 'DIPLOMANTE', date '2007-09-15', date '2008-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('be54e9c9-6444-5114-8e46-56d5e8db8f94', 'a0363ce2-7f2e-5b3c-94c4-2f3a7a94d0ca', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Ingénieur télécoms', 'CDI', date '2008-10-01', date '2010-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('aedd35cd-cb15-50c4-b2f2-5a14b89c123f', 'a0363ce2-7f2e-5b3c-94c4-2f3a7a94d0ca', '7e73cd92-6749-510c-964c-c90065024e4a', 'Directeur technique', 'CDI', date '2010-09-01', null, false, true,
  'Poste actuel : directeur technique.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '75d14361-a9af-5dd6-a9d0-d5bf9d20fa32', 'seydou.sene@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Seydou', 'Sène', 'ALUMNI', 'ACTIF', 'Génie Industriel', 2010, 2013, 'INGENIEUR', 'Touba', 'Chef de service', 'Diplômé de l’EPT en Génie Industriel, je suis aujourd’hui chef de service chez Mines du Sénégal oriental. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/0820a639-3f6c-5d6e-ad30-c5959c1005ad.jpg', null, now() - interval '868 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('65882964-6762-5272-bad7-0405f7898313', '75d14361-a9af-5dd6-a9d0-d5bf9d20fa32', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Industriel', 'DIPLOMANTE', date '2010-10-01', date '2013-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f89bd139-28d4-50c3-b656-0f2d25c1779b', '75d14361-a9af-5dd6-a9d0-d5bf9d20fa32', '7e73cd92-6749-510c-964c-c90065024e4a', 'Stage de fin d’études', 'STAGE', date '2013-02-01', date '2013-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('eb6ac862-881c-5d06-a9ea-ffcea85ba67e', '75d14361-a9af-5dd6-a9d0-d5bf9d20fa32', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Master en management de la chaîne logistique', 'DIPLOMANTE', date '2013-09-15', date '2014-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('fdcb8bb3-c92a-5b7e-9240-6809520ad350', '75d14361-a9af-5dd6-a9d0-d5bf9d20fa32', '7e73cd92-6749-510c-964c-c90065024e4a', 'Chef de projet industriel', 'CDD', date '2014-10-01', date '2019-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('c8aad575-22da-587b-98a8-0987e4fa82f7', '75d14361-a9af-5dd6-a9d0-d5bf9d20fa32', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Chef de service', 'FONCTION_PUBLIQUE', date '2019-09-01', null, false, true,
  'Poste actuel : chef de service.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'ead565a2-323e-591b-84d0-8db8bda4c57b', 'nene.mbengue@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Néné', 'Mbengue', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2004, 2007, 'INGENIEUR', 'Thiès', 'Directeur technique', 'Diplômée de l’EPT en Génie Informatique et Télécommunications, je suis aujourd’hui directeur technique chez Jàmm Pay. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/bc3fb2ac-cd3e-591f-8037-cf2a4a38f599.jpg', 'https://portfolio.example.org/nene-mbengue', now() - interval '684 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('f7f7cda0-ca22-5931-9327-d99409d65c08', 'ead565a2-323e-591b-84d0-8db8bda4c57b', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2004-10-01', date '2007-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('dbe19a89-4ae6-5b6d-8c31-2aac59e06717', 'ead565a2-323e-591b-84d0-8db8bda4c57b', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Stage de fin d’études', 'STAGE', date '2007-02-01', date '2007-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('d4f6695a-df7e-5637-8f94-fdd0be9a3a27', 'ead565a2-323e-591b-84d0-8db8bda4c57b', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Master en science des données', 'DIPLOMANTE', date '2007-09-15', date '2008-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('d5145375-c795-50a3-b0a5-8bb94e1fe410', 'ead565a2-323e-591b-84d0-8db8bda4c57b', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Ingénieur cybersécurité', 'CDD', date '2008-10-01', date '2010-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('9212fa7f-59af-5121-bfc4-38f660ce265e', 'ead565a2-323e-591b-84d0-8db8bda4c57b', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Directeur technique', 'FREELANCE', date '2010-09-01', null, false, true,
  'Poste actuel : directeur technique.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '9f088eb6-0059-5cec-a0f2-d8cd281a702d', 'demba.sene@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Demba', 'Sène', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2014, 2017, 'INGENIEUR', 'Montréal', 'Directeur de projets', 'Diplômé de l’EPT en Génie Électromécanique, je suis aujourd’hui directeur de projets chez Eau Vive Sahel. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/cca94c35-dfca-554a-926e-5c6be02f028c.jpg', null, now() - interval '510 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('1154ec59-8fa3-5306-b3da-ca1fea30b033', '9f088eb6-0059-5cec-a0f2-d8cd281a702d', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2014-10-01', date '2017-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('1308e4bc-f417-5bc2-b9a9-6015a2e934fd', '9f088eb6-0059-5cec-a0f2-d8cd281a702d', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage de fin d’études', 'STAGE', date '2017-02-01', date '2017-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('03bdff60-bcc8-5d67-a038-1b7ea2769455', '9f088eb6-0059-5cec-a0f2-d8cd281a702d', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Master en énergies renouvelables', 'DIPLOMANTE', date '2017-09-15', date '2018-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('3e0e7750-ccf4-50d7-bfe9-186b37009277', '9f088eb6-0059-5cec-a0f2-d8cd281a702d', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Ingénieur process', 'CDI', date '2018-10-01', date '2020-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('18975267-6ca0-5a95-a724-764b38b07bb2', '9f088eb6-0059-5cec-a0f2-d8cd281a702d', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Directeur de projets', 'CDI', date '2020-09-01', null, false, true,
  'Poste actuel : directeur de projets.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('ead6587a-bf14-5245-9086-5fc3955eee35', '9f088eb6-0059-5cec-a0f2-d8cd281a702d', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Habilitation électrique haute tension', 'CERTIFICATION', date '2026-03-01', date '2026-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '03017916-9ccb-5538-bf6a-e8b136545408', 'arame.sene@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Arame', 'Sène', 'ALUMNI', 'ACTIF', 'Génie Civil', 2019, 2022, 'INGENIEUR', 'Nouakchott', 'Ingénieur hydraulique', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Cap-Vert Construction où j’occupe le poste de ingénieur hydraulique. Ouverte aux échanges sur les métiers de la civil.', '+221 77 000 00 00', '/api/photos/7b803439-408c-5b04-a3fa-a0456c8af06b.jpg', null, now() - interval '614 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('6f9eb03e-e1e1-53f7-ab30-3f89aab68132', '03017916-9ccb-5538-bf6a-e8b136545408', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2019-10-01', date '2022-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('3c735db0-f0d4-5ad4-aa44-852ee45eca5f', '03017916-9ccb-5538-bf6a-e8b136545408', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Stage de fin d’études', 'STAGE', date '2022-02-01', date '2022-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('57fc84b7-c374-526d-8938-eb30868314ba', '03017916-9ccb-5538-bf6a-e8b136545408', '3e4bf4ab-5b3a-5436-8e8f-4cd7f25b802f', 'Ingénieur hydraulique', 'FONCTION_PUBLIQUE', date '2022-09-01', null, false, true,
  'Poste actuel : ingénieur hydraulique.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('1556c30c-90b7-5c4c-a686-3dfe9b53fd00', '03017916-9ccb-5538-bf6a-e8b136545408', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Formation BIM avancée', 'CERTIFICATION', date '2026-03-01', date '2026-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '8f0a4694-dbd7-56ef-8a66-f9b0169504e8', 'souleymane.mbengue@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Souleymane', 'Mbengue', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2006, 2009, 'INGENIEUR', 'Casablanca', 'Directeur de projets', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Eau Vive Sahel où j’occupe le poste de directeur de projets. Ouvert aux échanges sur les métiers de la électromécanique.', '+221 77 000 00 00', '/api/photos/0b6b787d-afb6-52b7-812a-81611b27146c.jpg', null, now() - interval '347 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('bf59ba9d-718c-5026-9200-f87ce7d63ca2', '8f0a4694-dbd7-56ef-8a66-f9b0169504e8', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2006-10-01', date '2009-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('e6bb27fc-2c9c-5c4d-9f4c-3d73ed3effed', '8f0a4694-dbd7-56ef-8a66-f9b0169504e8', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage de fin d’études', 'STAGE', date '2009-02-01', date '2009-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('dc631f9e-a9de-5885-a543-157d3d2b32dd', '8f0a4694-dbd7-56ef-8a66-f9b0169504e8', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Ingénieur énergies renouvelables', 'CDI', date '2009-10-01', date '2013-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('be7409e7-0bce-5577-a036-e9ac29a9b7ee', '8f0a4694-dbd7-56ef-8a66-f9b0169504e8', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Directeur de projets', 'CDI', date '2013-09-01', null, false, true,
  'Poste actuel : directeur de projets.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('d92d11d5-2655-5377-9a31-1fc6f3771d40', '8f0a4694-dbd7-56ef-8a66-f9b0169504e8', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Habilitation électrique haute tension', 'CERTIFICATION', date '2023-03-01', date '2023-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'b5872f7c-6d3c-5f90-b99a-e6b4586cb9f2', 'youssou.cisse@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Youssou', 'Cissé', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2004, 2007, 'INGENIEUR', 'Thiès', 'Automaticien', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Génie Nord Consultants où j’occupe le poste de automaticien. Ouvert aux échanges sur les métiers de la électromécanique.', '+221 77 000 00 00', '/api/photos/c6a14eb6-c8b0-5052-97ca-57d628e55a2a.jpg', null, now() - interval '630 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('14c9f389-033b-5b12-a373-71966bf24d61', 'b5872f7c-6d3c-5f90-b99a-e6b4586cb9f2', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2004-10-01', date '2007-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('53ece8fe-537e-5495-a75f-32e3ea5eda8e', 'b5872f7c-6d3c-5f90-b99a-e6b4586cb9f2', 'eb348294-3725-52e1-8093-d20746ed097d', 'Stage de fin d’études', 'STAGE', date '2007-02-01', date '2007-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('b90c0ff5-799c-5c47-a141-1d0eda773613', 'b5872f7c-6d3c-5f90-b99a-e6b4586cb9f2', 'eb348294-3725-52e1-8093-d20746ed097d', 'Ingénieur électricien', 'CDI', date '2007-10-01', date '2012-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('9d340c2a-9f35-5c55-b88c-05ecb87ffeb8', 'b5872f7c-6d3c-5f90-b99a-e6b4586cb9f2', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Automaticien', 'FREELANCE', date '2012-09-01', null, false, true,
  'Poste actuel : automaticien.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'e30df4e3-580d-5f8a-9ec9-5d29165f5ea3', 'assane.faye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Assane', 'Faye', 'ALUMNI', 'ACTIF', 'Génie Industriel', 2000, 2003, 'INGENIEUR', 'Dakar', 'Responsable d’équipe', 'Diplômé de l’EPT en Génie Industriel, je suis aujourd’hui responsable d’équipe chez Lumen Conseil. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/82d53b81-f79f-5ce1-b4aa-f17f78a0de46.jpg', null, now() - interval '48 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('2bf1cd5d-5b8b-5e37-80bf-751b04a2685c', 'e30df4e3-580d-5f8a-9ec9-5d29165f5ea3', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Industriel', 'DIPLOMANTE', date '2000-10-01', date '2003-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('ea4f949e-5d0a-561c-863e-664a79e080f9', 'e30df4e3-580d-5f8a-9ec9-5d29165f5ea3', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Stage de fin d’études', 'STAGE', date '2003-02-01', date '2003-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('e259dad7-3a91-5fff-91c7-be4e84a4e8c6', 'e30df4e3-580d-5f8a-9ec9-5d29165f5ea3', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Ingénieur méthodes', 'CDD', date '2003-10-01', date '2007-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('8a10fca4-03fc-5407-ba2a-ba53122db57c', 'e30df4e3-580d-5f8a-9ec9-5d29165f5ea3', '7e73cd92-6749-510c-964c-c90065024e4a', 'Responsable d’équipe', 'FREELANCE', date '2007-09-01', null, false, true,
  'Poste actuel : responsable d’équipe.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '1a1ae694-fc50-5757-931c-51ac8bbdcfc5', 'marieme.ka@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Marième', 'Ka', 'ALUMNI', 'ACTIF', 'Génie Civil', 2011, 2014, 'INGENIEUR', 'Paris', 'Responsable d’équipe', 'Responsable d’équipe chez Agence des infrastructures de Thiès, basée à Paris. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/51ffc83f-98aa-5556-981c-b04845e1ec13.jpg', null, now() - interval '897 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('9a765189-91d8-5476-ad56-a1b187e305b4', '1a1ae694-fc50-5757-931c-51ac8bbdcfc5', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2011-10-01', date '2014-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('3c04e057-dd2f-509f-a35f-f0eb2b7763e3', '1a1ae694-fc50-5757-931c-51ac8bbdcfc5', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Stage de fin d’études', 'STAGE', date '2014-02-01', date '2014-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('5e486f94-859e-57b0-b0bb-87290043f073', '1a1ae694-fc50-5757-931c-51ac8bbdcfc5', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Conducteur de travaux', 'CDI', date '2014-10-01', date '2016-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('05db32ae-2676-51af-8ab1-f9d5c1107575', '1a1ae694-fc50-5757-931c-51ac8bbdcfc5', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Responsable d’équipe', 'FONCTION_PUBLIQUE', date '2016-09-01', null, false, true,
  'Poste actuel : responsable d’équipe.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '263ad97e-9911-56e5-90a2-f2ab0d88ddf2', 'abdou.tall@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Abdou', 'Tall', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2007, 2010, 'INGENIEUR', 'Thiès', 'Chef de service', 'Ingénieur électromécanique (promo 2010). Mon parcours m’a mené de stages en entreprise à mon poste actuel de chef de service à Thiès.', '+221 77 000 00 00', '/api/photos/e9d8ccc4-9791-53c4-bcef-146087503cc0.jpg', null, now() - interval '595 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('ae48dae6-35f0-528e-ab44-d9f284eed3ad', '263ad97e-9911-56e5-90a2-f2ab0d88ddf2', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2007-10-01', date '2010-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('ba88e8a7-53b7-59d1-945a-de3595171c86', '263ad97e-9911-56e5-90a2-f2ab0d88ddf2', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Stage de fin d’études', 'STAGE', date '2010-02-01', date '2010-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('7b0168d8-a008-573b-9b63-82eeff148b2a', '263ad97e-9911-56e5-90a2-f2ab0d88ddf2', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Responsable de production', 'CDI', date '2010-10-01', date '2012-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('378fa948-bdc7-519a-99b3-8e49100eb8ea', '263ad97e-9911-56e5-90a2-f2ab0d88ddf2', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Chef de service', 'FREELANCE', date '2012-09-01', null, false, true,
  'Poste actuel : chef de service.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '2c80d750-a819-5513-b56c-483c3c6d0379', 'binta.cisse@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Binta', 'Cissé', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2013, 2016, 'INGENIEUR', 'Dakar', 'Responsable d’équipe', 'Responsable d’équipe chez Jàmm Pay, basée à Dakar. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/cf8cdc6e-19d9-5a8a-9cfb-e4d9f16fb4f5.jpg', 'https://portfolio.example.org/binta-cisse', now() - interval '216 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('554591b5-377a-5fa4-a76b-1b7a7cbd5726', '2c80d750-a819-5513-b56c-483c3c6d0379', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2013-10-01', date '2016-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('03bf4b1b-d552-57d5-8d95-350b32322fc8', '2c80d750-a819-5513-b56c-483c3c6d0379', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage de fin d’études', 'STAGE', date '2016-02-01', date '2016-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('410f0c20-1d6a-5469-9d02-358d0ccd116f', '2c80d750-a819-5513-b56c-483c3c6d0379', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Ingénieur réseaux', 'CDD', date '2016-10-01', date '2019-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('cb0c7f14-0d94-55ed-8927-958f8cd0e6ae', '2c80d750-a819-5513-b56c-483c3c6d0379', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Responsable d’équipe', 'CDI', date '2019-09-01', null, false, true,
  'Poste actuel : responsable d’équipe.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('d304c57c-40e2-5568-8785-c020f0057d13', '2c80d750-a819-5513-b56c-483c3c6d0379', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Certification AWS Solutions Architect', 'CERTIFICATION', date '2025-03-01', date '2025-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '6140551c-046e-5ae3-a2d5-7a9d63de1fc1', 'fallou.sylla@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Fallou', 'Sylla', 'ALUMNI', 'ACTIF', 'Génie Industriel', 2008, 2011, 'INGENIEUR', 'Ziguinchor', 'Contrôleur de gestion industriel', 'Ingénieur industriel (promo 2011). Mon parcours m’a mené de stages en entreprise à mon poste actuel de contrôleur de gestion industriel à Ziguinchor.', '+221 77 000 00 00', '/api/photos/41d4debf-a512-592c-884d-754bf4d31d64.jpg', null, now() - interval '773 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('3eb6a2e6-6c0c-5fa7-98c6-7d8156f23463', '6140551c-046e-5ae3-a2d5-7a9d63de1fc1', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Industriel', 'DIPLOMANTE', date '2008-10-01', date '2011-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('c2371bf9-32e6-5e73-b30c-219a677ffd09', '6140551c-046e-5ae3-a2d5-7a9d63de1fc1', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Stage de fin d’études', 'STAGE', date '2011-02-01', date '2011-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f0e142ed-8ab3-5c0b-8921-1a5ccf6812ec', '6140551c-046e-5ae3-a2d5-7a9d63de1fc1', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Ingénieur méthodes', 'CDD', date '2011-10-01', date '2015-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('e79dac07-fdb0-54cd-81c9-e9c1ee5cdf3d', '6140551c-046e-5ae3-a2d5-7a9d63de1fc1', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Contrôleur de gestion industriel', 'FONCTION_PUBLIQUE', date '2015-09-01', null, false, true,
  'Poste actuel : contrôleur de gestion industriel.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('49c07437-0e21-5600-b8b0-cf8d1df0b516', '6140551c-046e-5ae3-a2d5-7a9d63de1fc1', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Certification APICS CSCP', 'CERTIFICATION', date '2020-03-01', date '2020-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '2dff725c-6ec3-5b75-b826-d333f238f88f', 'malick.mbengue@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Malick', 'Mbengue', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2016, 2019, 'INGENIEUR', 'Mbour', 'Développeur full-stack', 'Ingénieur informatique et télécommunications (promo 2019). Mon parcours m’a mené de stages en entreprise à mon poste actuel de développeur full-stack à Mbour.', '+221 77 000 00 00', '/api/photos/dfc8b879-81e8-51ce-b8c4-d079ae9d375b.jpg', 'https://portfolio.example.org/malick-mbengue', now() - interval '54 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('155c655b-8362-53c7-ac86-dc3b19b57d4d', '2dff725c-6ec3-5b75-b826-d333f238f88f', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2016-10-01', date '2019-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('8b25842b-72e0-5101-9cb3-71ff73ab1f3b', '2dff725c-6ec3-5b75-b826-d333f238f88f', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Stage de fin d’études', 'STAGE', date '2019-02-01', date '2019-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('45b6c305-3792-586f-968c-cd9932e0021e', '2dff725c-6ec3-5b75-b826-d333f238f88f', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Master en science des données', 'DIPLOMANTE', date '2019-09-15', date '2020-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('d71f99ff-dfcf-5032-add1-d99f8f4d3573', '2dff725c-6ec3-5b75-b826-d333f238f88f', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Architecte cloud', 'CDD', date '2020-10-01', date '2024-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('473e69e1-5a31-5017-abb7-46536e6a0c67', '2dff725c-6ec3-5b75-b826-d333f238f88f', '7e73cd92-6749-510c-964c-c90065024e4a', 'Développeur full-stack', 'CDI', date '2024-09-01', null, false, true,
  'Poste actuel : développeur full-stack.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('1614423b-06a2-583f-bdf9-37832c35bb07', '2dff725c-6ec3-5b75-b826-d333f238f88f', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Certification AWS Solutions Architect', 'CERTIFICATION', date '2024-03-01', date '2024-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '93d2ab4b-627f-581f-a8e5-c9e3ba3cb819', 'mame-diarra.cisse@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mame Diarra', 'Cissé', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2014, 2017, 'INGENIEUR', 'Kaolack', 'Directeur technique', 'Directeur technique chez Dakar Cloud Services, basée à Kaolack. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/b2d54366-2ba4-53aa-9506-c2dc74fee9b2.jpg', null, now() - interval '402 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('3f67a936-b830-5be2-85f5-71eb1b8cbcaf', '93d2ab4b-627f-581f-a8e5-c9e3ba3cb819', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2014-10-01', date '2017-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('0173b00b-590e-5845-a2e9-881ec3f97ef2', '93d2ab4b-627f-581f-a8e5-c9e3ba3cb819', '8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Stage de fin d’études', 'STAGE', date '2017-02-01', date '2017-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('9ce43764-5bbb-5406-a8aa-8863ea2da7e9', '93d2ab4b-627f-581f-a8e5-c9e3ba3cb819', '8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Ingénieur cybersécurité', 'CDI', date '2017-10-01', date '2022-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('10db97f0-4555-5c4f-b8af-ef85091722a9', '93d2ab4b-627f-581f-a8e5-c9e3ba3cb819', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Directeur technique', 'FONCTION_PUBLIQUE', date '2022-09-01', null, false, true,
  'Poste actuel : directeur technique.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', 'seydou.toure@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Seydou', 'Touré', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2010, 2013, 'INGENIEUR', 'Paris', 'Ingénieur énergies renouvelables', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Eau Vive Sahel où j’occupe le poste de ingénieur énergies renouvelables. Ouvert aux échanges sur les métiers de la électromécanique.', '+221 77 000 00 00', '/api/photos/db4956bf-7f6c-56ac-bfe9-ca098568aad5.jpg', null, now() - interval '591 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('50689c00-b951-590c-9a6d-a26ad8208ced', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2010-10-01', date '2013-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('6d4dbef0-93a5-54e0-af81-f16d1a4b3b31', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Stage de fin d’études', 'STAGE', date '2013-02-01', date '2013-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('0ef6d884-c45f-5ea5-853a-a1c02f92d9bf', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Master en énergies renouvelables', 'DIPLOMANTE', date '2013-09-15', date '2014-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('73138f81-5664-5370-80fe-0cf2b9f6c206', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Ingénieur électricien', 'CDD', date '2014-10-01', date '2019-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('651b4807-7731-502a-8dfa-859f3eba7194', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Ingénieur énergies renouvelables', 'CDI', date '2019-09-01', null, false, true,
  'Poste actuel : ingénieur énergies renouvelables.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '4bcb274c-796b-59c3-834f-5e321bfcd580', 'oumou.fall@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Oumou', 'Fall', 'ALUMNI', 'ACTIF', 'Génie Aéronautique et Aérospatial', 2004, 2007, 'INGENIEUR', 'Thiès', 'Directeur technique', 'Ingénieure aéronautique et aérospatial (promo 2007). Mon parcours m’a menée de stages en entreprise à mon poste actuel de directeur technique à Thiès.', '+221 77 000 00 00', '/api/photos/6b2f99d7-f674-5301-80d6-1662955bf93c.jpg', null, now() - interval '206 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('b04dbb9b-39a7-53e5-b354-f765c848a442', '4bcb274c-796b-59c3-834f-5e321bfcd580', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Aéronautique et Aérospatial', 'DIPLOMANTE', date '2004-10-01', date '2007-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('cea81c85-2595-532e-9b98-6dc8162a2efd', '4bcb274c-796b-59c3-834f-5e321bfcd580', '0a080697-5a47-5150-8a7c-d22c53494978', 'Stage de fin d’études', 'STAGE', date '2007-02-01', date '2007-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('41fb568e-e83f-5e03-b70a-1c2f4954f3dc', '4bcb274c-796b-59c3-834f-5e321bfcd580', '0a080697-5a47-5150-8a7c-d22c53494978', 'Directeur technique', 'FONCTION_PUBLIQUE', date '2007-09-01', null, false, true,
  'Poste actuel : directeur technique.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('b4e07640-f2ae-52b6-88ea-62cbfb7a7930', '4bcb274c-796b-59c3-834f-5e321bfcd580', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Formation réglementation Part-145', 'CERTIFICATION', date '2012-03-01', date '2012-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'a356c8fe-aad9-58e3-bfc2-29bca745f15a', 'mor.mbaye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mor', 'Mbaye', 'ALUMNI', 'ACTIF', 'Génie Civil', 2021, 2024, 'INGENIEUR', 'Dakar', 'Ingénieur VRD', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Ciments de la Petite Côte où j’occupe le poste de ingénieur VRD. Ouvert aux échanges sur les métiers de la civil.', '+221 77 000 00 00', '/api/photos/584af265-5945-5254-b8f5-8836b925c68f.jpg', null, now() - interval '406 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('83c1cabe-2483-5c86-8601-a86d14096545', 'a356c8fe-aad9-58e3-bfc2-29bca745f15a', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2021-10-01', date '2024-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('54da50de-3ee0-56c8-af91-4b13e136c22f', 'a356c8fe-aad9-58e3-bfc2-29bca745f15a', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage de fin d’études', 'STAGE', date '2024-02-01', date '2024-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('de1e2398-4c23-53a4-9d30-a419415fa28b', 'a356c8fe-aad9-58e3-bfc2-29bca745f15a', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Ingénieur VRD', 'CDI', date '2024-09-01', null, false, true,
  'Poste actuel : ingénieur VRD.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '8d7ce8d8-e167-529b-be7e-4d8fd645a8fe', 'alassane.diop@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Alassane', 'Diop', 'ALUMNI', 'ACTIF', 'Génie Civil', 2019, 2022, 'INGENIEUR', 'Thiès', 'Ingénieur structures', 'Ingénieur civil (promo 2022). Mon parcours m’a mené de stages en entreprise à mon poste actuel de ingénieur structures à Thiès.', '+221 77 000 00 00', '/api/photos/73283de9-e456-5e73-a926-8272ce4e30c9.jpg', null, now() - interval '346 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('4ff8692a-8eea-562f-8bc8-37645e32fae9', '8d7ce8d8-e167-529b-be7e-4d8fd645a8fe', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2019-10-01', date '2022-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('2047ed5f-b8f4-558e-ba23-07bd006b0f8b', '8d7ce8d8-e167-529b-be7e-4d8fd645a8fe', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Stage de fin d’études', 'STAGE', date '2022-02-01', date '2022-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('a8ff37c1-a366-5278-a4dd-3204fc8adc1d', '8d7ce8d8-e167-529b-be7e-4d8fd645a8fe', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Master en génie urbain', 'DIPLOMANTE', date '2022-09-15', date '2023-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('cbbc78d8-262d-5861-98b0-8901a5b8b168', '8d7ce8d8-e167-529b-be7e-4d8fd645a8fe', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Ingénieur structures', 'FREELANCE', date '2023-09-01', null, false, true,
  'Poste actuel : ingénieur structures.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '58bf6984-dbbe-5b82-afe6-3f8c58a1be77', 'assane.kebe@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Assane', 'Kébé', 'ALUMNI', 'ACTIF', 'Génie Industriel', 2015, 2018, 'INGENIEUR', 'Ziguinchor', 'Directeur de projets', 'Directeur de projets chez Ciments de la Petite Côte, basé à Ziguinchor. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/f0a5689d-de74-5a8a-bd2a-f75808894057.jpg', null, now() - interval '549 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('9ababc7d-4f53-5530-9e3d-c9130bc32e3b', '58bf6984-dbbe-5b82-afe6-3f8c58a1be77', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Industriel', 'DIPLOMANTE', date '2015-10-01', date '2018-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('a7ea9197-f10d-5b83-ba27-f4287708b6e1', '58bf6984-dbbe-5b82-afe6-3f8c58a1be77', '8fb67a87-4ec4-56b8-a021-1ab27b84d9b1', 'Stage de fin d’études', 'STAGE', date '2018-02-01', date '2018-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('d17a3b46-81ef-53b0-834f-bb7c6f116cca', '58bf6984-dbbe-5b82-afe6-3f8c58a1be77', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Master en management de la chaîne logistique', 'DIPLOMANTE', date '2018-09-15', date '2019-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('b89c7fe9-868f-5e68-88f9-d78c04c216d5', '58bf6984-dbbe-5b82-afe6-3f8c58a1be77', '8fb67a87-4ec4-56b8-a021-1ab27b84d9b1', 'Ingénieur méthodes', 'CDI', date '2019-10-01', date '2024-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('313e44c7-fe3f-5772-abb4-51ef769d8108', '58bf6984-dbbe-5b82-afe6-3f8c58a1be77', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Directeur de projets', 'CDI', date '2024-09-01', null, false, true,
  'Poste actuel : directeur de projets.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '20d4fb0d-adb2-5d38-b9fe-715a170435d3', 'fatoumata.cisse@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Fatoumata', 'Cissé', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2003, 2006, 'INGENIEUR', 'Dakar', 'Ingénieur énergies renouvelables', 'Diplômée de l’EPT en Génie Électromécanique, je suis aujourd’hui ingénieur énergies renouvelables chez Sahel Énergie Distribution. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/cc8f071c-fea9-5d62-b1ac-ef2e205a44e8.jpg', null, now() - interval '288 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('34eed510-2577-5e28-a40f-bd1a0be7ebac', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2003-10-01', date '2006-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('0c992e21-3631-51b5-9492-15a766fd4591', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Stage de fin d’études', 'STAGE', date '2006-02-01', date '2006-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('26e500c2-f48e-5ef4-a239-80a35a1d45fa', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Ingénieur process', 'CDD', date '2006-10-01', date '2008-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('d648f10e-0c73-5878-9ebe-fb807b46f219', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', 'eb348294-3725-52e1-8093-d20746ed097d', 'Ingénieur énergies renouvelables', 'CDI', date '2008-09-01', null, false, true,
  'Poste actuel : ingénieur énergies renouvelables.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('5b276014-d5d9-59e5-b055-d799d0e9b301', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Habilitation électrique haute tension', 'CERTIFICATION', date '2009-03-01', date '2009-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '6593d854-bb87-5921-a69f-4167b7a5e904', 'boubacar.gueye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Boubacar', 'Gueye', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2002, 2005, 'INGENIEUR', 'Touba', 'Architecte cloud', 'Ingénieur informatique et télécommunications (promo 2005). Mon parcours m’a mené de stages en entreprise à mon poste actuel de architecte cloud à Touba.', '+221 77 000 00 00', '/api/photos/c296e431-c9fd-5a16-b0d3-80b492378318.jpg', 'https://portfolio.example.org/boubacar-gueye', now() - interval '656 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('d3172cbd-7b42-54a9-8dd1-84b6302f097c', '6593d854-bb87-5921-a69f-4167b7a5e904', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2002-10-01', date '2005-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('830b6d69-316b-52a2-8980-e11d721a7c52', '6593d854-bb87-5921-a69f-4167b7a5e904', '7e73cd92-6749-510c-964c-c90065024e4a', 'Stage de fin d’études', 'STAGE', date '2005-02-01', date '2005-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('0cb0cd3d-b93a-59da-aca5-bedc693f2bfe', '6593d854-bb87-5921-a69f-4167b7a5e904', '7e73cd92-6749-510c-964c-c90065024e4a', 'Product manager', 'CDI', date '2005-10-01', date '2010-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f3bcb4be-0b57-5145-9166-096d4e1acc11', '6593d854-bb87-5921-a69f-4167b7a5e904', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Architecte cloud', 'CDI', date '2010-09-01', null, false, true,
  'Poste actuel : architecte cloud.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '4ef34c8c-1ebb-5b2d-9f8b-e1dea623166b', 'malick.coly@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Malick', 'Coly', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2019, 2022, 'INGENIEUR', 'Dakar', 'Product manager', 'Ingénieur informatique et télécommunications (promo 2022). Mon parcours m’a mené de stages en entreprise à mon poste actuel de product manager à Dakar.', '+221 77 000 00 00', '/api/photos/402bded5-7c1b-5f4c-ba6e-33bab14f0784.jpg', 'https://portfolio.example.org/malick-coly', now() - interval '709 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('ff52dadb-0f94-559b-9005-360b02938e1e', '4ef34c8c-1ebb-5b2d-9f8b-e1dea623166b', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2019-10-01', date '2022-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('de07339d-145a-5d68-8bee-23d64e9344b7', '4ef34c8c-1ebb-5b2d-9f8b-e1dea623166b', '8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Stage de fin d’études', 'STAGE', date '2022-02-01', date '2022-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('3c86298d-b304-575a-8828-f899f8ecf1ff', '4ef34c8c-1ebb-5b2d-9f8b-e1dea623166b', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Master en science des données', 'DIPLOMANTE', date '2022-09-15', date '2023-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('96b69d01-b5c7-5c99-badf-b1fa7e9c104d', '4ef34c8c-1ebb-5b2d-9f8b-e1dea623166b', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Product manager', 'CDI', date '2023-09-01', null, false, true,
  'Poste actuel : product manager.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '102b12e7-e8a2-59dc-9b3a-ab365bac18c2', 'ismaila.sy@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ismaïla', 'Sy', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2007, 2010, 'INGENIEUR', 'Montréal', 'Ingénieur énergies renouvelables', 'Ingénieur énergies renouvelables chez Eau Vive Sahel, basé à Montréal. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/d756a00b-d796-5be4-9305-0ec7aa2158c6.jpg', null, now() - interval '853 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('eaea5983-91d7-59e7-8ded-533193d5a18b', '102b12e7-e8a2-59dc-9b3a-ab365bac18c2', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2007-10-01', date '2010-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('0e0c9986-e3ba-559d-9b33-146eccb44d48', '102b12e7-e8a2-59dc-9b3a-ab365bac18c2', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Stage de fin d’études', 'STAGE', date '2010-02-01', date '2010-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('593586f2-3e87-5e3a-9c05-2d25dccc32af', '102b12e7-e8a2-59dc-9b3a-ab365bac18c2', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Ingénieur énergies renouvelables', 'CDD', date '2010-10-01', date '2012-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('1bbbbf96-b420-59ec-8e01-0dc240060e00', '102b12e7-e8a2-59dc-9b3a-ab365bac18c2', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Ingénieur énergies renouvelables', 'CDI', date '2012-09-01', null, false, true,
  'Poste actuel : ingénieur énergies renouvelables.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('fe8e06bc-58d0-52b2-a5ff-5ae9cab471d4', '102b12e7-e8a2-59dc-9b3a-ab365bac18c2', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Certification PMP', 'CERTIFICATION', date '2026-03-01', date '2026-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'a1337834-0187-5899-b8bf-5fd74cd1d75b', 'souleymane.toure@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Souleymane', 'Touré', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2008, 2011, 'INGENIEUR', 'Nouakchott', 'Ingénieur logiciel', 'Diplômé de l’EPT en Génie Informatique et Télécommunications, je suis aujourd’hui ingénieur logiciel chez Dakar Cloud Services. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/7c203798-6004-5cff-b12f-87049abdf3b4.jpg', null, now() - interval '254 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('c89494e8-346a-5744-9717-a64572f8cca3', 'a1337834-0187-5899-b8bf-5fd74cd1d75b', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2008-10-01', date '2011-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('87ea3d65-5e08-56e2-b70b-97e4612eaca1', 'a1337834-0187-5899-b8bf-5fd74cd1d75b', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Stage de fin d’études', 'STAGE', date '2011-02-01', date '2011-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('7203739c-e577-524e-8842-84622de9d437', 'a1337834-0187-5899-b8bf-5fd74cd1d75b', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Architecte cloud', 'CDI', date '2011-10-01', date '2014-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('299593cd-02b9-584a-8a92-f57633a38c36', 'a1337834-0187-5899-b8bf-5fd74cd1d75b', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Ingénieur logiciel', 'CDI', date '2014-09-01', null, false, true,
  'Poste actuel : ingénieur logiciel.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '8670e440-184b-5365-9e7b-3e0c983658b4', 'aissatou.diop@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Aïssatou', 'Diop', 'ALUMNI', 'ACTIF', 'Génie Industriel', 2015, 2018, 'INGENIEUR', 'Montréal', 'Ingénieur méthodes', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Jàmm Pay où j’occupe le poste de ingénieur méthodes. Ouverte aux échanges sur les métiers de la industriel.', '+221 77 000 00 00', '/api/photos/944eae8c-b6dd-51a8-9dc7-0c4c717e0341.jpg', null, now() - interval '174 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('1c303745-db20-5c87-8b72-c6523280bee7', '8670e440-184b-5365-9e7b-3e0c983658b4', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Industriel', 'DIPLOMANTE', date '2015-10-01', date '2018-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('0852487d-a627-5212-bd2a-5e7177d39f45', '8670e440-184b-5365-9e7b-3e0c983658b4', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Stage de fin d’études', 'STAGE', date '2018-02-01', date '2018-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('348534b1-6a4e-5dc3-a50a-195257d6c58b', '8670e440-184b-5365-9e7b-3e0c983658b4', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Contrôleur de gestion industriel', 'CDI', date '2018-10-01', date '2020-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('a3855ad3-23c9-5866-904c-e457e871f89f', '8670e440-184b-5365-9e7b-3e0c983658b4', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Ingénieur méthodes', 'FREELANCE', date '2020-09-01', null, false, true,
  'Poste actuel : ingénieur méthodes.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'cdddccef-2bda-5223-ae7d-112ff4b1c9ac', 'kine.kane@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Kiné', 'Kane', 'ALUMNI', 'ACTIF', 'Génie Industriel', 2011, 2014, 'INGENIEUR', 'Abidjan', 'Consultant lean', 'Consultant lean chez Mines du Sénégal oriental, basée à Abidjan. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/908fb8c5-f4d4-59b3-b8e9-2c29e9405f83.jpg', null, now() - interval '711 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('5b259b7f-b5ef-5047-9057-86a64085cb0d', 'cdddccef-2bda-5223-ae7d-112ff4b1c9ac', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Industriel', 'DIPLOMANTE', date '2011-10-01', date '2014-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('d8167768-114f-5c35-abc8-64f1622c4f07', 'cdddccef-2bda-5223-ae7d-112ff4b1c9ac', '7e73cd92-6749-510c-964c-c90065024e4a', 'Stage de fin d’études', 'STAGE', date '2014-02-01', date '2014-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('1579e0a4-522a-5e2c-91fb-5b8ffb0c58e6', 'cdddccef-2bda-5223-ae7d-112ff4b1c9ac', '7e73cd92-6749-510c-964c-c90065024e4a', 'Responsable supply chain', 'CDI', date '2014-10-01', date '2018-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('51c07457-ba2d-515d-8e88-13bd468821cd', 'cdddccef-2bda-5223-ae7d-112ff4b1c9ac', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Consultant lean', 'CDI', date '2018-09-01', null, false, true,
  'Poste actuel : consultant lean.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '58529a43-d7de-50da-887d-0d7a51fb5929', 'samba.diatta@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Samba', 'Diatta', 'ALUMNI', 'ACTIF', 'Génie Civil', 2015, 2018, 'INGENIEUR', 'Nouakchott', 'Chef de service', 'Chef de service chez Agence des infrastructures de Thiès, basé à Nouakchott. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/8463804f-5fd5-58d3-8fec-89d1a525232c.jpg', null, now() - interval '215 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('f2e02bdd-661e-5730-8d29-710482a6d447', '58529a43-d7de-50da-887d-0d7a51fb5929', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2015-10-01', date '2018-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('d2e4a95d-9554-5e4f-a5af-775aafa93adb', '58529a43-d7de-50da-887d-0d7a51fb5929', '3e4bf4ab-5b3a-5436-8e8f-4cd7f25b802f', 'Stage de fin d’études', 'STAGE', date '2018-02-01', date '2018-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('9a6bae86-5b81-5c30-a22e-878449819c8b', '58529a43-d7de-50da-887d-0d7a51fb5929', '3e4bf4ab-5b3a-5436-8e8f-4cd7f25b802f', 'Ingénieur méthodes BTP', 'CDI', date '2018-10-01', date '2023-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('a7b0e497-9772-50ef-a7bc-93b57e57411d', '58529a43-d7de-50da-887d-0d7a51fb5929', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Chef de service', 'CDI', date '2023-09-01', null, false, true,
  'Poste actuel : chef de service.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('1175b223-dbf7-59ca-9a9d-70fd8d0466f6', '58529a43-d7de-50da-887d-0d7a51fb5929', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Certification PMP', 'CERTIFICATION', date '2019-03-01', date '2019-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '5809136a-2a1b-52d9-bd37-16cb2afcac33', 'binta.sy@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Binta', 'Sy', 'ALUMNI', 'ACTIF', 'Génie Civil', 2015, 2018, 'INGENIEUR', 'Thiès', 'Chef de service', 'Chef de service chez Direction régionale de l’hydraulique, basée à Thiès. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', null, null, now() - interval '370 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('87ee644e-b864-5712-8020-aeb4d5d03ce5', '5809136a-2a1b-52d9-bd37-16cb2afcac33', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2015-10-01', date '2018-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f6c84ca6-e357-5ca8-a3ae-5b6b50c021ff', '5809136a-2a1b-52d9-bd37-16cb2afcac33', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Stage de fin d’études', 'STAGE', date '2018-02-01', date '2018-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('63c42dc8-c523-5063-bf73-be8e15b6d4ef', '5809136a-2a1b-52d9-bd37-16cb2afcac33', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Ingénieur géotechnicien', 'CDD', date '2018-10-01', date '2021-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('94873964-6b9d-50df-b1b4-4bf678f38416', '5809136a-2a1b-52d9-bd37-16cb2afcac33', '4dbcd1bc-ac2d-5628-86a2-b70890077276', 'Chef de service', 'CDI', date '2021-09-01', null, false, true,
  'Poste actuel : chef de service.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '713d3bed-9680-507d-902f-f81fe90e43f4', 'demba.gueye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Demba', 'Gueye', 'ALUMNI', 'ACTIF', 'Génie Aéronautique et Aérospatial', 2014, 2017, 'INGENIEUR', 'Kaolack', 'Chef de service', 'Ingénieur aéronautique et aérospatial (promo 2017). Mon parcours m’a mené de stages en entreprise à mon poste actuel de chef de service à Kaolack.', '+221 77 000 00 00', '/api/photos/8177b516-0d46-5353-a581-77c13b380adf.jpg', null, now() - interval '160 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('617f8673-469f-5382-a12a-c78f82e65374', '713d3bed-9680-507d-902f-f81fe90e43f4', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Aéronautique et Aérospatial', 'DIPLOMANTE', date '2014-10-01', date '2017-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('1ab7e12f-2cc6-58ed-9ae2-93612e400278', '713d3bed-9680-507d-902f-f81fe90e43f4', '0a080697-5a47-5150-8a7c-d22c53494978', 'Stage de fin d’études', 'STAGE', date '2017-02-01', date '2017-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('be2eb079-3648-50ed-996b-13ac97c9621a', '713d3bed-9680-507d-902f-f81fe90e43f4', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Master en systèmes aéronautiques', 'DIPLOMANTE', date '2017-09-15', date '2018-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('fec4047a-253f-5343-ba5a-a1ff76cfb18d', '713d3bed-9680-507d-902f-f81fe90e43f4', '0a080697-5a47-5150-8a7c-d22c53494978', 'Chef de service', 'CDI', date '2018-09-01', null, false, true,
  'Poste actuel : chef de service.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('0ccd781f-a447-58ea-b962-874538e18a44', '713d3bed-9680-507d-902f-f81fe90e43f4', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Formation réglementation Part-145', 'CERTIFICATION', date '2021-03-01', date '2021-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '760ed432-29c6-5dad-9d2d-ec90276f6f75', 'ramatoulaye.badji@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ramatoulaye', 'Badji', 'ALUMNI', 'ACTIF', 'Génie Civil', 1999, 2002, 'INGENIEUR', 'Dakar', 'BIM manager', 'Diplômée de l’EPT en Génie Civil, je suis aujourd’hui bIM manager chez Génie Nord Consultants. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/edf882ae-da1f-56ba-9ce0-0728f2546067.jpg', null, now() - interval '90 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('63cd7319-34f9-559f-b2d6-a9f2af303cfa', '760ed432-29c6-5dad-9d2d-ec90276f6f75', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '1999-10-01', date '2002-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('e03b7d61-aec7-5754-b6cc-93c3421843b1', '760ed432-29c6-5dad-9d2d-ec90276f6f75', '4dbcd1bc-ac2d-5628-86a2-b70890077276', 'Stage de fin d’études', 'STAGE', date '2002-02-01', date '2002-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('d1c36f05-317f-5fc6-bd8f-9cab99b9aaf9', '760ed432-29c6-5dad-9d2d-ec90276f6f75', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Master en génie urbain', 'DIPLOMANTE', date '2002-09-15', date '2003-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('3ed9d0cc-6911-54e4-a152-c80325bf6ed9', '760ed432-29c6-5dad-9d2d-ec90276f6f75', '4dbcd1bc-ac2d-5628-86a2-b70890077276', 'BIM manager', 'CDI', date '2003-10-01', date '2005-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('7fb62439-f4a4-581b-87d8-da174ac4acff', '760ed432-29c6-5dad-9d2d-ec90276f6f75', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'BIM manager', 'CDI', date '2005-09-01', null, false, true,
  'Poste actuel : bIM manager.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'e26b8671-16eb-54b9-b11f-ed3f99a912f5', 'oumou.diop@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Oumou', 'Diop', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2020, 2023, 'INGENIEUR', 'Thiès', 'Ingénieur électricien', 'Diplômée de l’EPT en Génie Électromécanique, je suis aujourd’hui ingénieur électricien chez Agence des infrastructures de Thiès. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/291d5b85-bee5-562e-828f-f7b20f4c7326.jpg', null, now() - interval '660 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('b3e6822c-1fb4-5248-8b96-5ed04e81fd05', 'e26b8671-16eb-54b9-b11f-ed3f99a912f5', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2020-10-01', date '2023-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('86866d68-d76e-5187-be71-ed3716393391', 'e26b8671-16eb-54b9-b11f-ed3f99a912f5', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage de fin d’études', 'STAGE', date '2023-02-01', date '2023-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('42261364-237c-5758-a796-e9a673ba5b6f', 'e26b8671-16eb-54b9-b11f-ed3f99a912f5', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Master en énergies renouvelables', 'DIPLOMANTE', date '2023-09-15', date '2024-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('44386aa6-c73e-55d7-99ba-716570bd23db', 'e26b8671-16eb-54b9-b11f-ed3f99a912f5', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Ingénieur électricien', 'CDI', date '2024-09-01', null, false, true,
  'Poste actuel : ingénieur électricien.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'b105f039-968f-520a-8860-da5b95b4482f', 'penda.diatta@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Penda', 'Diatta', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2011, 2014, 'INGENIEUR', 'Dakar', 'Responsable d’équipe', 'Ingénieure informatique et télécommunications (promo 2014). Mon parcours m’a menée de stages en entreprise à mon poste actuel de responsable d’équipe à Dakar.', '+221 77 000 00 00', '/api/photos/2ecee46e-6338-5c52-90a2-89b6c69f0a25.jpg', null, now() - interval '556 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('cae283fa-abe5-559b-820e-07cddf106b15', 'b105f039-968f-520a-8860-da5b95b4482f', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2011-10-01', date '2014-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('d391a1e9-8e88-5c01-a91c-befc5d993bc8', 'b105f039-968f-520a-8860-da5b95b4482f', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage de fin d’études', 'STAGE', date '2014-02-01', date '2014-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('25d58373-8b54-5187-a61c-35494689806e', 'b105f039-968f-520a-8860-da5b95b4482f', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Ingénieur cybersécurité', 'CDI', date '2014-10-01', date '2017-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('9d470b05-839d-5343-8717-c02e32d83808', 'b105f039-968f-520a-8860-da5b95b4482f', '7e73cd92-6749-510c-964c-c90065024e4a', 'Responsable d’équipe', 'FREELANCE', date '2017-09-01', null, false, true,
  'Poste actuel : responsable d’équipe.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'ba62afaa-e97b-5dfd-b99f-cc115508f551', 'elhadji.mbengue@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Elhadji', 'Mbengue', 'ALUMNI', 'ACTIF', 'Génie Industriel', 2006, 2009, 'INGENIEUR', 'Thiès', 'Directeur de projets', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Jàmm Pay où j’occupe le poste de directeur de projets. Ouvert aux échanges sur les métiers de la industriel.', '+221 77 000 00 00', '/api/photos/7cf2e123-456f-5a42-ac7f-ca4c05e3bcde.jpg', null, now() - interval '858 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('4a4b8f76-ced9-54d4-a649-c6dab8a4ff4f', 'ba62afaa-e97b-5dfd-b99f-cc115508f551', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Industriel', 'DIPLOMANTE', date '2006-10-01', date '2009-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('8d59449c-ffdf-5d6d-8571-e7d12492f81c', 'ba62afaa-e97b-5dfd-b99f-cc115508f551', '8fb67a87-4ec4-56b8-a021-1ab27b84d9b1', 'Stage de fin d’études', 'STAGE', date '2009-02-01', date '2009-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('5ee51ba3-ae1e-5c6b-933c-bf415894420a', 'ba62afaa-e97b-5dfd-b99f-cc115508f551', '8fb67a87-4ec4-56b8-a021-1ab27b84d9b1', 'Chef de projet industriel', 'CDD', date '2009-10-01', date '2012-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('fbbe43f2-9d6a-5303-b7e5-97e2bf72c3e3', 'ba62afaa-e97b-5dfd-b99f-cc115508f551', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Directeur de projets', 'CDI', date '2012-09-01', null, false, true,
  'Poste actuel : directeur de projets.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'f604100c-50ad-5847-9b95-008b78aea6a1', 'boubacar.samb@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Boubacar', 'Samb', 'ALUMNI', 'ACTIF', 'Génie Industriel', 2000, 2003, 'INGENIEUR', 'Dakar', 'Directeur de projets', 'Ingénieur industriel (promo 2003). Mon parcours m’a mené de stages en entreprise à mon poste actuel de directeur de projets à Dakar.', '+221 77 000 00 00', '/api/photos/b84f7070-a1c1-5a16-8c23-ffd20e235a40.jpg', null, now() - interval '52 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('46ec69fd-c610-5610-927e-d096eb8d340a', 'f604100c-50ad-5847-9b95-008b78aea6a1', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Industriel', 'DIPLOMANTE', date '2000-10-01', date '2003-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('629eed33-2afc-5b4b-bc61-2038926bc9db', 'f604100c-50ad-5847-9b95-008b78aea6a1', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Stage de fin d’études', 'STAGE', date '2003-02-01', date '2003-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('76006107-e533-5455-a9d2-99d8386ee8ba', 'f604100c-50ad-5847-9b95-008b78aea6a1', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Ingénieur qualité', 'CDD', date '2003-10-01', date '2005-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('6b5432d3-4d73-5514-8872-9830c30859c1', 'f604100c-50ad-5847-9b95-008b78aea6a1', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Directeur de projets', 'CDI', date '2005-09-01', null, false, true,
  'Poste actuel : directeur de projets.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '87ce220b-bb1b-55b0-acb8-ff8e1bf24804', 'arame.diatta@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Arame', 'Diatta', 'ALUMNI', 'ACTIF', 'Génie Aéronautique et Aérospatial', 2012, 2015, 'INGENIEUR', 'Dakar', 'Directeur de projets', 'Diplômée de l’EPT en Génie Aéronautique et Aérospatial, je suis aujourd’hui directeur de projets chez AéroTech Ingénierie. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', null, null, now() - interval '95 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('314a7fd3-89db-5465-907a-73532b9200bb', '87ce220b-bb1b-55b0-acb8-ff8e1bf24804', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Aéronautique et Aérospatial', 'DIPLOMANTE', date '2012-10-01', date '2015-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('3010054f-01f0-539c-bbef-bd147108d59c', '87ce220b-bb1b-55b0-acb8-ff8e1bf24804', '0a080697-5a47-5150-8a7c-d22c53494978', 'Stage de fin d’études', 'STAGE', date '2015-02-01', date '2015-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('11317728-b08d-5ddb-82b9-a93d20a55e01', '87ce220b-bb1b-55b0-acb8-ff8e1bf24804', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Master en systèmes aéronautiques', 'DIPLOMANTE', date '2015-09-15', date '2016-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('3b87206e-15a9-51ba-bfa8-4e120aeebd85', '87ce220b-bb1b-55b0-acb8-ff8e1bf24804', '0a080697-5a47-5150-8a7c-d22c53494978', 'Directeur de projets', 'CDI', date '2016-09-01', null, false, true,
  'Poste actuel : directeur de projets.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '945626e0-cf07-5ff9-8f88-c99c26151b4f', 'omar.seck@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Omar', 'Seck', 'ALUMNI', 'ACTIF', 'Génie Industriel', 2019, 2022, 'INGENIEUR', 'Casablanca', 'Contrôleur de gestion industriel', 'Diplômé de l’EPT en Génie Industriel, je suis aujourd’hui contrôleur de gestion industriel chez Ciments de la Petite Côte. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/2d429148-0f4a-58c0-9c2c-02da3de3d3da.jpg', null, now() - interval '877 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('f66b59da-9dc5-5ec2-a304-539c2bf572b1', '945626e0-cf07-5ff9-8f88-c99c26151b4f', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Industriel', 'DIPLOMANTE', date '2019-10-01', date '2022-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('779aa4f1-eefb-5052-9d3f-00571ee5b885', '945626e0-cf07-5ff9-8f88-c99c26151b4f', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Stage de fin d’études', 'STAGE', date '2022-02-01', date '2022-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('39fce27e-8152-52a8-848f-53f01b81991e', '945626e0-cf07-5ff9-8f88-c99c26151b4f', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Contrôleur de gestion industriel', 'FREELANCE', date '2022-09-01', null, false, true,
  'Poste actuel : contrôleur de gestion industriel.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('0fd2cd62-ae8f-5296-a3ad-fc30903972a8', '945626e0-cf07-5ff9-8f88-c99c26151b4f', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Certification APICS CSCP', 'CERTIFICATION', date '2023-03-01', date '2023-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '9d2aff63-4cd9-5acb-b774-d8d88967742d', 'alassane.diagne@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Alassane', 'Diagne', 'ALUMNI', 'ACTIF', 'Génie Aéronautique et Aérospatial', 2016, 2019, 'INGENIEUR', 'Dakar', 'Ingénieur maintenance aéronautique', 'Ingénieur maintenance aéronautique chez AéroTech Ingénierie, basé à Dakar. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', null, null, now() - interval '815 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('197ce22f-e86d-54fe-8350-a0368f8417a8', '9d2aff63-4cd9-5acb-b774-d8d88967742d', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Aéronautique et Aérospatial', 'DIPLOMANTE', date '2016-10-01', date '2019-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('300387b5-ea54-51dd-9c8f-f6559e601563', '9d2aff63-4cd9-5acb-b774-d8d88967742d', '0a080697-5a47-5150-8a7c-d22c53494978', 'Stage de fin d’études', 'STAGE', date '2019-02-01', date '2019-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('16bd993c-b4ae-5491-a46f-0719e07770a7', '9d2aff63-4cd9-5acb-b774-d8d88967742d', '0a080697-5a47-5150-8a7c-d22c53494978', 'Ingénieur maintenance aéronautique', 'CDI', date '2019-09-01', null, false, true,
  'Poste actuel : ingénieur maintenance aéronautique.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '95baa7f1-b8e2-574d-93a4-6e67ae22b3fa', 'khadidiatou.samb@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Khadidiatou', 'Samb', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2015, 2018, 'INGENIEUR', 'Montréal', 'Ingénieur cybersécurité', 'Ingénieur cybersécurité chez Dakar Cloud Services, basée à Montréal. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/59348777-a73b-53f1-a7f0-29fd5bb707c8.jpg', null, now() - interval '797 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('f004ce62-ce89-5da6-9934-609e530fd963', '95baa7f1-b8e2-574d-93a4-6e67ae22b3fa', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2015-10-01', date '2018-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('7796435d-7e87-5193-90fa-29120eb108d2', '95baa7f1-b8e2-574d-93a4-6e67ae22b3fa', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Stage de fin d’études', 'STAGE', date '2018-02-01', date '2018-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('2c40c68f-9b81-55e5-9b4e-9aef7dca55c3', '95baa7f1-b8e2-574d-93a4-6e67ae22b3fa', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Master en science des données', 'DIPLOMANTE', date '2018-09-15', date '2019-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('3f3657e4-b65b-56e9-9cc6-5a933574bad5', '95baa7f1-b8e2-574d-93a4-6e67ae22b3fa', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Product manager', 'CDD', date '2019-10-01', date '2021-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('2b57261d-b2af-505c-9a85-ce37ea35edd9', '95baa7f1-b8e2-574d-93a4-6e67ae22b3fa', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Ingénieur cybersécurité', 'CDI', date '2021-09-01', null, false, true,
  'Poste actuel : ingénieur cybersécurité.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('350274e0-a81d-5383-b61d-c69bac63a868', '95baa7f1-b8e2-574d-93a4-6e67ae22b3fa', '5e286ac3-a41a-50dc-972c-8435932fba81', 'Certification CISSP', 'CERTIFICATION', date '2022-03-01', date '2022-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'f8b792d4-c0da-5555-921c-45fad1f0a9da', 'mariama.ndiaye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mariama', 'Ndiaye', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2007, 2010, 'INGENIEUR', 'Dakar', 'Ingénieur réseaux', 'Diplômée de l’EPT en Génie Informatique et Télécommunications, je suis aujourd’hui ingénieur réseaux chez Lumen Conseil. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/aa1efa18-fdd8-56bb-b136-924707275034.jpg', null, now() - interval '760 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('0a6eb22d-a399-552b-b409-dad76706accc', 'f8b792d4-c0da-5555-921c-45fad1f0a9da', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2007-10-01', date '2010-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('b9cf9b5f-6b5a-5af5-931f-8234ef32e1ae', 'f8b792d4-c0da-5555-921c-45fad1f0a9da', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Stage de fin d’études', 'STAGE', date '2010-02-01', date '2010-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('93f9530b-e967-5719-8b76-827db51496e2', 'f8b792d4-c0da-5555-921c-45fad1f0a9da', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Ingénieur réseaux', 'CDD', date '2010-10-01', date '2013-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('cddc8725-015e-5b8c-bc1e-bcc9ecc6b5c1', 'f8b792d4-c0da-5555-921c-45fad1f0a9da', '7e73cd92-6749-510c-964c-c90065024e4a', 'Ingénieur réseaux', 'CDI', date '2013-09-01', null, false, true,
  'Poste actuel : ingénieur réseaux.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '804935f3-67f5-5246-a0a0-1db7119996d7', 'cheikh.sylla@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Cheikh', 'Sylla', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2021, 2024, 'INGENIEUR', 'Thiès', 'Ingénieur process', 'Ingénieur process chez Eau Vive Sahel, basé à Thiès. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/18d00d08-80d6-5c78-b2a7-b4ad1fc2501b.jpg', null, now() - interval '176 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('ad659601-3e29-5ab8-abe9-e83c38c02be5', '804935f3-67f5-5246-a0a0-1db7119996d7', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2021-10-01', date '2024-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('dafa2db9-0bb7-56b1-9f72-02aa346f26f8', '804935f3-67f5-5246-a0a0-1db7119996d7', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage de fin d’études', 'STAGE', date '2024-02-01', date '2024-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('072244dc-964b-51c9-89b3-fb3ea144855b', '804935f3-67f5-5246-a0a0-1db7119996d7', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Ingénieur process', 'CDI', date '2024-09-01', null, false, true,
  'Poste actuel : ingénieur process.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '1e8f70c6-3dff-5af1-9a96-985aa502c94b', 'elhadji.kebe@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Elhadji', 'Kébé', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2016, 2019, 'INGENIEUR', 'Dakar', 'Data engineer', 'Data engineer chez Lumen Conseil, basé à Dakar. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/eefdc687-6945-50e3-a39f-7630f4a94630.jpg', null, now() - interval '60 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('9ce8ec16-6b8c-5f83-9909-2b85cc5e4792', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2016-10-01', date '2019-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('bae7b899-330b-56d9-95f7-227e766c6519', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Stage de fin d’études', 'STAGE', date '2019-02-01', date '2019-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('771354b9-a1ac-568a-ba98-7d33e0cfcee3', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Ingénieur cybersécurité', 'CDI', date '2019-10-01', date '2021-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('1973d04d-1917-5dbf-8e16-22012055bfa8', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', '7e73cd92-6749-510c-964c-c90065024e4a', 'Data engineer', 'CDI', date '2021-09-01', null, false, true,
  'Poste actuel : data engineer.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'f88aefc3-5aef-5b0b-b217-82182448e43e', 'mor.ba@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mor', 'Ba', 'ALUMNI', 'ACTIF', 'Génie Aéronautique et Aérospatial', 2002, 2005, 'INGENIEUR', 'Dakar', 'Ingénieur structures aéronautiques', 'Ingénieur structures aéronautiques chez AéroTech Ingénierie, basé à Dakar. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/d75fada3-a900-5172-97e6-d1ad84401fcf.jpg', null, now() - interval '583 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('714bd97a-c03f-5d93-91a1-544bab3303c1', 'f88aefc3-5aef-5b0b-b217-82182448e43e', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Aéronautique et Aérospatial', 'DIPLOMANTE', date '2002-10-01', date '2005-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('25dea12a-98dc-5aed-8be8-f2a0950d1be6', 'f88aefc3-5aef-5b0b-b217-82182448e43e', '0a080697-5a47-5150-8a7c-d22c53494978', 'Stage de fin d’études', 'STAGE', date '2005-02-01', date '2005-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('5fe9b8f5-46fc-5f11-bb86-54db60ad7299', 'f88aefc3-5aef-5b0b-b217-82182448e43e', '0a080697-5a47-5150-8a7c-d22c53494978', 'Ingénieur structures aéronautiques', 'CDI', date '2005-09-01', null, false, true,
  'Poste actuel : ingénieur structures aéronautiques.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '32139e9c-9e23-5367-a1f4-8446a769fc85', 'djibril.diagne@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Djibril', 'Diagne', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2015, 2018, 'INGENIEUR', 'Abidjan', 'Ingénieur télécoms', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Teranga Télécom où j’occupe le poste de ingénieur télécoms. Ouvert aux échanges sur les métiers de la informatique et télécommunications.', '+221 77 000 00 00', null, null, now() - interval '312 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('c460312d-77d7-503c-b40f-74f0bdf6116c', '32139e9c-9e23-5367-a1f4-8446a769fc85', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2015-10-01', date '2018-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('3efba927-3ac6-54ae-bc8e-8d9f371519eb', '32139e9c-9e23-5367-a1f4-8446a769fc85', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Stage de fin d’études', 'STAGE', date '2018-02-01', date '2018-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('f9e0c62a-074d-5acd-9a35-418f6fb90608', '32139e9c-9e23-5367-a1f4-8446a769fc85', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Master en science des données', 'DIPLOMANTE', date '2018-09-15', date '2019-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f4efe4af-88bf-50db-8b88-6edccd651b89', '32139e9c-9e23-5367-a1f4-8446a769fc85', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Développeur full-stack', 'CDD', date '2019-10-01', date '2021-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('942d4d8d-da06-50e4-9b5d-b7e13d8326e9', '32139e9c-9e23-5367-a1f4-8446a769fc85', '8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Ingénieur télécoms', 'CDI', date '2021-09-01', null, false, true,
  'Poste actuel : ingénieur télécoms.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', 'ismaila.gueye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ismaïla', 'Gueye', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2017, 2020, 'INGENIEUR', 'Bamako', 'Développeur full-stack', 'Développeur full-stack chez Lumen Conseil, basé à Bamako. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', null, null, now() - interval '510 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('5dac2758-5da5-50c9-80c7-f8cc1a9622ec', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2017-10-01', date '2020-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('6b195f7f-d6a2-595c-a471-3d0837d4db4c', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Stage de fin d’études', 'STAGE', date '2020-02-01', date '2020-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('be4dc456-aac4-514b-8d32-3ed37c24ed0c', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Ingénieur télécoms', 'CDI', date '2020-10-01', date '2024-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f8208ad8-ffa8-50aa-ba66-1b4354895f32', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', '7e73cd92-6749-510c-964c-c90065024e4a', 'Développeur full-stack', 'FREELANCE', date '2024-09-01', null, false, true,
  'Poste actuel : développeur full-stack.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'ff940591-a6e2-520f-b5b1-b130755c3279', 'mbaye.ndour@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mbaye', 'Ndour', 'ALUMNI', 'ACTIF', 'Génie Civil', 2009, 2012, 'INGENIEUR', 'Abidjan', 'Ingénieur méthodes BTP', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Eau Vive Sahel où j’occupe le poste de ingénieur méthodes BTP. Ouvert aux échanges sur les métiers de la civil.', '+221 77 000 00 00', '/api/photos/d3cfe3a0-d60a-5ea3-aca7-06716724813a.jpg', null, now() - interval '441 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('0fbfaec2-8d24-5887-89d3-93038e012ca2', 'ff940591-a6e2-520f-b5b1-b130755c3279', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2009-10-01', date '2012-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('81d921b7-96fd-5a5e-9e0b-232bc70c7964', 'ff940591-a6e2-520f-b5b1-b130755c3279', '4dbcd1bc-ac2d-5628-86a2-b70890077276', 'Stage de fin d’études', 'STAGE', date '2012-02-01', date '2012-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('18a81a62-de4f-5c25-b93b-12eb2b0433a4', 'ff940591-a6e2-520f-b5b1-b130755c3279', '4dbcd1bc-ac2d-5628-86a2-b70890077276', 'Conducteur de travaux', 'CDI', date '2012-10-01', date '2016-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('8cb4bbb8-ea32-59fd-8af9-cf2c985c107c', 'ff940591-a6e2-520f-b5b1-b130755c3279', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Ingénieur méthodes BTP', 'CDI', date '2016-09-01', null, false, true,
  'Poste actuel : ingénieur méthodes BTP.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('1ff6822b-723e-5ec3-bf89-4bc11f88b56f', 'ff940591-a6e2-520f-b5b1-b130755c3279', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Formation BIM avancée', 'CERTIFICATION', date '2013-03-01', date '2013-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '524f58bf-88b0-5678-a632-98804ad9226c', 'seydou.barry@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Seydou', 'Barry', 'ALUMNI', 'ACTIF', 'Génie Civil', 2020, 2023, 'INGENIEUR', 'Dakar', 'Ingénieur structures', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Eau Vive Sahel où j’occupe le poste de ingénieur structures. Ouvert aux échanges sur les métiers de la civil.', '+221 77 000 00 00', '/api/photos/3fa348af-a92a-5331-a989-428c5c4db151.jpg', null, now() - interval '606 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('74373e11-15d8-5abf-9df2-b22c17ccee10', '524f58bf-88b0-5678-a632-98804ad9226c', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2020-10-01', date '2023-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('ad4da969-daf5-59ed-9727-f02640356b6d', '524f58bf-88b0-5678-a632-98804ad9226c', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage de fin d’études', 'STAGE', date '2023-02-01', date '2023-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f8d26ae1-0e0d-5279-bb38-f2787f00f1ef', '524f58bf-88b0-5678-a632-98804ad9226c', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Ingénieur structures', 'CDI', date '2023-09-01', null, false, true,
  'Poste actuel : ingénieur structures.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'a079f292-6780-5517-9501-9a0439c347a7', 'rama.coly@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Rama', 'Coly', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2019, 2022, 'INGENIEUR', 'Dakar', 'Product manager', 'Diplômée de l’EPT en Génie Informatique et Télécommunications, je suis aujourd’hui product manager chez Jàmm Pay. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/1ce09e5f-f79d-57fb-a494-f80553f360ed.jpg', null, now() - interval '571 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('8205508c-ff71-5d8e-b509-d5db46c91f4b', 'a079f292-6780-5517-9501-9a0439c347a7', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2019-10-01', date '2022-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('1d7d8fea-d325-533c-831d-7779996d5cdf', 'a079f292-6780-5517-9501-9a0439c347a7', '8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Stage de fin d’études', 'STAGE', date '2022-02-01', date '2022-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('8c4dcdd0-008a-5306-a5b7-39bc503e5652', 'a079f292-6780-5517-9501-9a0439c347a7', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Product manager', 'CDI', date '2022-09-01', null, false, true,
  'Poste actuel : product manager.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '6b674cd4-406f-546f-aae4-5a78a5d13b31', 'alassane.faye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Alassane', 'Faye', 'ALUMNI', 'ACTIF', 'Génie Électromécanique', 2017, 2020, 'INGENIEUR', 'Paris', 'Ingénieur maintenance', 'Ingénieur électromécanique (promo 2020). Mon parcours m’a mené de stages en entreprise à mon poste actuel de ingénieur maintenance à Paris.', '+221 77 000 00 00', '/api/photos/500539e3-1b7b-5bf5-a4b3-92a5f7e76fe6.jpg', null, now() - interval '282 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('1dee50a5-468f-56b0-948e-f6d37ccbf514', '6b674cd4-406f-546f-aae4-5a78a5d13b31', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Électromécanique', 'DIPLOMANTE', date '2017-10-01', date '2020-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('c52dfccc-314a-5fbb-ae37-4658ebb3e197', '6b674cd4-406f-546f-aae4-5a78a5d13b31', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Stage de fin d’études', 'STAGE', date '2020-02-01', date '2020-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('cc8a9b17-186e-5b50-a46e-c586b34ac0c6', '6b674cd4-406f-546f-aae4-5a78a5d13b31', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Ingénieur maintenance', 'CDD', date '2020-10-01', date '2023-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('06ec28cf-efc3-5f1e-8a37-3aa7a2f03334', '6b674cd4-406f-546f-aae4-5a78a5d13b31', 'eb348294-3725-52e1-8093-d20746ed097d', 'Ingénieur maintenance', 'CDI', date '2023-09-01', null, false, true,
  'Poste actuel : ingénieur maintenance.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('1bcdb3a5-7369-5944-bae1-a1895d4bea08', '6b674cd4-406f-546f-aae4-5a78a5d13b31', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Habilitation électrique haute tension', 'CERTIFICATION', date '2021-03-01', date '2021-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'ef763dcf-06b8-5e9b-a1a2-97877c358ff2', 'mariama.ka@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mariama', 'Ka', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2010, 2013, 'INGENIEUR', 'Saint-Louis', 'Responsable d’équipe', 'Responsable d’équipe chez Dakar Cloud Services, basée à Saint-Louis. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/bba6aa4d-6aa2-5644-bad7-fe7fc55e1780.jpg', null, now() - interval '217 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('0a758236-ce5b-5b08-a643-610aaec58691', 'ef763dcf-06b8-5e9b-a1a2-97877c358ff2', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2010-10-01', date '2013-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('2bc66604-eba4-51c1-8129-8c9d72216083', 'ef763dcf-06b8-5e9b-a1a2-97877c358ff2', '7e73cd92-6749-510c-964c-c90065024e4a', 'Stage de fin d’études', 'STAGE', date '2013-02-01', date '2013-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('9a799ac9-6071-5eb1-a98d-ab2085f4fe29', 'ef763dcf-06b8-5e9b-a1a2-97877c358ff2', '7e73cd92-6749-510c-964c-c90065024e4a', 'Data engineer', 'CDI', date '2013-10-01', date '2017-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('9c96bd3e-e2f0-5681-8353-6f7294a644b7', 'ef763dcf-06b8-5e9b-a1a2-97877c358ff2', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Responsable d’équipe', 'CDI', date '2017-09-01', null, false, true,
  'Poste actuel : responsable d’équipe.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('7af908fd-f825-50bb-a362-ed73fc788d42', 'ef763dcf-06b8-5e9b-a1a2-97877c358ff2', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Certification AWS Solutions Architect', 'CERTIFICATION', date '2015-03-01', date '2015-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '9c5eaed3-8efd-5c3a-8045-b853a546ed9b', 'alassane.diouf@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Alassane', 'Diouf', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2015, 2018, 'INGENIEUR', 'Casablanca', 'Product manager', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Lumen Conseil où j’occupe le poste de product manager. Ouvert aux échanges sur les métiers de la informatique et télécommunications.', '+221 77 000 00 00', '/api/photos/d9ab7e4b-687a-57de-a941-d2fb8949beee.jpg', null, now() - interval '103 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('1cb4f61f-4cd7-5f82-92dc-02c4ecfdc998', '9c5eaed3-8efd-5c3a-8045-b853a546ed9b', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2015-10-01', date '2018-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('76f275f5-5b21-565d-bb8a-2f559ea14158', '9c5eaed3-8efd-5c3a-8045-b853a546ed9b', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Stage de fin d’études', 'STAGE', date '2018-02-01', date '2018-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('902378f0-7fe0-532f-a1ed-8682e89ab671', '9c5eaed3-8efd-5c3a-8045-b853a546ed9b', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Ingénieur logiciel', 'CDD', date '2018-10-01', date '2020-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('101daa51-46e0-5b79-9331-c133077335f9', '9c5eaed3-8efd-5c3a-8045-b853a546ed9b', '7e73cd92-6749-510c-964c-c90065024e4a', 'Product manager', 'CDI', date '2020-09-01', null, false, true,
  'Poste actuel : product manager.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '2ad470a2-5a14-59b3-b5b2-531d823f53b3', 'ibrahima.kebe@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ibrahima', 'Kébé', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2021, 2024, 'INGENIEUR', 'Dakar', 'Ingénieur télécoms', 'Ingénieur informatique et télécommunications (promo 2024). Mon parcours m’a mené de stages en entreprise à mon poste actuel de ingénieur télécoms à Dakar.', '+221 77 000 00 00', '/api/photos/2151ece2-5769-5ac3-8ff2-8ee2db3f4303.jpg', null, now() - interval '846 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('50c25eeb-0bb7-5b4a-8594-4cda342102cd', '2ad470a2-5a14-59b3-b5b2-531d823f53b3', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2021-10-01', date '2024-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('410f9007-7a21-5957-b101-0f66045bb906', '2ad470a2-5a14-59b3-b5b2-531d823f53b3', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage de fin d’études', 'STAGE', date '2024-02-01', date '2024-07-15', true, true,
  'Étude et mise en œuvre d’un projet pilote, soutenu devant un jury mixte.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('5ece102e-c971-505f-804e-4c189be96147', '2ad470a2-5a14-59b3-b5b2-531d823f53b3', '7e73cd92-6749-510c-964c-c90065024e4a', 'Ingénieur télécoms', 'CDI', date '2024-09-01', null, false, true,
  'Poste actuel : ingénieur télécoms.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'c1fbb1ac-135a-57d9-894c-43881af45eaa', 'ndiaga.diatta@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ndiaga', 'Diatta', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2018, 2021, 'INGENIEUR', 'Dakar', 'Responsable des systèmes d’information', 'Diplômé de l’EPT en Génie Informatique et Télécommunications, je suis aujourd’hui responsable des systèmes d’information chez Dakar Cloud Services. J’aime partager mon expérience avec les étudiants.', '+221 77 000 00 00', '/api/photos/57a19993-14a3-5fc5-85d0-84470df505a3.jpg', null, now() - interval '175 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('bb7165ff-10c5-5e4f-9366-033cf4aee6a6', 'c1fbb1ac-135a-57d9-894c-43881af45eaa', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2018-10-01', date '2021-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('667668ef-e814-5cb3-9424-f80b1612f3fe', 'c1fbb1ac-135a-57d9-894c-43881af45eaa', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Stage de fin d’études', 'STAGE', date '2021-02-01', date '2021-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('07ea8939-2037-54fe-8648-362e2ee4774b', 'c1fbb1ac-135a-57d9-894c-43881af45eaa', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Product manager', 'CDD', date '2021-10-01', date '2025-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('e4909ae0-122f-553f-a92a-b0c7cbe1f8e1', 'c1fbb1ac-135a-57d9-894c-43881af45eaa', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Responsable des systèmes d’information', 'CDI', date '2025-09-01', null, false, true,
  'Poste actuel : responsable des systèmes d’information.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'dbf4d1a4-103d-5acd-9646-1a3e970d68c0', 'omar.diouf@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Omar', 'Diouf', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2014, 2017, 'INGENIEUR', 'Touba', 'Chef de service', 'Chef de service chez Lumen Conseil, basé à Touba. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', null, 'https://portfolio.example.org/omar-diouf', now() - interval '102 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('789129e6-670e-58fc-8c2c-1287659cb467', 'dbf4d1a4-103d-5acd-9646-1a3e970d68c0', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2014-10-01', date '2017-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('1f644907-6cba-5c9b-ad52-5ecfab08fdaa', 'dbf4d1a4-103d-5acd-9646-1a3e970d68c0', '8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Stage de fin d’études', 'STAGE', date '2017-02-01', date '2017-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('a3c339e3-a8ca-5069-b8c5-6c85f10c6984', 'dbf4d1a4-103d-5acd-9646-1a3e970d68c0', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Master en science des données', 'DIPLOMANTE', date '2017-09-15', date '2018-09-30', false, true,
  'Spécialisation suivie après le diplôme d’ingénieur.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('3efb5ed1-ff94-5180-9e4b-c5a8aa4d399c', 'dbf4d1a4-103d-5acd-9646-1a3e970d68c0', '8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Développeur full-stack', 'CDI', date '2018-10-01', date '2022-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('0bdb9743-9433-596e-a5a0-7a3844e2d5e0', 'dbf4d1a4-103d-5acd-9646-1a3e970d68c0', '7e73cd92-6749-510c-964c-c90065024e4a', 'Chef de service', 'CDI', date '2022-09-01', null, false, true,
  'Poste actuel : chef de service.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('37f495ed-c26d-5846-808b-6c9c44f9c293', 'dbf4d1a4-103d-5acd-9646-1a3e970d68c0', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Certification AWS Solutions Architect', 'CERTIFICATION', date '2021-03-01', date '2021-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '6fa62627-bf15-591d-8334-e0939916dc4f', 'nafissatou.toure@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Nafissatou', 'Touré', 'ALUMNI', 'ACTIF', 'Génie Civil', 2000, 2003, 'INGENIEUR', 'Bamako', 'Chef de projet infrastructures', 'Après mon cycle d’ingénieur à Thiès, j’ai rejoint Agence des infrastructures de Thiès où j’occupe le poste de chef de projet infrastructures. Ouverte aux échanges sur les métiers de la civil.', '+221 77 000 00 00', '/api/photos/0657bb9b-f8e3-5ee9-9990-63d605cb80df.jpg', null, now() - interval '752 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('46b1c58f-7c57-5034-914d-f641fa610582', '6fa62627-bf15-591d-8334-e0939916dc4f', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Civil', 'DIPLOMANTE', date '2000-10-01', date '2003-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('06607311-1e3a-5fa3-b527-60a1e3ad8872', '6fa62627-bf15-591d-8334-e0939916dc4f', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Stage de fin d’études', 'STAGE', date '2003-02-01', date '2003-07-15', true, true,
  'Stage de six mois au sein de l’équipe technique.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('d9b96b7e-58a9-5c37-9373-064ca7b35342', '6fa62627-bf15-591d-8334-e0939916dc4f', 'd9d7c1eb-6e5d-5552-b49b-2d503d45ac9f', 'Ingénieur VRD', 'CDI', date '2003-10-01', date '2006-06-30', false, true,
  'Premier poste après l’école : montée en compétences sur les projets de l’équipe.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('994304d2-a8a9-58e8-aded-ae1b627a2e01', '6fa62627-bf15-591d-8334-e0939916dc4f', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Chef de projet infrastructures', 'CDI', date '2006-09-01', null, false, true,
  'Poste actuel : chef de projet infrastructures.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('2cd7eae1-208c-56e7-8c0c-033fad8667db', '6fa62627-bf15-591d-8334-e0939916dc4f', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Certification PMP', 'CERTIFICATION', date '2014-03-01', date '2014-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '0834d43d-bb9f-5abd-9029-916c63c2ae11', 'nafissatou.diop@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Nafissatou', 'Diop', 'ALUMNI', 'ACTIF', 'Génie Informatique et Télécommunications', 2020, 2023, 'INGENIEUR', 'Mbour', 'Ingénieur télécoms', 'Ingénieur télécoms chez Teranga Télécom, basée à Mbour. Je garde un lien fort avec l’école et je participe volontiers aux forums et aux jurys.', '+221 77 000 00 00', '/api/photos/a007267d-7430-52da-80ef-731c6968dcae.jpg', null, now() - interval '481 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('65935e5f-38f9-5bcb-ae49-3f92cd3e4446', '0834d43d-bb9f-5abd-9029-916c63c2ae11', (select id from organisme where etablissement_ept limit 1), 'Diplôme d’ingénieur de conception — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2020-10-01', date '2023-07-31', false, true,
  'Cycle ingénieur à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('89507b03-bc14-516e-98d1-1fdb00691102', '0834d43d-bb9f-5abd-9029-916c63c2ae11', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage de fin d’études', 'STAGE', date '2023-02-01', date '2023-07-15', true, true,
  'Projet de fin d’études encadré en entreprise.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('78327bac-33bb-52c4-b2f7-fa60f1926bc0', '0834d43d-bb9f-5abd-9029-916c63c2ae11', '8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Ingénieur télécoms', 'CDI', date '2023-09-01', null, false, true,
  'Poste actuel : ingénieur télécoms.') on conflict (id) do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('d2203b48-6f6e-5d34-bd18-9b0347d62049', '0834d43d-bb9f-5abd-9029-916c63c2ae11', '6ef782e2-a6e1-52da-81bb-4120ac83526d', 'Certification CISSP', 'CERTIFICATION', date '2026-03-01', date '2026-05-31', false, true,
  'Certification professionnelle obtenue en cours de carrière.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'a69bb100-a789-56a8-860d-1a65c7f840eb', 'djibril.niang@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Djibril', 'Niang', 'ETUDIANT', 'ACTIF', 'Génie Civil', 2025, 2028, null, 'Thiès', 'Élève ingénieur', 'Étudiant à l’EPT en Génie Civil. Passionné par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', '/api/photos/74d29a0b-2061-5604-b3f8-33d43f7b3fb5.jpg', null, now() - interval '196 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('0a4aac94-ea92-503d-839d-a4fb0e1ddc7e', 'a69bb100-a789-56a8-860d-1a65c7f840eb', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Civil', 'DIPLOMANTE', date '2025-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('01688fc7-824f-5f6c-a263-7226fd8b69c4', 'a69bb100-a789-56a8-860d-1a65c7f840eb', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage ouvrier', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'd95c2e6e-2b83-501b-9ac4-49a06f4029bc', 'aliou.camara@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Aliou', 'Camara', 'ETUDIANT', 'ACTIF', 'Génie Civil', 2024, 2027, null, 'Thiès', 'Élève ingénieur', 'En 3e année de génie civil à l’EPT, je m’intéresse particulièrement à la construction durable.', '+221 77 000 00 00', '/api/photos/130d7d04-6efc-55e6-965a-f2773e6fe7ca.jpg', null, now() - interval '353 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('ba78b94d-b636-5f1d-8ae4-11083d301a27', 'd95c2e6e-2b83-501b-9ac4-49a06f4029bc', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Civil', 'DIPLOMANTE', date '2024-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('b8f2dc17-1e9a-5152-bcfa-d23c01d95acb', 'd95c2e6e-2b83-501b-9ac4-49a06f4029bc', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Stage technicien', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'fd2abcc5-5026-56f8-9739-ad5c6994612f', 'khoudia.seck@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Khoudia', 'Seck', 'ETUDIANT', 'ACTIF', 'Génie Informatique et Télécommunications', 2025, 2028, null, 'Thiès', 'Élève ingénieure', 'Étudiante à l’EPT en Génie Informatique et Télécommunications. Passionnée par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', '/api/photos/577363c2-438a-5a45-8a64-2fb0b002cdfb.jpg', null, now() - interval '476 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('f3ccb60e-d8b1-5cc2-b4c6-119415448216', 'fd2abcc5-5026-56f8-9739-ad5c6994612f', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2025-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('358bd835-e6ec-5766-b1cc-df8a889c9c86', 'fd2abcc5-5026-56f8-9739-ad5c6994612f', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Stage ouvrier', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '31278c62-d3fb-59c0-b298-877946b40983', 'penda.drame@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Penda', 'Dramé', 'ETUDIANT', 'ACTIF', 'Génie Électromécanique', 2026, 2029, null, 'Thiès', 'Élève ingénieure', 'Étudiante à l’EPT en Génie Électromécanique. Passionnée par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', '/api/photos/92609f82-a99e-5ee3-b26b-116cb4b2419c.jpg', null, now() - interval '47 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('273e541f-935f-5cd4-b75f-4c6b1da80978', '31278c62-d3fb-59c0-b298-877946b40983', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Électromécanique', 'DIPLOMANTE', date '2026-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'fc943673-dd44-5e31-bd35-82def3570012', 'khadim.sall@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Khadim', 'Sall', 'ETUDIANT', 'ACTIF', 'Génie Électromécanique', 2025, 2028, null, 'Thiès', 'Élève ingénieur', 'En 2e année de génie électromécanique à l’EPT, je m’intéresse particulièrement à les énergies renouvelables.', '+221 77 000 00 00', null, null, now() - interval '364 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('879d3d97-85bd-5d61-8c90-943c38ff34e6', 'fc943673-dd44-5e31-bd35-82def3570012', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Électromécanique', 'DIPLOMANTE', date '2025-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'da6bf8d6-8287-52e0-a118-f9ed2eb61e7a', 'ibrahima.cisse@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ibrahima', 'Cissé', 'ETUDIANT', 'ACTIF', 'Génie Industriel', 2025, 2028, null, 'Thiès', 'Élève ingénieur', 'En 2e année de génie industriel à l’EPT, je m’intéresse particulièrement à l’amélioration continue et la logistique.', '+221 77 000 00 00', '/api/photos/bd0095ee-511d-5812-ba05-7812d30c0a9c.jpg', null, now() - interval '62 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('d8bc5409-8424-5514-b9e6-7adc96cad88c', 'da6bf8d6-8287-52e0-a118-f9ed2eb61e7a', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Industriel', 'DIPLOMANTE', date '2025-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'eb601a8f-ae9f-5a99-9b34-ffd994889776', 'assane.diouf@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Assane', 'Diouf', 'ETUDIANT', 'ACTIF', 'Génie Civil', 2024, 2027, null, 'Thiès', 'Élève ingénieur', 'Élève ingénieur en Génie Civil, promotion 2027. Je cherche un stage pour l’été et des conseils sur les métiers de la filière.', '+221 77 000 00 00', null, null, now() - interval '37 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('cfd0fea8-c262-5a71-9a9d-59402771d052', 'eb601a8f-ae9f-5a99-9b34-ffd994889776', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Civil', 'DIPLOMANTE', date '2024-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('032a32eb-4224-5312-a327-83bb392071fe', 'eb601a8f-ae9f-5a99-9b34-ffd994889776', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Stage technicien', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '33c4c54d-e3d2-5d47-9fb4-dcac89aabe0e', 'malick.tall@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Malick', 'Tall', 'ETUDIANT', 'ACTIF', 'Génie Informatique et Télécommunications', 2024, 2027, null, 'Thiès', 'Élève ingénieur', 'Étudiant à l’EPT en Génie Informatique et Télécommunications. Passionné par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', null, null, now() - interval '25 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('5e2a0d25-ac41-5b12-927a-8640d8e8b80c', '33c4c54d-e3d2-5d47-9fb4-dcac89aabe0e', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2024-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('e6592666-4648-5bf2-81b3-15abb4c1423f', '33c4c54d-e3d2-5d47-9fb4-dcac89aabe0e', 'ef43641a-d71b-5aee-ba0f-7725c094609d', 'Stage technicien', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '6b507882-0089-585c-94df-f160023559ef', 'yacine.ndiaye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Yacine', 'Ndiaye', 'ETUDIANT', 'ACTIF', 'Génie Informatique et Télécommunications', 2026, 2029, null, 'Thiès', 'Élève ingénieure', 'Étudiante à l’EPT en Génie Informatique et Télécommunications. Passionnée par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', '/api/photos/4b8b3091-ca28-5b41-8907-7af5e64d0f8c.jpg', null, now() - interval '189 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('44f7b534-9230-5833-b2ae-6ecdf07b2a2e', '6b507882-0089-585c-94df-f160023559ef', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2026-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '80d38c99-6816-528d-b682-9a6617f4f3a4', 'massamba.cisse@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Massamba', 'Cissé', 'ETUDIANT', 'ACTIF', 'Génie Électromécanique', 2026, 2029, null, 'Thiès', 'Élève ingénieur', 'En 1e année de génie électromécanique à l’EPT, je m’intéresse particulièrement à les énergies renouvelables.', '+221 77 000 00 00', '/api/photos/7183d41a-b48c-5b1a-9ec6-2f71c1d3fd25.jpg', null, now() - interval '259 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('df0ef3bd-b1c2-5ee0-b3bc-b0557c75f03c', '80d38c99-6816-528d-b682-9a6617f4f3a4', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Électromécanique', 'DIPLOMANTE', date '2026-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'd4575e51-15e5-5732-9202-060f7c776e6f', 'mor.dia@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mor', 'Dia', 'ETUDIANT', 'ACTIF', 'Génie Informatique et Télécommunications', 2026, 2029, null, 'Thiès', 'Élève ingénieur', 'Élève ingénieur en Génie Informatique et Télécommunications, promotion 2029. Je cherche un stage pour l’été et des conseils sur les métiers de la filière.', '+221 77 000 00 00', '/api/photos/7b5c80c2-d6a9-5280-b609-123de1e3701b.jpg', null, now() - interval '174 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('02f82795-d549-53fd-8541-ddab805a9fc1', 'd4575e51-15e5-5732-9202-060f7c776e6f', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2026-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', 'adama.ndour@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Adama', 'Ndour', 'ETUDIANT', 'ACTIF', 'Génie Aéronautique et Aérospatial', 2024, 2027, null, 'Thiès', 'Élève ingénieure', 'Élève ingénieure en Génie Aéronautique et Aérospatial, promotion 2027. Je cherche un stage pour l’été et des conseils sur les métiers de la filière.', '+221 77 000 00 00', null, null, now() - interval '166 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('fc6b019c-91a1-5014-9ba0-6c11a80cb5f9', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Aéronautique et Aérospatial', 'DIPLOMANTE', date '2024-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'd0540eb7-c40f-5b4d-b71f-67e26f1f2203', 'astou.toure@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Astou', 'Touré', 'ETUDIANT', 'ACTIF', 'Génie Informatique et Télécommunications', 2024, 2027, null, 'Thiès', 'Élève ingénieure', 'Étudiante à l’EPT en Génie Informatique et Télécommunications. Passionnée par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', '/api/photos/738fb1ef-4429-5365-a07d-8a273434a837.jpg', null, now() - interval '358 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('87ddada4-1a67-586f-85fe-14d396a195b1', 'd0540eb7-c40f-5b4d-b71f-67e26f1f2203', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2024-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('d50f75d1-e685-5d97-b9de-d372b518f27b', 'd0540eb7-c40f-5b4d-b71f-67e26f1f2203', 'efde041e-342d-5712-90fc-0cd90c79985a', 'Stage technicien', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '2e3cf9f7-e4c1-523f-be84-d3ac97b3407e', 'fallou.ndour@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Fallou', 'Ndour', 'ETUDIANT', 'ACTIF', 'Génie Informatique et Télécommunications', 2026, 2029, null, 'Thiès', 'Élève ingénieur', 'Étudiant à l’EPT en Génie Informatique et Télécommunications. Passionné par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', '/api/photos/799cbc20-1003-5758-ad89-01bb50d82de3.jpg', null, now() - interval '37 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('d10c9e96-4c13-5171-8a8a-0c485c77cbc1', '2e3cf9f7-e4c1-523f-be84-d3ac97b3407e', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2026-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'bd120997-d5e4-5d5f-b3c3-19f7e71b8d44', 'oumou.dieng@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Oumou', 'Dieng', 'ETUDIANT', 'ACTIF', 'Génie Informatique et Télécommunications', 2026, 2029, null, 'Thiès', 'Élève ingénieure', 'Élève ingénieure en Génie Informatique et Télécommunications, promotion 2029. Je cherche un stage pour l’été et des conseils sur les métiers de la filière.', '+221 77 000 00 00', '/api/photos/2095e29b-9bc4-51c7-bd80-640c3e565b90.jpg', null, now() - interval '34 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('bb4f321f-8ee5-5a46-8cad-0a1bc94d9445', 'bd120997-d5e4-5d5f-b3c3-19f7e71b8d44', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2026-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '3c57b1aa-4676-5875-8440-d925477549d6', 'ibrahima.coly@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ibrahima', 'Coly', 'ETUDIANT', 'ACTIF', 'Génie Aéronautique et Aérospatial', 2024, 2027, null, 'Thiès', 'Élève ingénieur', 'Étudiant à l’EPT en Génie Aéronautique et Aérospatial. Passionné par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', null, null, now() - interval '325 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('e45bcbf3-4d50-59d1-bd78-47e128f76011', '3c57b1aa-4676-5875-8440-d925477549d6', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Aéronautique et Aérospatial', 'DIPLOMANTE', date '2024-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('5fabd211-d3a2-5fc6-99d1-b3cc81df0671', '3c57b1aa-4676-5875-8440-d925477549d6', '0a080697-5a47-5150-8a7c-d22c53494978', 'Stage technicien', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'ec3fef72-9456-5acc-9639-000d9e507c1a', 'djibril.barry@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Djibril', 'Barry', 'ETUDIANT', 'ACTIF', 'Génie Électromécanique', 2024, 2027, null, 'Thiès', 'Élève ingénieur', 'Étudiant à l’EPT en Génie Électromécanique. Passionné par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', '/api/photos/568fed8f-c39d-5566-bc49-7e077d80e51e.jpg', null, now() - interval '71 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('6f8e24cf-744b-59fb-a2e9-3daec09d8bf4', 'ec3fef72-9456-5acc-9639-000d9e507c1a', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Électromécanique', 'DIPLOMANTE', date '2024-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '7c7db830-2584-5eac-8dcf-abeb6ca91d55', 'codou.diallo@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Codou', 'Diallo', 'ETUDIANT', 'ACTIF', 'Génie Civil', 2024, 2027, null, 'Thiès', 'Élève ingénieure', 'Élève ingénieure en Génie Civil, promotion 2027. Je cherche un stage pour l’été et des conseils sur les métiers de la filière.', '+221 77 000 00 00', '/api/photos/16a5e766-03f8-5c4a-9428-1bc799d35c4e.jpg', null, now() - interval '232 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('8e471871-e32f-57fd-a67f-5f7d30927c23', '7c7db830-2584-5eac-8dcf-abeb6ca91d55', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Civil', 'DIPLOMANTE', date '2024-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('053cbd26-838a-5c69-9951-756b277a9080', '7c7db830-2584-5eac-8dcf-abeb6ca91d55', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage technicien', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'c66385a9-2e09-5478-9f8f-e2556567191f', 'bamba.coly@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Bamba', 'Coly', 'ETUDIANT', 'ACTIF', 'Génie Civil', 2024, 2027, null, 'Thiès', 'Élève ingénieur', 'Étudiant à l’EPT en Génie Civil. Passionné par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', null, null, now() - interval '307 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('c23d7d13-6491-5247-831e-bf46beac0b84', 'c66385a9-2e09-5478-9f8f-e2556567191f', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Civil', 'DIPLOMANTE', date '2024-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f4d10835-0949-5490-bfa9-4516f67b3981', 'c66385a9-2e09-5478-9f8f-e2556567191f', 'f6a78c0c-37e1-5eca-a2b0-eb500a642d88', 'Stage technicien', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'dcf23cda-8f49-52ba-af43-69e5ff8a2e6c', 'elhadji.barry@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Elhadji', 'Barry', 'ETUDIANT', 'ACTIF', 'Génie Civil', 2024, 2027, null, 'Thiès', 'Élève ingénieur', 'En 3e année de génie civil à l’EPT, je m’intéresse particulièrement à la construction durable.', '+221 77 000 00 00', '/api/photos/feb1050b-ceb8-5a38-99b3-9d2224951c0a.jpg', null, now() - interval '184 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('8a2b70ff-38ae-528a-9107-79ed01683494', 'dcf23cda-8f49-52ba-af43-69e5ff8a2e6c', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Civil', 'DIPLOMANTE', date '2024-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '8c19c881-c56c-5007-92d0-fd9589c41646', 'alassane.diallo@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Alassane', 'Diallo', 'ETUDIANT', 'ACTIF', 'Génie Électromécanique', 2025, 2028, null, 'Thiès', 'Élève ingénieur', 'En 2e année de génie électromécanique à l’EPT, je m’intéresse particulièrement à les énergies renouvelables.', '+221 77 000 00 00', null, null, now() - interval '133 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('df2b4443-4951-5511-927b-8facf286dc64', '8c19c881-c56c-5007-92d0-fd9589c41646', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Électromécanique', 'DIPLOMANTE', date '2025-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('51f0b8cf-364f-5f74-aff0-dbefd3f4a107', '8c19c881-c56c-5007-92d0-fd9589c41646', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage ouvrier', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'd257bd7c-c404-57a1-a4fc-662d31f7a29d', 'aissatou.seck@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Aïssatou', 'Seck', 'ETUDIANT', 'ACTIF', 'Génie Électromécanique', 2026, 2029, null, 'Thiès', 'Élève ingénieure', 'Étudiante à l’EPT en Génie Électromécanique. Passionnée par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', null, null, now() - interval '148 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('0fb14b41-e5e4-5aa0-9b33-2ae0455c47db', 'd257bd7c-c404-57a1-a4fc-662d31f7a29d', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Électromécanique', 'DIPLOMANTE', date '2026-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'feadc7dc-098f-588a-ac2d-3f6e1623387e', 'aliou.barry@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Aliou', 'Barry', 'ETUDIANT', 'ACTIF', 'Génie Électromécanique', 2024, 2027, null, 'Thiès', 'Élève ingénieur', 'Élève ingénieur en Génie Électromécanique, promotion 2027. Je cherche un stage pour l’été et des conseils sur les métiers de la filière.', '+221 77 000 00 00', null, null, now() - interval '322 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('95ea53f3-76b2-5cff-a69b-f79cd6860c97', 'feadc7dc-098f-588a-ac2d-3f6e1623387e', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Électromécanique', 'DIPLOMANTE', date '2024-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('652a54af-c79f-5bfb-87fd-d33b7ca2fb07', 'feadc7dc-098f-588a-ac2d-3f6e1623387e', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage technicien', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '25ff0193-529a-5f33-b609-c64f82d415b3', 'coumba.diagne@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Coumba', 'Diagne', 'ETUDIANT', 'ACTIF', 'Génie Électromécanique', 2025, 2028, null, 'Thiès', 'Élève ingénieure', 'Étudiante à l’EPT en Génie Électromécanique. Passionnée par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', null, null, now() - interval '246 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('fbf13752-613e-55a0-81e0-fd174e2ec1fa', '25ff0193-529a-5f33-b609-c64f82d415b3', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Électromécanique', 'DIPLOMANTE', date '2025-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('351f5df9-2f78-5860-98c1-78498ec29f79', '25ff0193-529a-5f33-b609-c64f82d415b3', '408e11af-95d6-5c5b-b250-4b62f4609084', 'Stage ouvrier', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'aeb42be6-c8b9-5936-9659-4fc41e322b16', 'aminata.thiam@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Aminata', 'Thiam', 'ETUDIANT', 'ACTIF', 'Génie Informatique et Télécommunications', 2025, 2028, null, 'Thiès', 'Élève ingénieure', 'Étudiante à l’EPT en Génie Informatique et Télécommunications. Passionnée par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', null, null, now() - interval '129 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('87f8571d-2cfb-55b5-8c76-98ca0d39d9c4', 'aeb42be6-c8b9-5936-9659-4fc41e322b16', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2025-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '422e77a7-ae81-5b28-be87-0e8d9b3c769d', 'samba.bodian@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Samba', 'Bodian', 'ETUDIANT', 'ACTIF', 'Génie Informatique et Télécommunications', 2025, 2028, null, 'Thiès', 'Élève ingénieur', 'Étudiant à l’EPT en Génie Informatique et Télécommunications. Passionné par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', '/api/photos/a5fc5a8b-9d8a-51f4-afb1-93b95bb4ef5e.jpg', null, now() - interval '106 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('64b97e1b-7edb-5069-a9c8-9e5fc580b40b', '422e77a7-ae81-5b28-be87-0e8d9b3c769d', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2025-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '1b42620c-c483-53d0-81c2-11af42770c68', 'mor.tall@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mor', 'Tall', 'ETUDIANT', 'ACTIF', 'Génie Électromécanique', 2026, 2029, null, 'Thiès', 'Élève ingénieur', 'Élève ingénieur en Génie Électromécanique, promotion 2029. Je cherche un stage pour l’été et des conseils sur les métiers de la filière.', '+221 77 000 00 00', null, null, now() - interval '70 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('5c8fc574-4953-57b1-9b15-a7c8c8e734e2', '1b42620c-c483-53d0-81c2-11af42770c68', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Électromécanique', 'DIPLOMANTE', date '2026-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'e84a9fc0-ca48-5c1a-85e1-f8fce2a9618a', 'matar.toure@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Matar', 'Touré', 'ETUDIANT', 'ACTIF', 'Génie Électromécanique', 2025, 2028, null, 'Thiès', 'Élève ingénieur', 'Étudiant à l’EPT en Génie Électromécanique. Passionné par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', '/api/photos/ba3fb4f4-4540-5c44-b26e-2361676536ad.jpg', null, now() - interval '392 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('6f07846e-1e18-5270-9395-163a48cbeb53', 'e84a9fc0-ca48-5c1a-85e1-f8fce2a9618a', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Électromécanique', 'DIPLOMANTE', date '2025-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'b6fcfbae-d362-5ba1-bd18-d5057aea2f8d', 'kine.sarr@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Kiné', 'Sarr', 'ETUDIANT', 'ACTIF', 'Génie Industriel', 2025, 2028, null, 'Thiès', 'Élève ingénieure', 'Étudiante à l’EPT en Génie Industriel. Passionnée par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', '/api/photos/feeacb37-df1b-5fa3-b674-526b653dcf3c.jpg', null, now() - interval '422 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('dda80cf5-1bc7-50aa-ac0f-d84f1ca2d290', 'b6fcfbae-d362-5ba1-bd18-d5057aea2f8d', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Industriel', 'DIPLOMANTE', date '2025-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('5eae5f23-03be-520f-8dea-25df95261362', 'b6fcfbae-d362-5ba1-bd18-d5057aea2f8d', '7e73cd92-6749-510c-964c-c90065024e4a', 'Stage ouvrier', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '0d960ead-333b-580a-bf11-faac2d46f590', 'dieynaba.kebe@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Dieynaba', 'Kébé', 'ETUDIANT', 'ACTIF', 'Génie Électromécanique', 2026, 2029, null, 'Thiès', 'Élève ingénieure', 'Élève ingénieure en Génie Électromécanique, promotion 2029. Je cherche un stage pour l’été et des conseils sur les métiers de la filière.', '+221 77 000 00 00', null, null, now() - interval '434 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('2fd54a07-a28c-5409-9b14-31354ce09f90', '0d960ead-333b-580a-bf11-faac2d46f590', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Électromécanique', 'DIPLOMANTE', date '2026-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '0efa151b-4536-5acd-98b8-9e62cd5042c5', 'mame-diarra.dieng@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Mame Diarra', 'Dieng', 'ETUDIANT', 'ACTIF', 'Génie Informatique et Télécommunications', 2025, 2028, null, 'Thiès', 'Élève ingénieure', 'En 2e année de génie informatique et télécommunications à l’EPT, je m’intéresse particulièrement à l’intelligence artificielle et le développement web.', '+221 77 000 00 00', null, null, now() - interval '194 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('c1861b39-6c3e-5bb2-ba0a-0f86bc81afe6', '0efa151b-4536-5acd-98b8-9e62cd5042c5', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2025-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'ef6c88cb-7f71-5f28-b013-f3dc3f90329a', 'elhadji.kane@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Elhadji', 'Kane', 'ETUDIANT', 'ACTIF', 'Génie Informatique et Télécommunications', 2024, 2027, null, 'Thiès', 'Élève ingénieur', 'Étudiant à l’EPT en Génie Informatique et Télécommunications. Passionné par les projets concrets, je prépare mon projet de fin d’études.', '+221 77 000 00 00', '/api/photos/ebd1d370-20a5-5258-9c7e-68abe37321c9.jpg', null, now() - interval '114 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('ed8352e1-840e-5de7-b652-53fe798a24f2', 'ef6c88cb-7f71-5f28-b013-f3dc3f90329a', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Informatique et Télécommunications', 'DIPLOMANTE', date '2024-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('f683bea3-4822-5dba-bfb4-683d1a9b6a21', 'ef6c88cb-7f71-5f28-b013-f3dc3f90329a', '7e73cd92-6749-510c-964c-c90065024e4a', 'Stage technicien', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'f2ddf2c7-06e2-56e5-b270-91ff9380f037', 'coumba.sarr@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Coumba', 'Sarr', 'ETUDIANT', 'ACTIF', 'Génie Électromécanique', 2025, 2028, null, 'Thiès', 'Élève ingénieure', 'Élève ingénieure en Génie Électromécanique, promotion 2028. Je cherche un stage pour l’été et des conseils sur les métiers de la filière.', '+221 77 000 00 00', '/api/photos/0c9de604-0598-5c53-abaf-93122e2e5f50.jpg', null, now() - interval '260 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('8615ba1d-0607-563a-a865-34fb98bcdb03', 'f2ddf2c7-06e2-56e5-b270-91ff9380f037', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Électromécanique', 'DIPLOMANTE', date '2025-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('c8ce19aa-0ba1-5d9f-a6ef-88f1841fde52', 'f2ddf2c7-06e2-56e5-b270-91ff9380f037', 'd646d7b8-1e7f-5774-8ef4-fe9f9019a3bd', 'Stage ouvrier', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '5c97b403-1475-5719-863d-b06958f0ad7b', 'ibrahima.badji@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ibrahima', 'Badji', 'ETUDIANT', 'ACTIF', 'Génie Civil', 2025, 2028, null, 'Thiès', 'Élève ingénieur', 'En 2e année de génie civil à l’EPT, je m’intéresse particulièrement à la construction durable.', '+221 77 000 00 00', '/api/photos/25932d68-9e62-55ad-bade-b43a8f2a9257.jpg', null, now() - interval '52 days'
on conflict do nothing;
insert into formation (id, utilisateur_id, organisme_id, libelle, type_formation, date_debut, date_fin, est_stage, est_valide, description)
values ('fcea9601-9e1a-515e-b191-79922b3c5822', '5c97b403-1475-5719-863d-b06958f0ad7b', (select id from organisme where etablissement_ept limit 1), 'Cycle ingénieur — Génie Civil', 'DIPLOMANTE', date '2025-10-01', null, false, true,
  'Formation en cours à l’École Polytechnique de Thiès.') on conflict (id) do nothing;
insert into experience_professionelle (id, utilisateur_id, organisme_id, poste, type_contrat, date_debut, date_fin, est_stage, est_valide, description)
values ('ce4da11e-5470-5b51-80bb-eced1d58e95c', '5c97b403-1475-5719-863d-b06958f0ad7b', '7cc60e4d-8ad0-556c-8d39-5d727379d23f', 'Stage ouvrier', 'STAGE', date '2025-07-01', date '2025-08-31', true, true,
  'Stage d’été de deux mois.') on conflict (id) do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '8bc22c03-0373-5d99-a18d-1e1c2d71578c', 'ousmane.badji@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Ousmane', 'Badji', 'PERSONNEL', 'ACTIF', null, null, null, null, 'Thiès', 'Chef du service de la scolarité', 'Membre du personnel de l’École Polytechnique de Thiès, chef du service de la scolarité.', '+221 77 000 00 00', '/api/photos/f6081020-f23e-57b3-83ac-51a55c85dc58.jpg', null, now() - interval '347 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'b58eb7ec-492a-5e00-b7d4-18d3b848066a', 'aissatou.dieng@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Aïssatou', 'Dieng', 'PERSONNEL', 'ACTIF', null, null, null, null, 'Thiès', 'Responsable des relations internationales', 'Membre du personnel de l’École Polytechnique de Thiès, responsable des relations internationales.', '+221 77 000 00 00', '/api/photos/a0bc5d65-2f7e-5506-8f6f-94b7afad73dd.jpg', null, now() - interval '746 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c', 'pierre.mendy@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Pierre', 'Mendy', 'PERSONNEL', 'ACTIF', null, null, null, null, 'Thiès', 'Enseignant-chercheur en génie civil', 'Membre du personnel de l’École Polytechnique de Thiès, enseignant-chercheur en génie civil.', '+221 77 000 00 00', null, null, now() - interval '647 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '95f0f598-aeda-59f7-8df3-e74bd10dc64d', 'fatou-binetou.ndiaye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Fatou Binetou', 'Ndiaye', 'PERSONNEL', 'ACTIF', null, null, null, null, 'Thiès', 'Chargée de l’insertion professionnelle', 'Membre du personnel de l’École Polytechnique de Thiès, chargée de l’insertion professionnelle.', '+221 77 000 00 00', '/api/photos/90d117c1-0c0c-56b0-9b3e-6854ecbd2da1.jpg', null, now() - interval '613 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'dc23b8dd-7e75-583d-a661-962ac846c8b8', 'abdoulaye.sow@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Abdoulaye', 'Sow', 'PERSONNEL', 'ACTIF', null, null, null, null, 'Thiès', 'Enseignant-chercheur en informatique', 'Membre du personnel de l’École Polytechnique de Thiès, enseignant-chercheur en informatique.', '+221 77 000 00 00', '/api/photos/354ad47c-ce47-5db4-b797-d91e80effe4d.jpg', null, now() - interval '790 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'd61f79a6-6b3a-542f-89b1-08d81a347be8', 'rokhaya.gaye@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Rokhaya', 'Gaye', 'PERSONNEL', 'ACTIF', null, null, null, null, 'Thiès', 'Bibliothécaire de l’école', 'Membre du personnel de l’École Polytechnique de Thiès, bibliothécaire de l’école.', '+221 77 000 00 00', '/api/photos/f5f7b5d9-b4d8-5968-a790-416f89620937.jpg', null, now() - interval '308 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'bcceeeec-059e-5229-90b4-15838929d725', 'julien.moreau@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Julien', 'Moreau', 'VISITEUR', 'ACTIF', null, null, null, null, 'Toulouse', 'Responsable recrutement en ingénierie', 'Responsable recrutement en ingénierie, en lien avec le réseau des ingénieurs de l’EPT.', '+221 77 000 00 00', '/api/photos/1e720d13-4f77-5a33-89da-17c870bf8f07.jpg', null, now() - interval '206 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'f4b29068-7ff9-5610-9ad2-20474998efdd', 'sophie.lambert@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Sophie', 'Lambert', 'VISITEUR', 'ACTIF', null, null, null, null, 'Paris', 'Chargée des relations écoles', 'Chargée des relations écoles, en lien avec le réseau des ingénieurs de l’EPT.', '+221 77 000 00 00', '/api/photos/8595e142-55e5-5ce5-9d50-8a17044af815.jpg', null, now() - interval '83 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '85d4ba18-d76f-5c2a-a240-dcf6baabd84c', 'kwame.mensah@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Kwame', 'Mensah', 'VISITEUR', 'ACTIF', null, null, null, null, 'Accra', 'Directeur d’un incubateur technologique', 'Directeur d’un incubateur technologique, en lien avec le réseau des ingénieurs de l’EPT.', '+221 77 000 00 00', '/api/photos/27357db6-c925-56f6-a9c9-2bb49e9d0332.jpg', null, now() - interval '50 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '74a06960-9dce-51ad-aa8f-af54c468706b', 'aya.kouassi@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Aya', 'Kouassi', 'VISITEUR', 'ACTIF', null, null, null, null, 'Abidjan', 'Consultante en transformation numérique', 'Consultante en transformation numérique, en lien avec le réseau des ingénieurs de l’EPT.', '+221 77 000 00 00', null, null, now() - interval '234 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'cd98b0b9-9e1d-5f1e-a7ae-933f51e45989', 'moussa.traore@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Moussa', 'Traoré', 'VISITEUR', 'ACTIF', null, null, null, null, 'Bamako', 'Ingénieur conseil indépendant', 'Ingénieur conseil indépendant, en lien avec le réseau des ingénieurs de l’EPT.', '+221 77 000 00 00', null, null, now() - interval '112 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'b23772fe-a5b2-5037-881f-8de86b35f087', 'lea.fontaine@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Léa', 'Fontaine', 'VISITEUR', 'ACTIF', null, null, null, null, 'Lyon', 'Journaliste scientifique', 'Journaliste scientifique, en lien avec le réseau des ingénieurs de l’EPT.', '+221 77 000 00 00', '/api/photos/d0451c55-018d-5ef0-9e47-582d4517b4ad.jpg', null, now() - interval '97 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'fce07ac1-1fa2-5929-b89b-f38df176c1d1', 'hamidou.sangare@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Hamidou', 'Sangaré', 'VISITEUR', 'ACTIF', null, null, null, null, 'Nouakchott', 'Chef de projet énergie', 'Chef de projet énergie, en lien avec le réseau des ingénieurs de l’EPT.', '+221 77 000 00 00', null, null, now() - interval '186 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select '1ec94b2d-dfb0-5400-8e05-00f259ccd5aa', 'ines.benali@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Inès', 'Benali', 'VISITEUR', 'ACTIF', null, null, null, null, 'Casablanca', 'Responsable partenariats universitaires', 'Responsable partenariats universitaires, en lien avec le réseau des ingénieurs de l’EPT.', '+221 77 000 00 00', null, null, now() - interval '76 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'ee46384a-c14b-5eec-b37a-a8fb4409d9b7', 'daniel.gomis@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Daniel', 'Gomis', 'VISITEUR', 'ACTIF', null, null, null, null, 'Ziguinchor', 'Professeur de mathématiques au lycée', 'Professeur de mathématiques au lycée, en lien avec le réseau des ingénieurs de l’EPT.', '+221 77 000 00 00', '/api/photos/e203e882-9dd6-5815-b5e6-1971b09351a1.jpg', null, now() - interval '214 days'
on conflict do nothing;
insert into utilisateur (id, email, email_verifie, password, doit_changer_mot_de_passe, prenom, nom, role, statut_compte, filiere, annee_entree, annee_sortie, diplome, ville_residence, poste_actuel, bio, telephone, url_photo, lien_portfolio, date_creation)
select 'a04dcec7-743b-55ad-82f2-a4be51bce88c', 'awa.coulibaly@demo.ept-alumni.invalid', true, coalesce((select password from utilisateur where email = :'compte_modele'), '!'), false,
  'Awa', 'Coulibaly', 'VISITEUR', 'ACTIF', null, null, null, null, 'Montréal', 'Conseillère en immigration professionnelle', 'Conseillère en immigration professionnelle, en lien avec le réseau des ingénieurs de l’EPT.', '+221 77 000 00 00', null, null, now() - interval '150 days'
on conflict do nothing;
update utilisateur set url_photo = '/api/photos/72e8e4f7-2357-5faa-a0c3-f992b4692bfd.jpg' where id = '1538e22c-a2a9-5eee-9a99-7a5ac9d211be' and url_photo is null;
update utilisateur set url_photo = '/api/photos/d103f260-5cdc-5c16-ada5-6e927266894c.jpg' where id = 'a6c84916-3462-5018-8e9c-bedaeb3b39bd' and url_photo is null;
update utilisateur set url_photo = '/api/photos/b23c5810-f1f9-5701-9a54-3722270cad6e.jpg' where id = 'fd215a7e-7fbb-57c5-b04b-57f515003008' and url_photo is null;
update utilisateur set url_photo = '/api/photos/433c25f9-5da0-5ee2-a767-4e4f984e66e8.jpg' where id = '2a4cfd61-2f58-5671-b2ca-14cae9884932' and url_photo is null;
update utilisateur set url_photo = '/api/photos/70d0baf9-d45c-577e-9ceb-3b818e455f9c.jpg' where id = 'e220afa9-938c-526b-bca4-e7357e3d1208' and url_photo is null;
update utilisateur set url_photo = '/api/photos/3d706ee5-4ae8-541c-90d5-f87c6fadcce7.jpg' where id = '3ec77c21-295a-5bcf-a1a1-662782624791' and url_photo is null;
update utilisateur set url_photo = '/api/photos/fc3fd529-4bf3-55c0-aba0-412318f5186c.jpg' where id = 'cb4ae14b-a5ae-5be3-87f5-03bdebba98db' and url_photo is null;
update utilisateur set url_photo = '/api/photos/cfe4d901-2657-5209-a586-be2a68aed4b7.jpg' where id = '217acb44-3d62-541a-ad55-20b393defe14' and url_photo is null;
update utilisateur set url_photo = '/api/photos/cbc7e9bd-57c9-521f-b508-15b57acd8a2c.jpg' where id = '4ba85b20-f2d7-5b10-91aa-f71726a6c246' and url_photo is null;
update utilisateur set url_photo = '/api/photos/31e45a87-e635-5a52-94e3-3254f4a55b02.jpg' where id = 'f43959e1-0009-5285-b7d8-1da0861fad73' and url_photo is null;
update utilisateur set url_photo = '/api/photos/e48418f9-bd3e-5002-ad2f-1024327d3082.jpg' where id = 'caa7ac70-9b4e-5f0c-99b5-9261e81224f2' and url_photo is null;
update utilisateur set url_photo = '/api/photos/6df56fd1-0c75-560d-afbd-861a2281e865.jpg' where id = 'f963c1e1-ddad-5c37-aeec-73a4a0871d57' and url_photo is null;
update utilisateur set url_photo = '/api/photos/40cfd6ef-4f62-51a5-a18d-a9d651b35030.jpg' where id = '346777f9-3a05-56ac-a532-17cb17f2d45b' and url_photo is null;
update utilisateur set url_photo = '/api/photos/8527725e-7215-5e9f-b018-5448fb01aa47.jpg' where id = '755dbf8a-d991-5272-97a1-ea495c4116fa' and url_photo is null;
update utilisateur set url_photo = '/api/photos/f4f84168-0467-5fbc-ad80-10961c101de1.jpg' where id = '28b42385-c305-5335-8c90-0cb2c1668b2f' and url_photo is null;
update utilisateur set url_photo = '/api/photos/a3ccddb5-6ab2-501c-99e0-c2d16c3a88b1.jpg' where id = '8860b22b-057b-5a11-aa09-11335b1ef58f' and url_photo is null;
update utilisateur set url_photo = '/api/photos/40834974-d317-59e0-94b5-00b213c299f6.jpg' where id = 'c45d1c47-7542-5522-8a2e-ede85b53b2ae' and url_photo is null;
update utilisateur set url_photo = '/api/photos/75b43986-479a-5f30-ba19-1f00ea0479c2.jpg' where id = '70ef578a-181c-510a-9cf7-b6cf3ce5f99b' and url_photo is null;
update utilisateur set url_photo = '/api/photos/f066a2ab-6ada-5389-8fe9-5053f506824c.jpg' where id = '6904214d-a1f0-5cf9-b47d-c8344e8ff2c0' and url_photo is null;
update utilisateur set url_photo = '/api/photos/ab2ea61d-efbc-515c-ae3b-2153b1372caa.jpg' where id = '4d33cf28-2592-56c3-b033-855cffb14776' and url_photo is null;
update utilisateur set url_photo = '/api/photos/8192ea4b-18c7-5027-b3ae-6971c8f742a6.jpg' where id = '5caabf0a-289b-50a6-b714-75d251427d31' and url_photo is null;
update utilisateur set url_photo = '/api/photos/dcdddeaa-c5ac-53f7-8d1b-e6badce71816.jpg' where id = '57518406-14da-54a4-bab0-408d9f6bb421' and url_photo is null;
update utilisateur set url_photo = '/api/photos/0daddec9-3bd1-58c8-b75e-3b82a2dfaf09.jpg' where id = 'd8ce4039-b9d4-5e06-8e8c-e5d507c9ea9c' and url_photo is null;
update utilisateur set url_photo = '/api/photos/06aa7146-86e2-58ea-9539-7a937b7abf88.jpg' where id = '438d8c6e-122a-501e-bf8a-a8db962e4337' and url_photo is null;
update utilisateur set url_photo = '/api/photos/be082c41-9ba2-56c0-8b67-bf0549cb2675.jpg' where id = '8b0824f9-36fa-590f-8d99-227ff13aeb80' and url_photo is null;
update utilisateur set url_photo = '/api/photos/2aa2c5e4-8462-54e9-8614-a0df4311a21c.jpg' where id = 'af68381f-38ee-55b1-8ae5-65b149d6f4c8' and url_photo is null;
update utilisateur set url_photo = '/api/photos/22fea694-5186-58e5-8e41-c201f2e2862b.jpg' where id = '0f494f58-6c35-57f1-b27c-9d4b676f3b63' and url_photo is null;
update utilisateur set url_photo = '/api/photos/0a172b08-3741-5fd9-a256-8d00b2459f28.jpg' where id = '51225c77-6d76-5efb-8d46-5e0ab767ae87' and url_photo is null;
update utilisateur set url_photo = '/api/photos/9991bede-71bd-58ad-8ea6-f7b82c0f1888.jpg' where id = '99599b64-8426-5c71-9a67-7d8476b7d2eb' and url_photo is null;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('1d3de83a-47ca-5aaa-82ac-32ffa369e697', 'Conférence : l’intelligence artificielle dans l’industrie sénégalaise', 'Conférence : l’intelligence artificielle dans l’industrie sénégalaise. Inscrivez-vous rapidement, les places sont limitées. Une collation sera offerte à l’issue de la rencontre.', 'Amphithéâtre A, EPT',
  date_trunc('day', now()) + interval '9 days' + interval '18 hours',
  date_trunc('day', now()) + interval '9 days' + interval '22 hours',
  'TOUS', 200, true, 'PUBLIE', '8bc22c03-0373-5d99-a18d-1e1c2d71578c', '/api/evenement-images/1d3de83a-47ca-5aaa-82ac-32ffa369e697.jpg', now() - interval '19 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6032796e-5e76-5f60-872f-4fefc6421871', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '6593d854-bb87-5921-a69f-4167b7a5e904', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6fb0d724-487d-506d-930c-7cf2366f8639', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '47dbc521-229b-5806-be71-eb7d9f24fb1e', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1acd5eb5-a3be-588f-a123-453cd1d25afb', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '03017916-9ccb-5538-bf6a-e8b136545408', 'NE_PARTICIPERA_PAS', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3a010c1f-fc02-5ba7-a701-fa5aae491cd6', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', 'bd120997-d5e4-5d5f-b3c3-19f7e71b8d44', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('57e30263-e149-51e1-80d6-390a8ace2908', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', 'feadc7dc-098f-588a-ac2d-3f6e1623387e', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b157eb36-eecc-5ea4-9c74-53b636c087e4', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '4ef34c8c-1ebb-5b2d-9f8b-e1dea623166b', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4d32640c-0e3c-56f2-a535-9c975f09001f', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '235c7b1c-4170-52c0-9469-475b0210cb78', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('512edef1-82ea-5192-8344-1f01c88aac34', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '1a1ae694-fc50-5757-931c-51ac8bbdcfc5', 'NE_PARTICIPERA_PAS', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2c849ff1-8a50-580b-a875-e22e21fe5dd9', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '2e3cf9f7-e4c1-523f-be84-d3ac97b3407e', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('96addfa4-c90e-5b31-9f47-00928a775c6d', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', 'e26b8671-16eb-54b9-b11f-ed3f99a912f5', 'NE_PARTICIPERA_PAS', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a8ee6537-05a8-5406-af0d-a3b98ffb17d9', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '0834d43d-bb9f-5abd-9029-916c63c2ae11', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0445b7b2-25a2-52a1-a83a-d2c8805ff85a', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', 'a1337834-0187-5899-b8bf-5fd74cd1d75b', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8582fe43-8a37-56bf-8cb0-40ab76fb6c32', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b57cf7a4-30f4-57fd-a081-09438acda1f0', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '102b12e7-e8a2-59dc-9b3a-ab365bac18c2', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a3c9f2dd-e99a-5053-a190-f47579591264', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '6b674cd4-406f-546f-aae4-5a78a5d13b31', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fed16964-27de-5e7b-a99c-acb5f069909a', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '85d4ba18-d76f-5c2a-a240-dcf6baabd84c', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2b923e1c-26a5-5f00-88b0-fe9a12b19d20', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', 'f2ddf2c7-06e2-56e5-b270-91ff9380f037', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d8913970-dc1b-529b-8eba-0554898090fb', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '58a64778-e962-5167-9c0b-5216c2e855d6', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e8e3d3a9-26c8-52a8-b33a-93c49411d400', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '848f10d0-ecf4-597a-9bb8-a4a950cf2294', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ea2273d0-06eb-5748-beeb-2f259a0a1558', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '58bf6984-dbbe-5b82-afe6-3f8c58a1be77', 'NE_PARTICIPERA_PAS', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0335b9da-0464-5e97-9601-df06d763b947', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', 'b23772fe-a5b2-5037-881f-8de86b35f087', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d07a4709-574a-523b-bbd6-f35d1158a7a6', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '577385a3-9946-557b-be83-a8afaf69835f', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('cc55a7e9-e704-5a78-862b-cb4869e31001', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', 'dbf4d1a4-103d-5acd-9646-1a3e970d68c0', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d236d562-a315-5a4a-a8dc-6f86581ea71b', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '89629841-a5b6-5eee-be22-e550bc5d33fb', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7db0b03a-9519-54a2-bd40-48f967c2eb93', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', 'f88aefc3-5aef-5b0b-b217-82182448e43e', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d8197b74-faa4-505c-a090-1213fe535265', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '2767c1e8-a06b-5908-8fdc-b872bb7dfd48', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3b91efe6-b4c0-588d-8e4a-a1053e2f8033', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', 'd657f819-3789-584f-ab12-f814e2e66008', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('dd827bd7-3458-5bc4-a4ca-79b313ddb9a6', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '4a73bb2a-d738-5997-a201-df09d1c31953', 'NE_PARTICIPERA_PAS', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8064014e-7491-5c45-b98d-dde3c5d9329d', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', 'd634be2e-9272-5970-944b-55be40fef00b', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('cdb29f73-e4c5-5364-9bf4-7db19d55fcc2', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', 'e84a9fc0-ca48-5c1a-85e1-f8fce2a9618a', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ba699a8b-21db-509a-b5d5-fccc4ff3911b', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '945626e0-cf07-5ff9-8f88-c99c26151b4f', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('15dacd9b-752b-5974-ac7d-08e7455a8369', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', 'fc943673-dd44-5e31-bd35-82def3570012', 'NE_PARTICIPERA_PAS', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('27247523-2f4b-5962-bb8d-3baebbe8578d', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '87ce220b-bb1b-55b0-acb8-ff8e1bf24804', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e67db18b-98ad-5def-9e45-be608fa7126f', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '31278c62-d3fb-59c0-b298-877946b40983', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ebbc102b-afe8-5e5a-a92a-eade7b5d1f51', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '1ec94b2d-dfb0-5400-8e05-00f259ccd5aa', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1e92f3f1-c980-565f-951d-e55d4c865545', '1d3de83a-47ca-5aaa-82ac-32ffa369e697', '8bc22c03-0373-5d99-a18d-1e1c2d71578c', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('655b55a5-fc2c-54a9-90c7-34fef0f63084', 'Rencontre alumni de Paris', 'Rencontre alumni de Paris. Un moment d’échange entre diplômés, étudiants et partenaires. Une collation sera offerte à l’issue de la rencontre.', 'La Défense, Paris',
  date_trunc('day', now()) + interval '-96 days' + interval '14 hours',
  date_trunc('day', now()) + interval '-96 days' + interval '17 hours',
  'ALUMNI', 50, false, 'PUBLIE', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', '/api/evenement-images/655b55a5-fc2c-54a9-90c7-34fef0f63084.jpg', now() - interval '106 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0e7e2c51-1563-5968-9424-666437662d81', '655b55a5-fc2c-54a9-90c7-34fef0f63084', 'b5872f7c-6d3c-5f90-b99a-e6b4586cb9f2', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0f05f9a0-2732-5b9f-91e1-ec4241a7bfb2', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '2767c1e8-a06b-5908-8fdc-b872bb7dfd48', 'NE_PARTICIPERA_PAS', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e4d1aa21-5da4-5503-8be0-e3c75d8ef56c', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '9f088eb6-0059-5cec-a0f2-d8cd281a702d', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fe90e10b-8f69-5d8f-a832-81280313464d', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '577385a3-9946-557b-be83-a8afaf69835f', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('69b43e9d-ce57-572f-b13c-ac9330eb69fc', '655b55a5-fc2c-54a9-90c7-34fef0f63084', 'e30df4e3-580d-5f8a-9ec9-5d29165f5ea3', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f49ca4bc-01dd-5c87-8673-b826f8f608a3', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '75d14361-a9af-5dd6-a9d0-d5bf9d20fa32', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('573da539-4ebc-5e49-a1e6-dae43c91ab69', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '6b674cd4-406f-546f-aae4-5a78a5d13b31', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('800340a6-4e72-5f28-a646-a447bcc5301e', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', 'NE_PARTICIPERA_PAS', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a810f006-a204-5688-b877-9d4e91e96a74', '655b55a5-fc2c-54a9-90c7-34fef0f63084', 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', 'NE_PARTICIPERA_PAS', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1b0e93f6-a969-560c-8735-a0e0fb26d351', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '1ec94b2d-dfb0-5400-8e05-00f259ccd5aa', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d2a13a2b-99d3-54b3-8c68-5d0b341bd605', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '58529a43-d7de-50da-887d-0d7a51fb5929', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6aef83d8-8cc5-5ffc-8392-fb28f63fc344', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '58a64778-e962-5167-9c0b-5216c2e855d6', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8843cb3d-8a32-54ce-a63b-2796d87dc240', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '945626e0-cf07-5ff9-8f88-c99c26151b4f', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4fd1bf1a-0438-52c1-a770-d91ebb4932ae', '655b55a5-fc2c-54a9-90c7-34fef0f63084', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', 'NE_PARTICIPERA_PAS', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7dcc562d-d11f-5876-b57e-454d127e76c2', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '713d3bed-9680-507d-902f-f81fe90e43f4', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4ef06fa5-0e84-5340-bbe4-8f96b2349f41', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '2b34d94e-66b2-5292-8f66-8cde42ae3106', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f7985cd3-e644-52b4-a17c-297d7b08f292', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7d853eda-2878-5fc4-8b67-5559701633a4', '655b55a5-fc2c-54a9-90c7-34fef0f63084', 'e3b60172-18f3-5bf7-9823-b8b6edfdb350', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('adeebb79-a44a-545f-93e2-51ce0f9a2ec0', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '8f0a4694-dbd7-56ef-8a66-f9b0169504e8', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('90dc2856-3f1a-54b2-85f2-3bb52d480cab', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '29191454-c4cc-5485-9e68-e24aad0ba23f', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('86eaa495-86d2-50a1-af52-0cbcf841abd5', '655b55a5-fc2c-54a9-90c7-34fef0f63084', '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'Atelier : préparer un entretien technique', 'Atelier : préparer un entretien technique. Un rendez-vous ouvert à toute la communauté EPT. Une collation sera offerte à l’issue de la rencontre.', 'Salle 12, EPT',
  date_trunc('day', now()) + interval '-43 days' + interval '10 hours',
  date_trunc('day', now()) + interval '-43 days' + interval '14 hours',
  'ETUDIANTS', 40, true, 'PUBLIE', 'd61f79a6-6b3a-542f-89b1-08d81a347be8', '/api/evenement-images/197206f3-1aa4-5e94-bd20-00a1b0f247b7.jpg', now() - interval '53 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6d39769e-8b7f-5aa5-8d9b-74e254319cf9', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'fc943673-dd44-5e31-bd35-82def3570012', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fe41f920-4c6b-5d02-9fda-bc7141ad80e2', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '95f0f598-aeda-59f7-8df3-e74bd10dc64d', 'NE_PARTICIPERA_PAS', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6b3da5ec-5535-5c21-9ed1-287759fddf1b', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'cd98b0b9-9e1d-5f1e-a7ae-933f51e45989', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('99d8847e-15e0-5fb2-a1b0-369cfcb1ea48', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'd95c2e6e-2b83-501b-9ac4-49a06f4029bc', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('315d0cc8-f9bd-5af6-8b79-07fec95492f3', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '25ff0193-529a-5f33-b609-c64f82d415b3', 'NE_PARTICIPERA_PAS', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d0215a0e-64bc-54ee-9569-8100c14f8a59', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '1ec94b2d-dfb0-5400-8e05-00f259ccd5aa', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f9abb524-e095-55ad-a7e2-a9f4105884ae', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '422e77a7-ae81-5b28-be87-0e8d9b3c769d', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6722fac0-7b55-5895-8da3-36e31be2b6e5', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'aeb42be6-c8b9-5936-9659-4fc41e322b16', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4b4a145f-1c93-5cfe-9680-d803e00bf950', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '33c4c54d-e3d2-5d47-9fb4-dcac89aabe0e', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3ae80ce0-593a-5580-9186-77721d6b176f', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'b23772fe-a5b2-5037-881f-8de86b35f087', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('950d9edd-7369-56c3-84d9-893ac0a4fbdb', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'f4b29068-7ff9-5610-9ad2-20474998efdd', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('149cd64a-82a1-5611-aaa0-2ecc961ca02a', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'eb601a8f-ae9f-5a99-9b34-ffd994889776', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4544e949-879f-5333-bd4f-6f16c20772cb', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '0d960ead-333b-580a-bf11-faac2d46f590', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('bbecffa1-ed84-5ab9-bab7-fedf6edd52db', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '6b507882-0089-585c-94df-f160023559ef', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e66fbfdb-b59e-5f9a-8048-f619a4ae0c99', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'ef6c88cb-7f71-5f28-b013-f3dc3f90329a', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3c1e135b-dc2c-57e8-b67e-529892f9775f', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '31278c62-d3fb-59c0-b298-877946b40983', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0873f175-2a1b-5395-96b4-5868471579ce', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'd257bd7c-c404-57a1-a4fc-662d31f7a29d', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0a5ceccb-19b4-5e89-876d-181406a21a42', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '3c57b1aa-4676-5875-8440-d925477549d6', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('085c5642-d8f7-5276-9c42-afd2924d3a3d', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '80d38c99-6816-528d-b682-9a6617f4f3a4', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('bb31879c-ed75-5865-9fbb-26c1470a4245', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'dcf23cda-8f49-52ba-af43-69e5ff8a2e6c', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('978ab89e-22a2-5512-a627-6c5fc4ea2382', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '5c97b403-1475-5719-863d-b06958f0ad7b', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5ba838bf-75cf-505b-9a18-0a87334aac51', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('758c0216-1fec-5d96-9dd1-bc02728d0ed9', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'd0540eb7-c40f-5b4d-b71f-67e26f1f2203', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('bab72c3f-443b-56e2-bd5f-2c57f4a70d31', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '74a06960-9dce-51ad-aa8f-af54c468706b', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('135d60b5-dab2-5867-8732-6a90ee99b032', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'dc23b8dd-7e75-583d-a661-962ac846c8b8', 'NE_PARTICIPERA_PAS', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('522df81d-8514-5018-b9d4-1e79a12f19a1', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'b6fcfbae-d362-5ba1-bd18-d5057aea2f8d', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b2074631-ba49-58cf-b2f5-f438a613622c', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '8bc22c03-0373-5d99-a18d-1e1c2d71578c', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('739be2aa-c790-51cb-927b-0df3b456462b', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'ec3fef72-9456-5acc-9639-000d9e507c1a', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a0452b6b-d21e-5de2-a4c7-b4c491beb21c', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '2e3cf9f7-e4c1-523f-be84-d3ac97b3407e', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('abfb2f79-2487-5a2c-868a-cb537b2fa7ec', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '7c7db830-2584-5eac-8dcf-abeb6ca91d55', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('046495cb-8147-5e89-94ba-3593b0136368', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'b58eb7ec-492a-5e00-b7d4-18d3b848066a', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f61e583f-f4d9-527a-bf74-8c8570c1c114', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'e84a9fc0-ca48-5c1a-85e1-f8fce2a9618a', 'NE_PARTICIPERA_PAS', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4ee2e233-073a-5c90-8266-7c7dce461430', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c', 'NE_PARTICIPERA_PAS', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('671255a1-3040-549d-83e7-0d0cc6a20091', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'f2ddf2c7-06e2-56e5-b270-91ff9380f037', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('14e97608-1186-5bba-893d-1331a93a8851', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '1b42620c-c483-53d0-81c2-11af42770c68', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ba8ff4e0-4bf5-5c95-a211-9c44689dc37f', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '85d4ba18-d76f-5c2a-a240-dcf6baabd84c', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('955b1b03-c070-56c5-a0d9-0dec571bff92', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'da6bf8d6-8287-52e0-a118-f9ed2eb61e7a', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d8c84e6a-a793-598c-b734-e12130e2a0a5', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', 'd61f79a6-6b3a-542f-89b1-08d81a347be8', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('edecd1aa-e05a-5af9-aa2a-d84a9f5c7bdb', '197206f3-1aa4-5e94-bd20-00a1b0f247b7', '8c19c881-c56c-5007-92d0-fd9589c41646', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('26d77ebf-94a3-5341-99e1-ad308f17e9a3', 'Visite du chantier du pont de Rufisque', 'Visite du chantier du pont de Rufisque. Un rendez-vous ouvert à toute la communauté EPT. Apportez vos questions : un temps d’échange est prévu.', 'Rufisque',
  date_trunc('day', now()) + interval '12 days' + interval '9 hours',
  date_trunc('day', now()) + interval '12 days' + interval '13 hours',
  'ETUDIANTS', 30, false, 'PUBLIE', 'cdddccef-2bda-5223-ae7d-112ff4b1c9ac', '/api/evenement-images/26d77ebf-94a3-5341-99e1-ad308f17e9a3.jpg', now() - interval '22 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7473f11b-0808-52e6-ab10-6fa97f4ba9c5', '26d77ebf-94a3-5341-99e1-ad308f17e9a3', 'b6fcfbae-d362-5ba1-bd18-d5057aea2f8d', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f7f3fadb-70fd-5d40-bfdd-639d76e91194', '26d77ebf-94a3-5341-99e1-ad308f17e9a3', '31278c62-d3fb-59c0-b298-877946b40983', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7afd2b52-f9bf-5b5d-b711-fa8ae0e1ba20', '26d77ebf-94a3-5341-99e1-ad308f17e9a3', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('df0dc3a6-bbe9-5c33-92f5-708d02b246f3', '26d77ebf-94a3-5341-99e1-ad308f17e9a3', 'ee46384a-c14b-5eec-b37a-a8fb4409d9b7', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9f63eb2a-674c-5e77-af7d-570488de04ba', '26d77ebf-94a3-5341-99e1-ad308f17e9a3', '422e77a7-ae81-5b28-be87-0e8d9b3c769d', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8e2fbd9e-e8d8-5b76-bfdd-6bda0c3651aa', '26d77ebf-94a3-5341-99e1-ad308f17e9a3', 'a04dcec7-743b-55ad-82f2-a4be51bce88c', 'NE_PARTICIPERA_PAS', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('23f7e8d6-778d-5119-a558-99f50dfb69eb', '26d77ebf-94a3-5341-99e1-ad308f17e9a3', 'ec3fef72-9456-5acc-9639-000d9e507c1a', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a1e08545-8913-5c3a-8666-93664ced6fe3', '26d77ebf-94a3-5341-99e1-ad308f17e9a3', 'b23772fe-a5b2-5037-881f-8de86b35f087', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('753366f3-e590-5d9b-a261-512775871b55', '26d77ebf-94a3-5341-99e1-ad308f17e9a3', 'd0540eb7-c40f-5b4d-b71f-67e26f1f2203', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e63e69c4-ffa4-5dd6-af3f-e271d3a67a2c', '26d77ebf-94a3-5341-99e1-ad308f17e9a3', '74a06960-9dce-51ad-aa8f-af54c468706b', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('919f0082-0c89-5c36-a3ce-a9ec694be1c2', '26d77ebf-94a3-5341-99e1-ad308f17e9a3', '3c57b1aa-4676-5875-8440-d925477549d6', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7edabbcf-a841-57a3-aa9d-c7809f30b1c9', '26d77ebf-94a3-5341-99e1-ad308f17e9a3', '8c19c881-c56c-5007-92d0-fd9589c41646', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', 'Tournoi de basket des promotions', 'Tournoi de basket des promotions. Inscrivez-vous rapidement, les places sont limitées. Une collation sera offerte à l’issue de la rencontre.', 'Gymnase de l’EPT',
  date_trunc('day', now()) + interval '-96 days' + interval '10 hours',
  date_trunc('day', now()) + interval '-96 days' + interval '12 hours',
  'TOUS', null, false, 'PUBLIE', 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', '/api/evenement-images/dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a.jpg', now() - interval '106 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('63a0aa7f-12ce-582e-8be5-834e19543349', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', 'd657f819-3789-584f-ab12-f814e2e66008', 'NE_PARTICIPERA_PAS', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7285acee-3ed8-5268-ad87-437b4d24b4fd', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '1ec94b2d-dfb0-5400-8e05-00f259ccd5aa', 'NE_PARTICIPERA_PAS', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('666bb976-af18-5347-80f1-90097e505492', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '89629841-a5b6-5eee-be22-e550bc5d33fb', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('67875b26-d3ac-563c-8ff9-b352e2946a0b', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '2c80d750-a819-5513-b56c-483c3c6d0379', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('098b4ea5-4cc9-5a4c-b73e-1f21686a52c8', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '6b674cd4-406f-546f-aae4-5a78a5d13b31', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('cc18a885-de00-55d7-a758-af1d544c0abe', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', 'dbf4d1a4-103d-5acd-9646-1a3e970d68c0', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('bc0be939-ff51-5bd6-b930-e636c2df14a6', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', 'dc23b8dd-7e75-583d-a661-962ac846c8b8', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b305ee63-828b-57a3-9124-bb3b25e2e456', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0563cc3f-689d-57c2-9c68-b721fe6dc3a6', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', 'd0540eb7-c40f-5b4d-b71f-67e26f1f2203', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d732052a-9313-5848-b694-7a2075d87ec7', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', 'bcceeeec-059e-5229-90b4-15838929d725', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('370f8eb7-37f2-5c73-8581-53587bfad8a6', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '3c57b1aa-4676-5875-8440-d925477549d6', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('09ae26f3-df98-5fc2-bc7d-8926c42319a7', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '2ce655c2-b971-5cdf-8afd-9049eb1b237f', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('250897b1-cfb9-5e65-90c4-5773c023b79c', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '8c19c881-c56c-5007-92d0-fd9589c41646', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a5303cdc-c994-5371-a952-ae37121aa416', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('32439e4c-fd50-5ac9-b1f7-47dd0c05422f', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', 'ead565a2-323e-591b-84d0-8db8bda4c57b', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1d261ab2-473e-5119-a409-8118f9dbc057', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '5c97b403-1475-5719-863d-b06958f0ad7b', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ecb893ca-d11c-54c7-9d8c-0f554f6d8739', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '58bf6984-dbbe-5b82-afe6-3f8c58a1be77', 'NE_PARTICIPERA_PAS', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('66c2945d-8505-55f8-96b3-fda425fe7165', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', 'ec3fef72-9456-5acc-9639-000d9e507c1a', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3ca86626-53ef-5cbe-865d-f343572bcaa5', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', 'a079f292-6780-5517-9501-9a0439c347a7', 'NE_PARTICIPERA_PAS', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5eecea7d-3beb-5ba8-b51f-d27a7b196dea', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', 'NE_PARTICIPERA_PAS', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('eead21d6-30c4-5bdc-a3f4-81b8bfa0338c', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5005af5b-aabb-5d72-a5e0-c5b0a236696e', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '75d14361-a9af-5dd6-a9d0-d5bf9d20fa32', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('de5a86d2-826d-519b-801a-f64e45aabe89', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '848f10d0-ecf4-597a-9bb8-a4a950cf2294', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4cc3bd66-0bd6-5018-b3af-2c65e0f17723', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', 'f2ddf2c7-06e2-56e5-b270-91ff9380f037', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4bba4a59-b57f-55cc-96ee-2b20c4b49d7e', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '29191454-c4cc-5485-9e68-e24aad0ba23f', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7abb2758-1166-51e0-8948-8503f3d6619d', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '7a73d349-98d3-5966-9d16-3da7f3700741', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4e872313-d003-56f3-a75d-cdef8bcff362', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '0834d43d-bb9f-5abd-9029-916c63c2ae11', 'NE_PARTICIPERA_PAS', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0c8d18d0-720c-5e1e-af84-762314e4ea00', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', 'ff940591-a6e2-520f-b5b1-b130755c3279', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a0db78db-4d26-5518-bc4c-ff4207574d9d', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', '8d7ce8d8-e167-529b-be7e-4d8fd645a8fe', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9eb471ea-3ce6-5c88-ba03-0b5e68fc3549', 'dc0dcda1-dc7f-5c72-a6e3-5246cbbec65a', 'aa9de02b-b819-5dcb-9fed-e994479e6b7f', 'NE_PARTICIPERA_PAS', now() - interval '4 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('ff56635f-2993-52f7-9074-7f8eecb9b0d2', 'Soirée des 30 ans de l’association des diplômés', 'Soirée des 30 ans de l’association des diplômés. Inscrivez-vous rapidement, les places sont limitées. Une collation sera offerte à l’issue de la rencontre.', 'Hôtel Radisson, Dakar',
  date_trunc('day', now()) + interval '3 days' + interval '14 hours',
  date_trunc('day', now()) + interval '3 days' + interval '18 hours',
  'ALUMNI', 180, true, 'PUBLIE', '8bc22c03-0373-5d99-a18d-1e1c2d71578c', '/api/evenement-images/ff56635f-2993-52f7-9074-7f8eecb9b0d2.jpg', now() - interval '13 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5ca2158c-93a6-5d89-8745-208fb9cd05a2', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', 'c2e25360-dece-5880-89c5-b86ba7ded0e3', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('50177a09-d2b7-5ca1-9fcc-3e7e2b2f1912', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('eb65260e-9376-5c87-8af5-8254dbdeb130', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', 'NE_PARTICIPERA_PAS', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d5167e22-f151-5b65-bbc3-befad0eaefee', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '58a64778-e962-5167-9c0b-5216c2e855d6', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0855c94a-a67a-538b-85e1-c1b0f09eab71', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '95f0f598-aeda-59f7-8df3-e74bd10dc64d', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5d569009-c770-55bb-bd63-d8bf1f989386', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '4bcb274c-796b-59c3-834f-5e321bfcd580', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('14650cc5-30e1-5197-a0b6-638e2efef5a7', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '9f088eb6-0059-5cec-a0f2-d8cd281a702d', 'NE_PARTICIPERA_PAS', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4d807c6a-d861-5067-9d3e-5542ba8dc3f7', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '32139e9c-9e23-5367-a1f4-8446a769fc85', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('771e57cb-a3aa-5935-8d17-62d422a53ec9', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', 'b58eb7ec-492a-5e00-b7d4-18d3b848066a', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1a9225f0-c971-5fad-850d-51d078cdc390', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '93d2ab4b-627f-581f-a8e5-c9e3ba3cb819', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('12b45408-2c2e-5f89-af5e-e7a1691b8896', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '2ad470a2-5a14-59b3-b5b2-531d823f53b3', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7ddc7116-d759-5ea9-b51d-230109c72a46', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '03017916-9ccb-5538-bf6a-e8b136545408', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('060bc150-4c89-5bb0-84b5-54934fe7aeca', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '6140551c-046e-5ae3-a2d5-7a9d63de1fc1', 'NE_PARTICIPERA_PAS', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8bcf6297-cbed-5f72-84d1-a1d5569fc57f', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '74a06960-9dce-51ad-aa8f-af54c468706b', 'NE_PARTICIPERA_PAS', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0e637002-89e8-5de7-b22f-18422c1f3c52', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '6fa62627-bf15-591d-8334-e0939916dc4f', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6262371e-756d-584d-9190-32b6068bdd35', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', 'ead565a2-323e-591b-84d0-8db8bda4c57b', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5cb681fb-6da4-5563-97aa-1cb5f2f4ef9e', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '4a73bb2a-d738-5997-a201-df09d1c31953', 'NE_PARTICIPERA_PAS', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5a67086e-a432-5954-a600-2da805eda451', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '89629841-a5b6-5eee-be22-e550bc5d33fb', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('abc61eac-db1e-53a7-8fa9-52342c2ba530', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '760ed432-29c6-5dad-9d2d-ec90276f6f75', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('53dba9dc-c61f-5790-b208-862ec31acacf', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '1ec94b2d-dfb0-5400-8e05-00f259ccd5aa', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('86b89dfb-8357-5895-857a-6d0b8e255896', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', 'bcceeeec-059e-5229-90b4-15838929d725', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('45b5d4f0-a2c5-5802-a6cc-34eeb10ca200', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', 'd634be2e-9272-5970-944b-55be40fef00b', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('72113de0-91f7-5015-9a28-fc6e53c341ab', 'ff56635f-2993-52f7-9074-7f8eecb9b0d2', '102b12e7-e8a2-59dc-9b3a-ab365bac18c2', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('f225f98f-25cd-578e-87af-41385d093151', 'Webinaire : faire carrière dans les télécoms', 'Webinaire : faire carrière dans les télécoms. Un rendez-vous ouvert à toute la communauté EPT. Le programme détaillé sera envoyé aux inscrits.', 'En ligne',
  date_trunc('day', now()) + interval '73 days' + interval '9 hours',
  date_trunc('day', now()) + interval '73 days' + interval '15 hours',
  'TOUS', null, false, 'PUBLIE', 'a079f292-6780-5517-9501-9a0439c347a7', '/api/evenement-images/f225f98f-25cd-578e-87af-41385d093151.jpg', now() - interval '83 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4939bda9-4afd-523d-b43d-d7db9ec8de42', 'f225f98f-25cd-578e-87af-41385d093151', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('38430013-982c-5ad7-b361-e376a976762f', 'f225f98f-25cd-578e-87af-41385d093151', '2dff725c-6ec3-5b75-b826-d333f238f88f', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2b9a01a9-4d98-54bb-bcdc-e95c18a1bb27', 'f225f98f-25cd-578e-87af-41385d093151', 'aa9de02b-b819-5dcb-9fed-e994479e6b7f', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('763126d8-3de7-5e9a-a77b-aa12ab1f258e', 'f225f98f-25cd-578e-87af-41385d093151', 'f604100c-50ad-5847-9b95-008b78aea6a1', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1fa94058-afb6-5f71-9640-105863d17583', 'f225f98f-25cd-578e-87af-41385d093151', '9f088eb6-0059-5cec-a0f2-d8cd281a702d', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3c20cf8f-5cd2-58de-9cb4-2f48ef3f968e', 'f225f98f-25cd-578e-87af-41385d093151', '4a73bb2a-d738-5997-a201-df09d1c31953', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('04697b5e-e0b4-54a5-a61b-491284901695', 'f225f98f-25cd-578e-87af-41385d093151', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', 'NE_PARTICIPERA_PAS', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8e3b9c4c-79a9-51fa-bcdc-7c041b07a6f1', 'f225f98f-25cd-578e-87af-41385d093151', '03017916-9ccb-5538-bf6a-e8b136545408', 'NE_PARTICIPERA_PAS', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('31a00d24-e9f1-54f5-8b70-6957677cae15', 'f225f98f-25cd-578e-87af-41385d093151', 'c66385a9-2e09-5478-9f8f-e2556567191f', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0050cec3-c36d-5517-82e1-124f4b1c684d', 'f225f98f-25cd-578e-87af-41385d093151', 'a04dcec7-743b-55ad-82f2-a4be51bce88c', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b75c3ebf-6a72-5708-8d12-5aed7520628e', 'f225f98f-25cd-578e-87af-41385d093151', 'fd2abcc5-5026-56f8-9739-ad5c6994612f', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('46f04290-2e28-5ee7-b39a-87cbc2e1be0b', 'f225f98f-25cd-578e-87af-41385d093151', '102b12e7-e8a2-59dc-9b3a-ab365bac18c2', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e84bafd3-149d-532a-9e82-6af35baa3b59', 'f225f98f-25cd-578e-87af-41385d093151', 'a079f292-6780-5517-9501-9a0439c347a7', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8a4f72e4-424c-5f5c-a789-c24a75f9620c', 'f225f98f-25cd-578e-87af-41385d093151', 'fc943673-dd44-5e31-bd35-82def3570012', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('bb6ff353-a8e8-5fa0-881e-5f0cfaa786ac', 'f225f98f-25cd-578e-87af-41385d093151', 'dcf23cda-8f49-52ba-af43-69e5ff8a2e6c', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6f505b7a-b874-537a-a355-74ffe6e31930', 'f225f98f-25cd-578e-87af-41385d093151', 'f88aefc3-5aef-5b0b-b217-82182448e43e', 'NE_PARTICIPERA_PAS', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('09848f20-6470-5b2a-92b4-703c870e3977', 'f225f98f-25cd-578e-87af-41385d093151', '4ef34c8c-1ebb-5b2d-9f8b-e1dea623166b', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3b907632-b2f8-5d37-8af3-54c21ec0d8fe', 'f225f98f-25cd-578e-87af-41385d093151', '235c7b1c-4170-52c0-9469-475b0210cb78', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('267aae38-f049-54d6-95e2-59043a936e67', 'f225f98f-25cd-578e-87af-41385d093151', '29191454-c4cc-5485-9e68-e24aad0ba23f', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('bad808ba-39e1-562b-8653-ae7f35434eb6', 'f225f98f-25cd-578e-87af-41385d093151', '58529a43-d7de-50da-887d-0d7a51fb5929', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1ff6ab00-591a-5433-8c75-4a8cade2bafc', 'f225f98f-25cd-578e-87af-41385d093151', '263ad97e-9911-56e5-90a2-f2ab0d88ddf2', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0141c448-f0df-5f28-9ddf-721ce077d0fc', 'f225f98f-25cd-578e-87af-41385d093151', '80d38c99-6816-528d-b682-9a6617f4f3a4', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f3647ac8-3231-5aa2-afbf-0a075888d83f', 'f225f98f-25cd-578e-87af-41385d093151', 'b6fcfbae-d362-5ba1-bd18-d5057aea2f8d', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('0924d80f-3c27-5153-8266-c4d51e823685', 'Hackathon énergie et climat', 'Hackathon énergie et climat. Un rendez-vous ouvert à toute la communauté EPT. Le programme détaillé sera envoyé aux inscrits.', 'Dakar Cloud Services, Point E',
  date_trunc('day', now()) + interval '-82 days' + interval '18 hours',
  date_trunc('day', now()) + interval '-82 days' + interval '21 hours',
  'TOUS', 60, false, 'PUBLIE', '4bcb274c-796b-59c3-834f-5e321bfcd580', '/api/evenement-images/0924d80f-3c27-5153-8266-c4d51e823685.jpg', now() - interval '92 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8ae03a93-e0f5-5283-88a2-c66b19805c71', '0924d80f-3c27-5153-8266-c4d51e823685', '0834d43d-bb9f-5abd-9029-916c63c2ae11', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8e70fa51-8580-55b3-b44d-eacade545647', '0924d80f-3c27-5153-8266-c4d51e823685', 'bcceeeec-059e-5229-90b4-15838929d725', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('764b257b-4389-59bd-bd3b-bb16b67dda99', '0924d80f-3c27-5153-8266-c4d51e823685', 'fc943673-dd44-5e31-bd35-82def3570012', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('46c8cc1e-a0d7-5a45-91ee-d467ed042233', '0924d80f-3c27-5153-8266-c4d51e823685', 'b58eb7ec-492a-5e00-b7d4-18d3b848066a', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a437e456-f960-5bdc-88b8-92294cd5b6ea', '0924d80f-3c27-5153-8266-c4d51e823685', 'cd98b0b9-9e1d-5f1e-a7ae-933f51e45989', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('39270d0e-c2e8-5e54-be7d-c8e7898751ca', '0924d80f-3c27-5153-8266-c4d51e823685', 'db11a9f9-a998-50ee-9a16-dba7266089bb', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('759fee59-f3af-5754-866a-ca6fa3ef5247', '0924d80f-3c27-5153-8266-c4d51e823685', 'a1337834-0187-5899-b8bf-5fd74cd1d75b', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d9eb3bc7-9404-5f02-8677-204738d8c9f0', '0924d80f-3c27-5153-8266-c4d51e823685', '6b507882-0089-585c-94df-f160023559ef', 'NE_PARTICIPERA_PAS', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('aa068d9c-c812-5f12-bf16-4d60260b979e', '0924d80f-3c27-5153-8266-c4d51e823685', 'a356c8fe-aad9-58e3-bfc2-29bca745f15a', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0d393310-4513-5821-aee2-e75c08724636', '0924d80f-3c27-5153-8266-c4d51e823685', 'd657f819-3789-584f-ab12-f814e2e66008', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7ac5ba4b-b2c5-537c-86b5-43c877000fdc', '0924d80f-3c27-5153-8266-c4d51e823685', 'a69bb100-a789-56a8-860d-1a65c7f840eb', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('83d449df-03ac-5233-8267-b313be94f3c2', '0924d80f-3c27-5153-8266-c4d51e823685', 'aeb42be6-c8b9-5936-9659-4fc41e322b16', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b01fceb1-f6bf-5dad-851d-82da0e67f9df', '0924d80f-3c27-5153-8266-c4d51e823685', '4bcb274c-796b-59c3-834f-5e321bfcd580', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('62fec837-dc2a-51df-8188-1957a4b7b313', '0924d80f-3c27-5153-8266-c4d51e823685', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('53471cfc-0198-570e-8b06-492a0fc8f337', '0924d80f-3c27-5153-8266-c4d51e823685', 'e26b8671-16eb-54b9-b11f-ed3f99a912f5', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0fef9f0f-320a-52a0-bdae-73df06985526', '0924d80f-3c27-5153-8266-c4d51e823685', '58529a43-d7de-50da-887d-0d7a51fb5929', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('46e3c527-bc3f-5a5b-a089-0bce0e12223b', '0924d80f-3c27-5153-8266-c4d51e823685', 'e30df4e3-580d-5f8a-9ec9-5d29165f5ea3', 'NE_PARTICIPERA_PAS', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('64a05504-a0d7-522d-8348-d02261fd82f8', '0924d80f-3c27-5153-8266-c4d51e823685', '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', 'NE_PARTICIPERA_PAS', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a2fe4f49-2104-50e0-bd4f-80947ee252b1', '0924d80f-3c27-5153-8266-c4d51e823685', 'b6fcfbae-d362-5ba1-bd18-d5057aea2f8d', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('da31610d-d63c-52ab-8fc2-667030682600', '0924d80f-3c27-5153-8266-c4d51e823685', 'ba62afaa-e97b-5dfd-b99f-cc115508f551', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('de9a8556-4bde-5ccf-aeea-ac189ba2b8a6', '0924d80f-3c27-5153-8266-c4d51e823685', '2e3cf9f7-e4c1-523f-be84-d3ac97b3407e', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('494613d3-620e-5b5b-80a8-a4b5203aa735', '0924d80f-3c27-5153-8266-c4d51e823685', '95baa7f1-b8e2-574d-93a4-6e67ae22b3fa', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0797ecb5-65c2-5da5-ae4e-91d351793c71', '0924d80f-3c27-5153-8266-c4d51e823685', '6fa62627-bf15-591d-8334-e0939916dc4f', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('00dcbbf2-ee87-5377-ad3e-07016c0974ac', '0924d80f-3c27-5153-8266-c4d51e823685', 'ff940591-a6e2-520f-b5b1-b130755c3279', 'NE_PARTICIPERA_PAS', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4407051b-30ed-502a-ae69-36287c8ba5e2', '0924d80f-3c27-5153-8266-c4d51e823685', 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', 'NE_PARTICIPERA_PAS', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('71384297-fa0d-552f-9e38-41a7137991a5', '0924d80f-3c27-5153-8266-c4d51e823685', '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7f1eabb3-e877-54ea-8773-d6b3032f215c', '0924d80f-3c27-5153-8266-c4d51e823685', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('02c77b63-2ed7-5578-b21a-c11d5951ec57', '0924d80f-3c27-5153-8266-c4d51e823685', '577385a3-9946-557b-be83-a8afaf69835f', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8912fde2-a752-5cb8-9c9c-cc32fb418bb9', '0924d80f-3c27-5153-8266-c4d51e823685', 'd61f79a6-6b3a-542f-89b1-08d81a347be8', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1c39aeaa-ab42-52fe-939c-5c7dd874a4c6', '0924d80f-3c27-5153-8266-c4d51e823685', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4d1d7763-a0e4-5af2-8b98-2783a87341e7', '0924d80f-3c27-5153-8266-c4d51e823685', 'ead565a2-323e-591b-84d0-8db8bda4c57b', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f6cd3312-d99f-5e8f-bd80-45ecb32e15fe', '0924d80f-3c27-5153-8266-c4d51e823685', '8c19c881-c56c-5007-92d0-fd9589c41646', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('01146f21-3cc1-5993-9f3c-24f4aa03d20f', '0924d80f-3c27-5153-8266-c4d51e823685', '5c97b403-1475-5719-863d-b06958f0ad7b', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b26c7cda-d930-5c1f-b9d1-9ddcc2644b69', '0924d80f-3c27-5153-8266-c4d51e823685', '58bf6984-dbbe-5b82-afe6-3f8c58a1be77', 'NE_PARTICIPERA_PAS', now() - interval '16 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('e55d0ced-2bca-5430-aad0-e908725a6503', 'Afterwork des ingénieurs de Thiès', 'Afterwork des ingénieurs de Thiès. Un rendez-vous ouvert à toute la communauté EPT. Apportez vos questions : un temps d’échange est prévu.', 'Thiès, Escale',
  date_trunc('day', now()) + interval '51 days' + interval '18 hours',
  date_trunc('day', now()) + interval '51 days' + interval '21 hours',
  'ALUMNI', 40, false, 'PUBLIE', '58a64778-e962-5167-9c0b-5216c2e855d6', '/api/evenement-images/e55d0ced-2bca-5430-aad0-e908725a6503.jpg', now() - interval '61 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a7dc9e90-1b7a-568b-bd07-0c72146dec30', 'e55d0ced-2bca-5430-aad0-e908725a6503', '4a73bb2a-d738-5997-a201-df09d1c31953', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3632fe77-1921-5a58-87a6-6376012accb8', 'e55d0ced-2bca-5430-aad0-e908725a6503', '2b34d94e-66b2-5292-8f66-8cde42ae3106', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0bcfc1bf-d00b-5eb2-bb71-71bfdbecbe37', 'e55d0ced-2bca-5430-aad0-e908725a6503', 'bcceeeec-059e-5229-90b4-15838929d725', 'NE_PARTICIPERA_PAS', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2e74eef4-3ffd-5457-9e88-0f96616da501', 'e55d0ced-2bca-5430-aad0-e908725a6503', '263ad97e-9911-56e5-90a2-f2ab0d88ddf2', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d453e3e5-1771-5e7b-9164-e707944f974c', 'e55d0ced-2bca-5430-aad0-e908725a6503', '2ce655c2-b971-5cdf-8afd-9049eb1b237f', 'NE_PARTICIPERA_PAS', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fced7979-7e3c-50a4-82a0-4d5527df338f', 'e55d0ced-2bca-5430-aad0-e908725a6503', '1a1ae694-fc50-5757-931c-51ac8bbdcfc5', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fd015d46-3ccb-5885-8887-d21345b15511', 'e55d0ced-2bca-5430-aad0-e908725a6503', '4ef34c8c-1ebb-5b2d-9f8b-e1dea623166b', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4edd3f3d-5700-51ec-9763-ce3f4dcaba0b', 'e55d0ced-2bca-5430-aad0-e908725a6503', '0834d43d-bb9f-5abd-9029-916c63c2ae11', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f3df9d8b-e5b9-571c-aa37-4f97b559bcd6', 'e55d0ced-2bca-5430-aad0-e908725a6503', '8bc22c03-0373-5d99-a18d-1e1c2d71578c', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('667d99bd-4a31-59fc-8f75-a45ae1cdcc49', 'e55d0ced-2bca-5430-aad0-e908725a6503', 'c2e25360-dece-5880-89c5-b86ba7ded0e3', 'NE_PARTICIPERA_PAS', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('024ce8d3-db6e-5569-909a-48f9d8a89cb8', 'e55d0ced-2bca-5430-aad0-e908725a6503', 'ba62afaa-e97b-5dfd-b99f-cc115508f551', 'NE_PARTICIPERA_PAS', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fe7e91df-d9b1-5bdb-93b1-cbe69954d009', 'e55d0ced-2bca-5430-aad0-e908725a6503', '8670e440-184b-5365-9e7b-3e0c983658b4', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('262b95bf-bd63-5377-af84-7f20fa85c99b', 'e55d0ced-2bca-5430-aad0-e908725a6503', 'ff940591-a6e2-520f-b5b1-b130755c3279', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ed46cb5c-b027-581e-b8d7-2c36ccbb7f02', 'e55d0ced-2bca-5430-aad0-e908725a6503', '2dff725c-6ec3-5b75-b826-d333f238f88f', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('88813b89-dec7-59c5-bffc-3307c93ae2f7', 'e55d0ced-2bca-5430-aad0-e908725a6503', '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('05c59eb2-0d88-5668-8536-213a3ae399d9', 'e55d0ced-2bca-5430-aad0-e908725a6503', '8f0a4694-dbd7-56ef-8a66-f9b0169504e8', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c2df9f1c-24f8-504c-9a70-b8283a0bc87d', 'e55d0ced-2bca-5430-aad0-e908725a6503', 'f88aefc3-5aef-5b0b-b217-82182448e43e', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('acd1f392-a24e-5149-9c34-17b02af59173', 'e55d0ced-2bca-5430-aad0-e908725a6503', '95f0f598-aeda-59f7-8df3-e74bd10dc64d', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('cf39e9b1-7409-52cb-a649-62963f460299', 'e55d0ced-2bca-5430-aad0-e908725a6503', '945626e0-cf07-5ff9-8f88-c99c26151b4f', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c7664f5a-9538-516f-8897-5f01a159f82c', 'e55d0ced-2bca-5430-aad0-e908725a6503', '58a64778-e962-5167-9c0b-5216c2e855d6', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('098cc448-6808-530c-bf7f-a8bb722edc25', 'e55d0ced-2bca-5430-aad0-e908725a6503', '524f58bf-88b0-5678-a632-98804ad9226c', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('693cb4d3-e098-511e-bc62-af307f1d75ce', 'e55d0ced-2bca-5430-aad0-e908725a6503', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1876e60f-dc9e-586b-b2a2-e2643be92051', 'e55d0ced-2bca-5430-aad0-e908725a6503', 'd61f79a6-6b3a-542f-89b1-08d81a347be8', 'NE_PARTICIPERA_PAS', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9285e66e-bd08-5010-9ae8-01a69e73adf5', 'e55d0ced-2bca-5430-aad0-e908725a6503', '95baa7f1-b8e2-574d-93a4-6e67ae22b3fa', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8b2ed001-fdf6-5ae7-91d3-bcc712d87730', 'e55d0ced-2bca-5430-aad0-e908725a6503', '32139e9c-9e23-5367-a1f4-8446a769fc85', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f75de07c-435c-5410-ba59-eeca3930306c', 'e55d0ced-2bca-5430-aad0-e908725a6503', 'a0363ce2-7f2e-5b3c-94c4-2f3a7a94d0ca', 'NE_PARTICIPERA_PAS', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ecdec1c9-14bd-56ac-90ce-52be836eed76', 'e55d0ced-2bca-5430-aad0-e908725a6503', 'fee119d8-46ac-5ea5-995c-bd2becc002ae', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('710dbd79-e660-5422-ad87-cebc101c0fb8', 'e55d0ced-2bca-5430-aad0-e908725a6503', '235c7b1c-4170-52c0-9469-475b0210cb78', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('39ad9146-10ce-5c87-b426-a7f462824315', 'e55d0ced-2bca-5430-aad0-e908725a6503', '1ec94b2d-dfb0-5400-8e05-00f259ccd5aa', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0222c76c-af31-513a-85b6-b7904db85f8e', 'e55d0ced-2bca-5430-aad0-e908725a6503', 'a1337834-0187-5899-b8bf-5fd74cd1d75b', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9f18b8c7-58ee-5625-a933-5ad993040b0b', 'e55d0ced-2bca-5430-aad0-e908725a6503', 'dc23b8dd-7e75-583d-a661-962ac846c8b8', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('62b5d455-ff41-5621-be35-097abd3e51c2', 'e55d0ced-2bca-5430-aad0-e908725a6503', 'db11a9f9-a998-50ee-9a16-dba7266089bb', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9682e803-d79d-5333-b589-0481591c8754', 'e55d0ced-2bca-5430-aad0-e908725a6503', '6c56f510-f428-5542-8194-1dedc960b84e', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('bd403d0f-bf73-5d22-a675-007ade85136a', 'e55d0ced-2bca-5430-aad0-e908725a6503', 'ef763dcf-06b8-5e9b-a1a2-97877c358ff2', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('11a719f3-b902-55ca-84d5-c6d87806acac', 'e55d0ced-2bca-5430-aad0-e908725a6503', '58529a43-d7de-50da-887d-0d7a51fb5929', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e204a874-dbf5-59cb-923f-ae08f02b078d', 'e55d0ced-2bca-5430-aad0-e908725a6503', '8d7ce8d8-e167-529b-be7e-4d8fd645a8fe', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0f5e4a09-8163-5889-928a-88240fc16dbc', 'e55d0ced-2bca-5430-aad0-e908725a6503', '804935f3-67f5-5246-a0a0-1db7119996d7', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('0c5463b3-1a1a-508f-bcd2-63664c01bb33', 'Journée portes ouvertes de l’EPT', 'Journée portes ouvertes de l’EPT. Inscrivez-vous rapidement, les places sont limitées. Apportez vos questions : un temps d’échange est prévu.', 'Campus de l’EPT',
  date_trunc('day', now()) + interval '38 days' + interval '15 hours',
  date_trunc('day', now()) + interval '38 days' + interval '17 hours',
  'TOUS', 500, true, 'PUBLIE', 'dc23b8dd-7e75-583d-a661-962ac846c8b8', '/api/evenement-images/0c5463b3-1a1a-508f-bcd2-63664c01bb33.jpg', now() - interval '48 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('baa732c6-30b5-5577-b71f-d70e8b69f790', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', 'b6fcfbae-d362-5ba1-bd18-d5057aea2f8d', 'NE_PARTICIPERA_PAS', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d3e829bd-773f-513d-b083-3589f7695047', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '74a06960-9dce-51ad-aa8f-af54c468706b', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b1b0be68-0414-5fa7-b63b-bd8eec6f1d0c', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '804935f3-67f5-5246-a0a0-1db7119996d7', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3ee04b9a-9f28-5292-94e1-b960df291188', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '3c57b1aa-4676-5875-8440-d925477549d6', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('960a63a6-2cdf-5d76-8a5c-c21cf3d6db67', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '2dff725c-6ec3-5b75-b826-d333f238f88f', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('599a0c4d-e90d-5fc6-8559-dc9733e4346a', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '422e77a7-ae81-5b28-be87-0e8d9b3c769d', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d2dda1d5-5ffc-5fde-92e7-14baf35c11ce', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '0834d43d-bb9f-5abd-9029-916c63c2ae11', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fea2e0c9-df67-5889-9804-5ecda7cdcdaa', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', 'db11a9f9-a998-50ee-9a16-dba7266089bb', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('94ccf606-1b14-54e3-8738-8d38125760d5', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', 'f88aefc3-5aef-5b0b-b217-82182448e43e', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('169f17ec-3fbe-5575-b2f7-8e366be4612b', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', 'd257bd7c-c404-57a1-a4fc-662d31f7a29d', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('581f7c33-6b74-5417-b7ed-be1680b240f4', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '31278c62-d3fb-59c0-b298-877946b40983', 'NE_PARTICIPERA_PAS', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e34cc6e0-d629-5b91-a8e9-1f639818885c', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '0efa151b-4536-5acd-98b8-9e62cd5042c5', 'NE_PARTICIPERA_PAS', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('baea955b-6cb2-58e5-99d9-b0e205b22208', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '95f0f598-aeda-59f7-8df3-e74bd10dc64d', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d7ec408a-82e5-5730-a0f9-2c1e7d0b5921', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', 'ead565a2-323e-591b-84d0-8db8bda4c57b', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8f51e6ca-38af-5fc8-9105-3ec9625718ae', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', 'd0540eb7-c40f-5b4d-b71f-67e26f1f2203', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('75e3bced-bf27-50a1-8bf4-1b06df325fa9', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '6fa62627-bf15-591d-8334-e0939916dc4f', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1a0d8472-614b-5312-be6f-2be4a0a013d6', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '75d14361-a9af-5dd6-a9d0-d5bf9d20fa32', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('12cbbe74-9b23-502a-aeea-8d8f303957f4', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', 'd657f819-3789-584f-ab12-f814e2e66008', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8d427ee3-d404-5a88-b4e3-02327ac609ec', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', 'fd2abcc5-5026-56f8-9739-ad5c6994612f', 'NE_PARTICIPERA_PAS', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9394f56b-f452-51bb-b215-0274e9047092', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ad8d8c19-0764-54c2-9071-74716138d893', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '0d960ead-333b-580a-bf11-faac2d46f590', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5666e98f-1f78-5d8c-8b1e-860d32650aed', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('64858975-e186-5248-aec7-6186f2118f34', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '6b674cd4-406f-546f-aae4-5a78a5d13b31', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('922a89b9-22b5-5720-bdc5-e1a1391e3e42', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '03017916-9ccb-5538-bf6a-e8b136545408', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f66bbbcb-a417-574e-86b3-b958db9f6ac1', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', 'a079f292-6780-5517-9501-9a0439c347a7', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('08dc40b4-d3cd-5fcc-b3e3-7494a64b4f35', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d12ddfe9-694f-56f0-85f2-f478c855d1f2', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', 'e84a9fc0-ca48-5c1a-85e1-f8fce2a9618a', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b577a8d6-acba-56a1-9611-d1b740d93810', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', 'b23772fe-a5b2-5037-881f-8de86b35f087', 'NE_PARTICIPERA_PAS', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0cc67df1-1f80-548c-a81e-e2ccb18c0f5a', '0c5463b3-1a1a-508f-bcd2-63664c01bb33', '25ff0193-529a-5f33-b609-c64f82d415b3', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('2b71b840-15e2-55af-b2a0-12cec919c2d7', 'Visite de la cimenterie de Bargny', 'Visite de la cimenterie de Bargny. Un moment d’échange entre diplômés, étudiants et partenaires. Une collation sera offerte à l’issue de la rencontre.', 'Bargny',
  date_trunc('day', now()) + interval '23 days' + interval '9 hours',
  date_trunc('day', now()) + interval '23 days' + interval '11 hours',
  'ETUDIANTS', 25, false, 'PUBLIE', '2dff725c-6ec3-5b75-b826-d333f238f88f', '/api/evenement-images/2b71b840-15e2-55af-b2a0-12cec919c2d7.jpg', now() - interval '33 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2ac454f8-7666-5837-be1a-c66ff17ba1f5', '2b71b840-15e2-55af-b2a0-12cec919c2d7', 'fc943673-dd44-5e31-bd35-82def3570012', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('410cd777-bd64-5fcd-98f5-b23f07f524d9', '2b71b840-15e2-55af-b2a0-12cec919c2d7', '6b507882-0089-585c-94df-f160023559ef', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e580de8b-0bae-514c-bb6c-5f459bc3dc6a', '2b71b840-15e2-55af-b2a0-12cec919c2d7', '1b42620c-c483-53d0-81c2-11af42770c68', 'NE_PARTICIPERA_PAS', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('21f7dcb2-f2fa-5ebd-af22-96dffef4e402', '2b71b840-15e2-55af-b2a0-12cec919c2d7', '25ff0193-529a-5f33-b609-c64f82d415b3', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c4fed6a4-c30f-5bf4-bb60-6af0d735da94', '2b71b840-15e2-55af-b2a0-12cec919c2d7', '0d960ead-333b-580a-bf11-faac2d46f590', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6ba2e619-5cb8-5310-9d7b-51479ea10536', '2b71b840-15e2-55af-b2a0-12cec919c2d7', '8c19c881-c56c-5007-92d0-fd9589c41646', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0f8e83b5-8a62-54c9-8258-5522dc4272fb', '2b71b840-15e2-55af-b2a0-12cec919c2d7', 'd95c2e6e-2b83-501b-9ac4-49a06f4029bc', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('10c1567c-e7fe-53b8-8c3b-a342a0f25d9f', '2b71b840-15e2-55af-b2a0-12cec919c2d7', 'd0540eb7-c40f-5b4d-b71f-67e26f1f2203', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8a389452-9360-5280-a2b6-6916f1690018', '2b71b840-15e2-55af-b2a0-12cec919c2d7', 'b23772fe-a5b2-5037-881f-8de86b35f087', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('bb06c2d1-c572-53d8-bd43-a3465616fad0', '2b71b840-15e2-55af-b2a0-12cec919c2d7', '1ec94b2d-dfb0-5400-8e05-00f259ccd5aa', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('01cd7d1b-3e76-5971-a85a-fae95cec66bb', '2b71b840-15e2-55af-b2a0-12cec919c2d7', 'c66385a9-2e09-5478-9f8f-e2556567191f', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6f73571e-3743-56f9-91eb-2c860f3e1ab8', '2b71b840-15e2-55af-b2a0-12cec919c2d7', 'd4575e51-15e5-5732-9202-060f7c776e6f', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6167f71f-7c5d-5efc-8f95-9918a4b6039a', '2b71b840-15e2-55af-b2a0-12cec919c2d7', '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('616f5b2e-6e79-5062-9681-2b85cb2e4133', 'Atelier LinkedIn et marque professionnelle', 'Atelier LinkedIn et marque professionnelle. Un moment d’échange entre diplômés, étudiants et partenaires. Une collation sera offerte à l’issue de la rencontre.', 'En ligne',
  date_trunc('day', now()) + interval '-81 days' + interval '9 hours',
  date_trunc('day', now()) + interval '-81 days' + interval '11 hours',
  'TOUS', 100, false, 'PUBLIE', '2b34d94e-66b2-5292-8f66-8cde42ae3106', '/api/evenement-images/616f5b2e-6e79-5062-9681-2b85cb2e4133.jpg', now() - interval '91 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('23729207-c9e7-5d65-9990-db4b821da6f6', '616f5b2e-6e79-5062-9681-2b85cb2e4133', '6b507882-0089-585c-94df-f160023559ef', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6d976a8a-126e-515f-945e-980e6ecd683d', '616f5b2e-6e79-5062-9681-2b85cb2e4133', '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('dc30981b-a10e-591a-b4a6-62c82c901e57', '616f5b2e-6e79-5062-9681-2b85cb2e4133', 'fce07ac1-1fa2-5929-b89b-f38df176c1d1', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('872c29bd-98e0-50cc-85a7-22749692911f', '616f5b2e-6e79-5062-9681-2b85cb2e4133', 'f2ddf2c7-06e2-56e5-b270-91ff9380f037', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6cc6fc71-9248-5da3-bd4a-c856d4cd0cff', '616f5b2e-6e79-5062-9681-2b85cb2e4133', 'cd98b0b9-9e1d-5f1e-a7ae-933f51e45989', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('cc47cf87-733d-5705-9925-914f951d723e', '616f5b2e-6e79-5062-9681-2b85cb2e4133', 'aa9de02b-b819-5dcb-9fed-e994479e6b7f', 'NE_PARTICIPERA_PAS', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b1113673-629b-5e0d-b696-14b07a6b30e1', '616f5b2e-6e79-5062-9681-2b85cb2e4133', 'b23772fe-a5b2-5037-881f-8de86b35f087', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('cd9422d9-3cf0-5383-9144-12d2be608427', '616f5b2e-6e79-5062-9681-2b85cb2e4133', 'dc23b8dd-7e75-583d-a661-962ac846c8b8', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('79813add-229f-5824-99e6-26d687820eff', '616f5b2e-6e79-5062-9681-2b85cb2e4133', 'b6fcfbae-d362-5ba1-bd18-d5057aea2f8d', 'NE_PARTICIPERA_PAS', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0febbdfa-d021-5d76-b88c-7cf4e4b5e5cc', '616f5b2e-6e79-5062-9681-2b85cb2e4133', 'db11a9f9-a998-50ee-9a16-dba7266089bb', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7f5ccb63-e698-5e1d-bfbc-47f275e3b11c', '616f5b2e-6e79-5062-9681-2b85cb2e4133', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('bbd6568d-9101-5b74-9248-1046a455f1b8', '616f5b2e-6e79-5062-9681-2b85cb2e4133', '58bf6984-dbbe-5b82-afe6-3f8c58a1be77', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1fe01285-3dd9-5543-ae70-080893cbb7ec', '616f5b2e-6e79-5062-9681-2b85cb2e4133', 'e26b8671-16eb-54b9-b11f-ed3f99a912f5', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c5e7d3d1-ec26-52fb-96eb-7398b4cccae8', '616f5b2e-6e79-5062-9681-2b85cb2e4133', '4bcb274c-796b-59c3-834f-5e321bfcd580', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2a0a2be6-d6f5-595a-bdcd-0e8a2d3318f8', '616f5b2e-6e79-5062-9681-2b85cb2e4133', '85d4ba18-d76f-5c2a-a240-dcf6baabd84c', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3dbbb28a-05df-54fb-aafe-e131a886ac53', '616f5b2e-6e79-5062-9681-2b85cb2e4133', '31278c62-d3fb-59c0-b298-877946b40983', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ebc296e9-7a09-5acd-8f99-6a31257ac68d', '616f5b2e-6e79-5062-9681-2b85cb2e4133', '804935f3-67f5-5246-a0a0-1db7119996d7', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f82c10f0-124a-5539-a1dd-0e6b915fcc2d', '616f5b2e-6e79-5062-9681-2b85cb2e4133', 'aeb42be6-c8b9-5936-9659-4fc41e322b16', 'NE_PARTICIPERA_PAS', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f132924d-1806-508c-8a60-b82e39a2a4ed', '616f5b2e-6e79-5062-9681-2b85cb2e4133', '848f10d0-ecf4-597a-9bb8-a4a950cf2294', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f8513530-c8dd-57aa-8712-0331207f09c2', '616f5b2e-6e79-5062-9681-2b85cb2e4133', 'd634be2e-9272-5970-944b-55be40fef00b', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('cdd985de-5144-5654-8036-4a3facf8b92e', '616f5b2e-6e79-5062-9681-2b85cb2e4133', '5c97b403-1475-5719-863d-b06958f0ad7b', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fb040bc9-f901-505f-9f8d-0173840129f0', '616f5b2e-6e79-5062-9681-2b85cb2e4133', 'a04dcec7-743b-55ad-82f2-a4be51bce88c', 'NE_PARTICIPERA_PAS', now() - interval '20 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('9d348b11-2f57-52ab-9003-51e7ce2b336c', 'Conférence : la mobilité électrique en Afrique de l’Ouest', 'Conférence : la mobilité électrique en Afrique de l’Ouest. Un rendez-vous ouvert à toute la communauté EPT. Le programme détaillé sera envoyé aux inscrits.', 'Auditorium, Sahel Énergie Distribution',
  date_trunc('day', now()) + interval '46 days' + interval '9 hours',
  date_trunc('day', now()) + interval '46 days' + interval '11 hours',
  'TOUS', 120, false, 'PUBLIE', '75d14361-a9af-5dd6-a9d0-d5bf9d20fa32', null, now() - interval '56 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8607e78a-ee29-5b57-8b40-37fdd179a895', '9d348b11-2f57-52ab-9003-51e7ce2b336c', '93d2ab4b-627f-581f-a8e5-c9e3ba3cb819', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('af82b55d-14a6-50fa-80b4-0b734dbb3ed3', '9d348b11-2f57-52ab-9003-51e7ce2b336c', 'd95c2e6e-2b83-501b-9ac4-49a06f4029bc', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1086817c-9d21-59c7-a53a-1148c9f4acb4', '9d348b11-2f57-52ab-9003-51e7ce2b336c', '263ad97e-9911-56e5-90a2-f2ab0d88ddf2', 'NE_PARTICIPERA_PAS', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('79e45bc4-a313-5699-a943-5a5ca98ca331', '9d348b11-2f57-52ab-9003-51e7ce2b336c', '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fb00b676-dad5-5f2b-986a-a255b7eced0c', '9d348b11-2f57-52ab-9003-51e7ce2b336c', 'a1337834-0187-5899-b8bf-5fd74cd1d75b', 'NE_PARTICIPERA_PAS', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b63f2753-faec-5468-95fe-36790b84d6a9', '9d348b11-2f57-52ab-9003-51e7ce2b336c', '2dff725c-6ec3-5b75-b826-d333f238f88f', 'NE_PARTICIPERA_PAS', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('85dd6338-6379-5d45-affe-c713efb7db32', '9d348b11-2f57-52ab-9003-51e7ce2b336c', 'a69bb100-a789-56a8-860d-1a65c7f840eb', 'NE_PARTICIPERA_PAS', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a0992449-2c65-5fa9-936e-8c167a60127a', '9d348b11-2f57-52ab-9003-51e7ce2b336c', 'd657f819-3789-584f-ab12-f814e2e66008', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5c058c07-35de-5942-a4b8-a66c9ed16df6', '9d348b11-2f57-52ab-9003-51e7ce2b336c', '8d7ce8d8-e167-529b-be7e-4d8fd645a8fe', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b797fbea-e605-57f4-b346-03d5c77734b6', '9d348b11-2f57-52ab-9003-51e7ce2b336c', '8670e440-184b-5365-9e7b-3e0c983658b4', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('80b6d0b6-6ce0-5fe6-a5fa-80dc655771f7', '9d348b11-2f57-52ab-9003-51e7ce2b336c', '2767c1e8-a06b-5908-8fdc-b872bb7dfd48', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b6a4cd61-ecb1-50c3-985b-7a392b4c2c04', '9d348b11-2f57-52ab-9003-51e7ce2b336c', 'dbf4d1a4-103d-5acd-9646-1a3e970d68c0', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('8e4346c1-22f5-5585-a720-68feb1f1fa73', 'Marathon solidaire Thiès-Pout', 'Marathon solidaire Thiès-Pout. Un rendez-vous ouvert à toute la communauté EPT. Le programme détaillé sera envoyé aux inscrits.', 'Départ : place de France, Thiès',
  date_trunc('day', now()) + interval '54 days' + interval '9 hours',
  date_trunc('day', now()) + interval '54 days' + interval '11 hours',
  'TOUS', null, false, 'PUBLIE', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', null, now() - interval '64 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('796e275c-7be2-57f2-9b37-166701b9422a', '8e4346c1-22f5-5585-a720-68feb1f1fa73', 'b5872f7c-6d3c-5f90-b99a-e6b4586cb9f2', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('af5b8689-d65f-502a-8560-2625a792649c', '8e4346c1-22f5-5585-a720-68feb1f1fa73', '58529a43-d7de-50da-887d-0d7a51fb5929', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ac55edfa-36b6-5b62-a65e-c067777ca4e1', '8e4346c1-22f5-5585-a720-68feb1f1fa73', '3c57b1aa-4676-5875-8440-d925477549d6', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('07ee3245-c811-5772-b34c-17e6d7e26dac', '8e4346c1-22f5-5585-a720-68feb1f1fa73', 'b105f039-968f-520a-8860-da5b95b4482f', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6cc4be86-31f9-54e0-8416-b6ba3d3e1e98', '8e4346c1-22f5-5585-a720-68feb1f1fa73', '4ef34c8c-1ebb-5b2d-9f8b-e1dea623166b', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('334a249c-237e-5b7a-aaa6-28b6ff32e46f', '8e4346c1-22f5-5585-a720-68feb1f1fa73', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c0387542-5430-5be0-854d-ced77cd7fe0c', '8e4346c1-22f5-5585-a720-68feb1f1fa73', '58bf6984-dbbe-5b82-afe6-3f8c58a1be77', 'NE_PARTICIPERA_PAS', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0c75bc1f-1340-5175-8a87-b5990a62ba51', '8e4346c1-22f5-5585-a720-68feb1f1fa73', '6b507882-0089-585c-94df-f160023559ef', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2c2e1c3c-52f3-51a4-92fe-b309c05948be', '8e4346c1-22f5-5585-a720-68feb1f1fa73', '31278c62-d3fb-59c0-b298-877946b40983', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4d5b2193-d0ae-5c1b-a1b4-32827668cc72', '8e4346c1-22f5-5585-a720-68feb1f1fa73', '0efa151b-4536-5acd-98b8-9e62cd5042c5', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8db2d8ed-c4fd-589c-9e54-8fc6b38d6793', '8e4346c1-22f5-5585-a720-68feb1f1fa73', '8bc22c03-0373-5d99-a18d-1e1c2d71578c', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b1b1e0b2-0672-518e-9825-15f366e6f117', '8e4346c1-22f5-5585-a720-68feb1f1fa73', 'ead565a2-323e-591b-84d0-8db8bda4c57b', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e9ecf091-40df-5bb2-8324-d3cc21ff6d57', '8e4346c1-22f5-5585-a720-68feb1f1fa73', '1b42620c-c483-53d0-81c2-11af42770c68', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('618bbbb3-7a89-553c-84a0-29441a4fe21a', '8e4346c1-22f5-5585-a720-68feb1f1fa73', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4a3317b3-5f05-5809-8fe3-eff4adb6ec83', '8e4346c1-22f5-5585-a720-68feb1f1fa73', '4a73bb2a-d738-5997-a201-df09d1c31953', 'NE_PARTICIPERA_PAS', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('db0f0207-d912-56d4-a94f-822206e2684c', '8e4346c1-22f5-5585-a720-68feb1f1fa73', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('513728ce-b14e-51ad-8ff2-682c06e57823', '8e4346c1-22f5-5585-a720-68feb1f1fa73', 'eb601a8f-ae9f-5a99-9b34-ffd994889776', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f78516c0-9d99-5361-bf1a-c61b0416d41b', '8e4346c1-22f5-5585-a720-68feb1f1fa73', 'f8b792d4-c0da-5555-921c-45fad1f0a9da', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('b6a1c92f-98bc-5a45-a908-9f7a7040a944', 'Petit-déjeuner des femmes ingénieures', 'Petit-déjeuner des femmes ingénieures. Un rendez-vous ouvert à toute la communauté EPT. Apportez vos questions : un temps d’échange est prévu.', 'Dakar, Almadies',
  date_trunc('day', now()) + interval '-59 days' + interval '10 hours',
  date_trunc('day', now()) + interval '-59 days' + interval '16 hours',
  'TOUS', 45, false, 'PUBLIE', 'a1337834-0187-5899-b8bf-5fd74cd1d75b', null, now() - interval '69 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f5b0324f-a34b-5076-9988-21b4ac2b97a7', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', '0d960ead-333b-580a-bf11-faac2d46f590', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('315ddc4d-a333-542d-9930-ba041fcb68f1', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', 'fee119d8-46ac-5ea5-995c-bd2becc002ae', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8cf79c4e-f9c3-5a2f-9905-4b64778040fb', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', '80d38c99-6816-528d-b682-9a6617f4f3a4', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('11204a82-ac7f-5b18-8615-59669d97a115', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', 'fc943673-dd44-5e31-bd35-82def3570012', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ce463938-79a5-5217-9350-e55f50c7f291', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', '29191454-c4cc-5485-9e68-e24aad0ba23f', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('aaad26a4-f125-50eb-919a-60511799219b', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', 'NE_PARTICIPERA_PAS', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('011afa25-9e1a-5167-8292-685fbf018855', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', '2dff725c-6ec3-5b75-b826-d333f238f88f', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2fe5bd4a-d9ab-529f-b0fc-3679c82cf894', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', '6c56f510-f428-5542-8194-1dedc960b84e', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1b08cf5d-a1e5-5f59-bb8c-06fc2bf67df5', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', '25ff0193-529a-5f33-b609-c64f82d415b3', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('69176069-3dd0-5e6d-9bdb-0401a1473bd2', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', '945626e0-cf07-5ff9-8f88-c99c26151b4f', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a66b48ed-006e-5ee1-bd28-03f39f7e931c', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', '713d3bed-9680-507d-902f-f81fe90e43f4', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ffbb8b30-b547-52cd-880f-758956918ba7', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', 'd61f79a6-6b3a-542f-89b1-08d81a347be8', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c68b265b-94bc-57a7-b482-8e5d3bd5d42a', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', 'd4575e51-15e5-5732-9202-060f7c776e6f', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('47485f85-7e8c-507f-bada-f20ef6721f3d', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', 'bcceeeec-059e-5229-90b4-15838929d725', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('697d4eeb-d42a-5466-afc2-94dd754c5272', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', '87ce220b-bb1b-55b0-acb8-ff8e1bf24804', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('74eed5e9-58b8-5aa1-9a9d-245661bc2664', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', '2ad470a2-5a14-59b3-b5b2-531d823f53b3', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f9d64b9c-544a-528a-8715-404a3346d622', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6ab83e32-abc6-54d4-9333-89708d4063f6', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', '6b674cd4-406f-546f-aae4-5a78a5d13b31', 'NE_PARTICIPERA_PAS', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5516cb21-2003-5464-ab5b-5ee5b0d30543', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', 'ead565a2-323e-591b-84d0-8db8bda4c57b', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('478ad3d8-3a20-5004-be5c-1eb5e885078f', 'b6a1c92f-98bc-5a45-a908-9f7a7040a944', 'ec3fef72-9456-5acc-9639-000d9e507c1a', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('e181f70d-f22b-54e7-97bd-d469c8d35b5f', 'Atelier : initiation au BIM', 'Atelier : initiation au BIM. Un moment d’échange entre diplômés, étudiants et partenaires. Apportez vos questions : un temps d’échange est prévu.', 'Laboratoire de génie civil, EPT',
  date_trunc('day', now()) + interval '106 days' + interval '15 hours',
  date_trunc('day', now()) + interval '106 days' + interval '21 hours',
  'ETUDIANTS', 24, true, 'PUBLIE', '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c', null, now() - interval '116 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('95ad9cb2-98bb-5708-a63d-aa783b41d228', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', 'ef6c88cb-7f71-5f28-b013-f3dc3f90329a', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d6d86a8f-b99a-553c-939a-dbe2b1becad5', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', 'dcf23cda-8f49-52ba-af43-69e5ff8a2e6c', 'NE_PARTICIPERA_PAS', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c432da0a-139d-5a59-8177-10093f285426', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', '85d4ba18-d76f-5c2a-a240-dcf6baabd84c', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('36e9cb48-385d-5e26-93ef-51e134344e1e', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', 'd4575e51-15e5-5732-9202-060f7c776e6f', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e2f1e6e8-8fd1-5c91-87bd-bfc2ace0f2d9', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', '25ff0193-529a-5f33-b609-c64f82d415b3', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('bc08c1fb-4fe0-5940-a3c9-2e6a4d47102f', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('53e3d49f-d769-5347-a445-40c81bcbb30b', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', 'd61f79a6-6b3a-542f-89b1-08d81a347be8', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2a467af3-c1e1-5284-8d10-dfad3cf1a639', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', '3c57b1aa-4676-5875-8440-d925477549d6', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('dc7c08ae-0c1b-55b9-8998-8fbef13852b6', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', 'd257bd7c-c404-57a1-a4fc-662d31f7a29d', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('bd2450e9-23bd-529f-bd0e-4e8b2dbe49a5', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', '8bc22c03-0373-5d99-a18d-1e1c2d71578c', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7618a698-7b60-5ec8-b71d-bd101604cc0f', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', 'b58eb7ec-492a-5e00-b7d4-18d3b848066a', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('87b92243-63d2-502d-be7d-4b15481e62fd', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', '2e3cf9f7-e4c1-523f-be84-d3ac97b3407e', 'NE_PARTICIPERA_PAS', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1bee25c0-b81d-5151-9b85-0b6473897805', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', '1ec94b2d-dfb0-5400-8e05-00f259ccd5aa', 'NE_PARTICIPERA_PAS', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('02c65bba-2fbb-5b03-812f-3f432b928c00', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', 'cd98b0b9-9e1d-5f1e-a7ae-933f51e45989', 'NE_PARTICIPERA_PAS', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c4c1a838-1410-58ca-a614-a3492c210837', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', '33c4c54d-e3d2-5d47-9fb4-dcac89aabe0e', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3a7cf2f3-0651-5d3d-aff5-42f4608f9b7b', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', 'ec3fef72-9456-5acc-9639-000d9e507c1a', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5fc79e21-1bf3-5038-b737-02f6d1990897', 'e181f70d-f22b-54e7-97bd-d469c8d35b5f', 'ee46384a-c14b-5eec-b37a-a8fb4409d9b7', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('1a44ebed-c00e-5281-8478-7b33a99376ba', 'Visite du port autonome et de ses terminaux', 'Visite du port autonome et de ses terminaux. Un rendez-vous ouvert à toute la communauté EPT. Une collation sera offerte à l’issue de la rencontre.', 'Port autonome de Dakar',
  date_trunc('day', now()) + interval '-43 days' + interval '18 hours',
  date_trunc('day', now()) + interval '-43 days' + interval '22 hours',
  'ETUDIANTS', 30, false, 'PUBLIE', '6593d854-bb87-5921-a69f-4167b7a5e904', '/api/evenement-images/1a44ebed-c00e-5281-8478-7b33a99376ba.jpg', now() - interval '53 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4b763f5c-f065-5282-a004-f950c1f2d3c7', '1a44ebed-c00e-5281-8478-7b33a99376ba', '33c4c54d-e3d2-5d47-9fb4-dcac89aabe0e', 'NE_PARTICIPERA_PAS', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('56d65adb-7ec5-52c9-a487-9599a3c952fc', '1a44ebed-c00e-5281-8478-7b33a99376ba', '1ec94b2d-dfb0-5400-8e05-00f259ccd5aa', 'NE_PARTICIPERA_PAS', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b0e198ef-60c6-51bc-9d3d-f6788bde9cee', '1a44ebed-c00e-5281-8478-7b33a99376ba', 'd257bd7c-c404-57a1-a4fc-662d31f7a29d', 'NE_PARTICIPERA_PAS', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7087fb31-e910-5d99-b022-2726b977ef3c', '1a44ebed-c00e-5281-8478-7b33a99376ba', '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a01ee18a-badb-578b-b5b7-508dc78d8c3c', '1a44ebed-c00e-5281-8478-7b33a99376ba', '2e3cf9f7-e4c1-523f-be84-d3ac97b3407e', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0b5e7c34-9e5d-5866-a782-c48e197d2869', '1a44ebed-c00e-5281-8478-7b33a99376ba', '80d38c99-6816-528d-b682-9a6617f4f3a4', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8dd05a26-bd43-592f-bbd3-aab9e08676bd', '1a44ebed-c00e-5281-8478-7b33a99376ba', '3c57b1aa-4676-5875-8440-d925477549d6', 'NE_PARTICIPERA_PAS', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('29171c22-846f-5bd3-b15f-9dc082d78497', '1a44ebed-c00e-5281-8478-7b33a99376ba', 'aeb42be6-c8b9-5936-9659-4fc41e322b16', 'NE_PARTICIPERA_PAS', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ccc9d6e5-87a9-59d0-96f3-96f2ee2a5739', '1a44ebed-c00e-5281-8478-7b33a99376ba', 'd95c2e6e-2b83-501b-9ac4-49a06f4029bc', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('07baa9df-e1d0-51ab-92d9-b13d854552a7', '1a44ebed-c00e-5281-8478-7b33a99376ba', 'fc943673-dd44-5e31-bd35-82def3570012', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2b755d54-7a5c-5433-a80b-410de1ecec75', '1a44ebed-c00e-5281-8478-7b33a99376ba', 'b58eb7ec-492a-5e00-b7d4-18d3b848066a', 'NE_PARTICIPERA_PAS', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fa2cb36e-aa1c-59e7-9d81-5f992b9e7c1e', '1a44ebed-c00e-5281-8478-7b33a99376ba', '8c19c881-c56c-5007-92d0-fd9589c41646', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('715865d5-3b70-5e53-89d9-22a3a7614f15', '1a44ebed-c00e-5281-8478-7b33a99376ba', '95f0f598-aeda-59f7-8df3-e74bd10dc64d', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('59affa62-6344-528a-9862-1e6015d06642', '1a44ebed-c00e-5281-8478-7b33a99376ba', 'd4575e51-15e5-5732-9202-060f7c776e6f', 'NE_PARTICIPERA_PAS', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('588b4d8e-e000-5066-9bcb-c649b661df74', '1a44ebed-c00e-5281-8478-7b33a99376ba', 'da6bf8d6-8287-52e0-a118-f9ed2eb61e7a', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('edc3e953-f2bf-525a-9c70-d7f0a05ba440', 'Forum de l’entrepreneuriat technologique', 'Forum de l’entrepreneuriat technologique. Un rendez-vous ouvert à toute la communauté EPT. Le programme détaillé sera envoyé aux inscrits.', 'Jàmm Pay, Plateau',
  date_trunc('day', now()) + interval '-116 days' + interval '10 hours',
  date_trunc('day', now()) + interval '-116 days' + interval '16 hours',
  'TOUS', 150, false, 'PUBLIE', '6140551c-046e-5ae3-a2d5-7a9d63de1fc1', '/api/evenement-images/edc3e953-f2bf-525a-9c70-d7f0a05ba440.jpg', now() - interval '126 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6b2f7cd9-fbff-5e7b-b36c-5c4ed2672b50', 'edc3e953-f2bf-525a-9c70-d7f0a05ba440', '945626e0-cf07-5ff9-8f88-c99c26151b4f', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('11775a9a-e18b-539f-9c7d-49e61a1c43d7', 'edc3e953-f2bf-525a-9c70-d7f0a05ba440', 'db11a9f9-a998-50ee-9a16-dba7266089bb', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('77c9ee3d-8ce4-5e56-a99d-18f2ddd5119f', 'edc3e953-f2bf-525a-9c70-d7f0a05ba440', 'f4b29068-7ff9-5610-9ad2-20474998efdd', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e1da3f37-e70b-5bf7-97de-703c6e88c293', 'edc3e953-f2bf-525a-9c70-d7f0a05ba440', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e2a8d844-3a2d-56a0-a1c4-b574308873ae', 'edc3e953-f2bf-525a-9c70-d7f0a05ba440', 'aeb42be6-c8b9-5936-9659-4fc41e322b16', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('19c1a975-191b-536a-87b5-2e3c4a203054', 'edc3e953-f2bf-525a-9c70-d7f0a05ba440', '8f0a4694-dbd7-56ef-8a66-f9b0169504e8', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('df435227-2048-5553-b43d-79275c0042e1', 'edc3e953-f2bf-525a-9c70-d7f0a05ba440', '2b34d94e-66b2-5292-8f66-8cde42ae3106', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f4aa548d-db12-580a-a9c9-09de6260f888', 'edc3e953-f2bf-525a-9c70-d7f0a05ba440', '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('48918146-c524-52a3-93e8-1ed7ca7b33d1', 'edc3e953-f2bf-525a-9c70-d7f0a05ba440', '0d960ead-333b-580a-bf11-faac2d46f590', 'NE_PARTICIPERA_PAS', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('49c49d28-cb9f-5a49-920e-a2273eaf71a1', 'edc3e953-f2bf-525a-9c70-d7f0a05ba440', 'ba62afaa-e97b-5dfd-b99f-cc115508f551', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0af0ef0d-be0e-5113-9c67-024449de7b52', 'edc3e953-f2bf-525a-9c70-d7f0a05ba440', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5b04d5eb-5102-5ba7-a4d6-cbf6f7fd9500', 'edc3e953-f2bf-525a-9c70-d7f0a05ba440', 'fce07ac1-1fa2-5929-b89b-f38df176c1d1', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9688e747-c83b-5ab5-bbc4-301f0d8d2afc', 'edc3e953-f2bf-525a-9c70-d7f0a05ba440', '8d7ce8d8-e167-529b-be7e-4d8fd645a8fe', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('d69bf20f-dc77-552d-93e0-e7cac31d5c27', 'Dîner de la promotion 2006', 'Dîner de la promotion 2006. Un moment d’échange entre diplômés, étudiants et partenaires. Une collation sera offerte à l’issue de la rencontre.', 'Saly Portudal',
  date_trunc('day', now()) + interval '-38 days' + interval '9 hours',
  date_trunc('day', now()) + interval '-38 days' + interval '12 hours',
  'ALUMNI', 70, false, 'PUBLIE', '1a1ae694-fc50-5757-931c-51ac8bbdcfc5', '/api/evenement-images/d69bf20f-dc77-552d-93e0-e7cac31d5c27.jpg', now() - interval '48 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('cfd81122-8cea-5485-97d3-8f723c6e3897', 'd69bf20f-dc77-552d-93e0-e7cac31d5c27', '2ce655c2-b971-5cdf-8afd-9049eb1b237f', 'NE_PARTICIPERA_PAS', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fb3c4711-0192-546a-a25e-a727c054b010', 'd69bf20f-dc77-552d-93e0-e7cac31d5c27', '6593d854-bb87-5921-a69f-4167b7a5e904', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('eb13d1dd-bfb6-5852-87ab-67e1b8ba9754', 'd69bf20f-dc77-552d-93e0-e7cac31d5c27', '6fa62627-bf15-591d-8334-e0939916dc4f', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7872b40b-89e5-5101-8e76-797ed5990946', 'd69bf20f-dc77-552d-93e0-e7cac31d5c27', '8670e440-184b-5365-9e7b-3e0c983658b4', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a83bda7e-925b-573a-aa84-4f3be628b9e4', 'd69bf20f-dc77-552d-93e0-e7cac31d5c27', 'ead565a2-323e-591b-84d0-8db8bda4c57b', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('50114882-e85a-5b94-8555-1ba34a6e555b', 'd69bf20f-dc77-552d-93e0-e7cac31d5c27', '8bc22c03-0373-5d99-a18d-1e1c2d71578c', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('bc652526-f278-59e7-aea6-48a84d9df087', 'd69bf20f-dc77-552d-93e0-e7cac31d5c27', 'ef763dcf-06b8-5e9b-a1a2-97877c358ff2', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('cb64fe5b-6eae-5ffd-891a-962d75fabbf6', 'd69bf20f-dc77-552d-93e0-e7cac31d5c27', 'b105f039-968f-520a-8860-da5b95b4482f', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c81e0cab-79e3-5595-8e36-8e442688b56a', 'd69bf20f-dc77-552d-93e0-e7cac31d5c27', '93d2ab4b-627f-581f-a8e5-c9e3ba3cb819', 'NE_PARTICIPERA_PAS', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0f4813cc-7c92-5e4e-ac15-1e69b7760eab', 'd69bf20f-dc77-552d-93e0-e7cac31d5c27', '4ef34c8c-1ebb-5b2d-9f8b-e1dea623166b', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('860663f0-5d70-5b30-b4c1-f3a996d177af', 'd69bf20f-dc77-552d-93e0-e7cac31d5c27', 'd634be2e-9272-5970-944b-55be40fef00b', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('89bcaf58-0140-51f4-b6df-5d4662418c53', 'd69bf20f-dc77-552d-93e0-e7cac31d5c27', '1a1ae694-fc50-5757-931c-51ac8bbdcfc5', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f06c04ee-9621-5fda-8313-c92adeb83f47', 'd69bf20f-dc77-552d-93e0-e7cac31d5c27', 'ba62afaa-e97b-5dfd-b99f-cc115508f551', 'NE_PARTICIPERA_PAS', now() - interval '17 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('3ae4273b-c8ab-5359-9cc1-c8dabe92b970', 'Atelier cybersécurité : capture du drapeau', 'Atelier cybersécurité : capture du drapeau. Un rendez-vous ouvert à toute la communauté EPT. Le programme détaillé sera envoyé aux inscrits.', 'Salle informatique, EPT',
  date_trunc('day', now()) + interval '19 days' + interval '15 hours',
  date_trunc('day', now()) + interval '19 days' + interval '18 hours',
  'ETUDIANTS', 32, false, 'PUBLIE', 'cdddccef-2bda-5223-ae7d-112ff4b1c9ac', '/api/evenement-images/3ae4273b-c8ab-5359-9cc1-c8dabe92b970.jpg', now() - interval '29 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('63f7734c-6d87-571a-9443-7dbdbfc5c0ff', '3ae4273b-c8ab-5359-9cc1-c8dabe92b970', '95f0f598-aeda-59f7-8df3-e74bd10dc64d', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b9735dda-994a-5cef-a01e-d192d684e6bc', '3ae4273b-c8ab-5359-9cc1-c8dabe92b970', 'da6bf8d6-8287-52e0-a118-f9ed2eb61e7a', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d7137744-bfd1-5a06-a47b-a852d3c2d5d6', '3ae4273b-c8ab-5359-9cc1-c8dabe92b970', '0d960ead-333b-580a-bf11-faac2d46f590', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b54f611a-9978-5d0c-be96-ad2a7b558b50', '3ae4273b-c8ab-5359-9cc1-c8dabe92b970', '2e3cf9f7-e4c1-523f-be84-d3ac97b3407e', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('468642bb-fd36-534f-be20-984a952a8023', '3ae4273b-c8ab-5359-9cc1-c8dabe92b970', '80d38c99-6816-528d-b682-9a6617f4f3a4', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ea6e5eaa-bd7d-5fc4-a863-83e665d9e29b', '3ae4273b-c8ab-5359-9cc1-c8dabe92b970', '5c97b403-1475-5719-863d-b06958f0ad7b', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4a3ab1e9-fb01-5ef2-b68a-329a5f3a5b5a', '3ae4273b-c8ab-5359-9cc1-c8dabe92b970', '422e77a7-ae81-5b28-be87-0e8d9b3c769d', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0466c1a6-8a00-5da8-a09e-b08193941897', '3ae4273b-c8ab-5359-9cc1-c8dabe92b970', 'cd98b0b9-9e1d-5f1e-a7ae-933f51e45989', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1a5e7952-38b2-5be8-af14-b3987f154523', '3ae4273b-c8ab-5359-9cc1-c8dabe92b970', '0efa151b-4536-5acd-98b8-9e62cd5042c5', 'NE_PARTICIPERA_PAS', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('572d9d9a-ff36-53a9-b39f-13a0bae4ea02', '3ae4273b-c8ab-5359-9cc1-c8dabe92b970', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('08fe27aa-2e57-541c-ac78-c555de087f07', 'Conférence : l’hydrogène vert, une opportunité ?', 'Conférence : l’hydrogène vert, une opportunité ?. Un moment d’échange entre diplômés, étudiants et partenaires. Une collation sera offerte à l’issue de la rencontre.', 'Amphithéâtre B, EPT',
  date_trunc('day', now()) + interval '-116 days' + interval '10 hours',
  date_trunc('day', now()) + interval '-116 days' + interval '13 hours',
  'TOUS', 150, true, 'PUBLIE', 'b58eb7ec-492a-5e00-b7d4-18d3b848066a', '/api/evenement-images/08fe27aa-2e57-541c-ac78-c555de087f07.jpg', now() - interval '126 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('29bef383-f403-56bd-b574-da4fd13a279c', '08fe27aa-2e57-541c-ac78-c555de087f07', 'dc23b8dd-7e75-583d-a661-962ac846c8b8', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b704df1c-3bd9-5492-aa0d-4d169316c5f7', '08fe27aa-2e57-541c-ac78-c555de087f07', '6593d854-bb87-5921-a69f-4167b7a5e904', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f502ad29-ab51-5ce1-94b2-35f6d5337df4', '08fe27aa-2e57-541c-ac78-c555de087f07', '0d960ead-333b-580a-bf11-faac2d46f590', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('15ac9a84-c885-5dfe-9b69-7063e1929d94', '08fe27aa-2e57-541c-ac78-c555de087f07', '8f0a4694-dbd7-56ef-8a66-f9b0169504e8', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6e8d65a8-43fe-5c84-b974-91522beb84f2', '08fe27aa-2e57-541c-ac78-c555de087f07', '8c19c881-c56c-5007-92d0-fd9589c41646', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6905fb7d-a703-5f25-b37d-aa5cc18896d2', '08fe27aa-2e57-541c-ac78-c555de087f07', '4ef34c8c-1ebb-5b2d-9f8b-e1dea623166b', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('37b6ec93-069f-5e10-af2e-fbf2f2627f11', '08fe27aa-2e57-541c-ac78-c555de087f07', '89629841-a5b6-5eee-be22-e550bc5d33fb', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('205abce3-bb74-5da9-b022-eb29647c44e0', '08fe27aa-2e57-541c-ac78-c555de087f07', 'd0540eb7-c40f-5b4d-b71f-67e26f1f2203', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3a4d7c7a-8102-5d03-a84d-32c3642db1bd', '08fe27aa-2e57-541c-ac78-c555de087f07', 'eb601a8f-ae9f-5a99-9b34-ffd994889776', 'NE_PARTICIPERA_PAS', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7c02eca7-24cd-5905-ac46-c4f0761cb058', '08fe27aa-2e57-541c-ac78-c555de087f07', '1a1ae694-fc50-5757-931c-51ac8bbdcfc5', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f0dd0b04-07c1-5295-bbfe-b9ba7a4deaf5', '08fe27aa-2e57-541c-ac78-c555de087f07', '58a64778-e962-5167-9c0b-5216c2e855d6', 'NE_PARTICIPERA_PAS', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e74790f8-8a9f-5d99-a62d-6d4ab0618802', '08fe27aa-2e57-541c-ac78-c555de087f07', 'fd2abcc5-5026-56f8-9739-ad5c6994612f', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('902dea72-95d6-53f3-8a33-c6dff1aba4b4', '08fe27aa-2e57-541c-ac78-c555de087f07', '5809136a-2a1b-52d9-bd37-16cb2afcac33', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3d7d4325-4578-58fe-85c6-5a630d3ae7dc', '08fe27aa-2e57-541c-ac78-c555de087f07', 'd257bd7c-c404-57a1-a4fc-662d31f7a29d', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('26854889-badc-50a7-80d7-dbdfaa444c49', '08fe27aa-2e57-541c-ac78-c555de087f07', 'dbf4d1a4-103d-5acd-9646-1a3e970d68c0', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fad174dc-5971-5cee-aef4-db4f5ad20755', '08fe27aa-2e57-541c-ac78-c555de087f07', 'feadc7dc-098f-588a-ac2d-3f6e1623387e', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('60991f28-a034-5010-ad38-d0ce455f0df7', '08fe27aa-2e57-541c-ac78-c555de087f07', '95f0f598-aeda-59f7-8df3-e74bd10dc64d', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a6e6046e-b9cb-5cb0-9394-191c15237a45', '08fe27aa-2e57-541c-ac78-c555de087f07', 'f8b792d4-c0da-5555-921c-45fad1f0a9da', 'NE_PARTICIPERA_PAS', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9566eb79-29b2-5a3f-b7f9-9d572669239a', '08fe27aa-2e57-541c-ac78-c555de087f07', 'ef763dcf-06b8-5e9b-a1a2-97877c358ff2', 'NE_PARTICIPERA_PAS', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d9988c16-5253-5c1a-937c-857a77278267', '08fe27aa-2e57-541c-ac78-c555de087f07', '9f088eb6-0059-5cec-a0f2-d8cd281a702d', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d02fffd2-682b-5f18-b011-76d118b2c89e', '08fe27aa-2e57-541c-ac78-c555de087f07', '2b34d94e-66b2-5292-8f66-8cde42ae3106', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3eeec9af-5f80-5500-bb29-e482804a6255', '08fe27aa-2e57-541c-ac78-c555de087f07', '9c5eaed3-8efd-5c3a-8045-b853a546ed9b', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('652a8669-2ec2-5b88-bceb-2f8059b856d2', '08fe27aa-2e57-541c-ac78-c555de087f07', '32139e9c-9e23-5367-a1f4-8446a769fc85', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d22ac31c-9fac-54f6-b353-4da7145459bb', '08fe27aa-2e57-541c-ac78-c555de087f07', 'fee119d8-46ac-5ea5-995c-bd2becc002ae', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('43d53c96-9a04-5cce-8892-e04e7fa95c05', 'Rencontre alumni de Montréal', 'Rencontre alumni de Montréal. Inscrivez-vous rapidement, les places sont limitées. Le programme détaillé sera envoyé aux inscrits.', 'Montréal, Vieux-Port',
  date_trunc('day', now()) + interval '-94 days' + interval '18 hours',
  date_trunc('day', now()) + interval '-94 days' + interval '21 hours',
  'ALUMNI', 35, false, 'PUBLIE', '945626e0-cf07-5ff9-8f88-c99c26151b4f', '/api/evenement-images/43d53c96-9a04-5cce-8892-e04e7fa95c05.jpg', now() - interval '104 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b05230c4-6905-589b-97b5-c9e5b23b2782', '43d53c96-9a04-5cce-8892-e04e7fa95c05', 'b58eb7ec-492a-5e00-b7d4-18d3b848066a', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8402a9c8-819a-5944-81ef-72ad4e3232d6', '43d53c96-9a04-5cce-8892-e04e7fa95c05', '235c7b1c-4170-52c0-9469-475b0210cb78', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c8d4f44a-0203-5ae5-9915-9b1a84a075a0', '43d53c96-9a04-5cce-8892-e04e7fa95c05', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('41e083f2-6c2c-50c6-8b68-5a74a31704f7', '43d53c96-9a04-5cce-8892-e04e7fa95c05', '87ce220b-bb1b-55b0-acb8-ff8e1bf24804', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7f7ab335-05a3-576f-918f-3b1a27c725da', '43d53c96-9a04-5cce-8892-e04e7fa95c05', '9f088eb6-0059-5cec-a0f2-d8cd281a702d', 'NE_PARTICIPERA_PAS', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('28e3c260-f95b-563b-966f-cf8be0f4693f', '43d53c96-9a04-5cce-8892-e04e7fa95c05', '8bc22c03-0373-5d99-a18d-1e1c2d71578c', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e981aa26-0107-536a-8c44-c87720609d34', '43d53c96-9a04-5cce-8892-e04e7fa95c05', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', 'NE_PARTICIPERA_PAS', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ab647b2f-4745-59b2-bd9f-d532e4477518', '43d53c96-9a04-5cce-8892-e04e7fa95c05', '8d7ce8d8-e167-529b-be7e-4d8fd645a8fe', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1c32850c-7c32-5f0b-80e0-de61c764b6db', '43d53c96-9a04-5cce-8892-e04e7fa95c05', 'db11a9f9-a998-50ee-9a16-dba7266089bb', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('99b2cca6-1d67-562e-b727-e5e066ee3c70', '43d53c96-9a04-5cce-8892-e04e7fa95c05', '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c33d2485-581a-5fe9-99c4-79d2eb840493', '43d53c96-9a04-5cce-8892-e04e7fa95c05', '1ec94b2d-dfb0-5400-8e05-00f259ccd5aa', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2ca17c08-982e-5ff1-8a66-40d3f26eae59', '43d53c96-9a04-5cce-8892-e04e7fa95c05', '6fa62627-bf15-591d-8334-e0939916dc4f', 'NE_PARTICIPERA_PAS', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('33889498-2f9f-59ac-9ebe-b5d5e8675eb2', '43d53c96-9a04-5cce-8892-e04e7fa95c05', 'd61f79a6-6b3a-542f-89b1-08d81a347be8', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'Visite d’une ferme solaire à Diass', 'Visite d’une ferme solaire à Diass. Inscrivez-vous rapidement, les places sont limitées. Apportez vos questions : un temps d’échange est prévu.', 'Diass',
  date_trunc('day', now()) + interval '-96 days' + interval '15 hours',
  date_trunc('day', now()) + interval '-96 days' + interval '17 hours',
  'ETUDIANTS', 30, false, 'PUBLIE', 'ff940591-a6e2-520f-b5b1-b130755c3279', '/api/evenement-images/aacfe868-9f00-5dcb-8136-60bd5e8b2bb2.jpg', now() - interval '106 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('803679b2-f41a-53ab-afa7-4920962d2770', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', '8bc22c03-0373-5d99-a18d-1e1c2d71578c', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6b295764-a251-5c57-8708-e44587eb42bd', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', '6b507882-0089-585c-94df-f160023559ef', 'NE_PARTICIPERA_PAS', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fc1f85bc-bcbc-505f-a21b-88251e19ffab', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'ec3fef72-9456-5acc-9639-000d9e507c1a', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ef0161fb-42c4-5a77-b438-9a8342ed26ac', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', '74a06960-9dce-51ad-aa8f-af54c468706b', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('239ff56c-cc3c-501c-95ad-d36dcd4eb662', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'e84a9fc0-ca48-5c1a-85e1-f8fce2a9618a', 'NE_PARTICIPERA_PAS', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('cf4bd9d4-876f-5b34-92a0-ab56a03368d1', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'ef6c88cb-7f71-5f28-b013-f3dc3f90329a', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5ea2d0c4-a849-541d-b787-759c11644b4a', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'a04dcec7-743b-55ad-82f2-a4be51bce88c', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5cd20d27-b891-5db2-bd98-ce3a2bf247ce', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'fce07ac1-1fa2-5929-b89b-f38df176c1d1', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1aa5ccbc-81d3-56b3-9a54-f594d9ec7cf2', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'd0540eb7-c40f-5b4d-b71f-67e26f1f2203', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ec7334cb-02a1-58eb-b295-f8123b4040f3', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', '2e3cf9f7-e4c1-523f-be84-d3ac97b3407e', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('726ce20a-c89c-50b3-ad50-a71531cf4aeb', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'aeb42be6-c8b9-5936-9659-4fc41e322b16', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('487fcd0e-6128-5eb8-afb6-fa6bc97b8c8b', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', '0efa151b-4536-5acd-98b8-9e62cd5042c5', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3adf6ede-5c5c-5ba2-b1bc-d0ac12d976f3', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'cd98b0b9-9e1d-5f1e-a7ae-933f51e45989', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6b5f91a9-40e2-5a9a-8b19-36606a003998', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'eb601a8f-ae9f-5a99-9b34-ffd994889776', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a2b6c9dd-f560-5738-b56b-bf824f9712aa', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'd257bd7c-c404-57a1-a4fc-662d31f7a29d', 'NE_PARTICIPERA_PAS', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3a5edff9-d33c-5f93-93c8-280bc44c169a', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'd61f79a6-6b3a-542f-89b1-08d81a347be8', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('28dc14bb-7e61-5fa7-8b60-3923ebe80411', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', '33c4c54d-e3d2-5d47-9fb4-dcac89aabe0e', 'NE_PARTICIPERA_PAS', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('33cc08df-5fbe-5834-bbb3-ec2dc524a951', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'b58eb7ec-492a-5e00-b7d4-18d3b848066a', 'NE_PARTICIPERA_PAS', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a71889b4-8e53-5286-a172-bb6a619c8381', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', '31278c62-d3fb-59c0-b298-877946b40983', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('cd3409e1-6a91-5178-95a6-ee184d7b2c2b', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'b23772fe-a5b2-5037-881f-8de86b35f087', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6138e3a5-51bd-59bc-a779-ad33f46fe891', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'c66385a9-2e09-5478-9f8f-e2556567191f', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4539ee78-589a-5d5d-9978-6f3ca5fb4cab', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'feadc7dc-098f-588a-ac2d-3f6e1623387e', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d9e11c4b-c656-5a37-969e-fd0e79352413', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'd95c2e6e-2b83-501b-9ac4-49a06f4029bc', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('92aa7a72-eb44-5649-b95d-1da6dd4743cb', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', '85d4ba18-d76f-5c2a-a240-dcf6baabd84c', 'NE_PARTICIPERA_PAS', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7ec75a07-3e0a-5dbd-a19b-5311cd4cc813', 'aacfe868-9f00-5dcb-8136-60bd5e8b2bb2', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('27f29a61-d895-5405-ab24-2d3f305197ee', 'Coupe de football des filières', 'Coupe de football des filières. Un moment d’échange entre diplômés, étudiants et partenaires. Une collation sera offerte à l’issue de la rencontre.', 'Stade Lat Dior, Thiès',
  date_trunc('day', now()) + interval '46 days' + interval '10 hours',
  date_trunc('day', now()) + interval '46 days' + interval '12 hours',
  'TOUS', null, false, 'PUBLIE', '102b12e7-e8a2-59dc-9b3a-ab365bac18c2', '/api/evenement-images/27f29a61-d895-5405-ab24-2d3f305197ee.jpg', now() - interval '56 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1ee4b9c5-7e21-5cda-a313-5e0d62efbb36', '27f29a61-d895-5405-ab24-2d3f305197ee', 'ef6c88cb-7f71-5f28-b013-f3dc3f90329a', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4c9d0bf0-3fab-509e-aa0c-e306ba60aaa9', '27f29a61-d895-5405-ab24-2d3f305197ee', '760ed432-29c6-5dad-9d2d-ec90276f6f75', 'NE_PARTICIPERA_PAS', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('16dfe4fc-17fc-505c-823b-05f62c57352f', '27f29a61-d895-5405-ab24-2d3f305197ee', 'aa9de02b-b819-5dcb-9fed-e994479e6b7f', 'NE_PARTICIPERA_PAS', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('014fd182-ed69-53e5-abeb-a2dfe060decc', '27f29a61-d895-5405-ab24-2d3f305197ee', 'c66385a9-2e09-5478-9f8f-e2556567191f', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('586b4911-c177-5061-a53c-98b23ff08932', '27f29a61-d895-5405-ab24-2d3f305197ee', '9f088eb6-0059-5cec-a0f2-d8cd281a702d', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('91ff9d21-b601-518e-be1c-ea52beb90163', '27f29a61-d895-5405-ab24-2d3f305197ee', 'fd2abcc5-5026-56f8-9739-ad5c6994612f', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8486eb4c-7760-5d66-b8bb-9b498d0b2860', '27f29a61-d895-5405-ab24-2d3f305197ee', 'bcceeeec-059e-5229-90b4-15838929d725', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('dec986c8-e55b-508d-87d8-5fddfcc64dde', '27f29a61-d895-5405-ab24-2d3f305197ee', 'db11a9f9-a998-50ee-9a16-dba7266089bb', 'NE_PARTICIPERA_PAS', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7c2d34fa-e5ff-54ac-8b99-747991de90a1', '27f29a61-d895-5405-ab24-2d3f305197ee', '80d38c99-6816-528d-b682-9a6617f4f3a4', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1aec7ff9-3c0d-54e9-9b6e-4469d991c482', '27f29a61-d895-5405-ab24-2d3f305197ee', 'f8b792d4-c0da-5555-921c-45fad1f0a9da', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4636945d-0052-5399-8263-bac9df6bafad', '27f29a61-d895-5405-ab24-2d3f305197ee', '2ad470a2-5a14-59b3-b5b2-531d823f53b3', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7b29eb69-27bc-5c94-ac79-325d43916ed9', '27f29a61-d895-5405-ab24-2d3f305197ee', 'c2e25360-dece-5880-89c5-b86ba7ded0e3', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('26ce4591-6f63-55ad-bdbd-6f6820ef48cf', '27f29a61-d895-5405-ab24-2d3f305197ee', '713d3bed-9680-507d-902f-f81fe90e43f4', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8520539e-5d83-5614-af49-14b00ae2d76b', '27f29a61-d895-5405-ab24-2d3f305197ee', 'f2ddf2c7-06e2-56e5-b270-91ff9380f037', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1e6bb68d-104b-5d41-a524-f331a9ce5591', '27f29a61-d895-5405-ab24-2d3f305197ee', '2c80d750-a819-5513-b56c-483c3c6d0379', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8a6012fa-bbbf-59a3-a524-28eaad1e2319', '27f29a61-d895-5405-ab24-2d3f305197ee', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c9eb421c-a0ca-5141-ba54-13a683e6653a', '27f29a61-d895-5405-ab24-2d3f305197ee', '945626e0-cf07-5ff9-8f88-c99c26151b4f', 'NE_PARTICIPERA_PAS', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a557a9db-dbd7-5f71-98f6-8a6fb7e4fc41', '27f29a61-d895-5405-ab24-2d3f305197ee', '2767c1e8-a06b-5908-8fdc-b872bb7dfd48', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0c05d609-fcda-5437-9fbd-c07e638495fb', '27f29a61-d895-5405-ab24-2d3f305197ee', 'ec3fef72-9456-5acc-9639-000d9e507c1a', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a1f702b4-da65-5cca-b587-3af0e51a4600', '27f29a61-d895-5405-ab24-2d3f305197ee', 'feadc7dc-098f-588a-ac2d-3f6e1623387e', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fe2240c2-ec89-5928-b0aa-1f240460d7f9', '27f29a61-d895-5405-ab24-2d3f305197ee', '9c5eaed3-8efd-5c3a-8045-b853a546ed9b', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5d041725-a24d-5efc-b494-b1eb92913cdc', '27f29a61-d895-5405-ab24-2d3f305197ee', '7c7db830-2584-5eac-8dcf-abeb6ca91d55', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('01fe200d-e09b-5312-a18e-c4a0cf6a4b31', '27f29a61-d895-5405-ab24-2d3f305197ee', 'dc23b8dd-7e75-583d-a661-962ac846c8b8', 'NE_PARTICIPERA_PAS', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('69e6e229-91f9-5439-a3db-bf79a6fb3b0e', '27f29a61-d895-5405-ab24-2d3f305197ee', '1a1ae694-fc50-5757-931c-51ac8bbdcfc5', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7acf4da9-b616-5349-94c8-a658acb56665', '27f29a61-d895-5405-ab24-2d3f305197ee', 'da6bf8d6-8287-52e0-a118-f9ed2eb61e7a', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7b346578-4af5-5a76-9d33-58541466b387', '27f29a61-d895-5405-ab24-2d3f305197ee', '47dbc521-229b-5806-be71-eb7d9f24fb1e', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fb4c0480-a8b1-5d22-9990-8090686fab62', '27f29a61-d895-5405-ab24-2d3f305197ee', 'fce07ac1-1fa2-5929-b89b-f38df176c1d1', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('87e886ae-7265-55f0-b280-749cc447a8a2', '27f29a61-d895-5405-ab24-2d3f305197ee', '58a64778-e962-5167-9c0b-5216c2e855d6', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1aea6d84-a03b-5a57-b2f2-313b17a291c1', '27f29a61-d895-5405-ab24-2d3f305197ee', 'fee119d8-46ac-5ea5-995c-bd2becc002ae', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('595853b2-1791-567c-9953-8623a75fb6b2', '27f29a61-d895-5405-ab24-2d3f305197ee', 'b5872f7c-6d3c-5f90-b99a-e6b4586cb9f2', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e4ba06b0-e0ac-5f1e-9e62-722a04b080be', '27f29a61-d895-5405-ab24-2d3f305197ee', '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2b8c348a-864d-5b4a-b261-f768c225a9de', '27f29a61-d895-5405-ab24-2d3f305197ee', '9d2aff63-4cd9-5acb-b774-d8d88967742d', 'NE_PARTICIPERA_PAS', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5c9022c9-2bf8-5c9e-834f-2714cec1c8d8', '27f29a61-d895-5405-ab24-2d3f305197ee', 'fc943673-dd44-5e31-bd35-82def3570012', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2d292c05-cd1b-598e-9f72-5d29e04ea31e', '27f29a61-d895-5405-ab24-2d3f305197ee', '422e77a7-ae81-5b28-be87-0e8d9b3c769d', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('11ff3af8-8ca0-5fb3-ade2-3544f44d437c', '27f29a61-d895-5405-ab24-2d3f305197ee', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f8824a5e-d08f-5ca7-817d-2878a740c69e', '27f29a61-d895-5405-ab24-2d3f305197ee', '87ce220b-bb1b-55b0-acb8-ff8e1bf24804', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a0aed2c0-e4c1-55b2-a9b5-e24433f2a049', '27f29a61-d895-5405-ab24-2d3f305197ee', 'd4575e51-15e5-5732-9202-060f7c776e6f', 'NE_PARTICIPERA_PAS', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('dd731247-6cdb-55e8-884c-98e5f33aef2b', '27f29a61-d895-5405-ab24-2d3f305197ee', 'bd120997-d5e4-5d5f-b3c3-19f7e71b8d44', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fc2896e5-e994-500a-981b-4bc9ebc04586', '27f29a61-d895-5405-ab24-2d3f305197ee', '58529a43-d7de-50da-887d-0d7a51fb5929', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e8159804-5dc5-5b34-88cf-780bcaf3455d', '27f29a61-d895-5405-ab24-2d3f305197ee', 'ee46384a-c14b-5eec-b37a-a8fb4409d9b7', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('43643493-f273-5dfc-8995-b49756c73ec1', 'Atelier : rédiger son mémoire de fin d’études', 'Atelier : rédiger son mémoire de fin d’études. Un rendez-vous ouvert à toute la communauté EPT. Apportez vos questions : un temps d’échange est prévu.', 'Bibliothèque de l’EPT',
  date_trunc('day', now()) + interval '-108 days' + interval '14 hours',
  date_trunc('day', now()) + interval '-108 days' + interval '16 hours',
  'ETUDIANTS', 40, true, 'PUBLIE', 'd61f79a6-6b3a-542f-89b1-08d81a347be8', '/api/evenement-images/43643493-f273-5dfc-8995-b49756c73ec1.jpg', now() - interval '118 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3df7b25b-6ae7-5441-8234-43d7c09409bb', '43643493-f273-5dfc-8995-b49756c73ec1', '422e77a7-ae81-5b28-be87-0e8d9b3c769d', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('45080f07-82c3-51bd-bcbe-46db904eef05', '43643493-f273-5dfc-8995-b49756c73ec1', '85d4ba18-d76f-5c2a-a240-dcf6baabd84c', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('17573833-8774-500f-9645-20763eec87c6', '43643493-f273-5dfc-8995-b49756c73ec1', 'd95c2e6e-2b83-501b-9ac4-49a06f4029bc', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4580cb2e-5e87-57c3-a892-63431c81eda3', '43643493-f273-5dfc-8995-b49756c73ec1', '2e3cf9f7-e4c1-523f-be84-d3ac97b3407e', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('76865c59-2688-5dee-b104-59b44b88e044', '43643493-f273-5dfc-8995-b49756c73ec1', 'd61f79a6-6b3a-542f-89b1-08d81a347be8', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('470f4074-9fe1-56e0-92ae-4a4df54519ae', '43643493-f273-5dfc-8995-b49756c73ec1', 'eb601a8f-ae9f-5a99-9b34-ffd994889776', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('959e0c62-a4ab-538b-aa0a-576aacd7e677', '43643493-f273-5dfc-8995-b49756c73ec1', 'ef6c88cb-7f71-5f28-b013-f3dc3f90329a', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fe8f1e41-2a65-59c7-9595-5d60a48741ea', '43643493-f273-5dfc-8995-b49756c73ec1', '31278c62-d3fb-59c0-b298-877946b40983', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4d858522-5315-52d5-8a19-e0ecfc20f60c', '43643493-f273-5dfc-8995-b49756c73ec1', 'bcceeeec-059e-5229-90b4-15838929d725', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9946e5ae-641e-53e6-8992-f2677424c148', '43643493-f273-5dfc-8995-b49756c73ec1', 'aeb42be6-c8b9-5936-9659-4fc41e322b16', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6d4578ad-c29f-5b60-86c9-ec09d44913c7', '43643493-f273-5dfc-8995-b49756c73ec1', 'b6fcfbae-d362-5ba1-bd18-d5057aea2f8d', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('82024950-14d5-5f89-a4e7-f628d5f4159e', '43643493-f273-5dfc-8995-b49756c73ec1', '8bc22c03-0373-5d99-a18d-1e1c2d71578c', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('881e6e5a-f80f-5b39-8eda-6306496add8f', '43643493-f273-5dfc-8995-b49756c73ec1', 'dc23b8dd-7e75-583d-a661-962ac846c8b8', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6a595483-d8dd-511c-bd4f-6e8c8ae7397f', '43643493-f273-5dfc-8995-b49756c73ec1', '1ec94b2d-dfb0-5400-8e05-00f259ccd5aa', 'NE_PARTICIPERA_PAS', now() - interval '19 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('d2498bb2-c86e-54f5-ba2f-89e294879ce4', 'Table ronde : ingénieures et leadership', 'Table ronde : ingénieures et leadership. Inscrivez-vous rapidement, les places sont limitées. Une collation sera offerte à l’issue de la rencontre.', 'En ligne',
  date_trunc('day', now()) + interval '-141 days' + interval '18 hours',
  date_trunc('day', now()) + interval '-141 days' + interval '24 hours',
  'TOUS', null, false, 'PUBLIE', '804935f3-67f5-5246-a0a0-1db7119996d7', null, now() - interval '151 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fbd39c6b-ca98-5893-b648-7d615f6da71a', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'bd120997-d5e4-5d5f-b3c3-19f7e71b8d44', 'NE_PARTICIPERA_PAS', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3b8b2ec9-9a07-5b87-a446-218d58a0efda', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'feadc7dc-098f-588a-ac2d-3f6e1623387e', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f201956e-80d4-5d6d-844d-19436f9767fd', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', '577385a3-9946-557b-be83-a8afaf69835f', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5ad7f7c0-051b-528e-bd9d-9f40bdbfa033', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'e84a9fc0-ca48-5c1a-85e1-f8fce2a9618a', 'NE_PARTICIPERA_PAS', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c7f79eea-ec83-586c-8b34-70ca527b8211', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'd634be2e-9272-5970-944b-55be40fef00b', 'NE_PARTICIPERA_PAS', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d8fb1ec9-7d7e-51b0-b7ab-e44e4da3a1b7', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', '85d4ba18-d76f-5c2a-a240-dcf6baabd84c', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('819bb82f-6809-5995-9bb0-57645972997a', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3021671b-6e6c-544d-81fb-7ac81a5bb188', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'a0363ce2-7f2e-5b3c-94c4-2f3a7a94d0ca', 'NE_PARTICIPERA_PAS', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('264d2f1e-7e48-5801-93be-dd3275519f3b', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'f88aefc3-5aef-5b0b-b217-82182448e43e', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('12dacdb6-225b-5a21-b77c-fb132ed8b6d2', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'dbf4d1a4-103d-5acd-9646-1a3e970d68c0', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('840cf3b3-bd66-50f4-9233-eb64d6fb1c6b', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8f4db94d-0bcc-5475-87e7-33c39dc90df6', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', '4bcb274c-796b-59c3-834f-5e321bfcd580', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f6743b4a-ee34-57e9-8010-07d3cf22492a', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'f8b792d4-c0da-5555-921c-45fad1f0a9da', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9a1e5139-332a-5c6b-9275-e9b45d6ab42a', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', '6c56f510-f428-5542-8194-1dedc960b84e', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e51c60b2-339b-5fb4-84d7-ca677f1d182f', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'b105f039-968f-520a-8860-da5b95b4482f', 'NE_PARTICIPERA_PAS', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f4649387-bc62-5266-8e63-e6b5b53b22fc', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', '93d2ab4b-627f-581f-a8e5-c9e3ba3cb819', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4ff71ca7-d541-5dbb-b1ee-d4b93672219b', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', '2ad470a2-5a14-59b3-b5b2-531d823f53b3', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('886df3a1-7d86-5fa4-bdce-fabcecf2e220', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'b58eb7ec-492a-5e00-b7d4-18d3b848066a', 'NE_PARTICIPERA_PAS', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0047e2e5-8881-5477-82c6-d44b08264599', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'c2e25360-dece-5880-89c5-b86ba7ded0e3', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('48b4dc48-e9d6-505c-91ed-f3872fa2b493', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'da6bf8d6-8287-52e0-a118-f9ed2eb61e7a', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('00b3a2aa-a036-5490-9ea2-fe12dabdb84a', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'bcceeeec-059e-5229-90b4-15838929d725', 'NE_PARTICIPERA_PAS', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2214a046-6409-5742-9fba-55109aa8f898', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', '31278c62-d3fb-59c0-b298-877946b40983', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('cfa0ff8c-4950-5dc0-9ec5-5140dbf3cfae', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'a079f292-6780-5517-9501-9a0439c347a7', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8e0a6c45-ab1b-52d0-85dd-3243801119c3', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', '33c4c54d-e3d2-5d47-9fb4-dcac89aabe0e', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('df22609c-0af7-52b2-afbe-57f9deff26c3', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'e3b60172-18f3-5bf7-9823-b8b6edfdb350', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('13f28964-ed0f-5dfc-a1b3-959ff70138be', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'c1fbb1ac-135a-57d9-894c-43881af45eaa', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2c6db1ba-80ed-5dd5-b31c-66314e04eed7', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'd657f819-3789-584f-ab12-f814e2e66008', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9a565c95-19fe-5182-88a8-d6e94af84e79', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'db11a9f9-a998-50ee-9a16-dba7266089bb', 'NE_PARTICIPERA_PAS', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2a5c6548-1977-5d8e-9c10-af8362dae72a', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', '8670e440-184b-5365-9e7b-3e0c983658b4', 'NE_PARTICIPERA_PAS', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('aaa84328-afa0-55c5-a06b-cc3d80ca82f3', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', '2e3cf9f7-e4c1-523f-be84-d3ac97b3407e', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('13eb4f0a-083c-55ef-baf2-25e961aa7b36', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', '9c5eaed3-8efd-5c3a-8045-b853a546ed9b', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5159a4e6-2a67-5d37-93db-fac0fc43bf44', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'e30df4e3-580d-5f8a-9ec9-5d29165f5ea3', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c3b1fa4f-a8ec-5dc1-9e55-d09d66733cea', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'e26b8671-16eb-54b9-b11f-ed3f99a912f5', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('46f9eea1-0b02-5db7-8486-025267b42c24', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'cdddccef-2bda-5223-ae7d-112ff4b1c9ac', 'NE_PARTICIPERA_PAS', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('17eed946-93d7-523e-90ed-09488794c7c3', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', '58a64778-e962-5167-9c0b-5216c2e855d6', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8c26d171-0346-5984-92dc-499680bfcddb', 'd2498bb2-c86e-54f5-ba2f-89e294879ce4', 'f2ddf2c7-06e2-56e5-b270-91ff9380f037', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('a7f5f150-48e1-508d-993d-e96f231daf9a', 'Retrouvailles de la promotion 2011', 'Retrouvailles de la promotion 2011. Un moment d’échange entre diplômés, étudiants et partenaires. Apportez vos questions : un temps d’échange est prévu.', 'Thiès',
  date_trunc('day', now()) + interval '8 days' + interval '18 hours',
  date_trunc('day', now()) + interval '8 days' + interval '22 hours',
  'ALUMNI', 80, false, 'PUBLIE', '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', null, now() - interval '18 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ce683b61-8741-5f48-be55-228e719db515', 'a7f5f150-48e1-508d-993d-e96f231daf9a', '848f10d0-ecf4-597a-9bb8-a4a950cf2294', 'NE_PARTICIPERA_PAS', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('130afb4b-3613-53e5-9f31-813f198b9c25', 'a7f5f150-48e1-508d-993d-e96f231daf9a', 'aa9de02b-b819-5dcb-9fed-e994479e6b7f', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b57e6817-9b92-5c1f-8024-effc2609c982', 'a7f5f150-48e1-508d-993d-e96f231daf9a', '2ad470a2-5a14-59b3-b5b2-531d823f53b3', 'NE_PARTICIPERA_PAS', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('dfbed2d2-ddd1-5bf9-a63c-18a78982ed09', 'a7f5f150-48e1-508d-993d-e96f231daf9a', '47dbc521-229b-5806-be71-eb7d9f24fb1e', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f9039aef-fb66-54c9-9f76-1dacd0f47236', 'a7f5f150-48e1-508d-993d-e96f231daf9a', '102b12e7-e8a2-59dc-9b3a-ab365bac18c2', 'NE_PARTICIPERA_PAS', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('76a2a843-8c50-5700-baee-113c2c60bbeb', 'a7f5f150-48e1-508d-993d-e96f231daf9a', '9f088eb6-0059-5cec-a0f2-d8cd281a702d', 'NE_PARTICIPERA_PAS', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('22121d10-c4bc-5cab-8200-f311b5946135', 'a7f5f150-48e1-508d-993d-e96f231daf9a', '4bcb274c-796b-59c3-834f-5e321bfcd580', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ba47e501-e6a1-5982-aef6-2311e4b0bb8a', 'a7f5f150-48e1-508d-993d-e96f231daf9a', '8d7ce8d8-e167-529b-be7e-4d8fd645a8fe', 'NE_PARTICIPERA_PAS', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e8d5e01b-3bb9-5987-aa10-cba6872fa814', 'a7f5f150-48e1-508d-993d-e96f231daf9a', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', 'NE_PARTICIPERA_PAS', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e27e081e-0b4f-50ad-9f39-9aa14dac0536', 'a7f5f150-48e1-508d-993d-e96f231daf9a', 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', 'NE_PARTICIPERA_PAS', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6cba0071-d782-5f85-97aa-32b7acb6415d', 'a7f5f150-48e1-508d-993d-e96f231daf9a', '4ef34c8c-1ebb-5b2d-9f8b-e1dea623166b', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('75d83ab9-3e63-579b-9035-a4868402bd7e', 'a7f5f150-48e1-508d-993d-e96f231daf9a', '03017916-9ccb-5538-bf6a-e8b136545408', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6b82ac57-605e-5217-bddb-1933ef2d9e04', 'a7f5f150-48e1-508d-993d-e96f231daf9a', '2ce655c2-b971-5cdf-8afd-9049eb1b237f', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'Journée découverte de la maintenance aéronautique', 'Journée découverte de la maintenance aéronautique. Un rendez-vous ouvert à toute la communauté EPT. Le programme détaillé sera envoyé aux inscrits.', 'AIBD, Diass',
  date_trunc('day', now()) + interval '-97 days' + interval '18 hours',
  date_trunc('day', now()) + interval '-97 days' + interval '20 hours',
  'ETUDIANTS', 30, false, 'PUBLIE', '848f10d0-ecf4-597a-9bb8-a4a950cf2294', '/api/evenement-images/2b72d8bb-025d-582b-ae74-5ac57a1bd64c.jpg', now() - interval '107 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('da057830-13a7-53a3-b58b-d194d140c4c0', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', '7c7db830-2584-5eac-8dcf-abeb6ca91d55', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('71a9ac6f-c2d0-5a40-b742-755b8863fe6a', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'f4b29068-7ff9-5610-9ad2-20474998efdd', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4b2beb62-7ece-5bf9-8757-0165ecfb348a', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5a91f6c4-082a-542b-8f24-6f18943a78d4', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', '6b507882-0089-585c-94df-f160023559ef', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1cec3385-6fd0-5369-aa49-7bd10036acea', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'cd98b0b9-9e1d-5f1e-a7ae-933f51e45989', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('554f86fa-ea27-56c8-9b05-a03a32121573', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'd61f79a6-6b3a-542f-89b1-08d81a347be8', 'NE_PARTICIPERA_PAS', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e3319f37-fc04-5a61-9e22-a17ab90602fa', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'dcf23cda-8f49-52ba-af43-69e5ff8a2e6c', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('74184d38-f508-5097-a6f7-57d51080ff9f', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', '95f0f598-aeda-59f7-8df3-e74bd10dc64d', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fc970a4e-6a63-51fb-bd9b-66c0691bcb11', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', '85d4ba18-d76f-5c2a-a240-dcf6baabd84c', 'NE_PARTICIPERA_PAS', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ab9becc5-6341-519f-b07a-4e5116033b0d', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', '422e77a7-ae81-5b28-be87-0e8d9b3c769d', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('72918374-0d20-5495-aa41-da55e00d93d8', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'd0540eb7-c40f-5b4d-b71f-67e26f1f2203', 'NE_PARTICIPERA_PAS', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9e69a967-9a3a-5d27-ab31-7ecb5c5eee41', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'dc23b8dd-7e75-583d-a661-962ac846c8b8', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3cf126d8-5602-553f-990b-302f8c3d4c49', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', '31278c62-d3fb-59c0-b298-877946b40983', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('33f85deb-2163-5ee0-a0e6-3ab77dc1e23d', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'fce07ac1-1fa2-5929-b89b-f38df176c1d1', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('aa11f707-a88f-5742-9b7b-a89b6879ea0d', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', '33c4c54d-e3d2-5d47-9fb4-dcac89aabe0e', 'NE_PARTICIPERA_PAS', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5bc8f303-8e43-5351-83e9-8ebb6650d867', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', '3c57b1aa-4676-5875-8440-d925477549d6', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5e63dd86-dd5f-52b0-a374-ed9e5fb2bbd7', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'eb601a8f-ae9f-5a99-9b34-ffd994889776', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4f22021a-8c6d-583e-9ca5-0b10803ae323', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'd257bd7c-c404-57a1-a4fc-662d31f7a29d', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('02a97fa8-06ac-5b01-97e9-451e465d5667', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', '80d38c99-6816-528d-b682-9a6617f4f3a4', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('914d139d-cd98-557f-bf43-eca9d3ba0591', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', '5c97b403-1475-5719-863d-b06958f0ad7b', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('c4db90f4-c55e-5dc7-93cd-8736a4260460', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', '74a06960-9dce-51ad-aa8f-af54c468706b', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d43885ea-95d8-5077-9af1-1951875d9f36', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'da6bf8d6-8287-52e0-a118-f9ed2eb61e7a', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('88c40606-4850-5039-9fab-59c20ece5a67', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'fc943673-dd44-5e31-bd35-82def3570012', 'PARTICIPERA', now() - interval '18 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d1305209-592c-518c-b738-2cc541b6e400', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'bcceeeec-059e-5229-90b4-15838929d725', 'PARTICIPERA', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d4f5bf45-8f0a-5a87-8a97-d6aee824cc5f', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', '2e3cf9f7-e4c1-523f-be84-d3ac97b3407e', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a956d700-07ab-543a-9161-e787f2c7e45e', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'a04dcec7-743b-55ad-82f2-a4be51bce88c', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('2c4377b4-f3df-5776-bbf7-e04f886918bd', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'f2ddf2c7-06e2-56e5-b270-91ff9380f037', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('283fb190-42a6-5534-b2b4-3ae3d8347c6b', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'fd2abcc5-5026-56f8-9739-ad5c6994612f', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('465b1321-c1e2-50dc-9865-edd6b6efaa7a', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'bd120997-d5e4-5d5f-b3c3-19f7e71b8d44', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f6ef1d4f-d28e-50aa-8efb-aeaf0f7149fe', '2b72d8bb-025d-582b-ae74-5ac57a1bd64c', 'd4575e51-15e5-5732-9202-060f7c776e6f', 'NE_PARTICIPERA_PAS', now() - interval '7 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('2189f306-eef4-5618-af94-7f984b95ef9c', 'Conférence : villes durables et urbanisme', 'Conférence : villes durables et urbanisme. Un moment d’échange entre diplômés, étudiants et partenaires. Une collation sera offerte à l’issue de la rencontre.', 'Agence des infrastructures de Thiès',
  date_trunc('day', now()) + interval '5 days' + interval '9 hours',
  date_trunc('day', now()) + interval '5 days' + interval '13 hours',
  'TOUS', 90, false, 'PUBLIE', 'f604100c-50ad-5847-9b95-008b78aea6a1', '/api/evenement-images/2189f306-eef4-5618-af94-7f984b95ef9c.jpg', now() - interval '15 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b37dc3f2-b884-5c00-a4b1-a0222fc9ebcf', '2189f306-eef4-5618-af94-7f984b95ef9c', 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('761741ec-2edb-557d-8a06-3be32386bb3f', '2189f306-eef4-5618-af94-7f984b95ef9c', 'cdddccef-2bda-5223-ae7d-112ff4b1c9ac', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7adf4cb9-8dda-56b2-bf94-a7237e726735', '2189f306-eef4-5618-af94-7f984b95ef9c', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('414b3252-c5f8-51ee-b425-95c2e7b87698', '2189f306-eef4-5618-af94-7f984b95ef9c', 'a04dcec7-743b-55ad-82f2-a4be51bce88c', 'NE_PARTICIPERA_PAS', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1b02606d-d7e9-5caa-9fd4-ecfdadd22b07', '2189f306-eef4-5618-af94-7f984b95ef9c', 'd4575e51-15e5-5732-9202-060f7c776e6f', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6bffd54c-e6f3-56b9-9cae-f4c1dd735e1f', '2189f306-eef4-5618-af94-7f984b95ef9c', 'fee119d8-46ac-5ea5-995c-bd2becc002ae', 'NE_PARTICIPERA_PAS', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4ac9bf61-7523-5355-b164-fc172222dc82', '2189f306-eef4-5618-af94-7f984b95ef9c', 'fd2abcc5-5026-56f8-9739-ad5c6994612f', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('6d234cc3-0509-5a12-bbdb-d5f25dd95ef5', '2189f306-eef4-5618-af94-7f984b95ef9c', '58a64778-e962-5167-9c0b-5216c2e855d6', 'PARTICIPERA', now() - interval '2 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8cf8cb50-1871-5c72-8a53-560b9d35f3d9', '2189f306-eef4-5618-af94-7f984b95ef9c', '74a06960-9dce-51ad-aa8f-af54c468706b', 'NE_PARTICIPERA_PAS', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('cab7ff1f-ad03-549d-b860-b3bb65da1252', '2189f306-eef4-5618-af94-7f984b95ef9c', 'd257bd7c-c404-57a1-a4fc-662d31f7a29d', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0d378d9e-b65d-52d6-a9e2-3cb7c30e9995', '2189f306-eef4-5618-af94-7f984b95ef9c', '4bcb274c-796b-59c3-834f-5e321bfcd580', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0ac6b39c-56e0-5ef4-a714-bdb589177cf1', '2189f306-eef4-5618-af94-7f984b95ef9c', '8bc22c03-0373-5d99-a18d-1e1c2d71578c', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('7f6291f6-534a-5935-8320-64b2440aabef', '2189f306-eef4-5618-af94-7f984b95ef9c', 'dbf4d1a4-103d-5acd-9646-1a3e970d68c0', 'NE_PARTICIPERA_PAS', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a0146e61-7a29-5977-97f8-5ebc5dd7c5ab', '2189f306-eef4-5618-af94-7f984b95ef9c', '03017916-9ccb-5538-bf6a-e8b136545408', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('4c76cd1e-37ce-5f20-886f-443fa3e11699', '2189f306-eef4-5618-af94-7f984b95ef9c', '6140551c-046e-5ae3-a2d5-7a9d63de1fc1', 'PARTICIPERA', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('96293da4-fda2-545a-a37b-99665efb607f', '2189f306-eef4-5618-af94-7f984b95ef9c', '95baa7f1-b8e2-574d-93a4-6e67ae22b3fa', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('8c9ab8a3-fd82-5ff0-b236-644d6b9de992', '2189f306-eef4-5618-af94-7f984b95ef9c', '2dff725c-6ec3-5b75-b826-d333f238f88f', 'NE_PARTICIPERA_PAS', now() - interval '8 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('434e8752-7fd1-55da-a14e-7ecb05e562ca', '2189f306-eef4-5618-af94-7f984b95ef9c', '9d2aff63-4cd9-5acb-b774-d8d88967742d', 'PARTICIPERA', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b3370c78-4533-506a-a19e-b3b105b2b748', '2189f306-eef4-5618-af94-7f984b95ef9c', 'ead565a2-323e-591b-84d0-8db8bda4c57b', 'NE_PARTICIPERA_PAS', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('b7fb56ad-961d-5867-aff9-92cc1e8b8625', '2189f306-eef4-5618-af94-7f984b95ef9c', 'bcceeeec-059e-5229-90b4-15838929d725', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d8505677-658e-58fa-a545-1605dedac2e4', '2189f306-eef4-5618-af94-7f984b95ef9c', 'cd98b0b9-9e1d-5f1e-a7ae-933f51e45989', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fce2eeb3-5858-5c3a-999b-5796589f439a', '2189f306-eef4-5618-af94-7f984b95ef9c', '2ad470a2-5a14-59b3-b5b2-531d823f53b3', 'NE_PARTICIPERA_PAS', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d90cb552-6130-5edc-8d56-75fa9d6acf0a', '2189f306-eef4-5618-af94-7f984b95ef9c', '32139e9c-9e23-5367-a1f4-8446a769fc85', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into evenements (id, titre, description, lieu, date_debut, date_fin, audience, nombre_places, officiel_ept, statut, organisateur_id, url_image, cree_le, modifie_le)
values ('cc938bca-3d06-5d5a-880b-d9e5a5153545', 'Atelier : créer son premier tableau de bord de données', 'Atelier : créer son premier tableau de bord de données. Inscrivez-vous rapidement, les places sont limitées. Le programme détaillé sera envoyé aux inscrits.', 'En ligne',
  date_trunc('day', now()) + interval '-70 days' + interval '14 hours',
  date_trunc('day', now()) + interval '-70 days' + interval '17 hours',
  'TOUS', 80, false, 'PUBLIE', 'dbf4d1a4-103d-5acd-9646-1a3e970d68c0', null, now() - interval '80 days', now())
on conflict (id) do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('33d934b5-9b8e-59fd-8a13-04ee15dfc32d', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', 'aeb42be6-c8b9-5936-9659-4fc41e322b16', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('f2aca9d7-1e85-5db0-ba26-3bb4a93b11c8', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1153d18b-2a8b-5b45-ac32-ac37fe3b32f8', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '6fa62627-bf15-591d-8334-e0939916dc4f', 'NE_PARTICIPERA_PAS', now() - interval '7 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('dbae05d0-b38c-52c9-9dbf-1761686db99c', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '4a73bb2a-d738-5997-a201-df09d1c31953', 'PARTICIPERA', now() - interval '15 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a931dad6-4259-5c41-a539-1bf14611924a', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '9f088eb6-0059-5cec-a0f2-d8cd281a702d', 'PARTICIPERA', now() - interval '20 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('913ac938-442d-54a2-b23e-4ff2b4dec69a', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', 'b5872f7c-6d3c-5f90-b99a-e6b4586cb9f2', 'PARTICIPERA', now() - interval '17 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5ddc755b-4305-5894-b9b9-70415f39da77', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', 'd634be2e-9272-5970-944b-55be40fef00b', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0ce24059-0ae2-55c0-be65-e0715d20506a', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', 'b105f039-968f-520a-8860-da5b95b4482f', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('1d653978-524b-5764-a0c6-ab903745d8c3', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '6b507882-0089-585c-94df-f160023559ef', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('e2128900-758a-5884-b90b-206ecbd7483c', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '804935f3-67f5-5246-a0a0-1db7119996d7', 'NE_PARTICIPERA_PAS', now() - interval '14 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d0b93753-77a8-5910-96b8-74f9df6fe516', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', 'ead565a2-323e-591b-84d0-8db8bda4c57b', 'PARTICIPERA', now() - interval '6 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('65f6dbca-070f-5572-8333-262d2ab70612', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '5809136a-2a1b-52d9-bd37-16cb2afcac33', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('a2ea9ac7-cde6-54cd-946b-b5596ba3d2a4', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '31278c62-d3fb-59c0-b298-877946b40983', 'PARTICIPERA', now() - interval '9 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ce24452e-564c-5c2e-97d2-fe472027ddf2', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '6593d854-bb87-5921-a69f-4167b7a5e904', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('d58a894b-eda4-5d8e-8cdd-dbbff47555dd', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '9d2aff63-4cd9-5acb-b774-d8d88967742d', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('ad4066b6-67d6-5a8b-ab09-82879594adc6', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '713d3bed-9680-507d-902f-f81fe90e43f4', 'PARTICIPERA', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('bd1dde71-f800-52a1-ba47-b1b585ca1c49', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', 'aa9de02b-b819-5dcb-9fed-e994479e6b7f', 'PARTICIPERA', now() - interval '19 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9b70e482-e9df-5dc9-b9d3-88e3e6f7a00b', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '8f0a4694-dbd7-56ef-8a66-f9b0169504e8', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('702f448f-faa0-5f4a-971b-1986f7e2f6b8', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', 'dbf4d1a4-103d-5acd-9646-1a3e970d68c0', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('55933a20-9a8b-53b8-80ea-559acdf4a195', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', 'a69bb100-a789-56a8-860d-1a65c7f840eb', 'PARTICIPERA', now() - interval '12 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('0d318fc1-e350-5163-aa78-38cff30c4957', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', 'ec3fef72-9456-5acc-9639-000d9e507c1a', 'PARTICIPERA', now() - interval '1 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('5533fc1d-1460-5b6e-9539-f4cd3334c768', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', 'e84a9fc0-ca48-5c1a-85e1-f8fce2a9618a', 'PARTICIPERA', now() - interval '11 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('3d3e9286-597f-57fa-9dfa-83196a4aaa5b', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', 'cd98b0b9-9e1d-5f1e-a7ae-933f51e45989', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('174b7453-2634-507e-a687-15bcee108de8', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '6b674cd4-406f-546f-aae4-5a78a5d13b31', 'PARTICIPERA', now() - interval '3 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('52765a3e-1d8c-5978-81a9-4ab3a0304dc5', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', 'a356c8fe-aad9-58e3-bfc2-29bca745f15a', 'PARTICIPERA', now() - interval '16 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9270a028-dae1-5320-82d6-ff3068a09951', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', 'fee119d8-46ac-5ea5-995c-bd2becc002ae', 'PARTICIPERA', now() - interval '5 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('fca3666d-b96a-56cd-b724-fd97bf7e5aca', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '422e77a7-ae81-5b28-be87-0e8d9b3c769d', 'PARTICIPERA', now() - interval '13 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('399b8139-fac2-568d-b3cb-199b8da7d30b', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', 'f2ddf2c7-06e2-56e5-b270-91ff9380f037', 'NE_PARTICIPERA_PAS', now() - interval '10 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('9fad64e9-6ad2-51f0-b574-4c3ae1ed19a3', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '58bf6984-dbbe-5b82-afe6-3f8c58a1be77', 'PARTICIPERA', now() - interval '4 days') on conflict do nothing;
insert into participations_evenement (id, evenement_id, utilisateur_id, reponse, repondu_le) values ('52582057-f4ab-5e8f-b2e0-eb9433c602d6', 'cc938bca-3d06-5d5a-880b-d9e5a5153545', '577385a3-9946-557b-be83-a8afaf69835f', 'NE_PARTICIPERA_PAS', now() - interval '20 days') on conflict do nothing;
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('453ce789-9929-52c6-bb28-347873e6c5e8', '5809136a-2a1b-52d9-bd37-16cb2afcac33', 'Ingénieure génie civil (promo 2018). J’accompagne les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 3, now() - interval '191 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '453ce789-9929-52c6-bb28-347873e6c5e8', d.id from domaines_mentorat d where d.code = 'GENIE_CIVIL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '453ce789-9929-52c6-bb28-347873e6c5e8' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '453ce789-9929-52c6-bb28-347873e6c5e8', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '453ce789-9929-52c6-bb28-347873e6c5e8' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '453ce789-9929-52c6-bb28-347873e6c5e8', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '453ce789-9929-52c6-bb28-347873e6c5e8' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('51288483-57ad-5409-9ba5-97aace860b35', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', 'Ingénieure génie électromécanique (promo 2006). J’accompagne les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 3, now() - interval '36 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '51288483-57ad-5409-9ba5-97aace860b35', d.id from domaines_mentorat d where d.code = 'ELECTROMECANIQUE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '51288483-57ad-5409-9ba5-97aace860b35' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '51288483-57ad-5409-9ba5-97aace860b35', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '51288483-57ad-5409-9ba5-97aace860b35' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('54176e12-437b-58d6-adce-220848f9fb9e', '87ce220b-bb1b-55b0-acb8-ff8e1bf24804', 'Ingénieure génie aéronautique et aérospatial (promo 2015). Disponible pour relire CV et lettres, simuler des entretiens et parler des métiers de ma filière.', true, 4, now() - interval '22 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '54176e12-437b-58d6-adce-220848f9fb9e', d.id from domaines_mentorat d where d.code = 'ELECTROMECANIQUE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '54176e12-437b-58d6-adce-220848f9fb9e' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '54176e12-437b-58d6-adce-220848f9fb9e', d.id from domaines_mentorat d where d.code = 'CONCOURS_ETUDES'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '54176e12-437b-58d6-adce-220848f9fb9e' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '54176e12-437b-58d6-adce-220848f9fb9e', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '54176e12-437b-58d6-adce-220848f9fb9e' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('8601a9ce-93d7-5054-a93f-a5d326a172ed', '760ed432-29c6-5dad-9d2d-ec90276f6f75', 'Ingénieure génie civil (promo 2002). Disponible pour relire CV et lettres, simuler des entretiens et parler des métiers de ma filière.', true, 3, now() - interval '164 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '8601a9ce-93d7-5054-a93f-a5d326a172ed', d.id from domaines_mentorat d where d.code = 'GENIE_CIVIL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '8601a9ce-93d7-5054-a93f-a5d326a172ed' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '8601a9ce-93d7-5054-a93f-a5d326a172ed', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '8601a9ce-93d7-5054-a93f-a5d326a172ed' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '8601a9ce-93d7-5054-a93f-a5d326a172ed', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '8601a9ce-93d7-5054-a93f-a5d326a172ed' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('a84cd4b4-2f6c-5380-8c64-3e7082b156f3', 'c1fbb1ac-135a-57d9-894c-43881af45eaa', 'Ingénieur génie informatique et télécommunications (promo 2021). Ancien de l’EPT, j’aide à construire un projet professionnel réaliste et à préparer la mobilité à l’international.', false, 1, now() - interval '11 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'a84cd4b4-2f6c-5380-8c64-3e7082b156f3', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'a84cd4b4-2f6c-5380-8c64-3e7082b156f3' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'a84cd4b4-2f6c-5380-8c64-3e7082b156f3', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'a84cd4b4-2f6c-5380-8c64-3e7082b156f3' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'a84cd4b4-2f6c-5380-8c64-3e7082b156f3', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'a84cd4b4-2f6c-5380-8c64-3e7082b156f3' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('cdaf54f9-e73d-5e9f-bf8e-c6a9de0fb1a1', '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', 'Ingénieur génie électromécanique (promo 2013). Ancien de l’EPT, j’aide à construire un projet professionnel réaliste et à préparer la mobilité à l’international.', true, 4, now() - interval '167 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'cdaf54f9-e73d-5e9f-bf8e-c6a9de0fb1a1', d.id from domaines_mentorat d where d.code = 'ELECTROMECANIQUE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'cdaf54f9-e73d-5e9f-bf8e-c6a9de0fb1a1' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'cdaf54f9-e73d-5e9f-bf8e-c6a9de0fb1a1', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'cdaf54f9-e73d-5e9f-bf8e-c6a9de0fb1a1' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('62af8214-9016-5b27-a721-c13f133c7011', '2c80d750-a819-5513-b56c-483c3c6d0379', 'Ingénieure génie informatique et télécommunications (promo 2016). Disponible pour relire CV et lettres, simuler des entretiens et parler des métiers de ma filière.', false, 1, now() - interval '14 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '62af8214-9016-5b27-a721-c13f133c7011', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '62af8214-9016-5b27-a721-c13f133c7011' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '62af8214-9016-5b27-a721-c13f133c7011', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '62af8214-9016-5b27-a721-c13f133c7011' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '62af8214-9016-5b27-a721-c13f133c7011', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '62af8214-9016-5b27-a721-c13f133c7011' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('3eb74da8-ff45-577e-9662-b3005c74716c', 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', 'Ingénieur génie civil (promo 2016). Disponible pour relire CV et lettres, simuler des entretiens et parler des métiers de ma filière.', false, 1, now() - interval '189 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '3eb74da8-ff45-577e-9662-b3005c74716c', d.id from domaines_mentorat d where d.code = 'GENIE_CIVIL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '3eb74da8-ff45-577e-9662-b3005c74716c' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '3eb74da8-ff45-577e-9662-b3005c74716c', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '3eb74da8-ff45-577e-9662-b3005c74716c' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '3eb74da8-ff45-577e-9662-b3005c74716c', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '3eb74da8-ff45-577e-9662-b3005c74716c' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('d4b43832-3669-5357-b5f4-c544278efd6e', '58bf6984-dbbe-5b82-afe6-3f8c58a1be77', 'Ingénieur génie industriel (promo 2018). Ancien de l’EPT, j’aide à construire un projet professionnel réaliste et à préparer la mobilité à l’international.', false, 2, now() - interval '74 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'd4b43832-3669-5357-b5f4-c544278efd6e', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'd4b43832-3669-5357-b5f4-c544278efd6e' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'd4b43832-3669-5357-b5f4-c544278efd6e', d.id from domaines_mentorat d where d.code = 'ENTREPRENEURIAT'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'd4b43832-3669-5357-b5f4-c544278efd6e' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('60aee8e1-666f-56df-bd65-3b4416814cf7', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', 'Ingénieure génie informatique et télécommunications (promo 2006). Je partage volontiers mon expérience de terrain : organisation du travail, montée en compétences, évolution de carrière.', true, 3, now() - interval '43 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '60aee8e1-666f-56df-bd65-3b4416814cf7', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '60aee8e1-666f-56df-bd65-3b4416814cf7' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '60aee8e1-666f-56df-bd65-3b4416814cf7', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '60aee8e1-666f-56df-bd65-3b4416814cf7' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '60aee8e1-666f-56df-bd65-3b4416814cf7', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '60aee8e1-666f-56df-bd65-3b4416814cf7' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('82b50c00-83e7-5482-9e09-d59913d3f62b', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', 'Ingénieur génie électromécanique (promo 2013). Ancien de l’EPT, j’aide à construire un projet professionnel réaliste et à préparer la mobilité à l’international.', true, 2, now() - interval '138 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '82b50c00-83e7-5482-9e09-d59913d3f62b', d.id from domaines_mentorat d where d.code = 'ELECTROMECANIQUE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '82b50c00-83e7-5482-9e09-d59913d3f62b' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '82b50c00-83e7-5482-9e09-d59913d3f62b', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '82b50c00-83e7-5482-9e09-d59913d3f62b' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('a0823cc1-e79c-58cb-b788-7b7b43177154', '2b34d94e-66b2-5292-8f66-8cde42ae3106', 'Ingénieure génie aéronautique et aérospatial (promo 2018). Je partage volontiers mon expérience de terrain : organisation du travail, montée en compétences, évolution de carrière.', true, 1, now() - interval '187 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'a0823cc1-e79c-58cb-b788-7b7b43177154', d.id from domaines_mentorat d where d.code = 'ELECTROMECANIQUE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'a0823cc1-e79c-58cb-b788-7b7b43177154' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'a0823cc1-e79c-58cb-b788-7b7b43177154', d.id from domaines_mentorat d where d.code = 'CONCOURS_ETUDES'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'a0823cc1-e79c-58cb-b788-7b7b43177154' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'a0823cc1-e79c-58cb-b788-7b7b43177154', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'a0823cc1-e79c-58cb-b788-7b7b43177154' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('660efa68-b94a-566b-ab13-efd4cb8d5ca9', '713d3bed-9680-507d-902f-f81fe90e43f4', 'Ingénieur génie aéronautique et aérospatial (promo 2017). Disponible pour relire CV et lettres, simuler des entretiens et parler des métiers de ma filière.', true, 3, now() - interval '49 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '660efa68-b94a-566b-ab13-efd4cb8d5ca9', d.id from domaines_mentorat d where d.code = 'ELECTROMECANIQUE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '660efa68-b94a-566b-ab13-efd4cb8d5ca9' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '660efa68-b94a-566b-ab13-efd4cb8d5ca9', d.id from domaines_mentorat d where d.code = 'CONCOURS_ETUDES'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '660efa68-b94a-566b-ab13-efd4cb8d5ca9' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '660efa68-b94a-566b-ab13-efd4cb8d5ca9', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '660efa68-b94a-566b-ab13-efd4cb8d5ca9' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('5c17ae6b-9202-5851-a7a8-2797e3d92e54', 'b5872f7c-6d3c-5f90-b99a-e6b4586cb9f2', 'Ingénieur génie électromécanique (promo 2007). Ancien de l’EPT, j’aide à construire un projet professionnel réaliste et à préparer la mobilité à l’international.', true, 1, now() - interval '86 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '5c17ae6b-9202-5851-a7a8-2797e3d92e54', d.id from domaines_mentorat d where d.code = 'ELECTROMECANIQUE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '5c17ae6b-9202-5851-a7a8-2797e3d92e54' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '5c17ae6b-9202-5851-a7a8-2797e3d92e54', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '5c17ae6b-9202-5851-a7a8-2797e3d92e54' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '5c17ae6b-9202-5851-a7a8-2797e3d92e54', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '5c17ae6b-9202-5851-a7a8-2797e3d92e54' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('3642683f-fbdc-5c6e-8adc-c2f294bc9275', '03017916-9ccb-5538-bf6a-e8b136545408', 'Ingénieure génie civil (promo 2022). J’accompagne les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 3, now() - interval '68 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '3642683f-fbdc-5c6e-8adc-c2f294bc9275', d.id from domaines_mentorat d where d.code = 'GENIE_CIVIL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '3642683f-fbdc-5c6e-8adc-c2f294bc9275' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '3642683f-fbdc-5c6e-8adc-c2f294bc9275', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '3642683f-fbdc-5c6e-8adc-c2f294bc9275' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('6bcd817c-bca9-5966-b26b-57a4c1d1d32c', '32139e9c-9e23-5367-a1f4-8446a769fc85', 'Ingénieur génie informatique et télécommunications (promo 2018). Ancien de l’EPT, j’aide à construire un projet professionnel réaliste et à préparer la mobilité à l’international.', true, 1, now() - interval '24 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '6bcd817c-bca9-5966-b26b-57a4c1d1d32c', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '6bcd817c-bca9-5966-b26b-57a4c1d1d32c' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '6bcd817c-bca9-5966-b26b-57a4c1d1d32c', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '6bcd817c-bca9-5966-b26b-57a4c1d1d32c' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '6bcd817c-bca9-5966-b26b-57a4c1d1d32c', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '6bcd817c-bca9-5966-b26b-57a4c1d1d32c' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('1ccbfb4c-dc27-56c7-b537-90cd8f9931a5', '8670e440-184b-5365-9e7b-3e0c983658b4', 'Ingénieure génie industriel (promo 2018). Je partage volontiers mon expérience de terrain : organisation du travail, montée en compétences, évolution de carrière.', true, 3, now() - interval '195 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '1ccbfb4c-dc27-56c7-b537-90cd8f9931a5', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '1ccbfb4c-dc27-56c7-b537-90cd8f9931a5' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '1ccbfb4c-dc27-56c7-b537-90cd8f9931a5', d.id from domaines_mentorat d where d.code = 'ENTREPRENEURIAT'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '1ccbfb4c-dc27-56c7-b537-90cd8f9931a5' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('1eb3992b-1260-5784-8246-49163c0bd2d9', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', 'Ingénieur génie informatique et télécommunications (promo 2019). J’accompagne les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 2, now() - interval '169 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '1eb3992b-1260-5784-8246-49163c0bd2d9', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '1eb3992b-1260-5784-8246-49163c0bd2d9' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '1eb3992b-1260-5784-8246-49163c0bd2d9', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '1eb3992b-1260-5784-8246-49163c0bd2d9' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('5f3c48e7-4acb-59be-a3d0-85f3325b6772', '8f0a4694-dbd7-56ef-8a66-f9b0169504e8', 'Ingénieur génie électromécanique (promo 2009). J’accompagne les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 2, now() - interval '60 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '5f3c48e7-4acb-59be-a3d0-85f3325b6772', d.id from domaines_mentorat d where d.code = 'ELECTROMECANIQUE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '5f3c48e7-4acb-59be-a3d0-85f3325b6772' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '5f3c48e7-4acb-59be-a3d0-85f3325b6772', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '5f3c48e7-4acb-59be-a3d0-85f3325b6772' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('652995d5-49ee-52a6-bc6a-6e379337a43c', '6140551c-046e-5ae3-a2d5-7a9d63de1fc1', 'Ingénieur génie industriel (promo 2011). J’accompagne les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 3, now() - interval '40 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '652995d5-49ee-52a6-bc6a-6e379337a43c', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '652995d5-49ee-52a6-bc6a-6e379337a43c' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '652995d5-49ee-52a6-bc6a-6e379337a43c', d.id from domaines_mentorat d where d.code = 'ENTREPRENEURIAT'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '652995d5-49ee-52a6-bc6a-6e379337a43c' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '652995d5-49ee-52a6-bc6a-6e379337a43c', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '652995d5-49ee-52a6-bc6a-6e379337a43c' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('c1341c31-185c-5b60-b59a-89bd9f44e9f4', 'd657f819-3789-584f-ab12-f814e2e66008', 'Ingénieure génie électromécanique (promo 2002). Disponible pour relire CV et lettres, simuler des entretiens et parler des métiers de ma filière.', true, 2, now() - interval '88 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'c1341c31-185c-5b60-b59a-89bd9f44e9f4', d.id from domaines_mentorat d where d.code = 'ELECTROMECANIQUE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'c1341c31-185c-5b60-b59a-89bd9f44e9f4' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'c1341c31-185c-5b60-b59a-89bd9f44e9f4', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'c1341c31-185c-5b60-b59a-89bd9f44e9f4' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('6af2751d-5034-5159-b7c6-fbf32b6464a7', 'f8b792d4-c0da-5555-921c-45fad1f0a9da', 'Ingénieure génie informatique et télécommunications (promo 2010). Disponible pour relire CV et lettres, simuler des entretiens et parler des métiers de ma filière.', true, 3, now() - interval '186 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '6af2751d-5034-5159-b7c6-fbf32b6464a7', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '6af2751d-5034-5159-b7c6-fbf32b6464a7' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '6af2751d-5034-5159-b7c6-fbf32b6464a7', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '6af2751d-5034-5159-b7c6-fbf32b6464a7' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '6af2751d-5034-5159-b7c6-fbf32b6464a7', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '6af2751d-5034-5159-b7c6-fbf32b6464a7' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('045b4859-3996-58a7-966d-831c90c90973', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', 'Ingénieur génie informatique et télécommunications (promo 2020). J’accompagne les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', false, 2, now() - interval '146 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '045b4859-3996-58a7-966d-831c90c90973', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '045b4859-3996-58a7-966d-831c90c90973' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '045b4859-3996-58a7-966d-831c90c90973', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '045b4859-3996-58a7-966d-831c90c90973' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '045b4859-3996-58a7-966d-831c90c90973', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '045b4859-3996-58a7-966d-831c90c90973' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('5f823e34-fc3d-515c-9ca1-c95f311c6ca8', '235c7b1c-4170-52c0-9469-475b0210cb78', 'Ingénieure génie électromécanique (promo 2019). J’accompagne les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 3, now() - interval '64 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '5f823e34-fc3d-515c-9ca1-c95f311c6ca8', d.id from domaines_mentorat d where d.code = 'ELECTROMECANIQUE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '5f823e34-fc3d-515c-9ca1-c95f311c6ca8' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '5f823e34-fc3d-515c-9ca1-c95f311c6ca8', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '5f823e34-fc3d-515c-9ca1-c95f311c6ca8' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '5f823e34-fc3d-515c-9ca1-c95f311c6ca8', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '5f823e34-fc3d-515c-9ca1-c95f311c6ca8' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('6593bd3d-5461-5921-8cb5-05ab3975220c', 'cdddccef-2bda-5223-ae7d-112ff4b1c9ac', 'Ingénieure génie industriel (promo 2014). J’accompagne les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 4, now() - interval '158 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '6593bd3d-5461-5921-8cb5-05ab3975220c', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '6593bd3d-5461-5921-8cb5-05ab3975220c' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '6593bd3d-5461-5921-8cb5-05ab3975220c', d.id from domaines_mentorat d where d.code = 'ENTREPRENEURIAT'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '6593bd3d-5461-5921-8cb5-05ab3975220c' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '6593bd3d-5461-5921-8cb5-05ab3975220c', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '6593bd3d-5461-5921-8cb5-05ab3975220c' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('96c47a9d-4bcc-5b66-914f-c63be7a75b5e', '9c5eaed3-8efd-5c3a-8045-b853a546ed9b', 'Ingénieur génie informatique et télécommunications (promo 2018). Je partage volontiers mon expérience de terrain : organisation du travail, montée en compétences, évolution de carrière.', true, 4, now() - interval '70 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '96c47a9d-4bcc-5b66-914f-c63be7a75b5e', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '96c47a9d-4bcc-5b66-914f-c63be7a75b5e' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '96c47a9d-4bcc-5b66-914f-c63be7a75b5e', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '96c47a9d-4bcc-5b66-914f-c63be7a75b5e' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '96c47a9d-4bcc-5b66-914f-c63be7a75b5e', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '96c47a9d-4bcc-5b66-914f-c63be7a75b5e' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('0dc53485-ec26-5833-beae-dcb1f7cd2fa5', 'b105f039-968f-520a-8860-da5b95b4482f', 'Ingénieure génie informatique et télécommunications (promo 2014). Disponible pour relire CV et lettres, simuler des entretiens et parler des métiers de ma filière.', true, 1, now() - interval '47 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '0dc53485-ec26-5833-beae-dcb1f7cd2fa5', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '0dc53485-ec26-5833-beae-dcb1f7cd2fa5' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '0dc53485-ec26-5833-beae-dcb1f7cd2fa5', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '0dc53485-ec26-5833-beae-dcb1f7cd2fa5' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('981f6855-3718-5345-9be2-7b44dbf2849c', 'ba62afaa-e97b-5dfd-b99f-cc115508f551', 'Ingénieur génie industriel (promo 2009). Ancien de l’EPT, j’aide à construire un projet professionnel réaliste et à préparer la mobilité à l’international.', true, 4, now() - interval '184 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '981f6855-3718-5345-9be2-7b44dbf2849c', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '981f6855-3718-5345-9be2-7b44dbf2849c' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '981f6855-3718-5345-9be2-7b44dbf2849c', d.id from domaines_mentorat d where d.code = 'ENTREPRENEURIAT'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '981f6855-3718-5345-9be2-7b44dbf2849c' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('51c86bb7-2c9d-509b-8c2a-740d447f0d63', '6593d854-bb87-5921-a69f-4167b7a5e904', 'Ingénieur génie informatique et télécommunications (promo 2005). J’accompagne les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 2, now() - interval '18 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '51c86bb7-2c9d-509b-8c2a-740d447f0d63', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '51c86bb7-2c9d-509b-8c2a-740d447f0d63' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '51c86bb7-2c9d-509b-8c2a-740d447f0d63', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '51c86bb7-2c9d-509b-8c2a-740d447f0d63' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '51c86bb7-2c9d-509b-8c2a-740d447f0d63', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '51c86bb7-2c9d-509b-8c2a-740d447f0d63' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('91e03169-c6fc-53fc-8092-b77f2484aceb', '93d2ab4b-627f-581f-a8e5-c9e3ba3cb819', 'Ingénieure génie informatique et télécommunications (promo 2017). Disponible pour relire CV et lettres, simuler des entretiens et parler des métiers de ma filière.', true, 3, now() - interval '182 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '91e03169-c6fc-53fc-8092-b77f2484aceb', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '91e03169-c6fc-53fc-8092-b77f2484aceb' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '91e03169-c6fc-53fc-8092-b77f2484aceb', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '91e03169-c6fc-53fc-8092-b77f2484aceb' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '91e03169-c6fc-53fc-8092-b77f2484aceb', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '91e03169-c6fc-53fc-8092-b77f2484aceb' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('c8ce086b-c548-563f-9ebf-1d335fba5a60', 'eb601a8f-ae9f-5a99-9b34-ffd994889776', 'Disponible pour relire CV et lettres, simuler des entretiens et parler des métiers de ma filière.', false, 2, now() - interval '193 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'c8ce086b-c548-563f-9ebf-1d335fba5a60', d.id from domaines_mentorat d where d.code = 'GENIE_CIVIL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'c8ce086b-c548-563f-9ebf-1d335fba5a60' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'c8ce086b-c548-563f-9ebf-1d335fba5a60', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'c8ce086b-c548-563f-9ebf-1d335fba5a60' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'c8ce086b-c548-563f-9ebf-1d335fba5a60', d.id from domaines_mentorat d where d.code = 'CONCOURS_ETUDES'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'c8ce086b-c548-563f-9ebf-1d335fba5a60' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('aea5eb0b-93d8-57f6-b663-31239ef65369', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', 'J’accompagne les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 2, now() - interval '42 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'aea5eb0b-93d8-57f6-b663-31239ef65369', d.id from domaines_mentorat d where d.code = 'ELECTROMECANIQUE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'aea5eb0b-93d8-57f6-b663-31239ef65369' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'aea5eb0b-93d8-57f6-b663-31239ef65369', d.id from domaines_mentorat d where d.code = 'CONCOURS_ETUDES'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'aea5eb0b-93d8-57f6-b663-31239ef65369' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'aea5eb0b-93d8-57f6-b663-31239ef65369', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'aea5eb0b-93d8-57f6-b663-31239ef65369' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('c9d54514-bd91-5aed-9b58-23f81b881d6b', 'd0540eb7-c40f-5b4d-b71f-67e26f1f2203', 'J’accompagne les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 2, now() - interval '125 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'c9d54514-bd91-5aed-9b58-23f81b881d6b', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'c9d54514-bd91-5aed-9b58-23f81b881d6b' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'c9d54514-bd91-5aed-9b58-23f81b881d6b', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'c9d54514-bd91-5aed-9b58-23f81b881d6b' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'c9d54514-bd91-5aed-9b58-23f81b881d6b', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'c9d54514-bd91-5aed-9b58-23f81b881d6b' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'c9d54514-bd91-5aed-9b58-23f81b881d6b', d.id from domaines_mentorat d where d.code = 'CONCOURS_ETUDES'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'c9d54514-bd91-5aed-9b58-23f81b881d6b' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('c4890b40-2e6a-54b6-a93c-1ee852fd9911', '7c7db830-2584-5eac-8dcf-abeb6ca91d55', 'J’accompagne les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 4, now() - interval '59 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'c4890b40-2e6a-54b6-a93c-1ee852fd9911', d.id from domaines_mentorat d where d.code = 'GENIE_CIVIL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'c4890b40-2e6a-54b6-a93c-1ee852fd9911' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'c4890b40-2e6a-54b6-a93c-1ee852fd9911', d.id from domaines_mentorat d where d.code = 'GESTION_PROJET'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'c4890b40-2e6a-54b6-a93c-1ee852fd9911' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'c4890b40-2e6a-54b6-a93c-1ee852fd9911', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'c4890b40-2e6a-54b6-a93c-1ee852fd9911' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'c4890b40-2e6a-54b6-a93c-1ee852fd9911', d.id from domaines_mentorat d where d.code = 'CONCOURS_ETUDES'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'c4890b40-2e6a-54b6-a93c-1ee852fd9911' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('ca659577-8ca2-542c-a3d9-b2ab52bb430c', '8bc22c03-0373-5d99-a18d-1e1c2d71578c', 'J’accompagne les étudiants sur le choix de stage, la préparation des entretiens et les premiers pas en entreprise.', true, 3, now() - interval '74 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'ca659577-8ca2-542c-a3d9-b2ab52bb430c', d.id from domaines_mentorat d where d.code = 'DEV_LOGICIEL'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'ca659577-8ca2-542c-a3d9-b2ab52bb430c' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'ca659577-8ca2-542c-a3d9-b2ab52bb430c', d.id from domaines_mentorat d where d.code = 'DATA_IA'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'ca659577-8ca2-542c-a3d9-b2ab52bb430c' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select 'ca659577-8ca2-542c-a3d9-b2ab52bb430c', d.id from domaines_mentorat d where d.code = 'CARRIERE_INSERTION'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = 'ca659577-8ca2-542c-a3d9-b2ab52bb430c' and x.domaine_id = d.id);
insert into profils_mentor (id, utilisateur_id, presentation, disponible, capacite_max, cree_le, modifie_le)
values ('14a66b20-27b5-58f2-977b-1d3dba64c1aa', 'b58eb7ec-492a-5e00-b7d4-18d3b848066a', 'Disponible pour relire CV et lettres, simuler des entretiens et parler des métiers de ma filière.', true, 3, now() - interval '61 days', now()) on conflict do nothing;
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '14a66b20-27b5-58f2-977b-1d3dba64c1aa', d.id from domaines_mentorat d where d.code = 'ELECTROMECANIQUE'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '14a66b20-27b5-58f2-977b-1d3dba64c1aa' and x.domaine_id = d.id);
insert into profil_mentor_domaines (profil_mentor_id, domaine_id)
select '14a66b20-27b5-58f2-977b-1d3dba64c1aa', d.id from domaines_mentorat d where d.code = 'CONCOURS_ETUDES'
  and not exists (select 1 from profil_mentor_domaines x where x.profil_mentor_id = '14a66b20-27b5-58f2-977b-1d3dba64c1aa' and x.domaine_id = d.id);
insert into programmes_mentorat (id, titre, description, date_debut, date_fin, statut, responsable_id, cree_le)
values ('c845c3d5-3540-5400-9d4c-8120099441a4', 'Insertion professionnelle des jeunes diplômés', 'Des alumni confirmés accompagnent les diplômés de l’année dans leur recherche du premier emploi.', current_date - 45, current_date + interval '5 months', 'OUVERT', 'f7de9858-2346-53fe-a544-d2cc267a6f17', now() - interval '50 days') on conflict (id) do nothing;
insert into jalons_programme (id, programme_id, titre, description, ordre)
values ('38442d54-87ba-5991-8680-1f0d56eb9981', 'c845c3d5-3540-5400-9d4c-8120099441a4', 'Bilan du projet professionnel', 'Faire le point sur les envies, les compétences et les cibles.', 1) on conflict (id) do nothing;
insert into jalons_programme (id, programme_id, titre, description, ordre)
values ('3bcb0ed2-d7f8-5406-a75e-d851d4d82ddf', 'c845c3d5-3540-5400-9d4c-8120099441a4', 'CV et profil en ligne', null, 2) on conflict (id) do nothing;
insert into jalons_programme (id, programme_id, titre, description, ordre)
values ('0344f415-28ac-58d1-b2d5-ba040c5f8bb6', 'c845c3d5-3540-5400-9d4c-8120099441a4', 'Simulation d’entretien', null, 3) on conflict (id) do nothing;
insert into jalons_programme (id, programme_id, titre, description, ordre)
values ('435f86c4-1ed7-5384-ac11-25dc86ddf0a1', 'c845c3d5-3540-5400-9d4c-8120099441a4', 'Premières candidatures', 'Au moins cinq candidatures ciblées envoyées.', 4) on conflict (id) do nothing;
insert into programmes_mentorat (id, titre, description, date_debut, date_fin, statut, responsable_id, cree_le)
values ('1ee9835f-200b-5451-b126-61f781fd6ce2', 'Femmes ingénieures : leadership et carrière', 'Un accompagnement entre ingénieures pour oser les postes à responsabilité et construire son réseau.', current_date - 20, current_date + interval '8 months', 'OUVERT', 'f7de9858-2346-53fe-a544-d2cc267a6f17', now() - interval '50 days') on conflict (id) do nothing;
insert into jalons_programme (id, programme_id, titre, description, ordre)
values ('5b06979b-685e-5cb9-a2af-ef8139a7ebca', '1ee9835f-200b-5451-b126-61f781fd6ce2', 'Premier échange', null, 1) on conflict (id) do nothing;
insert into jalons_programme (id, programme_id, titre, description, ordre)
values ('34c07d32-96b7-5ac8-b08e-b1a2a5e03d24', '1ee9835f-200b-5451-b126-61f781fd6ce2', 'Plan de développement personnel', null, 2) on conflict (id) do nothing;
insert into jalons_programme (id, programme_id, titre, description, ordre)
values ('96716689-5015-551f-8eee-a5bf58b4c38c', '1ee9835f-200b-5451-b126-61f781fd6ce2', 'Prise de parole en public', null, 3) on conflict (id) do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
values ('fa382853-482f-5e0e-b4d3-c17e6ef8c910', 'c845c3d5-3540-5400-9d4c-8120099441a4', '453ce789-9929-52c6-bb28-347873e6c5e8', now() - interval '24 days') on conflict do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
values ('2d409677-ac1a-5b45-8d5c-ee8c4d5f9c4b', 'c845c3d5-3540-5400-9d4c-8120099441a4', '51288483-57ad-5409-9ba5-97aace860b35', now() - interval '28 days') on conflict do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
values ('a6e7b9ac-5648-5dcd-ad4f-e1ca03525724', 'c845c3d5-3540-5400-9d4c-8120099441a4', '54176e12-437b-58d6-adce-220848f9fb9e', now() - interval '33 days') on conflict do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
values ('4332a227-034a-57f4-b143-d72c62dfbd65', 'c845c3d5-3540-5400-9d4c-8120099441a4', '8601a9ce-93d7-5054-a93f-a5d326a172ed', now() - interval '34 days') on conflict do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
values ('0b9652f1-a373-510a-9690-82a27fbc9beb', 'c845c3d5-3540-5400-9d4c-8120099441a4', 'a84cd4b4-2f6c-5380-8c64-3e7082b156f3', now() - interval '20 days') on conflict do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
values ('657df1df-f459-5b1e-bda2-ccd416680ee3', 'c845c3d5-3540-5400-9d4c-8120099441a4', 'cdaf54f9-e73d-5e9f-bf8e-c6a9de0fb1a1', now() - interval '12 days') on conflict do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
values ('06b70777-d001-5ca0-9066-7f47d428bb4b', 'c845c3d5-3540-5400-9d4c-8120099441a4', '62af8214-9016-5b27-a721-c13f133c7011', now() - interval '15 days') on conflict do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
values ('c6385a77-712c-57df-9844-55f617f3ddc4', 'c845c3d5-3540-5400-9d4c-8120099441a4', '3eb74da8-ff45-577e-9662-b3005c74716c', now() - interval '11 days') on conflict do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
values ('222fd438-48f8-539a-aa48-1ac5d9b8c5f1', 'c845c3d5-3540-5400-9d4c-8120099441a4', 'd4b43832-3669-5357-b5f4-c544278efd6e', now() - interval '27 days') on conflict do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
values ('d4de62a8-fb42-5831-bc42-c00a6f52772f', '1ee9835f-200b-5451-b126-61f781fd6ce2', '453ce789-9929-52c6-bb28-347873e6c5e8', now() - interval '26 days') on conflict do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
values ('f02411ea-4a53-5d6a-a047-2bb7dc282570', '1ee9835f-200b-5451-b126-61f781fd6ce2', '51288483-57ad-5409-9ba5-97aace860b35', now() - interval '24 days') on conflict do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
values ('3d145adb-2938-5bff-86af-aaa8c0960c66', '1ee9835f-200b-5451-b126-61f781fd6ce2', '54176e12-437b-58d6-adce-220848f9fb9e', now() - interval '31 days') on conflict do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
values ('b60a9939-79eb-5e83-975b-de6af17a2f63', '1ee9835f-200b-5451-b126-61f781fd6ce2', '8601a9ce-93d7-5054-a93f-a5d326a172ed', now() - interval '38 days') on conflict do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
values ('74d2cbf1-064a-541c-99df-fcd0a0e5ab8a', '1ee9835f-200b-5451-b126-61f781fd6ce2', '62af8214-9016-5b27-a721-c13f133c7011', now() - interval '32 days') on conflict do nothing;
insert into participations_programme (id, programme_id, profil_mentor_id, cree_le)
values ('272a83bb-535e-58c9-bbce-e4e88dce5f44', '1ee9835f-200b-5451-b126-61f781fd6ce2', '60aee8e1-666f-56df-bd65-3b4416814cf7', now() - interval '38 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'eb534f47-30c9-5404-bf49-861417086840', 'dcf23cda-8f49-52ba-af43-69e5ff8a2e6c', '82b50c00-83e7-5482-9e09-d59913d3f62b', d.id, null, 'Préparer une candidature à un master à l’étranger.', 'ACCEPTEE', null,
  now() - interval '70 days', now() - interval '67 days', null, 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('a064a1b3-c7e6-5833-9b9b-abce56a72e3a', 'eb534f47-30c9-5404-bf49-861417086840', date_trunc('hour', now()) + interval '-55 days', 90, 'PRESENTIEL', 'Bureaux de l’entreprise',
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('e846d9b8-9466-53b6-b931-38e11f31e6f4', 'eb534f47-30c9-5404-bf49-861417086840', date_trunc('hour', now()) + interval '-5 days', 30, 'TELEPHONE', null,
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('2d0374bb-0e4f-57f8-b9b1-a33a6ba6f88e', 'eb534f47-30c9-5404-bf49-861417086840', date_trunc('hour', now()) + interval '7 days', 90, 'PRESENTIEL', 'Bureaux de l’entreprise',
  'PLANIFIEE', null, '5fa29b12-b7e1-5d2c-89c9-b8a0eb1035a8', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '78c3e9b8-aa69-51ba-ac36-285c1809e969', 'feadc7dc-098f-588a-ac2d-3f6e1623387e', '5f823e34-fc3d-515c-9ca1-c95f311c6ca8', d.id, null, 'Comprendre le métier au quotidien et préparer ma première candidature.', 'ACCEPTEE', null,
  now() - interval '46 days', now() - interval '45 days', null, 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('9588fe3f-b1e6-5f8b-99ff-5e2b1fe0c770', '78c3e9b8-aa69-51ba-ac36-285c1809e969', date_trunc('hour', now()) + interval '-3 days', 45, 'PRESENTIEL', 'Bureaux de l’entreprise',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '235c7b1c-4170-52c0-9469-475b0210cb78', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('8cd5776e-2bfd-5bf2-8264-a4d6f2b36edf', '78c3e9b8-aa69-51ba-ac36-285c1809e969', date_trunc('hour', now()) + interval '-4 days', 90, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '235c7b1c-4170-52c0-9469-475b0210cb78', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('aaf76224-9cff-5845-aa25-f3baf302387c', '78c3e9b8-aa69-51ba-ac36-285c1809e969', date_trunc('hour', now()) + interval '-42 days', 90, 'PRESENTIEL', 'Café du campus',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '235c7b1c-4170-52c0-9469-475b0210cb78', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'a0aeb316-c712-5738-b8bd-56cb1a4a28df', 'd95c2e6e-2b83-501b-9ac4-49a06f4029bc', '045b4859-3996-58a7-966d-831c90c90973', d.id, null, 'Choisir une spécialisation et construire mon projet professionnel.', 'ACCEPTEE', null,
  now() - interval '30 days', now() - interval '28 days', null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('151f43c3-1dde-583f-853c-3fd0e2976b9d', 'a0aeb316-c712-5738-b8bd-56cb1a4a28df', date_trunc('hour', now()) + interval '-17 days', 90, 'TELEPHONE', null,
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('6b790cdd-65a1-5c53-aa63-9da47628b6ec', 'a0aeb316-c712-5738-b8bd-56cb1a4a28df', date_trunc('hour', now()) + interval '-17 days', 45, 'PRESENTIEL', 'Bibliothèque de l’EPT',
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('28aae58b-915c-5395-9ce4-b8438b49c45b', 'a0aeb316-c712-5738-b8bd-56cb1a4a28df', date_trunc('hour', now()) + interval '-13 days', 90, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('02830956-9692-50a1-a383-4d1385a105b7', 'a0aeb316-c712-5738-b8bd-56cb1a4a28df', date_trunc('hour', now()) + interval '6 days', 30, 'TELEPHONE', null,
  'PLANIFIEE', null, '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'f2e338c9-16f7-5edb-aaa3-9118bef97420', 'c66385a9-2e09-5478-9f8f-e2556567191f', 'a0823cc1-e79c-58cb-b788-7b7b43177154', d.id, null, 'Préparer une candidature à un master à l’étranger.', 'ACCEPTEE', null,
  now() - interval '90 days', now() - interval '87 days', null, 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('3e1a5335-e625-50ed-92c6-0bbefdf44057', 'f2e338c9-16f7-5edb-aaa3-9118bef97420', date_trunc('hour', now()) + interval '-13 days', 30, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '2b34d94e-66b2-5292-8f66-8cde42ae3106', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('0753e589-dce4-5f7e-8289-562f1201ae37', 'f2e338c9-16f7-5edb-aaa3-9118bef97420', date_trunc('hour', now()) + interval '18 days', 90, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'PLANIFIEE', null, '2b34d94e-66b2-5292-8f66-8cde42ae3106', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'b2453d62-2e6a-531d-b6f3-cfb576bfcb6f', '848f10d0-ecf4-597a-9bb8-a4a950cf2294', 'aea5eb0b-93d8-57f6-b663-31239ef65369', d.id, null, 'Choisir une spécialisation et construire mon projet professionnel.', 'ACCEPTEE', null,
  now() - interval '66 days', now() - interval '64 days', null, 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('4e443d56-28e2-5562-980c-a795ca44c868', 'b2453d62-2e6a-531d-b6f3-cfb576bfcb6f', date_trunc('hour', now()) + interval '-21 days', 60, 'TELEPHONE', null,
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('4ccfa750-612d-54aa-ab9b-99a097314b0c', 'b2453d62-2e6a-531d-b6f3-cfb576bfcb6f', date_trunc('hour', now()) + interval '-60 days', 60, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('d4453cff-0e2d-5a2f-88ef-5602f9059eb9', 'b2453d62-2e6a-531d-b6f3-cfb576bfcb6f', date_trunc('hour', now()) + interval '-24 days', 90, 'TELEPHONE', null,
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('c6b7c2fd-22ec-5ae5-a816-f2533be91724', 'b2453d62-2e6a-531d-b6f3-cfb576bfcb6f', date_trunc('hour', now()) + interval '-52 days', 60, 'PRESENTIEL', 'Bibliothèque de l’EPT',
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'dcdadaa1-3b66-5d5b-a468-4fed3a317e0a', '6c56f510-f428-5542-8194-1dedc960b84e', '54176e12-437b-58d6-adce-220848f9fb9e', d.id, 'c845c3d5-3540-5400-9d4c-8120099441a4', 'Améliorer mon CV et mon profil professionnel.', 'ACCEPTEE', null,
  now() - interval '109 days', now() - interval '108 days', null, 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('c6a225a3-19cd-5843-b437-3e4aec5efea1', 'dcdadaa1-3b66-5d5b-a468-4fed3a317e0a', date_trunc('hour', now()) + interval '7 days', 60, 'TELEPHONE', null,
  'PLANIFIEE', null, '87ce220b-bb1b-55b0-acb8-ff8e1bf24804', now(), now())
on conflict (id) do nothing;
insert into progression_jalons (id, mentorat_id, jalon_id, atteint_le, valide_par_id, commentaire)
values ('cd7994a2-e16f-5a91-ae66-0fc4b0121f01', 'dcdadaa1-3b66-5d5b-a468-4fed3a317e0a', '38442d54-87ba-5991-8680-1f0d56eb9981', now() - interval '11 days',
  '6c56f510-f428-5542-8194-1dedc960b84e', null) on conflict do nothing;
insert into progression_jalons (id, mentorat_id, jalon_id, atteint_le, valide_par_id, commentaire)
values ('61567bb9-27ba-5653-a259-34c3b2c2b988', 'dcdadaa1-3b66-5d5b-a468-4fed3a317e0a', '3bcb0ed2-d7f8-5406-a75e-d851d4d82ddf', now() - interval '27 days',
  '6c56f510-f428-5542-8194-1dedc960b84e', 'Objectif atteint, on passe à la suite.') on conflict do nothing;
insert into progression_jalons (id, mentorat_id, jalon_id, atteint_le, valide_par_id, commentaire)
values ('70928ac3-4863-5d3c-940e-a2dd49d75afa', 'dcdadaa1-3b66-5d5b-a468-4fed3a317e0a', '0344f415-28ac-58d1-b2d5-ba040c5f8bb6', now() - interval '1 days',
  '87ce220b-bb1b-55b0-acb8-ff8e1bf24804', 'Étape franchie lors de la dernière séance.') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '9ebc162d-3779-51a5-b1fa-1745a552fbc4', '31278c62-d3fb-59c0-b298-877946b40983', '0dc53485-ec26-5833-beae-dcb1f7cd2fa5', d.id, null, 'Améliorer mon CV et mon profil professionnel.', 'ACCEPTEE', null,
  now() - interval '127 days', now() - interval '124 days', null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('869a24ee-9f67-5cd1-a516-423bba6aa69c', '9ebc162d-3779-51a5-b1fa-1745a552fbc4', date_trunc('hour', now()) + interval '-88 days', 30, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', 'b105f039-968f-520a-8860-da5b95b4482f', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('b209cda4-79bc-5e69-b533-e0b5d8d126ff', '9ebc162d-3779-51a5-b1fa-1745a552fbc4', date_trunc('hour', now()) + interval '-61 days', 90, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', 'b105f039-968f-520a-8860-da5b95b4482f', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('91e54019-6809-58b3-b6b6-0726b87a7951', '9ebc162d-3779-51a5-b1fa-1745a552fbc4', date_trunc('hour', now()) + interval '-30 days', 60, 'PRESENTIEL', 'Bureaux de l’entreprise',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', 'b105f039-968f-520a-8860-da5b95b4482f', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('7fcb11eb-7f18-5ae4-9f5f-5c90b8ddbdca', '9ebc162d-3779-51a5-b1fa-1745a552fbc4', date_trunc('hour', now()) + interval '-10 days', 90, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', 'b105f039-968f-520a-8860-da5b95b4482f', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'd8429a43-fdf7-5eba-a10c-276feffa60a2', 'aa9de02b-b819-5dcb-9fed-e994479e6b7f', '652995d5-49ee-52a6-bc6a-6e379337a43c', d.id, null, 'Trouver mon premier emploi après le diplôme.', 'ACCEPTEE', null,
  now() - interval '45 days', now() - interval '44 days', null, 0
from domaines_mentorat d where d.code = 'GESTION_PROJET' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('3e3c215e-47c6-5b44-84cd-a307a81055de', 'd8429a43-fdf7-5eba-a10c-276feffa60a2', date_trunc('hour', now()) + interval '-24 days', 30, 'TELEPHONE', null,
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', '6140551c-046e-5ae3-a2d5-7a9d63de1fc1', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('464a0895-ae94-5bb3-a0f9-7c6df2f3c8e9', 'd8429a43-fdf7-5eba-a10c-276feffa60a2', date_trunc('hour', now()) + interval '20 days', 60, 'TELEPHONE', null,
  'PLANIFIEE', null, '6140551c-046e-5ae3-a2d5-7a9d63de1fc1', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '8944adb3-e8a1-5a6f-af75-a14508236629', 'feadc7dc-098f-588a-ac2d-3f6e1623387e', '045b4859-3996-58a7-966d-831c90c90973', d.id, null, 'Trouver mon premier emploi après le diplôme.', 'ACCEPTEE', null,
  now() - interval '145 days', now() - interval '144 days', null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('a6f75f8f-2864-59b1-95fd-fa9043615894', '8944adb3-e8a1-5a6f-af75-a14508236629', date_trunc('hour', now()) + interval '-60 days', 30, 'TELEPHONE', null,
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('2fa22d12-9b89-5eb5-a0d2-ece1fa9d6d61', '8944adb3-e8a1-5a6f-af75-a14508236629', date_trunc('hour', now()) + interval '-135 days', 60, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('e86b1943-e7ec-5768-b4c1-d6d6fa701c07', '8944adb3-e8a1-5a6f-af75-a14508236629', date_trunc('hour', now()) + interval '-122 days', 30, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('ef7a1551-3be4-5f29-8ed1-885d4ac8e7c8', '8944adb3-e8a1-5a6f-af75-a14508236629', date_trunc('hour', now()) + interval '16 days', 90, 'PRESENTIEL', 'Bureaux de l’entreprise',
  'PLANIFIEE', null, '5c4496ed-b9d2-5ed0-9616-31412fbb5c65', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'a301b09e-f7d5-5368-9d7d-2b6be5672dcd', 'f2ddf2c7-06e2-56e5-b270-91ff9380f037', 'ca659577-8ca2-542c-a3d9-b2ab52bb430c', d.id, null, 'Me réorienter vers la data après quelques années en industrie.', 'ACCEPTEE', null,
  now() - interval '114 days', now() - interval '111 days', null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('ea71e3f8-2c54-5a0f-b1d9-78fa5c49901a', 'a301b09e-f7d5-5368-9d7d-2b6be5672dcd', date_trunc('hour', now()) + interval '-112 days', 30, 'PRESENTIEL', 'Café du campus',
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', '8bc22c03-0373-5d99-a18d-1e1c2d71578c', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('b135ee3a-2616-57f8-bfb0-b65fbf7e2b05', 'a301b09e-f7d5-5368-9d7d-2b6be5672dcd', date_trunc('hour', now()) + interval '11 days', 60, 'PRESENTIEL', 'Café du campus',
  'PLANIFIEE', null, '8bc22c03-0373-5d99-a18d-1e1c2d71578c', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'dd8c6bc3-5142-56f2-a927-615ba70fca17', 'bd120997-d5e4-5d5f-b3c3-19f7e71b8d44', '3eb74da8-ff45-577e-9662-b3005c74716c', d.id, null, 'Trouver mon premier emploi après le diplôme.', 'ACCEPTEE', null,
  now() - interval '11 days', now() - interval '9 days', null, 0
from domaines_mentorat d where d.code = 'GENIE_CIVIL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('a7fbb730-2fbb-51be-9807-4b2bb9850adb', 'dd8c6bc3-5142-56f2-a927-615ba70fca17', date_trunc('hour', now()) + interval '5 days', 90, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'PLANIFIEE', null, 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '2aeb357b-64f4-532b-8a51-f21fe4939785', 'bcceeeec-059e-5229-90b4-15838929d725', '981f6855-3718-5345-9be2-7b44dbf2849c', d.id, null, 'Me réorienter vers la data après quelques années en industrie.', 'ACCEPTEE', null,
  now() - interval '39 days', now() - interval '37 days', null, 0
from domaines_mentorat d where d.code = 'GESTION_PROJET' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('28643754-03d6-50cf-8029-95f893a4b707', '2aeb357b-64f4-532b-8a51-f21fe4939785', date_trunc('hour', now()) + interval '18 days', 60, 'TELEPHONE', null,
  'PLANIFIEE', null, 'ba62afaa-e97b-5dfd-b99f-cc115508f551', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '6505074b-1c72-5a9b-b562-f7288a5fbd1d', '3c57b1aa-4676-5875-8440-d925477549d6', '8601a9ce-93d7-5054-a93f-a5d326a172ed', d.id, null, 'Améliorer mon CV et mon profil professionnel.', 'ACCEPTEE', null,
  now() - interval '113 days', now() - interval '112 days', null, 0
from domaines_mentorat d where d.code = 'GENIE_CIVIL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('1b308448-baa4-5cee-8eb5-f0956caa6a90', '6505074b-1c72-5a9b-b562-f7288a5fbd1d', date_trunc('hour', now()) + interval '-92 days', 90, 'PRESENTIEL', 'Café du campus',
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', '760ed432-29c6-5dad-9d2d-ec90276f6f75', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'e7f48250-cd87-5a0c-a838-ffdc273ea864', '33c4c54d-e3d2-5d47-9fb4-dcac89aabe0e', '5c17ae6b-9202-5851-a7a8-2797e3d92e54', d.id, null, 'Préparer une candidature à un master à l’étranger.', 'ACCEPTEE', null,
  now() - interval '95 days', now() - interval '92 days', null, 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('786d9ac1-327e-5bb4-9dbe-a4a795e1f0aa', 'e7f48250-cd87-5a0c-a838-ffdc273ea864', date_trunc('hour', now()) + interval '-42 days', 60, 'PRESENTIEL', 'Bibliothèque de l’EPT',
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', 'b5872f7c-6d3c-5f90-b99a-e6b4586cb9f2', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('f5bcd0a6-ec12-58a9-a48d-4077aa323ed7', 'e7f48250-cd87-5a0c-a838-ffdc273ea864', date_trunc('hour', now()) + interval '-64 days', 60, 'PRESENTIEL', 'Café du campus',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', 'b5872f7c-6d3c-5f90-b99a-e6b4586cb9f2', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('9d963216-cf56-55d1-ba9f-c8abe2a78590', 'e7f48250-cd87-5a0c-a838-ffdc273ea864', date_trunc('hour', now()) + interval '17 days', 45, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'PLANIFIEE', null, 'b5872f7c-6d3c-5f90-b99a-e6b4586cb9f2', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'ddbfa10e-5db9-577d-bc5a-f1ec1845871c', '6b507882-0089-585c-94df-f160023559ef', 'cdaf54f9-e73d-5e9f-bf8e-c6a9de0fb1a1', d.id, null, 'Préparer une candidature à un master à l’étranger.', 'ACCEPTEE', null,
  now() - interval '81 days', now() - interval '78 days', null, 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('da687cc6-ce53-5e89-b5c7-907faa2a17ca', 'ddbfa10e-5db9-577d-bc5a-f1ec1845871c', date_trunc('hour', now()) + interval '-33 days', 60, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('1061f778-ce39-51ec-9455-1a5d300a82bf', 'ddbfa10e-5db9-577d-bc5a-f1ec1845871c', date_trunc('hour', now()) + interval '-18 days', 60, 'TELEPHONE', null,
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '9a5b25cb-dedb-50cf-9fce-bbadb80c282d', '6c56f510-f428-5542-8194-1dedc960b84e', '6af2751d-5034-5159-b7c6-fbf32b6464a7', d.id, null, 'Me réorienter vers la data après quelques années en industrie.', 'ACCEPTEE', null,
  now() - interval '95 days', now() - interval '94 days', null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('581ccbaa-7e45-5c91-8999-6c2bd861ed44', '9a5b25cb-dedb-50cf-9fce-bbadb80c282d', date_trunc('hour', now()) + interval '-19 days', 30, 'TELEPHONE', null,
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', 'f8b792d4-c0da-5555-921c-45fad1f0a9da', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '92d7ee4c-d20f-5dd7-bfdf-fa34c877904c', '1b42620c-c483-53d0-81c2-11af42770c68', '60aee8e1-666f-56df-bd65-3b4416814cf7', d.id, null, 'Comprendre le métier au quotidien et préparer ma première candidature.', 'ACCEPTEE', null,
  now() - interval '63 days', now() - interval '62 days', null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('0cc86c76-a339-5637-9df3-0c52a965a0f8', '92d7ee4c-d20f-5dd7-bfdf-fa34c877904c', date_trunc('hour', now()) + interval '11 days', 60, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'PLANIFIEE', null, 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '8c322a0e-c515-5216-a52f-345e4c12d379', '0efa151b-4536-5acd-98b8-9e62cd5042c5', '60aee8e1-666f-56df-bd65-3b4416814cf7', d.id, null, 'Monter un projet entrepreneurial avec des camarades.', 'ACCEPTEE', null,
  now() - interval '142 days', now() - interval '139 days', null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('6ce8155a-273f-5e21-88ca-86994e9c1d5e', '8c322a0e-c515-5216-a52f-345e4c12d379', date_trunc('hour', now()) + interval '-67 days', 60, 'PRESENTIEL', 'Bibliothèque de l’EPT',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('46b8a28c-21e5-56fb-888a-91589fb10d11', '8c322a0e-c515-5216-a52f-345e4c12d379', date_trunc('hour', now()) + interval '-131 days', 45, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('7147cfcc-a212-50f8-8135-2d3ad1180632', '8c322a0e-c515-5216-a52f-345e4c12d379', date_trunc('hour', now()) + interval '-68 days', 30, 'TELEPHONE', null,
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('1bae8e40-c8a2-57d5-8bb2-7129459c2155', '8c322a0e-c515-5216-a52f-345e4c12d379', date_trunc('hour', now()) + interval '-118 days', 90, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'f37dbc2f-51cb-5ad5-bdca-85f9ae638303', 'fd2abcc5-5026-56f8-9739-ad5c6994612f', 'c4890b40-2e6a-54b6-a93c-1ee852fd9911', d.id, null, 'Préparer mon stage de fin d’études et mes entretiens.', 'ACCEPTEE', null,
  now() - interval '31 days', now() - interval '28 days', null, 0
from domaines_mentorat d where d.code = 'GENIE_CIVIL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('18e27782-5aa4-5280-9cac-690a85102aa0', 'f37dbc2f-51cb-5ad5-bdca-85f9ae638303', date_trunc('hour', now()) + interval '-3 days', 45, 'PRESENTIEL', 'Bibliothèque de l’EPT',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '7c7db830-2584-5eac-8dcf-abeb6ca91d55', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('29940cd7-03ea-57ed-bbd3-e262032a6c56', 'f37dbc2f-51cb-5ad5-bdca-85f9ae638303', date_trunc('hour', now()) + interval '-20 days', 45, 'PRESENTIEL', 'Bibliothèque de l’EPT',
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', '7c7db830-2584-5eac-8dcf-abeb6ca91d55', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('051c4fb1-52b0-5742-8f70-a3da3c0d38c1', 'f37dbc2f-51cb-5ad5-bdca-85f9ae638303', date_trunc('hour', now()) + interval '7 days', 45, 'PRESENTIEL', 'Bibliothèque de l’EPT',
  'PLANIFIEE', null, '7c7db830-2584-5eac-8dcf-abeb6ca91d55', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '17150dc7-8309-567e-8a3d-fdb74d587dda', '422e77a7-ae81-5b28-be87-0e8d9b3c769d', '51288483-57ad-5409-9ba5-97aace860b35', d.id, null, 'Me réorienter vers la data après quelques années en industrie.', 'ACCEPTEE', null,
  now() - interval '77 days', now() - interval '74 days', null, 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('edd49118-fe10-5171-8a42-b60e2c6aad79', '17150dc7-8309-567e-8a3d-fdb74d587dda', date_trunc('hour', now()) + interval '-54 days', 45, 'PRESENTIEL', 'Bureaux de l’entreprise',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', now(), now())
on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'ce5e761b-54fc-5e2d-9774-95150fe25c14', '7c7db830-2584-5eac-8dcf-abeb6ca91d55', '96c47a9d-4bcc-5b66-914f-c63be7a75b5e', d.id, null, 'Choisir une spécialisation et construire mon projet professionnel.', 'TERMINEE', null,
  now() - interval '45 days', now() - interval '44 days', now() - interval '10 days', 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('cb84a217-9061-5101-a089-a22c289770b3', 'ce5e761b-54fc-5e2d-9774-95150fe25c14', date_trunc('hour', now()) + interval '-42 days', 60, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '9c5eaed3-8efd-5c3a-8045-b853a546ed9b', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('eda6108d-dbb1-5ea7-afac-78232bb84a19', 'ce5e761b-54fc-5e2d-9774-95150fe25c14', date_trunc('hour', now()) + interval '-28 days', 30, 'PRESENTIEL', 'Café du campus',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '9c5eaed3-8efd-5c3a-8045-b853a546ed9b', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('c728317e-247a-57cc-8365-21cc76751707', 'ce5e761b-54fc-5e2d-9774-95150fe25c14', date_trunc('hour', now()) + interval '-37 days', 60, 'TELEPHONE', null,
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', '9c5eaed3-8efd-5c3a-8045-b853a546ed9b', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('24b09727-fb9f-5b4c-a2ab-1e4ab7ebcd29', 'ce5e761b-54fc-5e2d-9774-95150fe25c14', date_trunc('hour', now()) + interval '-34 days', 30, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', '9c5eaed3-8efd-5c3a-8045-b853a546ed9b', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('ddc8fe99-7e9b-5e2d-8e5e-782f51728916', 'ce5e761b-54fc-5e2d-9774-95150fe25c14', '7c7db830-2584-5eac-8dcf-abeb6ca91d55', 3, 'Bons conseils, mais difficile de caler des créneaux.', now() - interval '10 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'bb66ea86-987b-5bc8-a293-4f08719e363b', 'f2ddf2c7-06e2-56e5-b270-91ff9380f037', 'aea5eb0b-93d8-57f6-b663-31239ef65369', d.id, null, 'Trouver mon premier emploi après le diplôme.', 'TERMINEE', null,
  now() - interval '5 days', now() - interval '3 days', now() - interval '1 days', 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('e0f2ab95-1f01-5145-aba6-25b05e7f6b23', 'bb66ea86-987b-5bc8-a293-4f08719e363b', date_trunc('hour', now()) + interval '-3 days', 90, 'PRESENTIEL', 'Café du campus',
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('d31b9acd-10a2-512f-868f-f8a49f7c95b0', 'bb66ea86-987b-5bc8-a293-4f08719e363b', date_trunc('hour', now()) + interval '-2 days', 90, 'PRESENTIEL', 'Café du campus',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('8f05e3d3-468c-5e1e-a225-d5d97daff6f3', 'bb66ea86-987b-5bc8-a293-4f08719e363b', 'f2ddf2c7-06e2-56e5-b270-91ff9380f037', 5, 'Mentorat bienveillant et exigeant à la fois.', now() - interval '9 days') on conflict do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('e4fa9d9a-e787-52a2-a4c0-de3a1c4b86ea', 'bb66ea86-987b-5bc8-a293-4f08719e363b', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', 3, 'Bons conseils, mais difficile de caler des créneaux.', now() - interval '2 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '75e925ee-a7d2-5264-9e35-310bf5142f49', '6c56f510-f428-5542-8194-1dedc960b84e', 'cdaf54f9-e73d-5e9f-bf8e-c6a9de0fb1a1', d.id, null, 'Choisir une spécialisation et construire mon projet professionnel.', 'TERMINEE', null,
  now() - interval '34 days', now() - interval '31 days', now() - interval '3 days', 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('30de53e8-31a7-5dc8-abc0-2e29a8707066', '75e925ee-a7d2-5264-9e35-310bf5142f49', date_trunc('hour', now()) + interval '-29 days', 45, 'TELEPHONE', null,
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('2ab46436-4480-5b15-a6dc-e9e3b680560a', '75e925ee-a7d2-5264-9e35-310bf5142f49', date_trunc('hour', now()) + interval '-5 days', 90, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', '4649f87e-3cb5-5d77-9bb3-2d67b6e3eb20', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('e50f7de7-c29d-51f5-bbed-ac9755e65d1f', '75e925ee-a7d2-5264-9e35-310bf5142f49', '6c56f510-f428-5542-8194-1dedc960b84e', 5, 'Des conseils concrets et une vraie disponibilité. Merci !', now() - interval '2 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '818562d8-8bc4-5650-ace1-775692cd6519', '0efa151b-4536-5acd-98b8-9e62cd5042c5', '1ccbfb4c-dc27-56c7-b537-90cd8f9931a5', d.id, null, 'Me réorienter vers la data après quelques années en industrie.', 'TERMINEE', null,
  now() - interval '17 days', now() - interval '14 days', now() - interval '3 days', 0
from domaines_mentorat d where d.code = 'GESTION_PROJET' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('0af7e717-b3c8-5f44-bf7d-9c58ac4ede77', '818562d8-8bc4-5650-ace1-775692cd6519', date_trunc('hour', now()) + interval '-14 days', 90, 'PRESENTIEL', 'Bibliothèque de l’EPT',
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '8670e440-184b-5365-9e7b-3e0c983658b4', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('b20dd0f7-6399-5986-96f5-1c787db0540c', '818562d8-8bc4-5650-ace1-775692cd6519', date_trunc('hour', now()) + interval '-15 days', 90, 'PRESENTIEL', 'Bureaux de l’entreprise',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '8670e440-184b-5365-9e7b-3e0c983658b4', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('55da4994-8855-5726-8c95-e7c073d91f8b', '818562d8-8bc4-5650-ace1-775692cd6519', date_trunc('hour', now()) + interval '-12 days', 45, 'TELEPHONE', null,
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '8670e440-184b-5365-9e7b-3e0c983658b4', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('cbd4cbe0-3169-5508-bd34-7f2a9aefce76', '818562d8-8bc4-5650-ace1-775692cd6519', date_trunc('hour', now()) + interval '-6 days', 60, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', '8670e440-184b-5365-9e7b-3e0c983658b4', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('04c4c049-e43f-51e4-9239-eaa7be973fd4', '818562d8-8bc4-5650-ace1-775692cd6519', '0efa151b-4536-5acd-98b8-9e62cd5042c5', 5, 'Des conseils concrets et une vraie disponibilité. Merci !', now() - interval '8 days') on conflict do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('a06d8a96-a1cf-5387-910a-76cba29459e5', '818562d8-8bc4-5650-ace1-775692cd6519', '8670e440-184b-5365-9e7b-3e0c983658b4', 5, 'Mentorat bienveillant et exigeant à la fois.', now() - interval '3 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '85967e7b-31c7-5c2f-a5a1-c6bef5e3ed34', 'ef6c88cb-7f71-5f28-b013-f3dc3f90329a', '5f823e34-fc3d-515c-9ca1-c95f311c6ca8', d.id, null, 'Choisir une spécialisation et construire mon projet professionnel.', 'TERMINEE', null,
  now() - interval '83 days', now() - interval '81 days', now() - interval '17 days', 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('ba178b06-165e-5d31-9f63-8f10ec98aa92', '85967e7b-31c7-5c2f-a5a1-c6bef5e3ed34', date_trunc('hour', now()) + interval '-60 days', 45, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', '235c7b1c-4170-52c0-9469-475b0210cb78', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('eb4f700f-00f2-58d5-8ee7-a8273ce0f99e', '85967e7b-31c7-5c2f-a5a1-c6bef5e3ed34', date_trunc('hour', now()) + interval '-7 days', 90, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', '235c7b1c-4170-52c0-9469-475b0210cb78', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('593f82ee-0cd8-52c7-a02b-6f86c19820f4', '85967e7b-31c7-5c2f-a5a1-c6bef5e3ed34', date_trunc('hour', now()) + interval '-29 days', 90, 'TELEPHONE', null,
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', '235c7b1c-4170-52c0-9469-475b0210cb78', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('aedf5b75-cd4f-5d51-994e-5153a64988cc', '85967e7b-31c7-5c2f-a5a1-c6bef5e3ed34', 'ef6c88cb-7f71-5f28-b013-f3dc3f90329a', 5, 'Mentorat bienveillant et exigeant à la fois.', now() - interval '5 days') on conflict do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('56116e80-5d47-5f07-a072-90ae1786b0ec', '85967e7b-31c7-5c2f-a5a1-c6bef5e3ed34', '235c7b1c-4170-52c0-9469-475b0210cb78', 3, 'Bons conseils, mais difficile de caler des créneaux.', now() - interval '4 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '49dcb6fc-27ef-5404-86b3-cfcd3e4c431f', 'a69bb100-a789-56a8-860d-1a65c7f840eb', '91e03169-c6fc-53fc-8092-b77f2484aceb', d.id, null, 'Me réorienter vers la data après quelques années en industrie.', 'TERMINEE', null,
  now() - interval '83 days', now() - interval '82 days', now() - interval '19 days', 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('bafa1f7d-fe49-5aed-84e6-b768337fa6db', '49dcb6fc-27ef-5404-86b3-cfcd3e4c431f', date_trunc('hour', now()) + interval '-18 days', 30, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', '93d2ab4b-627f-581f-a8e5-c9e3ba3cb819', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('9681777e-0172-5444-91bc-2b093b82e7a1', '49dcb6fc-27ef-5404-86b3-cfcd3e4c431f', date_trunc('hour', now()) + interval '-46 days', 90, 'TELEPHONE', null,
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '93d2ab4b-627f-581f-a8e5-c9e3ba3cb819', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('2ba2927e-c1d7-52c2-8b79-8ab0340807f4', '49dcb6fc-27ef-5404-86b3-cfcd3e4c431f', 'a69bb100-a789-56a8-860d-1a65c7f840eb', 5, 'Mentorat bienveillant et exigeant à la fois.', now() - interval '3 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '8d0c8789-8e1a-5497-a3ef-f2b60d1d307d', '3c57b1aa-4676-5875-8440-d925477549d6', 'a0823cc1-e79c-58cb-b788-7b7b43177154', d.id, null, 'Trouver mon premier emploi après le diplôme.', 'TERMINEE', null,
  now() - interval '119 days', now() - interval '118 days', now() - interval '1 days', 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('1726be69-a106-5b1f-aa8b-4ef151920bc6', '8d0c8789-8e1a-5497-a3ef-f2b60d1d307d', date_trunc('hour', now()) + interval '-116 days', 30, 'PRESENTIEL', 'Bureaux de l’entreprise',
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', '2b34d94e-66b2-5292-8f66-8cde42ae3106', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('31510ad3-c24c-5664-9645-8555cbcdd9b9', '8d0c8789-8e1a-5497-a3ef-f2b60d1d307d', '3c57b1aa-4676-5875-8440-d925477549d6', 3, 'Bons conseils, mais difficile de caler des créneaux.', now() - interval '2 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '723c843a-898a-5377-8e48-46ad86662d91', '1b42620c-c483-53d0-81c2-11af42770c68', '14a66b20-27b5-58f2-977b-1d3dba64c1aa', d.id, null, 'Me réorienter vers la data après quelques années en industrie.', 'TERMINEE', null,
  now() - interval '109 days', now() - interval '106 days', now() - interval '16 days', 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('6e79b625-1cc5-52eb-956d-0e8ea0e16913', '723c843a-898a-5377-8e48-46ad86662d91', date_trunc('hour', now()) + interval '-87 days', 45, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', 'b58eb7ec-492a-5e00-b7d4-18d3b848066a', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('251cd323-7074-5b12-bfde-6414df052a05', '723c843a-898a-5377-8e48-46ad86662d91', date_trunc('hour', now()) + interval '-66 days', 90, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', 'b58eb7ec-492a-5e00-b7d4-18d3b848066a', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('f32ede97-6650-5c73-bd40-6f5546e22a3b', '723c843a-898a-5377-8e48-46ad86662d91', date_trunc('hour', now()) + interval '-22 days', 60, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', 'b58eb7ec-492a-5e00-b7d4-18d3b848066a', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('238fba43-1f39-5500-885c-ab450472d0e5', '723c843a-898a-5377-8e48-46ad86662d91', '1b42620c-c483-53d0-81c2-11af42770c68', 3, 'Bons conseils, mais difficile de caler des créneaux.', now() - interval '6 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'c46f2ec1-c04d-51b1-a177-0b317ea43930', '422e77a7-ae81-5b28-be87-0e8d9b3c769d', '8601a9ce-93d7-5054-a93f-a5d326a172ed', d.id, null, 'Comprendre le métier au quotidien et préparer ma première candidature.', 'TERMINEE', null,
  now() - interval '75 days', now() - interval '73 days', now() - interval '11 days', 0
from domaines_mentorat d where d.code = 'GENIE_CIVIL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('8035e461-f040-552e-a691-46a9398ea077', 'c46f2ec1-c04d-51b1-a177-0b317ea43930', date_trunc('hour', now()) + interval '-33 days', 45, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', '760ed432-29c6-5dad-9d2d-ec90276f6f75', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('371a16c8-b821-5bec-9196-100d697f7af3', 'c46f2ec1-c04d-51b1-a177-0b317ea43930', date_trunc('hour', now()) + interval '-23 days', 60, 'PRESENTIEL', 'Bureaux de l’entreprise',
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '760ed432-29c6-5dad-9d2d-ec90276f6f75', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('e730bc86-7674-5784-ac70-793125239c87', 'c46f2ec1-c04d-51b1-a177-0b317ea43930', date_trunc('hour', now()) + interval '-30 days', 90, 'TELEPHONE', null,
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '760ed432-29c6-5dad-9d2d-ec90276f6f75', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('d894ce3b-622d-57db-8a8c-83782e259cfe', 'c46f2ec1-c04d-51b1-a177-0b317ea43930', '422e77a7-ae81-5b28-be87-0e8d9b3c769d', 4, 'Échanges riches, un peu espacés dans le temps.', now() - interval '3 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'fe22aa9e-6983-5086-8d74-19884c1b1b4a', 'feadc7dc-098f-588a-ac2d-3f6e1623387e', '3eb74da8-ff45-577e-9662-b3005c74716c', d.id, 'c845c3d5-3540-5400-9d4c-8120099441a4', 'Préparer mon stage de fin d’études et mes entretiens.', 'TERMINEE', null,
  now() - interval '112 days', now() - interval '111 days', now() - interval '26 days', 0
from domaines_mentorat d where d.code = 'GENIE_CIVIL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('701ebdb2-8dd5-5b76-bf22-87ca97c133ee', 'fe22aa9e-6983-5086-8d74-19884c1b1b4a', date_trunc('hour', now()) + interval '-42 days', 45, 'TELEPHONE', null,
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('2b490d7d-a6ae-5f75-b5b0-6c8a7e2648c6', 'fe22aa9e-6983-5086-8d74-19884c1b1b4a', date_trunc('hour', now()) + interval '-63 days', 45, 'PRESENTIEL', 'Café du campus',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', now(), now())
on conflict (id) do nothing;
insert into progression_jalons (id, mentorat_id, jalon_id, atteint_le, valide_par_id, commentaire)
values ('1c2c69bf-81fb-50d5-805d-673a69c7d2de', 'fe22aa9e-6983-5086-8d74-19884c1b1b4a', '38442d54-87ba-5991-8680-1f0d56eb9981', now() - interval '12 days',
  'feadc7dc-098f-588a-ac2d-3f6e1623387e', 'Étape franchie lors de la dernière séance.') on conflict do nothing;
insert into progression_jalons (id, mentorat_id, jalon_id, atteint_le, valide_par_id, commentaire)
values ('9328d5d4-2158-5bd6-ac9d-e92d57e7b0cd', 'fe22aa9e-6983-5086-8d74-19884c1b1b4a', '3bcb0ed2-d7f8-5406-a75e-d851d4d82ddf', now() - interval '1 days',
  'feadc7dc-098f-588a-ac2d-3f6e1623387e', 'Objectif atteint, on passe à la suite.') on conflict do nothing;
insert into progression_jalons (id, mentorat_id, jalon_id, atteint_le, valide_par_id, commentaire)
values ('c8ac8714-acfc-5896-a85e-540340cda845', 'fe22aa9e-6983-5086-8d74-19884c1b1b4a', '0344f415-28ac-58d1-b2d5-ba040c5f8bb6', now() - interval '29 days',
  'feadc7dc-098f-588a-ac2d-3f6e1623387e', 'Étape franchie lors de la dernière séance.') on conflict do nothing;
insert into progression_jalons (id, mentorat_id, jalon_id, atteint_le, valide_par_id, commentaire)
values ('cf29bd96-ed89-5686-9b01-81d08d3fd3c8', 'fe22aa9e-6983-5086-8d74-19884c1b1b4a', '435f86c4-1ed7-5384-ac11-25dc86ddf0a1', now() - interval '23 days',
  'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', 'Objectif atteint, on passe à la suite.') on conflict do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('4de57af7-17d4-507c-b4ee-be283dfb200f', 'fe22aa9e-6983-5086-8d74-19884c1b1b4a', 'feadc7dc-098f-588a-ac2d-3f6e1623387e', 3, 'Bons conseils, mais difficile de caler des créneaux.', now() - interval '2 days') on conflict do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('68ec70c0-3d9d-5ee5-acf6-5cf6526251a9', 'fe22aa9e-6983-5086-8d74-19884c1b1b4a', 'd32fe32f-a8a8-5ad9-b562-8ac15da0bfc3', 4, 'Très utile pour préparer mes entretiens.', now() - interval '9 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '56fc18d2-33e2-59ec-ab83-1bad072d89ba', 'a69bb100-a789-56a8-860d-1a65c7f840eb', '1ccbfb4c-dc27-56c7-b537-90cd8f9931a5', d.id, null, 'Préparer une candidature à un master à l’étranger.', 'TERMINEE', null,
  now() - interval '103 days', now() - interval '101 days', now() - interval '15 days', 0
from domaines_mentorat d where d.code = 'GESTION_PROJET' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('bbe5435a-fbf4-5307-8c97-e7074d9453bf', '56fc18d2-33e2-59ec-ab83-1bad072d89ba', date_trunc('hour', now()) + interval '-10 days', 45, 'PRESENTIEL', 'Bureaux de l’entreprise',
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', '8670e440-184b-5365-9e7b-3e0c983658b4', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('49384096-4359-54ff-bc2b-dc19603c2ab9', '56fc18d2-33e2-59ec-ab83-1bad072d89ba', date_trunc('hour', now()) + interval '-26 days', 60, 'PRESENTIEL', 'Bibliothèque de l’EPT',
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', '8670e440-184b-5365-9e7b-3e0c983658b4', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('877fbf3d-1068-59aa-af8d-edbfd3a3914d', '56fc18d2-33e2-59ec-ab83-1bad072d89ba', date_trunc('hour', now()) + interval '-70 days', 60, 'TELEPHONE', null,
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', '8670e440-184b-5365-9e7b-3e0c983658b4', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('7179ac2d-02bd-5ee7-b674-1e0a41a19d9f', '56fc18d2-33e2-59ec-ab83-1bad072d89ba', 'a69bb100-a789-56a8-860d-1a65c7f840eb', 4, 'Très utile pour préparer mes entretiens.', now() - interval '9 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '0a9a98a3-b8b9-521c-a09e-e887ea484719', '25ff0193-529a-5f33-b609-c64f82d415b3', '1eb3992b-1260-5784-8246-49163c0bd2d9', d.id, null, 'Me réorienter vers la data après quelques années en industrie.', 'TERMINEE', null,
  now() - interval '74 days', now() - interval '73 days', now() - interval '24 days', 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('27a28fa9-f9c9-57df-86f8-8f718ee4619e', '0a9a98a3-b8b9-521c-a09e-e887ea484719', date_trunc('hour', now()) + interval '-9 days', 45, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('add6be72-bba9-56cd-9c9f-8d1f414d2746', '0a9a98a3-b8b9-521c-a09e-e887ea484719', date_trunc('hour', now()) + interval '-59 days', 30, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('78225c0e-f5d8-5230-b1d6-0f7a8683bf0f', '0a9a98a3-b8b9-521c-a09e-e887ea484719', date_trunc('hour', now()) + interval '-41 days', 45, 'PRESENTIEL', 'Bureaux de l’entreprise',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('ec47b731-0a44-5973-a1dd-de3be0c39d4f', '0a9a98a3-b8b9-521c-a09e-e887ea484719', '25ff0193-529a-5f33-b609-c64f82d415b3', 5, 'Mentorat bienveillant et exigeant à la fois.', now() - interval '8 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '638ffe96-11b7-5c89-87e1-e791bc548915', 'a356c8fe-aad9-58e3-bfc2-29bca745f15a', '0dc53485-ec26-5833-beae-dcb1f7cd2fa5', d.id, null, 'Choisir une spécialisation et construire mon projet professionnel.', 'TERMINEE', null,
  now() - interval '49 days', now() - interval '47 days', now() - interval '14 days', 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('983dbb5f-fa9f-52a2-9c77-bfa0a93825f9', '638ffe96-11b7-5c89-87e1-e791bc548915', date_trunc('hour', now()) + interval '-14 days', 90, 'TELEPHONE', null,
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', 'b105f039-968f-520a-8860-da5b95b4482f', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('1e8f9e9a-1029-5227-8b24-57e5e3cc96a5', '638ffe96-11b7-5c89-87e1-e791bc548915', date_trunc('hour', now()) + interval '-38 days', 60, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Point sur les offres repérées ; échange sur les attentes des recruteurs.', 'b105f039-968f-520a-8860-da5b95b4482f', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('69019e8d-d498-57f4-9b6d-fe1df017374e', '638ffe96-11b7-5c89-87e1-e791bc548915', date_trunc('hour', now()) + interval '-30 days', 45, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', 'b105f039-968f-520a-8860-da5b95b4482f', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('25b1fe4b-6573-5354-adbb-0eabb4bd91c7', '638ffe96-11b7-5c89-87e1-e791bc548915', 'a356c8fe-aad9-58e3-bfc2-29bca745f15a', 4, 'Échanges riches, un peu espacés dans le temps.', now() - interval '6 days') on conflict do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('fec5f4da-0619-5ca7-b4c1-6fba50286c02', '638ffe96-11b7-5c89-87e1-e791bc548915', 'b105f039-968f-520a-8860-da5b95b4482f', 4, 'Très utile pour préparer mes entretiens.', now() - interval '1 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'cd0da3c9-4cae-5a6f-bc08-5ed55474952b', 'fd2abcc5-5026-56f8-9739-ad5c6994612f', '1eb3992b-1260-5784-8246-49163c0bd2d9', d.id, null, 'Préparer mon stage de fin d’études et mes entretiens.', 'TERMINEE', null,
  now() - interval '149 days', now() - interval '146 days', now() - interval '43 days', 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('0cd80bcd-223e-5e59-b94f-43c903a202e4', 'cd0da3c9-4cae-5a6f-bc08-5ed55474952b', date_trunc('hour', now()) + interval '-28 days', 45, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('107548a6-12cc-5f7f-9b37-fda35c78bbd0', 'cd0da3c9-4cae-5a6f-bc08-5ed55474952b', 'fd2abcc5-5026-56f8-9739-ad5c6994612f', 5, 'Un accompagnement précieux, je recommande.', now() - interval '5 days') on conflict do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('2c59780b-7ccc-569c-aa91-0d2f3f7b1302', 'cd0da3c9-4cae-5a6f-bc08-5ed55474952b', '1e8f70c6-3dff-5af1-9a96-985aa502c94b', 4, 'Échanges riches, un peu espacés dans le temps.', now() - interval '2 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '099b52d6-0d6c-5f42-8be0-01ab5c7f5554', '5c97b403-1475-5719-863d-b06958f0ad7b', '60aee8e1-666f-56df-bd65-3b4416814cf7', d.id, null, 'Améliorer mon CV et mon profil professionnel.', 'TERMINEE', null,
  now() - interval '44 days', now() - interval '41 days', now() - interval '13 days', 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('d2010845-c7e6-5f14-a1d5-cae0eabbbee6', '099b52d6-0d6c-5f42-8be0-01ab5c7f5554', date_trunc('hour', now()) + interval '-17 days', 60, 'PRESENTIEL', 'Bibliothèque de l’EPT',
  'REALISEE', 'Relecture du CV et de la lettre de motivation ; simulation d’entretien.', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('07f8033d-e7e8-5dce-b7c9-4616ffd358d2', '099b52d6-0d6c-5f42-8be0-01ab5c7f5554', '5c97b403-1475-5719-863d-b06958f0ad7b', 5, 'Mentorat bienveillant et exigeant à la fois.', now() - interval '4 days') on conflict do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('81f6dd1f-efff-505c-b34e-7ae8671d61b6', '099b52d6-0d6c-5f42-8be0-01ab5c7f5554', 'e0d2d0ba-0a1f-59b5-aec1-23b96b880300', 5, 'Un accompagnement précieux, je recommande.', now() - interval '10 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'ddeaed7a-b0e1-5d5c-b4b7-fcdcd3a4e8a8', 'eb601a8f-ae9f-5a99-9b34-ffd994889776', '51288483-57ad-5409-9ba5-97aace860b35', d.id, null, 'Monter un projet entrepreneurial avec des camarades.', 'TERMINEE', null,
  now() - interval '26 days', now() - interval '24 days', now() - interval '5 days', 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('a7a98d0e-492c-550c-9ce7-c18eb67efafb', 'ddeaed7a-b0e1-5d5c-b4b7-fcdcd3a4e8a8', date_trunc('hour', now()) + interval '-24 days', 90, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('7c02e822-da94-5059-9308-f796f9054c7d', 'ddeaed7a-b0e1-5d5c-b4b7-fcdcd3a4e8a8', date_trunc('hour', now()) + interval '-10 days', 90, 'TELEPHONE', null,
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('8952aa13-2553-56a9-8f9e-53fc30162ef8', 'ddeaed7a-b0e1-5d5c-b4b7-fcdcd3a4e8a8', date_trunc('hour', now()) + interval '-5 days', 30, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Présentation du métier au quotidien et des compétences recherchées.', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', now(), now())
on conflict (id) do nothing;
insert into seances_mentorat (id, mentorat_id, debut, duree_minutes, modalite, lieu_ou_lien, statut, compte_rendu, proposee_par_id, cree_le, modifie_le)
values ('284b6dc2-cb44-58e7-a6b4-1cf2d000293f', 'ddeaed7a-b0e1-5d5c-b4b7-fcdcd3a4e8a8', date_trunc('hour', now()) + interval '-12 days', 90, 'VISIO', 'https://meet.jit.si/ept-mentorat-demo',
  'REALISEE', 'Tour d’horizon du parcours et des objectifs ; liste de candidatures à préparer.', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', now(), now())
on conflict (id) do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('5ad811a1-8e39-59f7-9e1c-108c68aef066', 'ddeaed7a-b0e1-5d5c-b4b7-fcdcd3a4e8a8', 'eb601a8f-ae9f-5a99-9b34-ffd994889776', 5, 'Des conseils concrets et une vraie disponibilité. Merci !', now() - interval '9 days') on conflict do nothing;
insert into evaluations_mentorat (id, mentorat_id, auteur_id, note, commentaire, cree_le)
values ('01d29ee5-031a-51f0-aa73-8dd2067bf463', 'ddeaed7a-b0e1-5d5c-b4b7-fcdcd3a4e8a8', '20d4fb0d-adb2-5d38-b9fe-715a170435d3', 4, 'Échanges riches, un peu espacés dans le temps.', now() - interval '2 days') on conflict do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '6ed7f9d7-77d3-590e-bf90-fee906acb2ce', 'bd120997-d5e4-5d5f-b3c3-19f7e71b8d44', 'ca659577-8ca2-542c-a3d9-b2ab52bb430c', d.id, null, 'Trouver mon premier emploi après le diplôme.', 'EN_ATTENTE', null,
  now() - interval '7 days', null, null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'd11b8c2d-4403-5155-b56c-e646bf7a3bd4', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', '8601a9ce-93d7-5054-a93f-a5d326a172ed', d.id, 'c845c3d5-3540-5400-9d4c-8120099441a4', 'Préparer mon stage de fin d’études et mes entretiens.', 'EN_ATTENTE', null,
  now() - interval '9 days', null, null, 0
from domaines_mentorat d where d.code = 'GENIE_CIVIL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '1f47153d-5caf-522d-a373-7c412c5cab3e', 'aeb42be6-c8b9-5936-9659-4fc41e322b16', '3642683f-fbdc-5c6e-8adc-c2f294bc9275', d.id, null, 'Me réorienter vers la data après quelques années en industrie.', 'EN_ATTENTE', null,
  now() - interval '1 days', null, null, 0
from domaines_mentorat d where d.code = 'GENIE_CIVIL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '331a1977-c284-5c4c-b889-c8b6182f413e', 'ef6c88cb-7f71-5f28-b013-f3dc3f90329a', '0dc53485-ec26-5833-beae-dcb1f7cd2fa5', d.id, null, 'Me réorienter vers la data après quelques années en industrie.', 'EN_ATTENTE', null,
  now() - interval '5 days', null, null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'f5c892c9-f9a7-5be1-aec4-0fac42549e8c', 'bd120997-d5e4-5d5f-b3c3-19f7e71b8d44', '0dc53485-ec26-5833-beae-dcb1f7cd2fa5', d.id, null, 'Choisir une spécialisation et construire mon projet professionnel.', 'EN_ATTENTE', null,
  now() - interval '11 days', null, null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'e34e7b19-b5d5-5d12-a40f-b1daf67f3f12', 'ca5ba96e-0c6a-59ed-b007-16b3d75c27b3', '54176e12-437b-58d6-adce-220848f9fb9e', d.id, null, 'Choisir une spécialisation et construire mon projet professionnel.', 'EN_ATTENTE', null,
  now() - interval '17 days', null, null, 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '490de84d-238f-56c9-a0d5-756cc3365580', 'ec3fef72-9456-5acc-9639-000d9e507c1a', '62af8214-9016-5b27-a721-c13f133c7011', d.id, null, 'Monter un projet entrepreneurial avec des camarades.', 'EN_ATTENTE', null,
  now() - interval '4 days', null, null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '63079c69-e159-542a-808b-b350c398907f', '1b42620c-c483-53d0-81c2-11af42770c68', '6593bd3d-5461-5921-8cb5-05ab3975220c', d.id, null, 'Trouver mon premier emploi après le diplôme.', 'EN_ATTENTE', null,
  now() - interval '7 days', null, null, 0
from domaines_mentorat d where d.code = 'GESTION_PROJET' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'b1a7da50-811e-5c3d-a637-0672556c15a6', '7c7db830-2584-5eac-8dcf-abeb6ca91d55', 'c1341c31-185c-5b60-b59a-89bd9f44e9f4', d.id, null, 'Comprendre le métier au quotidien et préparer ma première candidature.', 'EN_ATTENTE', null,
  now() - interval '4 days', null, null, 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'b21c1ef7-8335-5ebc-97ba-73bec2df5fe8', '804935f3-67f5-5246-a0a0-1db7119996d7', '82b50c00-83e7-5482-9e09-d59913d3f62b', d.id, null, 'Préparer une candidature à un master à l’étranger.', 'EN_ATTENTE', null,
  now() - interval '18 days', null, null, 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'f47323e5-e2cb-51be-a5a4-91160c141bfb', '25ff0193-529a-5f33-b609-c64f82d415b3', '981f6855-3718-5345-9be2-7b44dbf2849c', d.id, null, 'Monter un projet entrepreneurial avec des camarades.', 'EN_ATTENTE', null,
  now() - interval '10 days', null, null, 0
from domaines_mentorat d where d.code = 'GESTION_PROJET' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'd29365c9-684c-51ad-b4af-9cd54d90d688', 'e84a9fc0-ca48-5c1a-85e1-f8fce2a9618a', 'ca659577-8ca2-542c-a3d9-b2ab52bb430c', d.id, null, 'Améliorer mon CV et mon profil professionnel.', 'EN_ATTENTE', null,
  now() - interval '13 days', null, null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '281bd3ee-5a41-5790-9410-3db79f4b934d', 'f2ddf2c7-06e2-56e5-b270-91ff9380f037', '045b4859-3996-58a7-966d-831c90c90973', d.id, null, 'Améliorer mon CV et mon profil professionnel.', 'REFUSEE', 'Je ne suis pas la bonne personne pour ce sujet ; un mentor de la filière vous aidera mieux.',
  now() - interval '54 days', now() - interval '51 days', null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'c88af2dc-6ca4-57af-94ed-be6229b6e44a', '31278c62-d3fb-59c0-b298-877946b40983', 'c1341c31-185c-5b60-b59a-89bd9f44e9f4', d.id, null, 'Choisir une spécialisation et construire mon projet professionnel.', 'REFUSEE', 'Je ne suis pas la bonne personne pour ce sujet ; un mentor de la filière vous aidera mieux.',
  now() - interval '113 days', now() - interval '112 days', null, 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'f19deabc-b1a3-5c2e-ac2a-b74463bcdc96', 'c66385a9-2e09-5478-9f8f-e2556567191f', '1ccbfb4c-dc27-56c7-b537-90cd8f9931a5', d.id, null, 'Améliorer mon CV et mon profil professionnel.', 'REFUSEE', 'Mon agenda est complet ce semestre, je vous recommande un autre mentor du même domaine.',
  now() - interval '11 days', now() - interval '10 days', null, 0
from domaines_mentorat d where d.code = 'GESTION_PROJET' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'f319de3e-4672-5df8-9c63-a92b8ffc458f', '2ad470a2-5a14-59b3-b5b2-531d823f53b3', '3642683f-fbdc-5c6e-8adc-c2f294bc9275', d.id, null, 'Améliorer mon CV et mon profil professionnel.', 'REFUSEE', 'Mon agenda est complet ce semestre, je vous recommande un autre mentor du même domaine.',
  now() - interval '38 days', now() - interval '37 days', null, 0
from domaines_mentorat d where d.code = 'GENIE_CIVIL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '349563cb-3c6f-5e63-aac9-0a769382d76d', '0efa151b-4536-5acd-98b8-9e62cd5042c5', '5f3c48e7-4acb-59be-a3d0-85f3325b6772', d.id, null, 'Améliorer mon CV et mon profil professionnel.', 'REFUSEE', 'Mon agenda est complet ce semestre, je vous recommande un autre mentor du même domaine.',
  now() - interval '58 days', now() - interval '55 days', null, 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'd3b6c46c-ee1d-5345-bef1-764041a52a6d', 'aa9de02b-b819-5dcb-9fed-e994479e6b7f', '96c47a9d-4bcc-5b66-914f-c63be7a75b5e', d.id, null, 'Améliorer mon CV et mon profil professionnel.', 'REFUSEE', 'Je ne suis pas la bonne personne pour ce sujet ; un mentor de la filière vous aidera mieux.',
  now() - interval '100 days', now() - interval '99 days', null, 0
from domaines_mentorat d where d.code = 'DEV_LOGICIEL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '08793c4d-6ce1-5949-9e39-dad73107ae87', '8c19c881-c56c-5007-92d0-fd9589c41646', '14a66b20-27b5-58f2-977b-1d3dba64c1aa', d.id, null, 'Préparer une candidature à un master à l’étranger.', 'ANNULEE', null,
  now() - interval '108 days', null, now() - interval '9 days', 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'b1aeb583-4050-55fd-aae7-17cfc49cfac6', '31278c62-d3fb-59c0-b298-877946b40983', '660efa68-b94a-566b-ab13-efd4cb8d5ca9', d.id, null, 'Améliorer mon CV et mon profil professionnel.', 'ANNULEE', null,
  now() - interval '3 days', null, now() - interval '1 days', 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '0b8ce79c-b472-5a1c-97b8-9f4c2806d272', '2e3cf9f7-e4c1-523f-be84-d3ac97b3407e', '14a66b20-27b5-58f2-977b-1d3dba64c1aa', d.id, null, 'Préparer une candidature à un master à l’étranger.', 'ANNULEE', null,
  now() - interval '105 days', null, now() - interval '20 days', 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '60fd6a01-6d89-5a3f-acd8-d004640c2216', 'ef6c88cb-7f71-5f28-b013-f3dc3f90329a', '3642683f-fbdc-5c6e-8adc-c2f294bc9275', d.id, null, 'Comprendre le métier au quotidien et préparer ma première candidature.', 'ANNULEE', null,
  now() - interval '145 days', null, now() - interval '24 days', 0
from domaines_mentorat d where d.code = 'GENIE_CIVIL' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select '2da3fb78-e18d-5247-bcd1-acca8342086b', 'a356c8fe-aad9-58e3-bfc2-29bca745f15a', '652995d5-49ee-52a6-bc6a-6e379337a43c', d.id, null, 'Préparer mon stage de fin d’études et mes entretiens.', 'ANNULEE', null,
  now() - interval '126 days', null, now() - interval '40 days', 0
from domaines_mentorat d where d.code = 'GESTION_PROJET' on conflict (id) do nothing;
insert into mentorats (id, mentore_id, profil_mentor_id, domaine_id, programme_id, objectif, statut, motif_refus, cree_le, repondu_le, cloture_le, version)
select 'e22fd5c8-f013-5fd3-beb4-8175cf14ed1d', 'd257bd7c-c404-57a1-a4fc-662d31f7a29d', '54176e12-437b-58d6-adce-220848f9fb9e', d.id, 'c845c3d5-3540-5400-9d4c-8120099441a4', 'Trouver mon premier emploi après le diplôme.', 'ANNULEE', null,
  now() - interval '43 days', null, now() - interval '13 days', 0
from domaines_mentorat d where d.code = 'ELECTROMECANIQUE' on conflict (id) do nothing;
commit;
