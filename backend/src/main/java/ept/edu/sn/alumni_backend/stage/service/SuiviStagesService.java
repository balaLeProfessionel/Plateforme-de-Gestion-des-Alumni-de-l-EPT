package ept.edu.sn.alumni_backend.stage.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.dto.PersonnelSuggestionResponse;
import ept.edu.sn.alumni_backend.stage.dto.SuiviStageResponse;
import ept.edu.sn.alumni_backend.stage.dto.TuteurRequest;
import ept.edu.sn.alumni_backend.stage.entity.EvaluationStage;
import ept.edu.sn.alumni_backend.stage.entity.RapportStage;
import ept.edu.sn.alumni_backend.stage.entity.Stage;
import ept.edu.sn.alumni_backend.stage.exception.ConflitStageException;
import ept.edu.sn.alumni_backend.stage.exception.OffreStageIntrouvableException;
import ept.edu.sn.alumni_backend.stage.repository.ConventionStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.EvaluationStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.RapportStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.StageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;

/**
 * Suivi des stages confirmés (STA-08).
 * - L'administrateur Stages voit tous les stages, désigne l'encadrant interne (un compte du personnel actif) et tient à
 *   jour les coordonnées du maître de stage.
 * - L'encadrant voit les stages qu'il encadre ; le chef de département ceux des étudiants de sa filière ; l'organisme
 *   les stagiaires qu'il accueille, sans leur adresse e-mail.
 */
@Service
@RequiredArgsConstructor
public class SuiviStagesService {
    private final StageRepository stageRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ApplicationEventPublisher evenements;
    private final ConventionStageRepository conventionRepository;
    private final EvaluationStageRepository evaluationRepository;
    private final RapportStageRepository rapportRepository;

    @Transactional(readOnly = true)
    public PageResponse<SuiviStageResponse> lister(UUID filiereId, boolean sansEncadrant, String texte, int page, int taille) {
        Specification<Stage> criteres = (racine, requete, cb) -> cb.equal(racine.get("statut"), StatutStage.CONFIRME);
        if (filiereId != null) {
            criteres = criteres.and((racine, requete, cb) -> cb.equal(racine.join("etudiant").join("filiere", JoinType.LEFT).get("id"), filiereId));
        }
        if (sansEncadrant) {
            criteres = criteres.and((racine, requete, cb) -> cb.isNull(racine.get("encadrantInterne")));
        }
        String recherche = texte == null ? "" : texte.strip().toLowerCase(Locale.ROOT);
        if (!recherche.isEmpty()) {
            String motif = "%" + recherche.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            criteres = criteres.and((racine, requete, cb) -> {
                var etudiant = racine.join("etudiant");
                return cb.or(
                    cb.like(cb.lower(cb.concat(cb.concat(etudiant.get("prenom"), " "), etudiant.get("nom"))), motif, '\\'),
                    cb.like(cb.lower(racine.get("sujet")), motif, '\\'),
                    cb.like(cb.lower(racine.join("organisme", JoinType.LEFT).get("nom")), motif, '\\'));
            });
        }
        var stages = stageRepository.findAll(criteres, PageRequest.of(page, taille, Sort.by(Sort.Order.desc("dateDebut"))));
        Etats etats = etats(stages.getContent());
        return PageResponse.depuis(stages.map(s -> etats.reponse(s, true)));
    }

