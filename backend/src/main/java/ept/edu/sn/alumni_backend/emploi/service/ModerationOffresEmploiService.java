package ept.edu.sn.alumni_backend.emploi.service;

import ept.edu.sn.alumni_backend.admin.NomCompte;
import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.entity.ActionAdmin;
import ept.edu.sn.alumni_backend.admin.repository.ActionAdminRepository;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.emploi.FileModerationOffres;
import ept.edu.sn.alumni_backend.emploi.ModeOffreEmploi;
import ept.edu.sn.alumni_backend.emploi.StatutOffreEmploi;
import ept.edu.sn.alumni_backend.emploi.dto.OffreAModererResponse;
import ept.edu.sn.alumni_backend.emploi.entity.OffreEmploi;
import ept.edu.sn.alumni_backend.emploi.entity.SignalementOffreEmploi;
import ept.edu.sn.alumni_backend.emploi.evenement.DecisionOffreEmploi;
import ept.edu.sn.alumni_backend.emploi.exception.ConflitOffreEmploiException;
import ept.edu.sn.alumni_backend.emploi.exception.OffreEmploiIntrouvableException;
import ept.edu.sn.alumni_backend.emploi.repository.OffreEmploiRepository;
import ept.edu.sn.alumni_backend.emploi.repository.SignalementOffreEmploiRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Modération des offres d'emploi par l'administration (#224, permission GERER_OFFRES_EMPLOI) :
 * - une offre en attente (organisme non validé) est publiée, ou refusée avec un motif ;
 * - une offre publiée, gérée ou relayée, est retirée avec un motif : ses signalements sont traités, et les candidatures
 *   sans décision d'une offre gérée sont closes, candidats prévenus ;
 * - les signalements d'une offre sont classés quand l'offre est conforme : elle reste publiée.
 * L'auteur est prévenu de chaque décision, motif compris, par notification et par e-mail ; tout est consigné au journal.
 */
@Service
@RequiredArgsConstructor
public class ModerationOffresEmploiService {
    private static final int LONGUEUR_DETAILS = 200;

    private final OffreEmploiRepository offreRepository;
    private final SignalementOffreEmploiRepository signalementRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ActionAdminRepository actionAdminRepository;
    private final OffresEmploiService offresService;
    private final TraitementCandidaturesEmploiService traitementCandidatures;
    private final ApplicationEventPublisher evenements;

    @Transactional(readOnly = true)
    public PageResponse<OffreAModererResponse> lister(FileModerationOffres file, int page, int taille, UtilisateurPrincipal principal) {
        Specification<OffreEmploi> specification = switch (file) {
            case A_VERIFIER -> (racine, requete, cb) -> cb.equal(racine.get("statut"), StatutOffreEmploi.SOUMISE);
            case PUBLIEES -> (racine, requete, cb) -> cb.equal(racine.get("statut"), StatutOffreEmploi.PUBLIEE);
            case SIGNALEES -> (racine, requete, cb) -> {
                var sousRequete = requete.subquery(Integer.class);
                var signalement = sousRequete.from(SignalementOffreEmploi.class);
                sousRequete.select(cb.literal(1))
                    .where(cb.equal(signalement.get("offre"), racine), cb.isNull(signalement.get("traiteLe")));
                return cb.and(cb.equal(racine.get("statut"), StatutOffreEmploi.PUBLIEE), cb.exists(sousRequete));
            };
        };
        Sort tri = file == FileModerationOffres.A_VERIFIER
            ? Sort.by(Sort.Order.asc("creeeLe"), Sort.Order.asc("id"))
            : Sort.by(Sort.Order.desc("publieeLe"), Sort.Order.desc("id"));
        var offres = offreRepository.findAll(specification, PageRequest.of(page, taille, tri));
        Map<UUID, List<SignalementOffreEmploi>> signalements = signalementRepository
            .findByOffreIdInAndTraiteLeIsNullOrderByCreeLeAsc(offres.map(OffreEmploi::getId).toList()).stream()
            .collect(Collectors.groupingBy(s -> s.getOffre().getId()));
        Utilisateur lecteur = principal.getUtilisateur();
        return PageResponse.depuis(offres.map(o -> versReponse(o, lecteur, signalements.getOrDefault(o.getId(), List.of()))));
    }

    /** Offres en attente de vérification, et offres publiées avec au moins un signalement en attente. */
    @Transactional(readOnly = true)
    public Map<String, Long> compter() {
        return Map.of("aVerifier", offreRepository.countByStatut(StatutOffreEmploi.SOUMISE),
            "signalees", signalementRepository.compterOffresSignalees(StatutOffreEmploi.PUBLIEE));
    }

    @Transactional(readOnly = true)
    public long nombreATraiter() {
        return compter().values().stream().mapToLong(Long::longValue).sum();
    }

    @Transactional
    public OffreAModererResponse publier(UUID id, UtilisateurPrincipal principal) {
        OffreEmploi offre = verrouiller(id);
        exigerStatut(offre, StatutOffreEmploi.SOUMISE, "Seule une offre en attente de vérification peut être publiée.");
        offre.publier();
        consigner(principal, offre, TypeActionAdmin.PUBLICATION_OFFRE_EMPLOI, null);
        prevenirAuteur(offre, "Votre offre d'emploi est publiée", "votre offre « " + offre.getTitre()
            + " » a été vérifiée par l'école : elle est désormais visible des étudiants et des alumni.", "/offres-emploi/" + offre.getId());
        return versReponse(offre, principal.getUtilisateur(), List.of());
    }

    @Transactional
    public OffreAModererResponse refuser(UUID id, String motif, UtilisateurPrincipal principal) {
        OffreEmploi offre = verrouiller(id);
        exigerStatut(offre, StatutOffreEmploi.SOUMISE, "Seule une offre en attente de vérification peut être refusée.");
        String motifPropre = motif.strip();
        offre.setStatut(StatutOffreEmploi.REFUSEE);
        offre.setMotifDecision(motifPropre);
        consigner(principal, offre, TypeActionAdmin.REFUS_OFFRE_EMPLOI, motifPropre);
        prevenirAuteur(offre, "Votre offre d'emploi n'a pas été publiée",
            "l'école n'a pas publié votre offre « " + offre.getTitre() + " ». Motif : " + motifPropre, "/offres-emploi/mes-offres");
        return versReponse(offre, principal.getUtilisateur(), List.of());
    }

    @Transactional
    public OffreAModererResponse retirer(UUID id, String motif, UtilisateurPrincipal principal) {
        OffreEmploi offre = verrouiller(id);
        exigerStatut(offre, StatutOffreEmploi.PUBLIEE, "Seule une offre publiée peut être retirée.");
        String motifPropre = motif.strip();
        Utilisateur admin = utilisateurRepository.getReferenceById(principal.getUtilisateur().getId());
        offre.setStatut(StatutOffreEmploi.RETIREE);
        offre.setMotifDecision(motifPropre);
        traiterSignalements(offre, admin);
        int closes = offre.getMode() == ModeOffreEmploi.GEREE ? traitementCandidatures.fermerCandidaturesOuvertes(offre, admin, true) : 0;
        consigner(principal, offre, TypeActionAdmin.RETRAIT_OFFRE_EMPLOI, motifPropre);
        prevenirAuteur(offre, "Votre offre d'emploi a été retirée", "l'école a retiré votre offre « " + offre.getTitre()
            + " », qui n'est plus visible des membres. Motif : " + motifPropre
            + (closes > 0 ? " Les candidatures sans décision sont closes et leurs candidats prévenus." : ""), "/offres-emploi/mes-offres");
        return versReponse(offre, principal.getUtilisateur(), List.of());
    }

    /** L'offre est conforme : ses signalements en attente sont classés et elle reste publiée. L'auteur n'est pas dérangé. */
    @Transactional
    public OffreAModererResponse classerSignalements(UUID id, UtilisateurPrincipal principal) {
        OffreEmploi offre = verrouiller(id);
        if (traiterSignalements(offre, utilisateurRepository.getReferenceById(principal.getUtilisateur().getId())) == 0) {
            throw new ConflitOffreEmploiException("Aucun signalement n'attend de décision pour cette offre.");
        }
        consigner(principal, offre, TypeActionAdmin.CLASSEMENT_SIGNALEMENTS_OFFRE_EMPLOI, null);
        return versReponse(offre, principal.getUtilisateur(), List.of());
    }

    private OffreEmploi verrouiller(UUID id) {
        return offreRepository.findByIdForUpdate(id).orElseThrow(OffreEmploiIntrouvableException::new);
    }

    private static void exigerStatut(OffreEmploi offre, StatutOffreEmploi attendu, String message) {
        if (offre.getStatut() != attendu) {
            throw new ConflitOffreEmploiException(message);
        }
    }

    private int traiterSignalements(OffreEmploi offre, Utilisateur admin) {
        List<SignalementOffreEmploi> enAttente = signalementRepository.findByOffreIdAndTraiteLeIsNull(offre.getId());
        Instant maintenant = Instant.now();
        enAttente.forEach(s -> s.traiter(admin, maintenant));
        return enAttente.size();
    }

    private void consigner(UtilisateurPrincipal principal, OffreEmploi offre, TypeActionAdmin type, String motif) {
        String details = "« " + offre.getTitre() + " »";
        actionAdminRepository.save(new ActionAdmin(utilisateurRepository.getReferenceById(principal.getUtilisateur().getId()),
            offre.getAuteur(), type, motif, details.length() > LONGUEUR_DETAILS ? details.substring(0, LONGUEUR_DETAILS - 1) + "…" : details));
    }

    private void prevenirAuteur(OffreEmploi offre, String sujet, String message, String lien) {
        Utilisateur auteur = offre.getAuteur();
        evenements.publishEvent(new DecisionOffreEmploi(auteur.getId(), auteur.getEmail(), sujet, message, lien));
    }

    private OffreAModererResponse versReponse(OffreEmploi offre, Utilisateur lecteur, List<SignalementOffreEmploi> signalements) {
        return new OffreAModererResponse(offresService.versReponse(offre, lecteur, false), signalements.stream()
            .map(s -> new OffreAModererResponse.Signalement(s.getId(), s.getMotif(), s.getCommentaire(), s.getCreeLe(),
                NomCompte.complet(s.getAuteur())))
            .toList());
    }
}
