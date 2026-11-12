package ept.edu.sn.alumni_backend.stage.service;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.common.stockage.ApresTransaction;
import ept.edu.sn.alumni_backend.common.stockage.FichierIntrouvableException;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.dto.ConventionRequest;
import ept.edu.sn.alumni_backend.stage.dto.ConventionResponse;
import ept.edu.sn.alumni_backend.stage.dto.SignatureRequest;
import ept.edu.sn.alumni_backend.stage.entity.ConventionStage;
import ept.edu.sn.alumni_backend.stage.entity.Stage;
import ept.edu.sn.alumni_backend.stage.exception.ConflitStageException;
import ept.edu.sn.alumni_backend.stage.exception.OffreStageIntrouvableException;
import ept.edu.sn.alumni_backend.stage.repository.ConventionStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.EvaluationStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.RapportStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.StageRepository;
import lombok.RequiredArgsConstructor;

/**
 * Convention de stage tripartite (STA-05), tenue par l'administrateur Stages pour un stage confirmé.
 * - Les clauses (assurance, indemnité, logement, confidentialité) se saisissent ; sujet et encadrants viennent du stage.
 * - Chaque signature sur papier s'enregistre avec sa date, jamais dans le futur ; le scan signé est un PDF remplaçable.
 * - Complète quand les trois signatures et le scan sont enregistrés : c'est la condition de l'évaluation (STA-06).
 * La génération du document attend le modèle officiel de l'école.
 */
@Service
@RequiredArgsConstructor
public class ConventionsStageService {
    public static final String AUCUNE = "AUCUNE";
    public static final String EN_COURS = "EN_COURS";
    public static final String COMPLETE = "COMPLETE";

    private final StageRepository stageRepository;
    private final ConventionStageRepository conventionRepository;
    private final StockageFichiersConvention stockage;
    private final EvaluationStageRepository evaluationRepository;
    private final RapportStageRepository rapportRepository;

    @Transactional(readOnly = true)
    public ConventionResponse lire(UUID stageId) {
        Stage stage = stageRepository.findById(stageId).filter(s -> s.getStatut() == StatutStage.CONFIRME)
            .orElseThrow(OffreStageIntrouvableException::new);
        return versReponse(stage, conventionRepository.findByStage_Id(stageId).orElse(null));
    }

    @Transactional
    public ConventionResponse enregistrerClauses(UUID stageId, ConventionRequest request, UtilisateurPrincipal principal) {
        ConventionStage convention = chargerOuCreer(stageId);
        convention.setAssurance(texte(request.assurance()));
        convention.setIndemnite(texte(request.indemnite()));
        convention.setLogement(texte(request.logement()));
        convention.setClauseConfidentialite(request.clauseConfidentialite());
        return enregistrer(convention, principal);
    }

    @Transactional
    public ConventionResponse signer(UUID stageId, SignatureRequest request, UtilisateurPrincipal principal) {
        LocalDate date = request.date();
        if (date != null && date.isAfter(LocalDate.now(OffresStageService.FUSEAU))) {
            throw new IllegalArgumentException("La date de signature ne peut pas être dans le futur.");
        }
        ConventionStage convention = chargerOuCreer(stageId);
        switch (request.partie()) {
            case ETUDIANT -> convention.setSigneeEtudiantLe(date);
            case ORGANISME -> convention.setSigneeOrganismeLe(date);
            case ECOLE -> convention.setSigneeEcoleLe(date);
        }
        return enregistrer(convention, principal);
    }

    @Transactional
    public ConventionResponse deposerScan(UUID stageId, MultipartFile fichier, UtilisateurPrincipal principal) {
        ConventionStage convention = chargerOuCreer(stageId);
        String ancien = convention.getScan();
        String nom = stockage.getScans().stocker(fichier);
        ApresTransaction.siAnnulee(() -> stockage.getScans().supprimer(nom));
        if (ancien != null) ApresTransaction.siValidee(() -> stockage.getScans().supprimer(ancien));
        convention.setScan(nom);
        convention.setScanNomOriginal(FichiersOffreService.nomAffiche(fichier.getOriginalFilename()));
        return enregistrer(convention, principal);
    }

    @Transactional(readOnly = true)
    public FichiersOffreService.Telechargement scan(UUID stageId) {
        ConventionStage convention = conventionRepository.findByStage_Id(stageId).filter(c -> c.getScan() != null)
            .orElseThrow(FichierIntrouvableException::new);
        return new FichiersOffreService.Telechargement(convention.getScanNomOriginal(), stockage.getScans().lire(convention.getScan()));
    }

    public static String etat(ConventionStage convention) {
        if (convention == null) return AUCUNE;
        return convention.complete() ? COMPLETE : EN_COURS;
    }

    /** Le stage est verrouillé : deux saisies simultanées ne créent pas deux conventions. */
    private ConventionStage chargerOuCreer(UUID stageId) {
        Stage stage = stageRepository.findByIdForUpdate(stageId).orElseThrow(OffreStageIntrouvableException::new);
        if (stage.getStatut() != StatutStage.CONFIRME) {
            throw new ConflitStageException("Une convention ne s'établit que pour un stage confirmé.");
        }
        return conventionRepository.findByStage_Id(stageId).orElseGet(() -> new ConventionStage(stage));
    }

    private ConventionResponse enregistrer(ConventionStage convention, UtilisateurPrincipal principal) {
        convention.setModifiePar(principal.getUtilisateur());
        return versReponse(convention.getStage(), conventionRepository.saveAndFlush(convention));
    }

    private ConventionResponse versReponse(Stage stage, ConventionStage c) {
        var suivi = SuiviStagesService.versReponse(stage, true, etat(c), evaluationRepository.findByStage_Id(stage.getId()).orElse(null),
            rapportRepository.findByStage_Id(stage.getId()).orElse(null));
        if (c == null) {
            return new ConventionResponse(suivi, false, null, null, null, false, null, null, null, null, AUCUNE, null);
        }
        return new ConventionResponse(suivi, true, c.getAssurance(), c.getIndemnite(), c.getLogement(), c.isClauseConfidentialite(),
            c.getSigneeEtudiantLe(), c.getSigneeOrganismeLe(), c.getSigneeEcoleLe(), c.getScan() == null ? null : c.getScanNomOriginal(),
            etat(c), c.getModifieLe());
    }

    private static String texte(String valeur) {
        return valeur == null || valeur.isBlank() ? null : valeur.strip();
    }
}
