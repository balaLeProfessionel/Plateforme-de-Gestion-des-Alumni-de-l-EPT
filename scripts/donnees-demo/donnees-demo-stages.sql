-- Données de démonstration du module stages (STA-01 à STA-14), chargées après donnees-demo.sql et les données étendues.
-- Rejouable : identifiants fixes et « on conflict do nothing ». Les dates sont calculées par rapport au jour du chargement.
-- Les PDF (CV, conventions signées, rapports) sont déposés par charger.sh sous documents/… avec les mêmes noms.
--
-- Parcours prévus :
--   * administrateur (admin@demo…, super administrateur) : offre à vérifier (Sahel AgriTech), liste définitive à
--     publier (Cap-Vert Construction), déclaration à traiter, encadrants à désigner, conventions, évaluations, rapports,
--     historique de sollicitation ;
--   * organisme (kerdata@demo…, baobab-energie@demo…, cap-vert-construction@demo…, teranga-telecom@demo…) :
--     candidatures à évaluer, stagiaires, évaluation à remplir, indicateurs ;
--   * étudiants : Omar Badji (DIC3, a postulé), Khoudia Seck (DIC2, déclaration en attente), Elhadji Kane (DIC3, PFE
--     en cours), Alassane Diallo (rapport à déposer), Coumba Diagne (stage terminé et validé), Aminata Thiam
--     (doctorante : stage de recherche seulement), Samba Bodian (DIC2 informatique : alternance possible) ;
--   * personnel : Abdoulaye Sow et Pierre Mendy encadrants ; Ousmane Badji chef du département Génie Électromécanique.

-- 1. Administration : le compte de démonstration est super administrateur (toutes les responsabilités, stages compris).
insert into utilisateur_permission_admin (utilisateur_id, permission)
select 'f7de9858-2346-53fe-a544-d2cc267a6f17', 'GERER_ADMINISTRATEURS'
where not exists (select 1 from utilisateur_permission_admin where utilisateur_id = 'f7de9858-2346-53fe-a544-d2cc267a6f17' and permission = 'GERER_ADMINISTRATEURS');

-- 2. Classes des étudiants : celles des parcours, puis une répartition sur les autres.
update utilisateur set classe = v.classe from (values
  ('438d8c6e-122a-501e-bf8a-a8db962e4337'::uuid, 'DIC3'), ('4d33cf28-2592-56c3-b033-855cffb14776'::uuid, 'DIC3'),
  ('d4575e51-15e5-5732-9202-060f7c776e6f'::uuid, 'MASTER2'), ('422e77a7-ae81-5b28-be87-0e8d9b3c769d'::uuid, 'DIC2'),
  ('d95c2e6e-2b83-501b-9ac4-49a06f4029bc'::uuid, 'TC2'), ('c66385a9-2e09-5478-9f8f-e2556567191f'::uuid, 'DIC1'),
  ('7c7db830-2584-5eac-8dcf-abeb6ca91d55'::uuid, 'DIC1'), ('25ff0193-529a-5f33-b609-c64f82d415b3'::uuid, 'DIC3'),
  ('8c19c881-c56c-5007-92d0-fd9589c41646'::uuid, 'DIC3'), ('6904214d-a1f0-5cf9-b47d-c8344e8ff2c0'::uuid, 'DIC3'),
  ('ef6c88cb-7f71-5f28-b013-f3dc3f90329a'::uuid, 'DIC3'), ('fd2abcc5-5026-56f8-9739-ad5c6994612f'::uuid, 'DIC2'),
  ('aeb42be6-c8b9-5936-9659-4fc41e322b16'::uuid, 'DOCTORAT1')
) as v(id, classe)
where utilisateur.id = v.id and utilisateur.classe is null;

update utilisateur u set classe = (array['TC1', 'TC2', 'DIC1', 'DIC2', 'DIC3', 'MASTER1'])[1 + (r.rang % 6)]
from (select id, row_number() over (order by id) as rang from utilisateur where role = 'ETUDIANT' and classe is null) r
where u.id = r.id;

