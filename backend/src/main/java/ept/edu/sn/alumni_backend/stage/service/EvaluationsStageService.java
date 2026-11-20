package ept.edu.sn.alumni_backend.stage.service;

import java.time.Instant;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.filiere.repository.ChefDepartementRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.CritereEvaluation;
import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.dto.EvaluationRequest;
import ept.edu.sn.alumni_backend.stage.dto.EvaluationResponse;
import ept.edu.sn.alumni_backend.stage.entity.ConventionStage;
import ept.edu.sn.alumni_backend.stage.entity.EvaluationStage;
import ept.edu.sn.alumni_backend.stage.entity.Stage;
import ept.edu.sn.alumni_backend.stage.exception.ConflitStageException;
import ept.edu.sn.alumni_backend.stage.exception.OffreStageIntrouvableException;
import ept.edu.sn.alumni_backend.stage.repository.ConventionStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.EvaluationStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.RapportStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.StageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

/**
 * Évaluation du stagiaire (STA-06), sur la grille de la fiche de l'école.
 * - Saisie par l'organisme d'accueil, ou par l'administrateur Stages si l'organisme n'a pas de compte, une fois la
 *   convention complète. Brouillon libre ; à la soumission, tout est exigé et la fiche est verrouillée.
 * - Seul l'administrateur Stages la rouvre, et décide de la validation finale du stage (l'avis du tuteur est indicatif).
 * - Lue par l'administrateur Stages, l'organisme, l'encadrant interne et le chef de département de la filière (ces deux
 *   derniers une fois soumise) ; jamais par l'étudiant : pour lui, elle n'existe pas (404).
 */
@Service
@RequiredArgsConstructor
public class EvaluationsStageService {
    public static final String AUCUNE = "AUCUNE";
    public static final String BROUILLON = "BROUILLON";
    public static final String SOUMISE = "SOUMISE";

    private static final List<EvaluationResponse.Critere> GRILLE = Arrays.stream(CritereEvaluation.values())
        .map(c -> new EvaluationResponse.Critere(c, c.section(), c.libelle())).toList();

    private final StageRepository stageRepository;
    private final EvaluationStageRepository evaluationRepository;
    private final RapportStageRepository rapportRepository;
    private final ConventionStageRepository conventionRepository;
    private final ChefDepartementRepository chefRepository;
    private final ApplicationEventPublisher evenements;

    private enum Lecteur { ECOLE, ORGANISME, ENCADREMENT }

    @Transactional(readOnly = true)
    public EvaluationResponse lire(UUID stageId, UtilisateurPrincipal principal, boolean ecole) {
        Stage stage = stageRepository.findById(stageId).filter(s -> s.getStatut() == StatutStage.CONFIRME)
            .orElseThrow(OffreStageIntrouvableException::new);
        Lecteur lecteur = lecteur(stage, principal.getUtilisateur(), ecole);
        return versReponse(stage, evaluationRepository.findByStage_Id(stageId).orElse(null), lecteur);
    }

    @Transactional
    public EvaluationResponse enregistrer(UUID stageId, EvaluationRequest request, UtilisateurPrincipal principal, boolean ecole) {
        EvaluationStage evaluation = chargerPourSaisie(stageId, principal.getUtilisateur(), ecole);
        appliquer(evaluation, request, principal.getUtilisateur(), ecole);
        return versReponse(evaluation.getStage(), evaluationRepository.saveAndFlush(evaluation), ecole ? Lecteur.ECOLE : Lecteur.ORGANISME);
    }

