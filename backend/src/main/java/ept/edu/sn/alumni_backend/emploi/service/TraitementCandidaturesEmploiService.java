package ept.edu.sn.alumni_backend.emploi.service;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.common.stockage.ApresTransaction;
import ept.edu.sn.alumni_backend.competence.entity.UtilisateurCompetence;
import ept.edu.sn.alumni_backend.competence.repository.UtilisateurCompetenceRepository;
import ept.edu.sn.alumni_backend.emploi.ModeOffreEmploi;
import ept.edu.sn.alumni_backend.emploi.StatutCandidatureEmploi;
import ept.edu.sn.alumni_backend.emploi.StatutOffreEmploi;
import ept.edu.sn.alumni_backend.emploi.dto.CandidatureRecueEmploiResponse;
import ept.edu.sn.alumni_backend.emploi.dto.MaCandidatureEmploiResponse;
import ept.edu.sn.alumni_backend.emploi.entity.CandidatureEmploi;
import ept.edu.sn.alumni_backend.emploi.entity.HistoriqueCandidatureEmploi;
import ept.edu.sn.alumni_backend.emploi.entity.OffreEmploi;
import ept.edu.sn.alumni_backend.emploi.exception.ConflitOffreEmploiException;
import ept.edu.sn.alumni_backend.emploi.exception.OffreEmploiIntrouvableException;
import ept.edu.sn.alumni_backend.emploi.repository.CandidatureEmploiRepository;
import ept.edu.sn.alumni_backend.emploi.repository.OffreEmploiRepository;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.notification.NouvelleNotification;
import ept.edu.sn.alumni_backend.notification.TypeNotification;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.service.StockageFichiersCandidature;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Traitement des candidatures d'une offre gérée par son organisme (#223), ou par l'administration des offres.
 * - Pour tout autre lecteur, l'offre et ses candidatures n'existent pas (404).
 * - Le statut avance sans jamais revenir en arrière (409 sinon) ; chaque changement entre dans l'historique et est
 *   notifié au candidat. La note privée reste entre recruteurs.
 * - La clôture du recrutement passe en NON_RETENUE les candidatures encore ouvertes, avec notification.
 * - Les CV sont effacés après la durée de conservation suivant la clôture ou l'expiration de l'offre.
 */
@Service
@RequiredArgsConstructor
public class TraitementCandidaturesEmploiService {
    private static final Logger log = LoggerFactory.getLogger(TraitementCandidaturesEmploiService.class);
    private static final ZoneId FUSEAU = ZoneId.of("Africa/Dakar");

    private final OffreEmploiRepository offreRepository;
    private final CandidatureEmploiRepository candidatureRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final UtilisateurCompetenceRepository competencesRepository;
    private final StockageFichiersCandidature stockageCandidatures;
    private final ApplicationEventPublisher evenements;

    @Value("${app.emploi.conservation-cv-mois:6}")
    private int conservationCvMois;

    /** Candidatures de l'offre, les plus récentes d'abord, sans celles retirées par leur candidat. */
    @Transactional(readOnly = true)
    public List<CandidatureRecueEmploiResponse> recues(UUID offreId, UtilisateurPrincipal principal) {
        OffreEmploi offre = offreRepository.findWithAuteurById(offreId).orElseThrow(OffreEmploiIntrouvableException::new);
        verifierRecruteur(offre, principal.getUtilisateur());
        List<CandidatureEmploi> candidatures =
            candidatureRepository.findByOffreIdAndStatutNotOrderByEnvoyeeLeDesc(offreId, StatutCandidatureEmploi.RETIREE);
        Map<UUID, List<String>> competences = competencesRepository.findByUtilisateurIdInOrderByOrdreAsc(
                candidatures.stream().map(c -> c.getCandidat().getId()).toList()).stream()
            .collect(Collectors.groupingBy(uc -> uc.getUtilisateur().getId(), LinkedHashMap::new,
                Collectors.mapping((UtilisateurCompetence uc) -> uc.getCompetence().getLibelle(), Collectors.toList())));
        return candidatures.stream().map(c -> versReponse(c, competences.getOrDefault(c.getCandidat().getId(), List.of()))).toList();
    }

