package ept.edu.sn.alumni_backend.stage.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.organisme.service.OrganismeService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.StatutOffre;
import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.TypeStage;
import ept.edu.sn.alumni_backend.stage.dto.OffreStageRequest;
import ept.edu.sn.alumni_backend.stage.dto.OffreStageResponse;
import ept.edu.sn.alumni_backend.stage.dto.OrganismeOffresResponse;
import ept.edu.sn.alumni_backend.stage.entity.OffreStage;
import ept.edu.sn.alumni_backend.stage.exception.ConflitStageException;
import ept.edu.sn.alumni_backend.stage.exception.OffreStageIntrouvableException;
import ept.edu.sn.alumni_backend.stage.repository.CandidatureRepository;
import ept.edu.sn.alumni_backend.stage.repository.OffreStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.StageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Offres de stage (STA-01, STA-02).
 * - Un organisme validé par l'école publie directement ; sinon l'offre attend l'administrateur Stages, qui la publie
 *   ou la refuse avec un motif.
 * - L'administrateur Stages peut saisir une offre au nom d'un organisme, même sans compte, et retirer une offre
 *   publiée avec un motif. L'organisme peut retirer ses propres offres.
 * - Les membres connectés voient les offres publiées, sauf celles d'un organisme suspendu.
 */
@Service
@RequiredArgsConstructor
public class OffresStageService {
    static final ZoneId FUSEAU = ZoneId.of("Africa/Dakar");

    private final OffreStageRepository offreRepository;
    private final OrganismeService organismeService;
    private final OrganismeRepository organismeRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final CandidatureRepository candidatureRepository;
    private final StageRepository stageRepository;
    private final ApplicationEventPublisher evenements;

    @Transactional
    public OffreStageResponse publierParOrganisme(OffreStageRequest request, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        if (auteur.getRole() != TypeRole.ORGANISME || auteur.getOrganisme() == null) {
            throw new SecurityException("Seul un organisme publie ses offres de stage.");
        }
        // Le compte du jeton est détaché : l'organisme est relu dans la transaction, avec son statut à jour.
        Organisme organisme = organismeRepository.findById(auteur.getOrganisme().getId()).orElseThrow(
            () -> new SecurityException("Seul un organisme publie ses offres de stage."));
        if (organisme.getStatutValidation() == StatutCompte.SUSPENDU) {
            throw new SecurityException("Votre organisme est suspendu : il ne peut pas publier d'offre.");
        }
        OffreStage offre = nouvelleOffre(request, organisme, auteur);
        if (organisme.getStatutValidation() == StatutCompte.ACTIF) {
            offre.publier();
        } else {
            offre.setStatut(StatutOffre.SOUMISE);
            prevenirAdministrateursStages(offre);
        }
        return versReponse(offreRepository.save(offre), true);
    }

    @Transactional
    public OffreStageResponse saisirParAdministration(OffreStageRequest request, UUID organismeId, String nomNouvelOrganisme,
            UtilisateurPrincipal principal) {
        Organisme organisme = organismeService.resoudreOrganisme(organismeId, nomNouvelOrganisme);
        if (organisme.getStatutValidation() == StatutCompte.SUSPENDU) {
            throw new IllegalArgumentException("Cet organisme est suspendu : ses offres ne seraient pas visibles.");
        }
        OffreStage offre = nouvelleOffre(request, organisme, principal.getUtilisateur());
        offre.publier();
        return versReponse(offreRepository.save(offre), true);
    }

    @Transactional
    public OffreStageResponse publierSoumise(UUID id) {
        OffreStage offre = verrouiller(id);
        exigerStatut(offre, StatutOffre.SOUMISE, "Seule une offre en attente de vérification peut être publiée.");
        offre.publier();
        prevenirOrganisme(offre, "Votre offre de stage est publiée",
            "Votre offre « " + offre.getTitre() + " » a été vérifiée par l'école et est désormais visible des étudiants.");
        return versReponse(offre, true);
    }

    @Transactional
    public OffreStageResponse refuser(UUID id, String motif) {
        OffreStage offre = verrouiller(id);
        exigerStatut(offre, StatutOffre.SOUMISE, "Seule une offre en attente de vérification peut être refusée.");
        offre.setStatut(StatutOffre.REFUSEE);
        offre.setMotifDecision(motif.trim());
        prevenirOrganisme(offre, "Votre offre de stage n'a pas été publiée",
            "L'école n'a pas publié votre offre « " + offre.getTitre() + " ». Motif : " + motif.trim());
        return versReponse(offre, true);
    }