    @Transactional
    public EvaluationResponse soumettre(UUID stageId, EvaluationRequest request, UtilisateurPrincipal principal, boolean ecole) {
        Utilisateur moi = principal.getUtilisateur();
        EvaluationStage evaluation = chargerPourSaisie(stageId, moi, ecole);
        appliquer(evaluation, request, moi, ecole);
        List<CritereEvaluation> manquants = Arrays.stream(CritereEvaluation.values()).filter(c -> !evaluation.getCriteres().containsKey(c)).toList();
        if (!manquants.isEmpty()) {
            throw new IllegalArgumentException("Notez tous les critères avant de soumettre (" + manquants.size() + " sans réponse).");
        }
        if (evaluation.getDureeEffectiveMois() == null || evaluation.getAppreciationGenerale() == null || evaluation.getAvisTuteurValide() == null) {
            throw new IllegalArgumentException("La durée effective, l'appréciation générale et l'avis du tuteur sont obligatoires pour soumettre.");
        }
        evaluation.setSoumiseLe(Instant.now());
        evaluation.setSoumisePar(moi);
        Stage stage = evaluation.getStage();
        Utilisateur encadrant = stage.getEncadrantInterne();
        if (encadrant != null && encadrant.getEmail() != null) {
            evenements.publishEvent(new NotificationCompte(encadrant.getId(), encadrant.getEmail(), "Évaluation de stage reçue",
                "Bonjour, l'évaluation du stage de " + stage.getEtudiant().getPrenom() + " " + stage.getEtudiant().getNom() + " chez "
                    + stage.nomOrganisme() + " a été remise. Retrouvez-la dans Stages › Suivi des stages."));
        }
        return versReponse(stage, evaluationRepository.saveAndFlush(evaluation), ecole ? Lecteur.ECOLE : Lecteur.ORGANISME);
    }

    /** L'administrateur Stages rouvre une évaluation soumise ; sa décision finale tombe avec. */
    @Transactional
    public EvaluationResponse rouvrir(UUID stageId, UtilisateurPrincipal principal) {
        EvaluationStage evaluation = chargerSoumise(stageId);
        evaluation.setSoumiseLe(null);
        evaluation.setSoumisePar(null);
        evaluation.setStageValide(null);
        evaluation.setDecideLe(null);
        evaluation.setDecidePar(null);
        evaluation.setModifiePar(principal.getUtilisateur());
        return versReponse(evaluation.getStage(), evaluationRepository.saveAndFlush(evaluation), Lecteur.ECOLE);
    }

    @Transactional
    public EvaluationResponse decider(UUID stageId, Boolean valide, UtilisateurPrincipal principal) {
        EvaluationStage evaluation = chargerSoumise(stageId);
        evaluation.setStageValide(valide);
        evaluation.setDecideLe(valide == null ? null : Instant.now());
        evaluation.setDecidePar(valide == null ? null : principal.getUtilisateur());
        return versReponse(evaluation.getStage(), evaluationRepository.saveAndFlush(evaluation), Lecteur.ECOLE);
    }

    public static String etat(EvaluationStage evaluation) {
        if (evaluation == null) return AUCUNE;
        return evaluation.soumise() ? SOUMISE : BROUILLON;
    }

    /** Qui lit : l'école, l'organisme d'accueil, l'encadrant ou le chef de département ; tout autre = 404. */
    private Lecteur lecteur(Stage stage, Utilisateur moi, boolean ecole) {
        if (ecole) return Lecteur.ECOLE;
        if (moi.getRole() == TypeRole.ORGANISME && moi.getOrganisme() != null && stage.getOrganisme() != null
                && moi.getOrganisme().getId().equals(stage.getOrganisme().getId())) {
            return Lecteur.ORGANISME;
        }
        if (moi.getRole() == TypeRole.PERSONNEL) {
            boolean encadrant = stage.getEncadrantInterne() != null && stage.getEncadrantInterne().getId().equals(moi.getId());
            var filiere = stage.getEtudiant().getFiliere();
            if (encadrant || (filiere != null && chefRepository.existsByChef_IdAndFiliereId(moi.getId(), filiere.getId()))) {
                return Lecteur.ENCADREMENT;
            }
        }
        throw new OffreStageIntrouvableException();
    }