    @Transactional
    public CandidatureRecueEmploiResponse changerStatut(UUID candidatureId, StatutCandidatureEmploi nouveau, UtilisateurPrincipal principal) {
        Utilisateur recruteur = principal.getUtilisateur();
        CandidatureEmploi candidature = chargerPourRecruteur(candidatureId, recruteur);
        OffreEmploi offre = candidature.getOffre();
        if (offre.estCloturee()) {
            throw new ConflitOffreEmploiException("Le recrutement de cette offre est clôturé : les candidatures ne changent plus.");
        }
        if (!candidature.getStatut().suivants().contains(nouveau)) {
            throw new ConflitOffreEmploiException(candidature.getStatut().suivants().isEmpty()
                ? "Cette candidature est déjà décidée : son statut ne change plus."
                : "Ce changement de statut n'est pas possible : le traitement ne revient pas en arrière.");
        }
        candidature.passerA(nouveau, utilisateurRepository.getReferenceById(recruteur.getId()));
        notifier(candidature, nouveau);
        return versReponse(candidature, competencesDe(candidature));
    }

    @Transactional
    public CandidatureRecueEmploiResponse noter(UUID candidatureId, String note, UtilisateurPrincipal principal) {
        CandidatureEmploi candidature = chargerPourRecruteur(candidatureId, principal.getUtilisateur());
        candidature.setNotePrivee(note == null || note.isBlank() ? null : note.strip());
        return versReponse(candidature, competencesDe(candidature));
    }

    /** Clôture du recrutement : l'offre ne reçoit plus rien et les candidatures sans décision sont non retenues. */
    @Transactional
    public int cloturer(UUID offreId, UtilisateurPrincipal principal) {
        Utilisateur recruteur = principal.getUtilisateur();
        OffreEmploi offre = offreRepository.findByIdForUpdate(offreId).orElseThrow(OffreEmploiIntrouvableException::new);
        verifierRecruteur(offre, recruteur);
        if (offre.estCloturee()) {
            throw new ConflitOffreEmploiException("Le recrutement de cette offre est déjà clôturé.");
        }
        if (offre.getStatut() != StatutOffreEmploi.PUBLIEE) {
            throw new ConflitOffreEmploiException("Seule une offre publiée peut être clôturée.");
        }
        offre.setClotureeLe(Instant.now());
        Utilisateur auteur = utilisateurRepository.getReferenceById(recruteur.getId());
        List<CandidatureEmploi> ouvertes = candidatureRepository.findByOffreIdAndStatutIn(offreId,
            EnumSet.of(StatutCandidatureEmploi.RECUE, StatutCandidatureEmploi.PRESELECTIONNEE, StatutCandidatureEmploi.ENTRETIEN));
        for (CandidatureEmploi candidature : ouvertes) {
            candidature.passerA(StatutCandidatureEmploi.NON_RETENUE, auteur);
            notifier(candidature, StatutCandidatureEmploi.NON_RETENUE);
        }
        return ouvertes.size();
    }

    /** Une fois par jour : efface les CV dont la durée de conservation est passée (le reste de la candidature demeure). */
    @Scheduled(cron = "0 30 3 * * *", zone = "Africa/Dakar")
    @Transactional
    public void purgerCv() {
        LocalDate aujourdhui = LocalDate.now(FUSEAU);
        LocalDate limite = aujourdhui.minusMonths(conservationCvMois);
        Instant clotureeAvant = limite.atStartOfDay(FUSEAU).toInstant();
        List<CandidatureEmploi> aPurger = candidatureRepository.cvAPurger(clotureeAvant, limite);
        for (CandidatureEmploi candidature : aPurger) {
            String fichier = candidature.getCv();
            candidature.setCvSupprimeLe(Instant.now());
            ApresTransaction.siValidee(() -> stockageCandidatures.getCv().supprimer(fichier));
        }
        if (!aPurger.isEmpty()) {
            log.info("Offres d'emploi : {} CV effacé(s) après la durée de conservation", aPurger.size());
        }
    }