-- 3. Personnel : filières, et un chef de département.
update utilisateur set filiere_id = (select id from filiere where nom = 'Génie Électromécanique')
where id in ('dc23b8dd-7e75-583d-a661-962ac846c8b8', '8bc22c03-0373-5d99-a18d-1e1c2d71578c') and filiere_id is null;
update utilisateur set filiere_id = (select id from filiere where nom = 'Génie Informatique et Télécommunications')
where id = '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c' and filiere_id is null;
insert into chef_departement (filiere_id, chef_id, designe_le, designe_par_id)
select id, '8bc22c03-0373-5d99-a18d-1e1c2d71578c', now() - interval '60 days', 'f7de9858-2346-53fe-a544-d2cc267a6f17'
from filiere where nom = 'Génie Électromécanique'
on conflict do nothing;

-- 4. Offres de stage.
insert into offre_stage (id, organisme_id, titre, description, competences, duree_mois, type_stage, lieu, date_debut_prevue,
  nombre_places, date_limite_candidature, statut, motif_decision, creee_par_id, creee_le, publiee_le, liste_publiee_le, version)
values
  ('d0000000-0000-4000-8000-000000000001', '9a407d0c-7bf8-5252-8fdd-29fc61c80b63', 'Plateforme d’analyse des données clients',
   'Concevoir un entrepôt de données et des tableaux de bord pour suivre l’usage de nos services par les PME clientes.',
   'SQL, Python, notions de modélisation décisionnelle', 6, 'PFE', 'Dakar', date_trunc('month', current_date + interval '3 months')::date,
   2, current_date + 20, 'PUBLIEE', null, 'f7de9858-2346-53fe-a544-d2cc267a6f17', now() - interval '12 days', now() - interval '10 days', null, 0),
  ('d0000000-0000-4000-8000-000000000002', '8846e4dc-1afe-5f34-91f5-2262f76f4006', 'Alternance – supervision du réseau mobile',
   'Participer à l’exploitation du cœur de réseau et automatiser les rapports d’incidents, en alternance avec la formation.',
   'Réseaux IP, scripts Bash ou Python', 12, 'ALTERNANCE', 'Dakar', date_trunc('month', current_date + interval '2 months')::date,
   1, current_date + 30, 'PUBLIEE', null, 'f7de9858-2346-53fe-a544-d2cc267a6f17', now() - interval '6 days', now() - interval '5 days', null, 0),
  ('d0000000-0000-4000-8000-000000000003', '3e4bf4ab-5b3a-5436-8e8f-4cd7f25b802f', 'Stage ouvrier sur chantier de bâtiment',
   'Découvrir l’organisation d’un chantier : implantation, coffrage, contrôle des bétons, sécurité.',
   'Curiosité, rigueur, respect des consignes de sécurité', 2, 'OUVRIER', 'Thiès', date_trunc('month', current_date + interval '2 months')::date,
   3, current_date - 5, 'PUBLIEE', null, 'f7de9858-2346-53fe-a544-d2cc267a6f17', now() - interval '40 days', now() - interval '38 days', null, 0),
  ('d0000000-0000-4000-8000-000000000004', 'ad907e30-c5ea-5d71-bcee-e646c8faba85', 'Dimensionnement d’une centrale solaire hybride',
   'Étudier le dimensionnement d’une centrale photovoltaïque avec stockage pour un site isolé.',
   'Électrotechnique, tableur, PVsyst apprécié', 3, 'MAITRISE', 'Kaolack', make_date(extract(year from current_date)::int, 6, 15),
   2, make_date(extract(year from current_date)::int, 4, 15), 'LISTE_PUBLIEE', null, 'f7de9858-2346-53fe-a544-d2cc267a6f17',
   make_date(extract(year from current_date)::int, 3, 1)::timestamp, make_date(extract(year from current_date)::int, 3, 5)::timestamp,
   make_date(extract(year from current_date)::int, 5, 2)::timestamp, 0),
  ('d0000000-0000-4000-8000-000000000005', '9a407d0c-7bf8-5252-8fdd-29fc61c80b63', 'Application de suivi des tickets clients',
   'Développer une application web de suivi des demandes clients, de la saisie à la clôture.',
   'Java ou JavaScript, bases de données', 3, 'MAITRISE', 'Dakar', make_date(extract(year from current_date)::int - 1, 6, 16),
   1, make_date(extract(year from current_date)::int - 1, 4, 10), 'LISTE_PUBLIEE', null, 'f7de9858-2346-53fe-a544-d2cc267a6f17',
   make_date(extract(year from current_date)::int - 1, 3, 1)::timestamp, make_date(extract(year from current_date)::int - 1, 3, 3)::timestamp,
   make_date(extract(year from current_date)::int - 1, 5, 2)::timestamp, 0),
  ('d0000000-0000-4000-8000-000000000006', '16397ae4-872c-5909-a942-7f13d802f0bb', 'Capteurs connectés pour l’irrigation',
   'Prototyper un réseau de capteurs d’humidité du sol et un tableau de bord pour piloter l’irrigation goutte-à-goutte.',
   'Électronique embarquée, LoRa, Python', 6, 'PFE', 'Saint-Louis', date_trunc('month', current_date + interval '3 months')::date,
   1, current_date + 40, 'SOUMISE', null, 'f7de9858-2346-53fe-a544-d2cc267a6f17', now() - interval '2 days', null, null, 0)