    @Transactional
    public OffreStageResponse retirerParAdministration(UUID id, String motif) {
        OffreStage offre = verrouiller(id);
        exigerStatut(offre, StatutOffre.PUBLIEE, "Seule une offre publiée peut être retirée.");
        offre.setStatut(StatutOffre.RETIREE);
        offre.setMotifDecision(motif.trim());
        stageRepository.supprimerParOffreEtStatut(offre.getId(), StatutStage.EN_PREPARATION);
        prevenirOrganisme(offre, "Votre offre de stage a été retirée",
            "L'école a retiré votre offre « " + offre.getTitre() + " », qui n'est plus visible des étudiants. Motif : " + motif.trim());
        return versReponse(offre, true);
    }

    /** L'organisme retire son offre, publiée ou encore en attente ; elle disparaît de la liste des étudiants. */
    @Transactional
    public OffreStageResponse retirerParOrganisme(UUID id, UtilisateurPrincipal principal) {
        OffreStage offre = verrouiller(id);
        if (!estDeLOrganisme(offre, principal.getUtilisateur())) {
            throw new OffreStageIntrouvableException();
        }
        if (offre.getStatut() != StatutOffre.PUBLIEE && offre.getStatut() != StatutOffre.SOUMISE) {
            throw new ConflitStageException("Cette offre n'est ni publiée ni en attente : il n'y a rien à retirer.");
        }
        offre.setStatut(StatutOffre.RETIREE);
        offre.setMotifDecision(null);
        stageRepository.supprimerParOffreEtStatut(offre.getId(), StatutStage.EN_PREPARATION);
        return versReponse(offre, true);
    }

    @Transactional(readOnly = true)
    public PageResponse<OffreStageResponse> listerPubliees(TypeStage type, UUID organismeId, String lieu, boolean ouvertesSeulement,
            int page, int taille) {
        Specification<OffreStage> specification = visiblesDesMembres();
        if (type != null) {
            specification = specification.and((racine, requete, cb) -> cb.equal(racine.get("typeStage"), type));
        }
        if (organismeId != null) {
            specification = specification.and((racine, requete, cb) -> cb.equal(racine.get("organisme").get("id"), organismeId));
        }
        if (lieu != null && !lieu.isBlank()) {
            String motif = "%" + lieu.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((racine, requete, cb) -> cb.like(cb.lower(racine.get("lieu")), motif));
        }
        if (ouvertesSeulement) {
            LocalDate aujourdhui = aujourdhui();
            // Une liste publiée clôt les candidatures, même avant la date limite.
            specification = specification.and((racine, requete, cb) -> cb.and(
                cb.equal(racine.get("statut"), StatutOffre.PUBLIEE),
                cb.greaterThanOrEqualTo(racine.get("dateLimiteCandidature"), aujourdhui)));
        }
        // Les offres qui ferment bientôt d'abord ; à date égale, la plus récente.
        Sort tri = ouvertesSeulement
            ? Sort.by(Sort.Order.asc("dateLimiteCandidature"), Sort.Order.desc("publieeLe"))
            : Sort.by(Sort.Order.desc("dateLimiteCandidature"), Sort.Order.desc("publieeLe"));
        return PageResponse.depuis(offreRepository.findAll(specification, PageRequest.of(page, taille, tri))
            .map(offre -> versReponse(offre, false, false)));
    }

    @Transactional(readOnly = true)
    public List<OrganismeOffresResponse> organismesAvecOffres() {
        return offreRepository.organismesAvecOffres(List.of(StatutOffre.PUBLIEE, StatutOffre.LISTE_PUBLIEE), StatutCompte.SUSPENDU).stream()
            .map(ligne -> new OrganismeOffresResponse(ligne.getId(), ligne.getNom())).toList();
    }

    /**
     * Une offre publiée est visible de tout membre connecté ; les autres, seulement de leur organisme et de
     * l'administrateur Stages. Sinon : 404, pour ne pas révéler son existence.
     */
    @Transactional(readOnly = true)
    public OffreStageResponse detail(UUID id, UtilisateurPrincipal principal) {
        OffreStage offre = chargerVisible(id, principal.getUtilisateur());
        return reponseComplete(offre, peutGerer(offre, principal.getUtilisateur()));
    }

