-- Témoignages de démonstration (base de développement uniquement) : personnes et propos fictifs.
-- À charger APRÈS donnees-demo.sql et donnees-demo-etendues.sql, qui créent les membres et leurs portraits.
-- La table est créée par le backend au démarrage. Identifiants stables : le script peut être rejoué.
\set ON_ERROR_STOP on
begin;

insert into temoignages (id, nom, promotion, fonction, organisation, pays, texte, url_photo, publie, ordre, cree_le)
select v.id::uuid, v.nom, v.promotion, v.fonction, v.organisation, v.pays, v.texte, u.url_photo, true, v.ordre, now()
from (values
  ('3c1a7f10-52d4-5c0e-9a11-7d2e4b6f0a01', 'aminata.sarr@demo.ept-alumni.invalid', 'Aminata Sarr', 'D2012', 'Directrice technique', 'Kër Data', 'Sénégal', 1,
   'J’ai retrouvé deux camarades de ma promotion dans l’annuaire, puis j’ai proposé du mentorat à des étudiants en informatique. Nous planifions nos séances directement sur la plateforme.'),
  ('3c1a7f10-52d4-5c0e-9a11-7d2e4b6f0a02', 'moussa.diop@demo.ept-alumni.invalid', 'Moussa Diop', 'D2011', 'Responsable maintenance industrielle', 'Baobab Énergie', 'Sénégal', 2,
   'Une étudiante en électromécanique m’a contacté pour préparer son projet de fin d’études. En trois séances, nous avons cadré son sujet et sa recherche de stage.'),
  ('3c1a7f10-52d4-5c0e-9a11-7d2e4b6f0a03', 'lamine.toure@demo.ept-alumni.invalid', 'Lamine Touré', 'D2009', 'Directeur régional des travaux', 'Thiès Ingénierie Conseil', 'Sénégal', 3,
   'Les événements de l’école m’ont permis de reprendre contact avec l’EPT après plusieurs années sur les chantiers. Je suis revenu présenter mon métier aux étudiants de génie civil.'),
  ('3c1a7f10-52d4-5c0e-9a11-7d2e4b6f0a04', 'assane.gueye@demo.ept-alumni.invalid', 'Assane Gueye', 'D2004', 'Directeur de projets', 'Dakar Cloud Services', 'Sénégal', 4,
   'Quand notre équipe a cherché un jeune ingénieur en réseaux, l’annuaire m’a permis de contacter directement des diplômés de la filière et de vérifier leur parcours.'),
  ('3c1a7f10-52d4-5c0e-9a11-7d2e4b6f0a05', 'souleymane.mbengue@demo.ept-alumni.invalid', 'Souleymane Mbengue', 'D2009', 'Directeur de projets', 'Ciments de la Petite Côte', 'Sénégal', 5,
   'Je tiens mon parcours à jour sur mon profil. Des étudiants de ma filière me sollicitent ainsi sur des questions précises, et l’échange reste simple à organiser.')
) as v(id, email, nom, promotion, fonction, organisation, pays, ordre, texte)
join utilisateur u on u.email = v.email
on conflict (id) do update set
  nom = excluded.nom, promotion = excluded.promotion, fonction = excluded.fonction, organisation = excluded.organisation,
  pays = excluded.pays, texte = excluded.texte, url_photo = excluded.url_photo, publie = excluded.publie, ordre = excluded.ordre;

commit;