on conflict do nothing;

-- 5. Candidatures (CV déposés par charger.sh).
insert into candidature (id, offre_id, etudiant_id, cv, nom_cv, lettre_motivation, statut, avis_organisme, avis_donne_le, envoyee_le, retiree_le, version)
values
  ('d0000000-0000-4000-8000-000000000101', 'd0000000-0000-4000-8000-000000000001', '438d8c6e-122a-501e-bf8a-a8db962e4337',
   'f0000000-0000-4000-8000-000000000101.pdf', 'CV Omar Badji.pdf', 'Mon projet de semestre portait sur un entrepôt de données ; je souhaite approfondir ce sujet.',
   'ENVOYEE', 'RETENUE', now() - interval '2 days', now() - interval '8 days', null, 0),
  ('d0000000-0000-4000-8000-000000000102', 'd0000000-0000-4000-8000-000000000001', '4d33cf28-2592-56c3-b033-855cffb14776',
   'f0000000-0000-4000-8000-000000000102.pdf', 'CV Bineta Camara.pdf', null, 'ENVOYEE', 'EN_ATTENTE', null, now() - interval '4 days', null, 0),
  ('d0000000-0000-4000-8000-000000000103', 'd0000000-0000-4000-8000-000000000001', 'd4575e51-15e5-5732-9202-060f7c776e6f',
   'f0000000-0000-4000-8000-000000000103.pdf', 'CV Mor Dia.pdf', null, 'ENVOYEE', 'NON_RETENUE', now() - interval '1 day', now() - interval '7 days', null, 0),
  ('d0000000-0000-4000-8000-000000000104', 'd0000000-0000-4000-8000-000000000003', 'd95c2e6e-2b83-501b-9ac4-49a06f4029bc',
   'f0000000-0000-4000-8000-000000000104.pdf', 'CV Aliou Camara.pdf', null, 'ENVOYEE', 'RETENUE', now() - interval '3 days', now() - interval '30 days', null, 0),
  ('d0000000-0000-4000-8000-000000000105', 'd0000000-0000-4000-8000-000000000003', 'c66385a9-2e09-5478-9f8f-e2556567191f',
   'f0000000-0000-4000-8000-000000000105.pdf', 'CV Bamba Coly.pdf', null, 'ENVOYEE', 'RETENUE', now() - interval '3 days', now() - interval '25 days', null, 0),
  ('d0000000-0000-4000-8000-000000000106', 'd0000000-0000-4000-8000-000000000003', '7c7db830-2584-5eac-8dcf-abeb6ca91d55',
   'f0000000-0000-4000-8000-000000000106.pdf', 'CV Codou Diallo.pdf', null, 'RETIREE', 'EN_ATTENTE', null, now() - interval '20 days', now() - interval '15 days', 0),
  ('d0000000-0000-4000-8000-000000000107', 'd0000000-0000-4000-8000-000000000004', '25ff0193-529a-5f33-b609-c64f82d415b3',
   'f0000000-0000-4000-8000-000000000107.pdf', 'CV Coumba Diagne.pdf', null, 'ENVOYEE', 'RETENUE',
   make_date(extract(year from current_date)::int, 4, 20)::timestamp, make_date(extract(year from current_date)::int, 3, 20)::timestamp, null, 0),
  ('d0000000-0000-4000-8000-000000000108', 'd0000000-0000-4000-8000-000000000004', '8c19c881-c56c-5007-92d0-fd9589c41646',
   'f0000000-0000-4000-8000-000000000108.pdf', 'CV Alassane Diallo.pdf', null, 'ENVOYEE', 'RETENUE',
   make_date(extract(year from current_date)::int, 4, 20)::timestamp, make_date(extract(year from current_date)::int, 3, 22)::timestamp, null, 0),
  ('d0000000-0000-4000-8000-000000000109', 'd0000000-0000-4000-8000-000000000005', '6904214d-a1f0-5cf9-b47d-c8344e8ff2c0',
   'f0000000-0000-4000-8000-000000000109.pdf', 'CV Yacine Diouf.pdf', null, 'ENVOYEE', 'RETENUE',
   make_date(extract(year from current_date)::int - 1, 4, 15)::timestamp, make_date(extract(year from current_date)::int - 1, 3, 20)::timestamp, null, 0)