    /** L'offre, si le lecteur peut la voir (mêmes règles que le détail) ; sinon 404. */
    @Transactional(readOnly = true)
    public OffreStage chargerVisible(UUID id, Utilisateur lecteur) {
        OffreStage offre = offreRepository.findWithOrganismeById(id).orElseThrow(OffreStageIntrouvableException::new);
        boolean visible = (offre.getStatut() == StatutOffre.PUBLIEE || offre.getStatut() == StatutOffre.LISTE_PUBLIEE)
            && offre.getOrganisme().getStatutValidation() != StatutCompte.SUSPENDU;
        if (!visible && !peutGerer(offre, lecteur)) {
            throw new OffreStageIntrouvableException();
        }
        return offre;
    }

    /**
     * L'offre verrouillée, pour la modifier (image, pièces jointes) : son organisme tant qu'elle est en attente ou
     * publiée, ou l'administrateur Stages. Un autre membre reçoit 404 ; une offre close à la modification, 409.
     */
    @Transactional
    public OffreStage chargerPourGestion(UUID id, Utilisateur auteur) {
        OffreStage offre = verrouiller(id);
        if (!peutGerer(offre, auteur)) {
            throw new OffreStageIntrouvableException();
        }
        if (offre.getStatut() != StatutOffre.PUBLIEE && offre.getStatut() != StatutOffre.SOUMISE) {
            throw new ConflitStageException("Une offre refusée ou retirée ne se modifie plus.");
        }
        return offre;
    }

    public static boolean peutGerer(OffreStage offre, Utilisateur utilisateur) {
        return estDeLOrganisme(offre, utilisateur) || PermissionAdmin.accordee(utilisateur, PermissionAdmin.GERER_STAGES);
    }

    /** Réponse avec le motif (pour qui gère l'offre) et les pièces jointes : le détail et les modifications de fichiers. */
    public static OffreStageResponse reponseComplete(OffreStage offre, boolean avecMotif) {
        return versReponse(offre, avecMotif, true);
    }

    @Transactional(readOnly = true)
    public List<OffreStageResponse> mesOffres(UtilisateurPrincipal principal) {
        Organisme organisme = principal.getUtilisateur().getOrganisme();
        if (organisme == null) {
            return List.of();
        }
        UUID organismeId = organisme.getId();
        Specification<OffreStage> deLOrganisme = (racine, requete, cb) -> cb.equal(racine.get("organisme").get("id"), organismeId);
        return avecNombres(offreRepository.findAll(deLOrganisme, PageRequest.of(0, 200, Sort.by(Sort.Order.desc("creeeLe"))))
            .map(offre -> versReponse(offre, true, true)).getContent());
    }

    @Transactional(readOnly = true)
    public PageResponse<OffreStageResponse> listerPourAdministration(StatutOffre statut, int page, int taille) {
        Specification<OffreStage> specification = Specification.unrestricted();
        if (statut != null) {
            specification = specification.and((racine, requete, cb) -> cb.equal(racine.get("statut"), statut));
        }
        // La file de vérification se traite dans l'ordre d'arrivée ; les autres listes montrent le plus récent d'abord.
        Sort tri = statut == StatutOffre.SOUMISE ? Sort.by(Sort.Order.asc("creeeLe")) : Sort.by(Sort.Order.desc("creeeLe"));
        PageResponse<OffreStageResponse> resultat = PageResponse.depuis(offreRepository.findAll(specification, PageRequest.of(page, taille, tri))
            .map(offre -> versReponse(offre, true, false)));
        return new PageResponse<>(avecNombres(resultat.contenu()), resultat.page(), resultat.taille(), resultat.totalElements(), resultat.totalPages());
    }

    /** Nombre de candidatures envoyées à chaque offre de la liste, en une requête. */
    private List<OffreStageResponse> avecNombres(List<OffreStageResponse> offres) {
        if (offres.isEmpty()) return offres;
        Map<UUID, Long> nombres = candidatureRepository.compterEnvoyees(offres.stream().map(OffreStageResponse::id).toList()).stream()
            .collect(Collectors.toMap(CandidatureRepository.NombreParOffre::getOffreId, CandidatureRepository.NombreParOffre::getNombre));
        return offres.stream().map(offre -> offre.avecNombreCandidatures(nombres.getOrDefault(offre.id(), 0L))).toList();
    }

    @Transactional(readOnly = true)
    public long nombreAVerifier() {
        return offreRepository.countByStatut(StatutOffre.SOUMISE);
    }

