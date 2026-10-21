# Mentorat — catalogue des cas de test (étape 1)

Périmètre : offre de mentorat, recherche de mentors, demandes et statuts, séances, évaluation,
notifications, écrans Angular. Les programmes et jalons (étape 2) ne sont pas encore exposés.

Chaque cas indique **où il est vérifié** :
- `B:<Classe>.<méthode>` — test d'intégration backend (`backend/src/test/java/.../mentorat/`) ;
- `F:<fichier>` — test Vitest frontend (`frontend/src/app/.../*.spec.ts`) ;
- `Navigateur` — vérification manuelle dans le navigateur intégré (dernière passe : 21 oct. 2026).

## Règles de référence

| Sujet | Règle |
|---|---|
| Rôles | Seul un **alumni** propose du mentorat ; seul un **étudiant** en demande. |
| Mentor visible | Compte `ACTIF`, e-mail vérifié, rôle `ALUMNI`, offre existante ; on ne se voit pas soi-même. |
| Capacité | 1 à 10 mentorés acceptés en même temps (3 par défaut). |
| Unicité | Une seule demande en cours (`EN_ATTENTE` ou `ACCEPTEE`) entre un étudiant et un mentor. |
| Statuts | `EN_ATTENTE` → `ACCEPTEE` / `REFUSEE` / `ANNULEE` ; `ACCEPTEE` → `TERMINEE`. Les autres sont finaux. |
| Qui agit | Accepter / refuser : le mentor. Annuler : l'étudiant (demande en attente). Terminer : l'un ou l'autre. |
| Visibilité | Un mentorat n'existe (404) que pour ses deux participants. |
| Séances | Planifier, consigner, annuler : uniquement pendant un mentorat `ACCEPTEE`. Durée 15 à 240 min. |
| Séance | `PLANIFIEE` → `REALISEE` (compte rendu possible, modifiable) ou `ANNULEE` (sans compte rendu, finale). |
| Évaluation | Après `TERMINEE`, une par participant, note 1 à 5, commentaire ≤ 1000. |
| Notifications | Envoyées après validation en base, à l'autre participant ; jamais pour une action refusée. |

## Backend

### Référentiel et offre (P)
| ID | Cas | Attendu | Vérifié par |
|---|---|---|---|
| P01 | Lister les domaines | 10 domaines actifs, ordonnés, créés une seule fois | B:MentoratProfil.p01 |
| P02 | Domaine désactivé | Absent de la liste, refusé dans une offre (400) | B:MentoratProfil.p02 |
| P03 | Appel sans connexion | 403 | B:MentoratProfil.p03 |
| P04 | Offre par étudiant, personnel, visiteur, organisme, admin | 403 « Seuls les alumni… » | B:MentoratProfil.p04 (5 rôles) |
| P05 | Première offre | `GET /profil` 404 puis offre créée avec ses valeurs | B:MentoratProfil.p05 |
| P06 | Modifier l'offre | Même identifiant, domaines remplacés | B:MentoratProfil.p06 |
| P07 | Présentation vide | Enregistrée comme absente | B:MentoratProfil.p07 |
| P08 | Offre invalide : aucun domaine, capacité 0 ou 11, `disponible` ou domaines absents | 400 | B:MentoratProfil.p08 (5 variantes) |
| P09 | 6 domaines, présentation > 600 | 400 avec message | B:MentoratProfil.p09 |
| P10 | Domaine inconnu | 400 « Un des domaines choisis n'existe pas. » | B:MentoratProfil.p10 |
| P11 | Capacité sous le nombre de mentorés actifs | 409 ; égale au nombre : acceptée | B:MentoratProfil.p11 |

### Recherche (R)
| ID | Cas | Attendu | Vérifié par |
|---|---|---|---|
| R01 | Recherche par nom (casse ignorée) ou par poste | Mentor trouvé ; texte inconnu → 0 | B:MentoratProfil.r01 |
| R02 | Filtres domaine et « disponibles uniquement » | Appliqués, combinables | B:MentoratProfil.r02 |
| R03 | Tri | Disponibles d'abord, puis par nom | B:MentoratProfil.r03 |
| R04 | Compte en attente, suspendu, non vérifié ; soi-même | Jamais affichés | B:MentoratProfil.r04 |
| R05 | Places restantes et « demande en cours » | Suivent acceptation et clôture | B:MentoratProfil.r05 |
| R06 | Pagination | `taille` 1–48, `page` ≥ 0, recherche ≤ 100 caractères ; découpage correct | B:MentoratProfil.r06 |
| R07 | Données privées | Ni e-mail, ni téléphone, ni date de naissance | B:MentoratProfil.r07 |