on conflict do nothing;

-- 6. Stages : liste en préparation (Cap-Vert), stages confirmés (Baobab cette année, Kër Data l'an dernier),
--    déclaration validée (Jàmm Pay, PFE en cours) et déclaration en attente.
insert into stage (id, etudiant_id, organisme_id, organisme_propose, offre_id, candidature_id, type_stage, sujet, lieu, date_debut, date_fin,
  statut, encadrant_interne_id, tuteur_nom, tuteur_fonction, tuteur_email, tuteur_telephone, motif, cree_par_id, cree_le, confirme_le,
  annule_le, decide_par_id, decide_le, version)
values
  ('d0000000-0000-4000-8000-000000000201', 'd95c2e6e-2b83-501b-9ac4-49a06f4029bc', '3e4bf4ab-5b3a-5436-8e8f-4cd7f25b802f', null,
   'd0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000104', 'OUVRIER', 'Stage ouvrier sur chantier de bâtiment', 'Thiès',
   date_trunc('month', current_date + interval '2 months')::date, (date_trunc('month', current_date + interval '2 months') + interval '2 months - 1 day')::date,
   'EN_PREPARATION', null, null, null, null, null, null, 'f7de9858-2346-53fe-a544-d2cc267a6f17', now() - interval '1 day', null, null, null, null, 0),
  ('d0000000-0000-4000-8000-000000000202', '25ff0193-529a-5f33-b609-c64f82d415b3', 'ad907e30-c5ea-5d71-bcee-e646c8faba85', null,
   'd0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000107', 'MAITRISE', 'Dimensionnement d’une centrale solaire hybride', 'Kaolack',
   make_date(extract(year from current_date)::int, 6, 15), make_date(extract(year from current_date)::int, 8, 31),
   'CONFIRME', 'dc23b8dd-7e75-583d-a661-962ac846c8b8', 'Moussa Faye', 'Ingénieur études', 'moussa.faye@baobab-energie.example.invalid', '+221 77 000 00 11',
   null, 'f7de9858-2346-53fe-a544-d2cc267a6f17', make_date(extract(year from current_date)::int, 4, 28)::timestamp,
   make_date(extract(year from current_date)::int, 5, 2)::timestamp, null, null, null, 0),
  ('d0000000-0000-4000-8000-000000000203', '8c19c881-c56c-5007-92d0-fd9589c41646', 'ad907e30-c5ea-5d71-bcee-e646c8faba85', null,
   'd0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000108', 'MAITRISE', 'Dimensionnement d’une centrale solaire hybride', 'Kaolack',
   make_date(extract(year from current_date)::int, 6, 15), make_date(extract(year from current_date)::int, 8, 31),
   'CONFIRME', 'dc23b8dd-7e75-583d-a661-962ac846c8b8', 'Moussa Faye', 'Ingénieur études', 'moussa.faye@baobab-energie.example.invalid', null,
   null, 'f7de9858-2346-53fe-a544-d2cc267a6f17', make_date(extract(year from current_date)::int, 4, 28)::timestamp,
   make_date(extract(year from current_date)::int, 5, 2)::timestamp, null, null, null, 0),
  ('d0000000-0000-4000-8000-000000000204', '6904214d-a1f0-5cf9-b47d-c8344e8ff2c0', '9a407d0c-7bf8-5252-8fdd-29fc61c80b63', null,
   'd0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000109', 'MAITRISE', 'Application de suivi des tickets clients', 'Dakar',
   make_date(extract(year from current_date)::int - 1, 6, 16), make_date(extract(year from current_date)::int - 1, 8, 29),
   'CONFIRME', '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c', 'Awa Ndiaye', 'Responsable produit', 'awa.ndiaye@kerdata.example.invalid', null,
   null, 'f7de9858-2346-53fe-a544-d2cc267a6f17', make_date(extract(year from current_date)::int - 1, 4, 28)::timestamp,
   make_date(extract(year from current_date)::int - 1, 5, 2)::timestamp, null, null, null, 0),
  ('d0000000-0000-4000-8000-000000000205', 'ef6c88cb-7f71-5f28-b013-f3dc3f90329a', 'ef43641a-d71b-5aee-ba0f-7725c094609d', null,
   null, null, 'PFE', 'Détection de fraude sur les paiements mobiles', 'Dakar',
   (date_trunc('month', current_date) - interval '1 month')::date, (date_trunc('month', current_date) + interval '5 months - 1 day')::date,
   'CONFIRME', '5423dc6e-6e27-5e4f-8e0f-9abe99fc159c', 'Cheikh Diop', 'Lead data scientist', 'cheikh.diop@jammpay.example.invalid', '+221 76 000 00 22',
   null, 'ef6c88cb-7f71-5f28-b013-f3dc3f90329a', now() - interval '50 days', now() - interval '45 days', null,
   'f7de9858-2346-53fe-a544-d2cc267a6f17', now() - interval '45 days', 0),
  ('d0000000-0000-4000-8000-000000000206', 'fd2abcc5-5026-56f8-9739-ad5c6994612f', null, 'Thiès Digital Lab',
   null, null, 'MAITRISE', 'Application mobile de réservation pour les artisans', 'Thiès',
   make_date(extract(year from current_date)::int + 1, 6, 15), make_date(extract(year from current_date)::int + 1, 8, 31),
   'DECLARE', null, 'Ndèye Fall', 'Fondatrice', 'ndeye.fall@thiesdigital.example.invalid', null,
   null, 'fd2abcc5-5026-56f8-9739-ad5c6994612f', now() - interval '3 days', null, null, null, null, 0)
on conflict do nothing;

-- 7. Conventions : complètes pour les stages terminés, en cours pour le PFE de Jàmm Pay (signature de l'école et scan manquants).
insert into convention_stage (id, stage_id, assurance, indemnite, logement, clause_confidentialite, signee_etudiant_le, signee_organisme_le,
  signee_ecole_le, scan, scan_nom_original, modifie_par_id, cree_le, modifie_le, version)
values
  ('d0000000-0000-4000-8000-000000000301', 'd0000000-0000-4000-8000-000000000202', 'AXA Sénégal, police 2026-4471', '75 000 FCFA par mois',
   'Hébergement fourni sur le site', false, make_date(extract(year from current_date)::int, 5, 20), make_date(extract(year from current_date)::int, 5, 22),
   make_date(extract(year from current_date)::int, 5, 27), 'f0000000-0000-4000-8000-000000000301.pdf', 'Convention Coumba Diagne.pdf',
   'f7de9858-2346-53fe-a544-d2cc267a6f17', make_date(extract(year from current_date)::int, 5, 10)::timestamp, make_date(extract(year from current_date)::int, 5, 27)::timestamp, 0),
  ('d0000000-0000-4000-8000-000000000302', 'd0000000-0000-4000-8000-000000000203', 'AXA Sénégal, police 2026-4472', '75 000 FCFA par mois',
   'Hébergement fourni sur le site', false, make_date(extract(year from current_date)::int, 5, 21), make_date(extract(year from current_date)::int, 5, 22),
   make_date(extract(year from current_date)::int, 5, 27), 'f0000000-0000-4000-8000-000000000302.pdf', 'Convention Alassane Diallo.pdf',
   'f7de9858-2346-53fe-a544-d2cc267a6f17', make_date(extract(year from current_date)::int, 5, 10)::timestamp, make_date(extract(year from current_date)::int, 5, 27)::timestamp, 0),
  ('d0000000-0000-4000-8000-000000000303', 'd0000000-0000-4000-8000-000000000204', 'Allianz Sénégal, police 2025-118', '50 000 FCFA par mois',
   'Aucun', true, make_date(extract(year from current_date)::int - 1, 5, 20), make_date(extract(year from current_date)::int - 1, 5, 21),
   make_date(extract(year from current_date)::int - 1, 5, 26), 'f0000000-0000-4000-8000-000000000303.pdf', 'Convention Yacine Diouf.pdf',
   'f7de9858-2346-53fe-a544-d2cc267a6f17', make_date(extract(year from current_date)::int - 1, 5, 10)::timestamp, make_date(extract(year from current_date)::int - 1, 5, 26)::timestamp, 0),
  ('d0000000-0000-4000-8000-000000000304', 'd0000000-0000-4000-8000-000000000205', 'Assurance de l’école', '150 000 FCFA par mois',
   'Aucun', true, (current_date - 40), (current_date - 38), null, null, null,
   'f7de9858-2346-53fe-a544-d2cc267a6f17', now() - interval '44 days', now() - interval '38 days', 0)
on conflict do nothing;

-- 8. Évaluations : remise et validée (Coumba Diagne, Yacine Diouf), brouillon de l'organisme (Alassane Diallo).
insert into evaluation_stage (id, stage_id, duree_effective_mois, points_forts, axes_amelioration, observations, appreciation_generale,
  avis_tuteur_valide, saisie_par_ecole, soumise_le, soumise_par_id, stage_valide, decide_le, decide_par_id, modifie_par_id, cree_le, modifie_le, version)
values
  ('d0000000-0000-4000-8000-000000000401', 'd0000000-0000-4000-8000-000000000202', 2.5, 'Rigueur dans les calculs, bonne autonomie sur le logiciel de simulation.',
   'Gagner en aisance pour présenter ses résultats à l’oral.', 'Stagiaire très impliquée ; nous la reprendrions volontiers.', 'TRES_SATISFAISANT',
   true, false, make_date(extract(year from current_date)::int, 9, 5)::timestamp, (select id from utilisateur where organisme_id = 'ad907e30-c5ea-5d71-bcee-e646c8faba85' limit 1),
   true, make_date(extract(year from current_date)::int, 9, 12)::timestamp, 'f7de9858-2346-53fe-a544-d2cc267a6f17',
   (select id from utilisateur where organisme_id = 'ad907e30-c5ea-5d71-bcee-e646c8faba85' limit 1),
   make_date(extract(year from current_date)::int, 9, 1)::timestamp, make_date(extract(year from current_date)::int, 9, 12)::timestamp, 0),
  ('d0000000-0000-4000-8000-000000000402', 'd0000000-0000-4000-8000-000000000203', 2.5, 'Sérieux et ponctuel.', null, null, null,
   null, false, null, null, null, null, null, (select id from utilisateur where organisme_id = 'ad907e30-c5ea-5d71-bcee-e646c8faba85' limit 1),
   make_date(extract(year from current_date)::int, 9, 3)::timestamp, make_date(extract(year from current_date)::int, 9, 3)::timestamp, 0),
  ('d0000000-0000-4000-8000-000000000403', 'd0000000-0000-4000-8000-000000000204', 2.5, 'Code propre et bien testé.', 'Mieux estimer ses délais.',
   null, 'SATISFAISANT', true, true, make_date(extract(year from current_date)::int - 1, 9, 10)::timestamp, 'f7de9858-2346-53fe-a544-d2cc267a6f17',
   true, make_date(extract(year from current_date)::int - 1, 9, 15)::timestamp, 'f7de9858-2346-53fe-a544-d2cc267a6f17', 'f7de9858-2346-53fe-a544-d2cc267a6f17',
   make_date(extract(year from current_date)::int - 1, 9, 10)::timestamp, make_date(extract(year from current_date)::int - 1, 9, 15)::timestamp, 0)
on conflict do nothing;

insert into evaluation_stage_critere (evaluation_id, critere, niveau)
select e.id, c.critere, case when e.id = 'd0000000-0000-4000-8000-000000000403' and c.rang % 3 = 0 then 'SATISFAISANT'
                            when e.id = 'd0000000-0000-4000-8000-000000000403' and c.rang = 14 then 'A_AMELIORER'
                            when c.rang % 4 = 0 then 'SATISFAISANT' else 'TRES_SATISFAISANT' end
from (values ('d0000000-0000-4000-8000-000000000401'::uuid), ('d0000000-0000-4000-8000-000000000403'::uuid)) as e(id)
cross join (values (1, 'RESPECT_SECURITE'), (2, 'COMPREHENSION_TACHES'), (3, 'ADAPTATION'), (4, 'CONNAISSANCES_THEORIQUES'),
  (5, 'QUALITE_TRAVAIL'), (6, 'ORGANISATION'), (7, 'AUTONOMIE'), (8, 'DELAIS_OBJECTIFS'), (9, 'MOTIVATION'), (10, 'INITIATIVE'),
  (11, 'COMMUNICATION'), (12, 'TRAVAIL_EQUIPE'), (13, 'SAVOIR_ETRE'), (14, 'PONCTUALITE')) as c(rang, critere)
on conflict do nothing;
insert into evaluation_stage_critere (evaluation_id, critere, niveau)
values ('d0000000-0000-4000-8000-000000000402', 'RESPECT_SECURITE', 'TRES_SATISFAISANT'), ('d0000000-0000-4000-8000-000000000402', 'PONCTUALITE', 'TRES_SATISFAISANT')
on conflict do nothing;

-- 9. Rapports : déposés (Coumba Diagne, Yacine Diouf), attendu dans 15 jours (Alassane Diallo).
insert into rapport_stage (id, stage_id, date_limite, date_limite_par_id, fichier, nom_original, depose_le, version)
values
  ('d0000000-0000-4000-8000-000000000501', 'd0000000-0000-4000-8000-000000000202', make_date(extract(year from current_date)::int, 9, 30),
   'f7de9858-2346-53fe-a544-d2cc267a6f17', 'f0000000-0000-4000-8000-000000000501.pdf', 'Rapport de stage Coumba Diagne.pdf',
   make_date(extract(year from current_date)::int, 9, 25)::timestamp, 0),
  ('d0000000-0000-4000-8000-000000000502', 'd0000000-0000-4000-8000-000000000203', current_date + 15,
   'f7de9858-2346-53fe-a544-d2cc267a6f17', null, null, null, 0),
  ('d0000000-0000-4000-8000-000000000503', 'd0000000-0000-4000-8000-000000000204', make_date(extract(year from current_date)::int - 1, 9, 30),
   'f7de9858-2346-53fe-a544-d2cc267a6f17', 'f0000000-0000-4000-8000-000000000503.pdf', 'Rapport de stage Yacine Diouf.pdf',
   make_date(extract(year from current_date)::int - 1, 9, 28)::timestamp, 0)
on conflict do nothing;

-- 10. Une sollicitation envoyée en octobre (historique).
insert into sollicitation (id, type, objet, message, envoyee_par_id, envoyee_le)
values ('d0000000-0000-4000-8000-000000000601', 'SUJETS_PFE', 'Proposition de sujets de projet de fin d’études',
  'Madame, Monsieur,

L’École polytechnique de Thiès prépare les projets de fin d’études de ses élèves ingénieurs (DIC3) et de ses étudiants de Master 2.

Nous vous invitons à nous proposer des sujets de stage de fin d’études, d’une durée de quatre à six mois, sur la plateforme EPT Alumni, rubrique Stages.

L’administration des stages de l’EPT', 'f7de9858-2346-53fe-a544-d2cc267a6f17', make_date(extract(year from current_date)::int, 10, 6)::timestamp)
on conflict do nothing;
insert into sollicitation_destinataire (sollicitation_id, rang, organisme_id, nom, email)
select 'd0000000-0000-4000-8000-000000000601', r.rang, o.id, o.nom, u.email
from (values (0, '9a407d0c-7bf8-5252-8fdd-29fc61c80b63'::uuid), (1, 'ad907e30-c5ea-5d71-bcee-e646c8faba85'::uuid),
             (2, '8846e4dc-1afe-5f34-91f5-2262f76f4006'::uuid)) as r(rang, id)
join organisme o on o.id = r.id join utilisateur u on u.organisme_id = o.id
on conflict do nothing;