    @Transactional
    public SuiviStageResponse designerEncadrant(UUID stageId, UUID encadrantId) {
        Stage stage = chargerConfirme(stageId);
        if (encadrantId == null) {
            stage.setEncadrantInterne(null);
            return versReponse(stage);
        }
        Utilisateur encadrant = utilisateurRepository.findById(encadrantId)
            .filter(u -> u.getRole() == TypeRole.PERSONNEL && u.getStatutCompte() == StatutCompte.ACTIF)
            .orElseThrow(() -> new IllegalArgumentException("L'encadrant interne doit être un membre du personnel au compte actif."));
        if (stage.getEncadrantInterne() != null && stage.getEncadrantInterne().getId().equals(encadrantId)) {
            throw new ConflitStageException("Ce membre du personnel encadre déjà ce stage.");
        }
        stage.setEncadrantInterne(encadrant);
        Utilisateur etudiant = stage.getEtudiant();
        prevenir(encadrant, "Vous encadrez un stage", "Bonjour, l'école vous a désigné encadrant interne du stage de " + etudiant.getPrenom()
            + " " + etudiant.getNom() + " : « " + stage.getSujet() + " » chez " + stage.nomOrganisme() + ", "
            + ListeDefinitiveService.periode(stage) + ". Retrouvez-le dans Stages › Suivi des stages.");
        prevenir(etudiant, "Votre encadrant de stage", "Bonjour, " + encadrant.getPrenom() + " " + encadrant.getNom()
            + " encadre votre stage « " + stage.getSujet() + " » pour l'école.");
        return versReponse(stage);
    }

    @Transactional
    public SuiviStageResponse modifierTuteur(UUID stageId, TuteurRequest request) {
        Stage stage = chargerConfirme(stageId);
        stage.setTuteurNom(request.nom().strip());
        stage.setTuteurFonction(texte(request.fonction()));
        stage.setTuteurEmail(texte(request.email()));
        stage.setTuteurTelephone(texte(request.telephone()));
        return versReponse(stage);
    }

    /** Membres du personnel actifs dont le nom contient le texte saisi (2 caractères au moins). */
    @Transactional(readOnly = true)
    public List<PersonnelSuggestionResponse> suggererPersonnel(String texte) {
        String recherche = texte == null ? "" : texte.strip().toLowerCase(Locale.ROOT);
        if (recherche.length() < 2) return List.of();
        String motif = "%" + recherche.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
        Specification<Utilisateur> personnel = (racine, requete, cb) -> cb.and(
            cb.equal(racine.get("role"), TypeRole.PERSONNEL),
            cb.equal(racine.get("statutCompte"), StatutCompte.ACTIF),
            cb.or(
                cb.like(cb.lower(cb.concat(cb.concat(racine.get("prenom"), " "), racine.get("nom"))), motif, '\\'),
                cb.like(cb.lower(cb.concat(cb.concat(racine.get("nom"), " "), racine.get("prenom"))), motif, '\\')));
        return utilisateurRepository.findAll(personnel, PageRequest.of(0, 10, Sort.by("nom", "prenom"))).stream()
            .map(u -> new PersonnelSuggestionResponse(u.getId(), u.getPrenom(), u.getNom(), u.getEmail(), u.getUrlPhoto())).toList();
    }

    /** Ce que le membre connecté suit : stages encadrés, de son département, ou accueillis par son organisme. */
    @Transactional(readOnly = true)
    public MesSuivis mesSuivis(UtilisateurPrincipal principal) {
        Utilisateur moi = principal.getUtilisateur();
        if (moi.getRole() == TypeRole.ORGANISME && moi.getOrganisme() != null) {
            return new MesSuivis(List.of(), List.of(), reponses(
                stageRepository.findByOrganisme_IdAndStatutOrderByDateDebutDesc(moi.getOrganisme().getId(), StatutStage.CONFIRME), false));
        }
        if (moi.getRole() == TypeRole.PERSONNEL) {
            return new MesSuivis(
                reponses(stageRepository.findByEncadrantInterne_IdAndStatutOrderByDateDebutDesc(moi.getId(), StatutStage.CONFIRME), true),
                reponses(stageRepository.duDepartementDe(moi.getId()), true),
                List.of());
        }
        return new MesSuivis(List.of(), List.of(), List.of());
    }

    public record MesSuivis(List<SuiviStageResponse> encadres, List<SuiviStageResponse> departement, List<SuiviStageResponse> accueillis) {
    }