    private OffreStage nouvelleOffre(OffreStageRequest request, Organisme organisme, Utilisateur auteur) {
        if (request.dateLimiteCandidature().isBefore(aujourdhui())) {
            throw new IllegalArgumentException("La date limite de candidature ne peut pas être passée.");
        }
        if (request.dateDebutPrevue() != null && request.dateDebutPrevue().isBefore(request.dateLimiteCandidature())) {
            throw new IllegalArgumentException("Le stage ne peut pas commencer avant la date limite de candidature.");
        }
        OffreStage offre = new OffreStage();
        offre.setOrganisme(organisme);
        offre.setTitre(request.titre().trim());
        offre.setDescription(request.description().trim());
        offre.setCompetences(request.competences().trim());
        offre.setDureeMois(request.dureeMois());
        offre.setTypeStage(request.typeStage());
        offre.setLieu(request.lieu() == null || request.lieu().isBlank() ? null : request.lieu().trim());
        offre.setDateDebutPrevue(request.dateDebutPrevue());
        offre.setNombrePlaces(request.nombrePlaces());
        offre.setDateLimiteCandidature(request.dateLimiteCandidature());
        offre.setCreeePar(auteur);
        return offre;
    }

    private OffreStage verrouiller(UUID id) {
        return offreRepository.findByIdForUpdate(id).orElseThrow(OffreStageIntrouvableException::new);
    }

    private static void exigerStatut(OffreStage offre, StatutOffre attendu, String message) {
        if (offre.getStatut() != attendu) {
            throw new ConflitStageException(message);
        }
    }

    private static boolean estDeLOrganisme(OffreStage offre, Utilisateur utilisateur) {
        return utilisateur.getRole() == TypeRole.ORGANISME && utilisateur.getOrganisme() != null
            && utilisateur.getOrganisme().getId().equals(offre.getOrganisme().getId());
    }

    private static Specification<OffreStage> visiblesDesMembres() {
        return (racine, requete, cb) -> cb.and(
            racine.get("statut").in(StatutOffre.PUBLIEE, StatutOffre.LISTE_PUBLIEE),
            cb.notEqual(racine.get("organisme").get("statutValidation"), StatutCompte.SUSPENDU));
    }

    /** Chaque administrateur Stages actif, super administrateurs compris, est prévenu d'une offre à vérifier. */
    private void prevenirAdministrateursStages(OffreStage offre) {
        String message = "Bonjour, l'organisme " + offre.getOrganisme().getNom() + " a déposé l'offre de stage « " + offre.getTitre()
            + " ». Elle attend votre vérification dans Stages › Offres de stage, avant d'être visible des étudiants.";
        utilisateurRepository.administrateursActifsAvecUneDe(List.of(PermissionAdmin.GERER_STAGES, PermissionAdmin.GERER_ADMINISTRATEURS))
            .forEach(admin -> evenements.publishEvent(
                new NotificationCompte(admin.getId(), admin.getEmail(), "Une offre de stage attend votre vérification", message)));
    }

    /** Un organisme sans compte n'est pas prévenu : l'administrateur Stages saisit ses offres pour lui. */
    private void prevenirOrganisme(OffreStage offre, String sujet, String message) {
        Utilisateur contact = offre.getOrganisme().getContact();
        if (contact != null && contact.getEmail() != null) {
            evenements.publishEvent(new NotificationCompte(contact.getId(), contact.getEmail(), sujet, "Bonjour, " + message));
        }
    }

    private static LocalDate aujourdhui() {
        return LocalDate.now(FUSEAU);
    }

    private static OffreStageResponse versReponse(OffreStage offre, boolean avecMotif) {
        return versReponse(offre, avecMotif, true);
    }

    private static OffreStageResponse versReponse(OffreStage offre, boolean avecMotif, boolean avecPieces) {
        Organisme organisme = offre.getOrganisme();
        List<OffreStageResponse.PieceJointe> pieces = avecPieces
            ? offre.getPiecesJointes().stream()
                .map(piece -> new OffreStageResponse.PieceJointe(piece.getId(), piece.getNomFichier(), piece.getTaille())).toList()
            : List.of();
        return new OffreStageResponse(offre.getId(), offre.getTitre(), offre.getDescription(), offre.getCompetences(),
            offre.getDureeMois(), offre.getTypeStage().name(), offre.getLieu(), offre.getDateDebutPrevue(), offre.getNombrePlaces(),
            offre.getDateLimiteCandidature(), offre.candidaturesOuvertes(aujourdhui()), offre.getStatut().name(),
            avecMotif ? offre.getMotifDecision() : null, offre.getPublieeLe(), offre.getCreeeLe(),
            new OffreStageResponse.Organisme(organisme.getId(), organisme.getNom(), organisme.getLogoUrl()),
            offre.getUrlImage(), pieces,
            avecMotif && (offre.getStatut() == StatutOffre.PUBLIEE || offre.getStatut() == StatutOffre.SOUMISE), null);
    }
}