    /** L'organisme de l'offre gérée ou l'administration des offres ; pour tout autre, l'offre n'existe pas. */
    static boolean recruteur(OffreEmploi offre, Utilisateur lecteur) {
        return offre.getMode() == ModeOffreEmploi.GEREE
            && (OffresEmploiService.gere(offre, lecteur) || PermissionAdmin.accordee(lecteur, PermissionAdmin.GERER_OFFRES_EMPLOI));
    }

    private static void verifierRecruteur(OffreEmploi offre, Utilisateur lecteur) {
        if (!recruteur(offre, lecteur)) {
            throw new OffreEmploiIntrouvableException();
        }
    }

    /** Candidature non retirée d'une offre que le lecteur recrute ; sinon 404. */
    private CandidatureEmploi chargerPourRecruteur(UUID candidatureId, Utilisateur lecteur) {
        CandidatureEmploi candidature = candidatureRepository.findWithOffreById(candidatureId).orElseThrow(OffreEmploiIntrouvableException::new);
        if (!recruteur(candidature.getOffre(), lecteur) || candidature.getStatut() == StatutCandidatureEmploi.RETIREE) {
            throw new OffreEmploiIntrouvableException();
        }
        return candidature;
    }

    private void notifier(CandidatureEmploi candidature, StatutCandidatureEmploi statut) {
        OffreEmploi offre = candidature.getOffre();
        String message = "Votre candidature à « " + offre.getTitre() + " » chez " + offre.entrepriseAffichee() + " est " + statut.libelle() + ".";
        evenements.publishEvent(new NouvelleNotification(candidature.getCandidat().getId(), TypeNotification.EMPLOI,
            "Candidature " + statut.libelle(), message, "/offres-emploi/" + offre.getId()));
    }

    private List<String> competencesDe(CandidatureEmploi candidature) {
        return competencesRepository.findByUtilisateurIdOrderByOrdreAsc(candidature.getCandidat().getId()).stream()
            .map(uc -> uc.getCompetence().getLibelle()).toList();
    }

    private static CandidatureRecueEmploiResponse versReponse(CandidatureEmploi c, List<String> competences) {
        Utilisateur u = c.getCandidat();
        var candidat = new CandidatureRecueEmploiResponse.Candidat(u.getId(), u.getPrenom(), u.getNom(), u.getRole().name(),
            u.getUrlPhoto(), u.getNomFiliere(), u.getClasse() == null ? null : u.getClasse().libelle(), u.getAnneeEntree(), u.getAnneeSortie(), competences);
        List<MaCandidatureEmploiResponse.Reponse> reponses = c.getReponses().stream()
            .map(r -> new MaCandidatureEmploiResponse.Reponse(r.getQuestion().getId(), r.getQuestion().getIntitule(), r.getValeur()))
            .toList();
        List<CandidatureRecueEmploiResponse.Changement> historique = new ArrayList<>(c.getHistorique().stream()
            .map(h -> new CandidatureRecueEmploiResponse.Changement(h.getStatut().name(), h.getChangeLe(), auteur(h, c)))
            .toList());
        // Une candidature envoyée avant l'historique (#223) n'a pas d'entrée de départ : on la reconstitue depuis son envoi.
        if (historique.isEmpty() || !historique.getFirst().statut().equals(StatutCandidatureEmploi.RECUE.name())) {
            historique.addFirst(new CandidatureRecueEmploiResponse.Changement(StatutCandidatureEmploi.RECUE.name(), c.getEnvoyeeLe(), "le candidat"));
        }
        return new CandidatureRecueEmploiResponse(c.getId(), candidat, c.getStatut().name(),
            c.getStatut().suivants().stream().map(Enum::name).toList(), c.getNomCv(), c.getCvSupprimeLe() == null,
            c.getLettreMotivation(), reponses, c.getNotePrivee(), c.getEnvoyeeLe(), historique);
    }

    /** « le candidat », le nom de l'organisme, ou « l'école » pour un administrateur. */
    private static String auteur(HistoriqueCandidatureEmploi h, CandidatureEmploi c) {
        Utilisateur auteur = h.getAuteur();
        if (auteur == null) return null;
        if (auteur.getId().equals(c.getCandidat().getId())) return "le candidat";
        if (auteur.getRole() == TypeRole.ORGANISME && auteur.getOrganisme() != null) return auteur.getOrganisme().getNom();
        return "l'école";
    }
}