    private Stage chargerConfirme(UUID id) {
        Stage stage = stageRepository.findByIdForUpdate(id).orElseThrow(OffreStageIntrouvableException::new);
        if (stage.getStatut() != StatutStage.CONFIRME) {
            throw new ConflitStageException("Seul un stage confirmé se suit.");
        }
        return stage;
    }

    private void prevenir(Utilisateur destinataire, String sujet, String message) {
        if (destinataire.getEmail() != null) evenements.publishEvent(new NotificationCompte(destinataire.getEmail(), sujet, message));
    }

    static String deroulement(Stage s, LocalDate aujourdhui) {
        if (aujourdhui.isBefore(s.getDateDebut())) return "A_VENIR";
        return aujourdhui.isAfter(s.getDateFin()) ? "TERMINE" : "EN_COURS";
    }

    private List<SuiviStageResponse> reponses(List<Stage> stages, boolean avecEmail) {
        Etats etats = etats(stages);
        return stages.stream().map(s -> etats.reponse(s, avecEmail)).toList();
    }

    /** Convention et évaluation de chaque stage d'une liste, en deux requêtes. */
    private Etats etats(List<Stage> stages) {
        if (stages.isEmpty()) return new Etats(Map.of(), Map.of(), Map.of());
        List<UUID> ids = stages.stream().map(Stage::getId).toList();
        Map<UUID, String> conventions = new HashMap<>();
        conventionRepository.findByStage_IdIn(ids).forEach(c -> conventions.put(c.getStage().getId(), ConventionsStageService.etat(c)));
        Map<UUID, EvaluationStage> evaluations = new HashMap<>();
        evaluationRepository.findByStage_IdIn(ids).forEach(e -> evaluations.put(e.getStage().getId(), e));
        Map<UUID, RapportStage> rapports = new HashMap<>();
        rapportRepository.findByStage_IdIn(ids).forEach(r -> rapports.put(r.getStage().getId(), r));
        return new Etats(conventions, evaluations, rapports);
    }

    private record Etats(Map<UUID, String> conventions, Map<UUID, EvaluationStage> evaluations, Map<UUID, RapportStage> rapports) {
        SuiviStageResponse reponse(Stage s, boolean avecEmail) {
            return versReponse(s, avecEmail, conventions.get(s.getId()), evaluations.get(s.getId()), rapports.get(s.getId()));
        }
    }

    private SuiviStageResponse versReponse(Stage stage) {
        return versReponse(stage, true, ConventionsStageService.etat(conventionRepository.findByStage_Id(stage.getId()).orElse(null)),
            evaluationRepository.findByStage_Id(stage.getId()).orElse(null), rapportRepository.findByStage_Id(stage.getId()).orElse(null));
    }

    static SuiviStageResponse versReponse(Stage s, boolean avecEmail, String convention, EvaluationStage evaluation, RapportStage rapport) {
        Utilisateur e = s.getEncadrantInterne();
        return new SuiviStageResponse(s.getId(), s.getOffre() == null ? null : s.getOffre().getId(), ListeDefinitiveService.etudiant(s.getEtudiant()),
            avecEmail ? s.getEtudiant().getEmail() : null, s.getOrganisme() == null ? null : s.getOrganisme().getId(), s.nomOrganisme(),
            s.getTypeStage().name(), s.getSujet(), s.getLieu(), s.getDateDebut(), s.getDateFin(),
            deroulement(s, LocalDate.now(OffresStageService.FUSEAU)),
            e == null ? null : new SuiviStageResponse.Encadrant(e.getId(), e.getPrenom(), e.getNom(), e.getEmail()),
            s.getTuteurNom(), s.getTuteurFonction(), s.getTuteurEmail(), s.getTuteurTelephone(), s.getOffre() == null,
            convention == null ? ConventionsStageService.AUCUNE : convention,
            EvaluationsStageService.etat(evaluation), evaluation == null ? null : evaluation.getStageValide(),
            RapportsStageService.versReponse(rapport));
    }

    private static String texte(String valeur) {
        return valeur == null || valeur.isBlank() ? null : valeur.strip();
    }
}
