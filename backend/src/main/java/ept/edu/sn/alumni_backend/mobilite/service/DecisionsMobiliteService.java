package ept.edu.sn.alumni_backend.mobilite.service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.mobilite.ActionHistorique;
import ept.edu.sn.alumni_backend.mobilite.ObjetHistorique;
import ept.edu.sn.alumni_backend.mobilite.PeriodeMobilite;
import ept.edu.sn.alumni_backend.mobilite.StatutCandidatureMobilite;
import ept.edu.sn.alumni_backend.mobilite.StatutMobilite;
import ept.edu.sn.alumni_backend.mobilite.StatutOffreMobilite;
import ept.edu.sn.alumni_backend.mobilite.dto.CandidaturesOffreResponse;
import ept.edu.sn.alumni_backend.mobilite.entity.CandidatureMobilite;
import ept.edu.sn.alumni_backend.mobilite.entity.Mobilite;
import ept.edu.sn.alumni_backend.mobilite.entity.OffreMobilite;
import ept.edu.sn.alumni_backend.mobilite.exception.ConflitMobiliteException;
import ept.edu.sn.alumni_backend.mobilite.exception.OffreMobiliteIntrouvableException;
import ept.edu.sn.alumni_backend.mobilite.repository.CandidatureMobiliteRepository;
import ept.edu.sn.alumni_backend.mobilite.repository.MobiliteRepository;
import ept.edu.sn.alumni_backend.mobilite.repository.OffreMobiliteRepository;
import ept.edu.sn.alumni_backend.notification.NouvelleNotification;
import ept.edu.sn.alumni_backend.notification.TypeNotification;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Sélection des candidats par le chef du service mobilité.
 * - Les décisions se prennent après la date limite (ou la clôture de l'offre), sans dépasser le nombre de places ;
 *   rien n'est visible des candidats avant la publication de la liste.
 * - La liste se publie quand chaque dossier a sa décision : les mobilités sortantes sont créées, chaque candidat est prévenu.
 * - Un candidat retenu peut se désister ; le chef fait alors monter un candidat de la liste d'attente.
 */
@Service
@RequiredArgsConstructor
public class DecisionsMobiliteService {
    private final OffreMobiliteRepository offreRepository;
    private final CandidatureMobiliteRepository candidatureRepository;
    private final MobiliteRepository mobiliteRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final HistoriqueMobiliteService historique;
    private final ApplicationEventPublisher evenements;

    @Transactional(readOnly = true)
    public CandidaturesOffreResponse dossiers(UUID offreId) {
        OffreMobilite offre = offreRepository.findWithOrganismeById(offreId).orElseThrow(OffreMobiliteIntrouvableException::new);
        return reponse(offre);
    }

    @Transactional
    public CandidaturesOffreResponse decider(UUID candidatureId, StatutCandidatureMobilite statut, Integer rang, UtilisateurPrincipal principal) {
        // L'offre est verrouillée avant de relire la candidature : deux décisions simultanées ne dépassent pas les places.
        OffreMobilite offre = verrouillerOffreDe(candidatureId);
        CandidatureMobilite candidature = candidatureRepository.findById(candidatureId).orElseThrow(OffreMobiliteIntrouvableException::new);
        if (statut != StatutCandidatureMobilite.RETENUE && statut != StatutCandidatureMobilite.LISTE_ATTENTE
                && statut != StatutCandidatureMobilite.NON_RETENUE) {
            throw new IllegalArgumentException("La décision est « retenue », « liste d'attente » ou « non retenue ».");
        }
        if (!decisionsOuvertes(offre)) {
            throw new ConflitMobiliteException(offre.getStatut() == StatutOffreMobilite.LISTE_PUBLIEE
                ? "La liste est publiée : les décisions ne changent plus."
                : "Les décisions se prennent après la date limite de candidature.");
        }
        if (candidature.getStatut() == StatutCandidatureMobilite.RETIREE) {
            throw new ConflitMobiliteException("Le candidat a retiré sa candidature.");
        }
        if (statut == StatutCandidatureMobilite.RETENUE && candidature.getStatut() != StatutCandidatureMobilite.RETENUE
                && candidatureRepository.countByOffre_IdAndStatut(offre.getId(), StatutCandidatureMobilite.RETENUE) >= offre.getNombrePlaces()) {
            throw new ConflitMobiliteException("Les " + offre.getNombrePlaces() + " places sont attribuées : placez ce candidat sur la liste d'attente.");
        }
        StatutCandidatureMobilite avant = candidature.getStatut();
        // Reconfirmé en attente sans rang, le candidat garde sa place.
        Integer place = rang != null ? rang : avant == StatutCandidatureMobilite.LISTE_ATTENTE ? candidature.getRangAttente() : null;
        candidature.setStatut(statut);
        ordonnerListeAttente(offre.getId(), candidature, statut == StatutCandidatureMobilite.LISTE_ATTENTE ? place : null);
        candidature.setDecideeLe(java.time.Instant.now());
        candidature.setDecideePar(utilisateurRepository.getReferenceById(principal.getUtilisateur().getId()));
        historique.consigner(ObjetHistorique.CANDIDATURE, candidature.getId(), ActionHistorique.DECISION_CANDIDATURE,
            avant + " → " + statut + (candidature.getRangAttente() != null ? " (rang " + candidature.getRangAttente() + ")" : ""), null,
            principal.getUtilisateur().getId());
        candidatureRepository.flush();
        return reponse(offre);
    }

    @Transactional
    public CandidaturesOffreResponse publierListe(UUID offreId, UtilisateurPrincipal principal) {
        OffreMobilite offre = offreRepository.findByIdForUpdate(offreId).orElseThrow(OffreMobiliteIntrouvableException::new);
        String blocage = blocagePublication(offre);
        if (blocage != null) throw new ConflitMobiliteException(blocage);
        Utilisateur auteur = utilisateurRepository.getReferenceById(principal.getUtilisateur().getId());
        offre.setStatut(StatutOffreMobilite.LISTE_PUBLIEE);
        offre.setListePublieeLe(java.time.Instant.now());
        List<CandidatureMobilite> dossiers = candidatureRepository.findByOffre_IdAndStatutNotOrderBySoumiseLeAsc(offreId, StatutCandidatureMobilite.RETIREE);
        long retenues = 0;
        for (CandidatureMobilite candidature : dossiers) {
            if (candidature.getStatut() == StatutCandidatureMobilite.RETENUE) {
                creerMobilite(candidature, auteur);
                retenues++;
            }
            prevenirDecision(candidature);
        }
        historique.consigner(ObjetHistorique.OFFRE, offre.getId(), ActionHistorique.PUBLICATION_LISTE, retenues + " retenu(s)", null, auteur.getId());
        Utilisateur contact = offre.getOrganisme().getContact();
        if (contact != null && contact.getEmail() != null) {
            evenements.publishEvent(new NotificationCompte(contact.getId(), contact.getEmail(), "Liste des candidats retenus",
                "Bonjour, l'école a publié la liste de l'offre « " + offre.getTitre() + " » : " + retenues
                    + " candidat(s) retenu(s). Leurs dossiers sont dans Mes offres de mobilité."));
        }
        candidatureRepository.flush();
        return reponse(offre);
    }

    /** Le premier de la liste d'attente (ou celui choisi par le chef) prend une place libérée par un désistement. */
    @Transactional
    public CandidaturesOffreResponse promouvoir(UUID candidatureId, UtilisateurPrincipal principal) {
        OffreMobilite offre = verrouillerOffreDe(candidatureId);
        CandidatureMobilite candidature = candidatureRepository.findById(candidatureId).orElseThrow(OffreMobiliteIntrouvableException::new);
        if (offre.getStatut() != StatutOffreMobilite.LISTE_PUBLIEE || candidature.getStatut() != StatutCandidatureMobilite.LISTE_ATTENTE) {
            throw new ConflitMobiliteException("Seul un candidat sur la liste d'attente d'une liste publiée peut prendre une place.");
        }
        if (candidatureRepository.countByOffre_IdAndStatut(offre.getId(), StatutCandidatureMobilite.RETENUE) >= offre.getNombrePlaces()) {
            throw new ConflitMobiliteException("Aucune place n'est libre sur cette offre.");
        }
        Utilisateur auteur = utilisateurRepository.getReferenceById(principal.getUtilisateur().getId());
        candidature.setStatut(StatutCandidatureMobilite.RETENUE);
        ordonnerListeAttente(offre.getId(), candidature, null);
        candidature.setDecideeLe(java.time.Instant.now());
        candidature.setDecideePar(auteur);
        creerMobilite(candidature, auteur);
        historique.consigner(ObjetHistorique.CANDIDATURE, candidature.getId(), ActionHistorique.PROMOTION_LISTE_ATTENTE, null, null, auteur.getId());
        prevenirDecision(candidature);
        candidatureRepository.flush();
        return reponse(offre);
    }

    /** Le candidat retenu renonce à sa place ; sa mobilité est annulée et le service mobilité est prévenu. */
    @Transactional
    public void desister(UUID candidatureId, UtilisateurPrincipal principal) {
        verrouillerOffreDe(candidatureId);
        CandidatureMobilite candidature = candidatureRepository.findWithOffreById(candidatureId)
            .filter(c -> c.getCandidat().getId().equals(principal.getUtilisateur().getId()))
            .orElseThrow(OffreMobiliteIntrouvableException::new);
        if (candidature.getStatut() != StatutCandidatureMobilite.RETENUE || candidature.getOffre().getStatut() != StatutOffreMobilite.LISTE_PUBLIEE) {
            throw new ConflitMobiliteException("Seul un candidat retenu sur une liste publiée peut se désister.");
        }
        Mobilite mobilite = mobiliteRepository.findByCandidature_Id(candidatureId).orElse(null);
        if (mobilite != null && mobilite.getStatut() != StatutMobilite.PREVUE) {
            throw new ConflitMobiliteException("La mobilité a commencé : adressez-vous au service mobilité.");
        }
        candidature.setStatut(StatutCandidatureMobilite.DESISTEE);
        if (mobilite != null) mobilite.setStatut(StatutMobilite.ANNULEE);
        historique.consigner(ObjetHistorique.CANDIDATURE, candidature.getId(), ActionHistorique.DESISTEMENT, null, null, principal.getUtilisateur().getId());
        OffreMobilite offre = candidature.getOffre();
        String message = candidature.getCandidat().getPrenom() + " " + candidature.getCandidat().getNom() + " se désiste de l'offre « "
            + offre.getTitre() + " » : une place est libre.";
        utilisateurRepository.administrateursActifsAvecUneDe(List.of(PermissionAdmin.GERER_MOBILITES, PermissionAdmin.GERER_ADMINISTRATEURS))
            .forEach(chef -> evenements.publishEvent(new NouvelleNotification(chef.getId(), TypeNotification.MOBILITE, "Désistement",
                message, "/admin/mobilites/offres/" + offre.getId() + "/candidatures")));
    }

    /** Candidats retenus d'une offre de l'institut, une fois la liste publiée ; sinon 404. */
    @Transactional(readOnly = true)
    public List<CandidaturesOffreResponse.Dossier> retenusPourInstitut(UUID offreId, UtilisateurPrincipal principal) {
        OffreMobilite offre = offreRepository.findWithOrganismeById(offreId)
            .filter(o -> AccesMobilite.estDeLInstitut(o, principal.getUtilisateur()))
            .orElseThrow(OffreMobiliteIntrouvableException::new);
        if (offre.getStatut() != StatutOffreMobilite.LISTE_PUBLIEE) return List.of();
        return candidatureRepository.findByOffre_IdAndStatutOrderByCandidat_NomAsc(offreId, StatutCandidatureMobilite.RETENUE).stream()
            .map(c -> dossier(c, null)).toList();
    }

    /** L'offre de la candidature, verrouillée et relue : les contrôles d'état portent sur sa version à jour. */
    private OffreMobilite verrouillerOffreDe(UUID candidatureId) {
        UUID offreId = candidatureRepository.offreDe(candidatureId).orElseThrow(OffreMobiliteIntrouvableException::new);
        return offreRepository.findByIdForUpdate(offreId).orElseThrow(OffreMobiliteIntrouvableException::new);
    }

    /**
     * Renumérote la liste d'attente de 1 à n. La candidature donnée y entre au rang voulu (à la fin sans rang), ou en
     * sort si elle n'est plus en attente ; les autres gardent leur ordre et se décalent.
     */
    private void ordonnerListeAttente(UUID offreId, CandidatureMobilite candidature, Integer rang) {
        List<CandidatureMobilite> liste = new java.util.ArrayList<>(
            candidatureRepository.findByOffre_IdAndStatutOrderByRangAttenteAsc(offreId, StatutCandidatureMobilite.LISTE_ATTENTE).stream()
                .filter(c -> !c.getId().equals(candidature.getId())).toList());
        if (candidature.getStatut() == StatutCandidatureMobilite.LISTE_ATTENTE) {
            int position = rang == null ? liste.size() : Math.min(rang - 1, liste.size());
            liste.add(position, candidature);
        } else {
            candidature.setRangAttente(null);
        }
        for (int i = 0; i < liste.size(); i++) liste.get(i).setRangAttente(i + 1);
    }

    private void creerMobilite(CandidatureMobilite candidature, Utilisateur auteur) {
        Mobilite mobilite = mobiliteRepository.save(Mobilite.sortante(candidature, auteur));
        historique.consigner(ObjetHistorique.MOBILITE, mobilite.getId(), ActionHistorique.CREATION_MOBILITE, "PREVUE", null, auteur.getId());
    }

    private void prevenirDecision(CandidatureMobilite candidature) {
        Utilisateur candidat = candidature.getCandidat();
        OffreMobilite offre = candidature.getOffre();
        String debut = "Bonjour, pour l'offre « " + offre.getTitre() + " » de " + offre.getOrganisme().getNom() + ", ";
        String[] texte = switch (candidature.getStatut()) {
            case RETENUE -> new String[] {"Candidature de mobilité retenue", debut + "votre candidature est retenue."};
            case LISTE_ATTENTE -> new String[] {"Candidature de mobilité sur liste d'attente",
                debut + "vous êtes sur la liste d'attente, au rang " + candidature.getRangAttente() + "."};
            case NON_RETENUE -> new String[] {"Candidature de mobilité non retenue", debut + "votre candidature n'est pas retenue."};
            default -> null;
        };
        if (texte != null && candidat.getEmail() != null) {
            evenements.publishEvent(new NotificationCompte(candidat.getId(), candidat.getEmail(), texte[0], texte[1]));
        }
    }

    private static boolean decisionsOuvertes(OffreMobilite offre) {
        return (offre.getStatut() == StatutOffreMobilite.PUBLIEE || offre.getStatut() == StatutOffreMobilite.CLOTUREE)
            && !offre.candidaturesOuvertes(LocalDate.now(OffresMobiliteService.FUSEAU));
    }

    private String blocagePublication(OffreMobilite offre) {
        if (offre.getStatut() == StatutOffreMobilite.LISTE_PUBLIEE) return "La liste est déjà publiée.";
        if (!decisionsOuvertes(offre)) return "La liste se publie après la date limite de candidature.";
        long sansDecision = candidatureRepository.countByOffre_IdAndStatut(offre.getId(), StatutCandidatureMobilite.SOUMISE);
        if (sansDecision > 0) {
            return sansDecision + (sansDecision > 1 ? " dossiers n'ont" : " dossier n'a") + " pas encore de décision.";
        }
        return null;
    }

    private CandidaturesOffreResponse reponse(OffreMobilite offre) {
        List<CandidatureMobilite> liste = candidatureRepository.findByOffre_IdAndStatutNotOrderBySoumiseLeAsc(offre.getId(), StatutCandidatureMobilite.RETIREE);
        Map<UUID, String> ailleurs = new HashMap<>();
        if (!liste.isEmpty()) {
            candidatureRepository.retenuesAilleurs(liste.stream().map(c -> c.getCandidat().getId()).toList(), offre.getId(), offre.getAnneeUniversitaire())
                .stream().filter(autre -> chevauchent(offre.getPeriode(), autre.getOffre().getPeriode()))
                .forEach(autre -> ailleurs.putIfAbsent(autre.getCandidat().getId(), autre.getOffre().getOrganisme().getNom() + " — " + autre.getOffre().getTitre()));
        }
        List<CandidaturesOffreResponse.Dossier> dossiers = liste.stream()
            .sorted(Comparator.comparing((CandidatureMobilite c) -> ordre(c.getStatut()))
                .thenComparing(c -> c.getRangAttente() == null ? 0 : c.getRangAttente()))
            .map(c -> dossier(c, ailleurs.get(c.getCandidat().getId()))).toList();
        long retenues = liste.stream().filter(c -> c.getStatut() == StatutCandidatureMobilite.RETENUE).count();
        long attente = liste.stream().filter(c -> c.getStatut() == StatutCandidatureMobilite.LISTE_ATTENTE).count();
        long sansDecision = liste.stream().filter(c -> c.getStatut() == StatutCandidatureMobilite.SOUMISE).count();
        String blocage = offre.getStatut() == StatutOffreMobilite.LISTE_PUBLIEE ? null : blocagePublication(offre);
        return new CandidaturesOffreResponse(
            new CandidaturesOffreResponse.Offre(offre.getId(), offre.getTitre(), offre.getOrganisme().getNom(), offre.getStatut().name(),
                offre.getNombrePlaces(), offre.getDateLimite(), offre.getAnneeUniversitaire(), offre.getPeriode().name(), offre.getDureeSemaines(),
                decisionsOuvertes(offre), offre.getListePublieeLe()),
            dossiers, retenues, attente, sansDecision, blocage);
    }

    /** Même période, ou l'une couvre l'année entière. */
    private static boolean chevauchent(PeriodeMobilite a, PeriodeMobilite b) {
        return a == b || a == PeriodeMobilite.ANNEE || b == PeriodeMobilite.ANNEE;
    }

    /** Sans décision d'abord, puis retenus, liste d'attente par rang, les autres. */
    private static int ordre(StatutCandidatureMobilite statut) {
        return switch (statut) {
            case SOUMISE -> 0;
            case RETENUE -> 1;
            case LISTE_ATTENTE -> 2;
            default -> 3;
        };
    }

    private static CandidaturesOffreResponse.Dossier dossier(CandidatureMobilite c, String ailleurs) {
        Utilisateur u = c.getCandidat();
        return new CandidaturesOffreResponse.Dossier(c.getId(),
            new CandidaturesOffreResponse.Candidat(u.getId(), u.getPrenom(), u.getNom(), u.getRole().name(),
                u.getFiliere() == null ? null : u.getFiliere().getNom(), u.getClasse() == null ? null : u.getClasse().libelle()),
            c.getStatut().name(), c.getRangAttente(), c.getSoumiseLe(),
            c.getPieces().stream().sorted(Comparator.comparing(p -> p.getType()))
                .map(p -> new CandidaturesOffreResponse.Piece(p.getId(), p.getType().name(), p.getNomFichier(), p.getTaille())).toList(),
            ailleurs);
    }
}