### Demandes (D)
| ID | Cas | Attendu | Vérifié par |
|---|---|---|---|
| D01 | Demande valide | 201, `Location`, statut `EN_ATTENTE`, rôle `MENTORE` | B:MentoratDemandes.d01 |
| D02 | Demande par alumni, personnel, visiteur, organisme, admin | 403 | B:MentoratDemandes.d02 (5 rôles) |
| D03 | Mentor inconnu | 404 | B:MentoratDemandes.d03 |
| D04 | Domaine hors de l'offre | 400 | B:MentoratDemandes.d04 |
| D05 | Mentor complet ou indisponible | 409 | B:MentoratDemandes.d05 |
| D06 | Deuxième demande au même mentor ; nouvelle demande après refus | 409 ; puis 201 | B:MentoratDemandes.d06 |
| D07 | Plusieurs mentors différents | Autorisé | B:MentoratDemandes.d07 |
| D08 | Objectif vide ou absent, identifiants absents ou mal formés | 400 | B:MentoratDemandes.d08 (5 variantes) |
| D09 | Objectif > 1000 ; espaces autour | 400 ; texte nettoyé | B:MentoratDemandes.d09 |
| D10 | Mentor dont le compte est suspendu ou non vérifié (appel direct à l'API) | 404, comme dans la recherche | B:MentoratDemandes.d10 |

### Listes et compteur (L)
| ID | Cas | Attendu | Vérifié par |
|---|---|---|---|
| L01 | Listes par rôle et par statuts | Chacun ne voit que ses mentorats | B:MentoratDemandes.l01 |
| L02 | Rôle absent ou invalide | 400 | B:MentoratDemandes.l02 |
| L03 | Compteur de demandes en attente | Suit les acceptations ; 0 pour un étudiant | B:MentoratDemandes.l03 |

### Changements de statut (T)
| ID | Cas | Attendu | Vérifié par |
|---|---|---|---|
| T01 | Accepter : étudiant 403, tiers 404, mentor 200 + date de réponse | idem | B:MentoratDemandes.t01 |
| T02 | Accepter au-delà de la capacité | 409 | B:MentoratDemandes.t02 |
| T03 | Deux acceptations simultanées pour une seule place | Une 200, une 409, un seul mentoré | B:MentoratDemandes.t03 |
| T04 | Refuser : motif nettoyé, motif vide → absent, motif > 500 → 400, étudiant → 403 | idem | B:MentoratDemandes.t04 |
| T05 | Annuler : mentor 403 ; étudiant 200 + date ; demande acceptée → 409 | idem | B:MentoratDemandes.t05 |
| T06 | Terminer : en attente 409 ; mentor et étudiant 200 ; tiers 404 | idem | B:MentoratDemandes.t06 |
| T07 | Agir sur un statut final | 409 « …plus dans un état… » | B:MentoratDemandes.t07 |
| T08 | Mentorat inconnu ; identifiant non UUID | 404 ; 400 | B:MentoratDemandes.t08 |

### Détail, séances, évaluation (V, S, E)
| ID | Cas | Attendu | Vérifié par |
|---|---|---|---|
| V01 | Détail par participants ; par un tiers | Rôle correct ; 404 | B:MentoratSuivi.v01 |
| V02 | Données privées des participants | Absentes | B:MentoratSuivi.v02 |
| S01 | Séance avant acceptation | 409 | B:MentoratSuivi.s01 |
| S02 | Les deux planifient ; ordre ; tiers | 201, plus récente d'abord ; 404 | B:MentoratSuivi.s02 |
| S03 | Durée 14 ou 241, date ou modalité absente/inconnue | 400 | B:MentoratSuivi.s03 (6 variantes) |
| S04 | Durées 15 et 240 ; lieu > 500 | 201 ; 400 | B:MentoratSuivi.s04 |
| S05 | Réalisée avec compte rendu, compte rendu modifié, puis annulation | 200, 200, 409 | B:MentoratSuivi.s05 |
| S06 | Annulée avec compte rendu → 400 ; annulée puis tout changement → 409 | idem | B:MentoratSuivi.s06 |
| S07 | Séance d'un autre mentorat ; compte rendu > 4000 | 404 ; 400 | B:MentoratSuivi.s07 |
| S08 | Après clôture : planifier ou consigner | 409, séance inchangée | B:MentoratSuivi.s08 |
| E01 | Évaluer en attente ou en cours | 409 | B:MentoratSuivi.e01 |
| E02 | Une évaluation par participant ; tiers ; `peutEvaluer` | 201, 409 au 2e essai, 404 ; drapeau mis à jour | B:MentoratSuivi.e02 |
| E03 | Note 0, 6 ou absente | 400 | B:MentoratSuivi.e03 |
| E04 | Commentaire > 1000 | 400 | B:MentoratSuivi.e04 |
| E05 | Mentorat annulé | Pas d'évaluation | B:MentoratSuivi.e05 |

### Notifications (N)
| ID | Cas | Attendu | Vérifié par |
|---|---|---|---|
| N01 | Demande, acceptation, séance, clôture | L'autre participant est prévenu | B:MentoratNotifications.n01 |
| N02 | Refus (avec motif), annulation | Étudiant / mentor prévenu | B:MentoratNotifications.n02 |
| N03 | Action refusée (403, 409) | Aucune notification | B:MentoratNotifications.n03 |

## Frontend

| ID | Cas | Vérifié par |
|---|---|---|
| F01 | Onglets selon le rôle (étudiant, alumni) ; présentation pour les autres rôles | F:mentorat.spec |
| F02 | Redirection de `/mentorat` vers l'onglet du rôle ; onglets protégés par rôle | F:mentorat.spec |
| F03 | Compteur dans l'onglet et dans la barre latérale (texte lu par les lecteurs d'écran) | F:mentorat.spec, F:espace-membre.spec |
| F04 | Recherche : critères lus dans l'URL, filtre par domaine sans étape d'historique | F:trouver-mentor.spec |
| F05 | Carte : disponible, complet, indisponible, demande envoyée ; domaines masqués ; initiales | F:carte-mentor.spec |
| F06 | Fenêtre de demande : ouverture/fermeture, domaine présélectionné, objectif obligatoire, focus sur l'erreur | F:dialogue-demande.spec |
| F07 | Fenêtre de demande : envoi nettoyé, erreur métier affichée sans perdre la saisie | F:dialogue-demande.spec, F:trouver-mentor.spec |
| F08 | Listes : accepter, refuser avec motif, erreur « capacité atteinte », annuler | F:liste-mentorats.spec |
| F09 | Mon offre : vierge, existante, 1 à 5 domaines, capacité 1 à 10, enregistrement, refus du serveur | F:mon-offre.spec |
| F10 | Suivi : introuvable, participants, terminer avec confirmation, annuler, répondre, motif de refus | F:detail-mentorat.spec |
| F11 | Séances : date obligatoire, format envoyé, libellé selon la modalité, consigner, annuler, liens `https` uniquement | F:seances-mentorat.spec |
| F12 | Évaluation : note obligatoire, envoi, ma note, note de l'autre, cas indisponible | F:evaluation-mentorat.spec |
| F13 | Service HTTP : paramètres utiles seulement, statuts répétés, identifiants encodés, verbes | F:core/services/mentorat/mentorat.spec |

## Vérifications dans le navigateur

| ID | Cas | Résultat |
|---|---|---|
| M01 | Parcours étudiant complet : recherche, demande, suivi, séance, compte rendu, clôture, évaluation | OK |
| M02 | Parcours mentor : offre (validation puis enregistrement), demandes reçues, refus motivé, acceptation, compteur | OK |
| M03 | 375 px : aucun débordement horizontal, onglets en largeur égale, filtres sur une ligne défilante | OK |
| M04 | AXE (WCAG 2.2 AA + bonnes pratiques) sur trouver, demandes, suivis, suivi, reçues, mentorés, offre, fenêtre de demande | 0 erreur dans le mentorat |
| M05 | Dates en français (« 21 oct. 2026 ») | OK |
| M06 | Notifications visibles dans les logs de l'API | OK |

## Constats hors périmètre (avant le mentorat)

- Annuaire et Événements imbriquent un second `<main>` dans celui de l'espace membre (AXE `landmark-no-duplicate-main`).
- La barre latérale PrimeNG a du contenu hors région (AXE `region`).
- `--ept-text-secondary` sur `--ept-bg` : contraste 4,48:1, juste sous 4,5:1.