    private EvaluationStage chargerPourSaisie(UUID stageId, Utilisateur moi, boolean ecole) {
        Stage stage = stageRepository.findByIdForUpdate(stageId).filter(s -> s.getStatut() == StatutStage.CONFIRME)
            .orElseThrow(OffreStageIntrouvableException::new);
        if (lecteur(stage, moi, ecole) == Lecteur.ENCADREMENT) {
            throw new SecurityException("Seul l'organisme d'accueil ou l'administrateur Stages saisit l'évaluation.");
        }
        if (!conventionRepository.findByStage_Id(stageId).map(ConventionStage::complete).orElse(false)) {
            throw new ConflitStageException("L'évaluation s'ouvre une fois la convention complète : trois signatures et scan signé.");
        }
        EvaluationStage evaluation = evaluationRepository.findByStage_Id(stageId).orElseGet(() -> new EvaluationStage(stage));
        if (evaluation.soumise()) {
            throw new ConflitStageException("L'évaluation a été soumise : seul l'administrateur Stages peut la rouvrir.");
        }
        return evaluation;
    }

    private EvaluationStage chargerSoumise(UUID stageId) {
        stageRepository.findByIdForUpdate(stageId).filter(s -> s.getStatut() == StatutStage.CONFIRME)
            .orElseThrow(OffreStageIntrouvableException::new);
        EvaluationStage evaluation = evaluationRepository.findByStage_Id(stageId).orElse(null);
        if (evaluation == null || !evaluation.soumise()) throw new ConflitStageException("L'évaluation n'a pas encore été soumise.");
        return evaluation;
    }

    private static void appliquer(EvaluationStage e, EvaluationRequest r, Utilisateur moi, boolean ecole) {
        e.getCriteres().clear();
        if (r.criteres() != null) {
            r.criteres().forEach((critere, niveau) -> {
                if (critere != null && niveau != null) e.getCriteres().put(critere, niveau);
            });
        }
        e.setDureeEffectiveMois(r.dureeEffectiveMois());
        e.setPointsForts(texte(r.pointsForts()));
        e.setAxesAmelioration(texte(r.axesAmelioration()));
        e.setObservations(texte(r.observations()));
        e.setAppreciationGenerale(r.appreciationGenerale());
        e.setAvisTuteurValide(r.avisTuteurValide());
        e.setSaisieParEcole(ecole);
        e.setModifiePar(moi);
    }

    private EvaluationResponse versReponse(Stage stage, EvaluationStage e, Lecteur lecteur) {
        var convention = conventionRepository.findByStage_Id(stage.getId()).orElse(null);
        var suivi = SuiviStagesService.versReponse(stage, true, ConventionsStageService.etat(convention), e,
            rapportRepository.findByStage_Id(stage.getId()).orElse(null));
        boolean conventionComplete = convention != null && convention.complete();
        boolean modifiable = lecteur != Lecteur.ENCADREMENT && conventionComplete && (e == null || !e.soumise());
        // L'encadrement ne lit pas le brouillon de l'organisme : seulement la fiche soumise.
        if (e == null || (lecteur == Lecteur.ENCADREMENT && !e.soumise())) {
            return new EvaluationResponse(suivi, GRILLE, new EnumMap<>(CritereEvaluation.class), null, null, null, null, null, null,
                etat(e), false, null, null, null, modifiable);
        }
        return new EvaluationResponse(suivi, GRILLE, new EnumMap<>(e.getCriteres()), e.getDureeEffectiveMois(), e.getPointsForts(),
            e.getAxesAmelioration(), e.getObservations(), e.getAppreciationGenerale(), e.getAvisTuteurValide(), etat(e), e.isSaisieParEcole(),
            e.getSoumiseLe(), e.getStageValide(), e.getDecideLe(), modifiable);
    }

    private static String texte(String valeur) {
        return valeur == null || valeur.isBlank() ? null : valeur.strip();
    }
}
