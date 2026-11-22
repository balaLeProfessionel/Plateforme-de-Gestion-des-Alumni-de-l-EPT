package ept.edu.sn.alumni_backend.stage.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.dto.DeclarationResponse;
import ept.edu.sn.alumni_backend.stage.dto.DeclarationStageRequest;
import ept.edu.sn.alumni_backend.stage.entity.Stage;
import ept.edu.sn.alumni_backend.stage.exception.ConflitStageException;
import ept.edu.sn.alumni_backend.stage.exception.OffreStageIntrouvableException;
import ept.edu.sn.alumni_backend.stage.repository.StageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Stages trouvés par les étudiants hors offre (STA-10).
 * - Un étudiant actif déclare l'organisme (connu ou nommé librement), le sujet, les dates, le type et son maître de stage.
 * - Il peut retirer sa déclaration tant qu'elle attend ; l'administrateur Stages est prévenu de chaque déclaration.
 * - L'administrateur Stages la valide (le stage est confirmé, sans chevauchement avec un autre) en enregistrant
 *   l'organisme si besoin, ou la refuse avec un motif. L'étudiant est prévenu par e-mail.
 */
@Service
@RequiredArgsConstructor
public class DeclarationsStageService {
    private final StageRepository stageRepository;
    private final OrganismeRepository organismeRepository;
    private final OrganismeService organismeService;
    private final UtilisateurRepository utilisateurRepository;
    private final ListeDefinitiveService listeDefinitiveService;
    private final ApplicationEventPublisher evenements;

    @Transactional
    public DeclarationResponse declarer(DeclarationStageRequest request, UtilisateurPrincipal principal) {
        Utilisateur etudiant = utilisateurRepository.findByIdForUpdate(principal.getUtilisateur().getId())
            .filter(u -> u.getRole() == TypeRole.ETUDIANT && u.getStatutCompte() == StatutCompte.ACTIF)
            .orElseThrow(() -> new SecurityException("Seuls les étudiants de l'EPT déclarent un stage."));
        if (request.dateFin().isBefore(request.dateDebut())) {
            throw new IllegalArgumentException("La fin du stage ne peut pas précéder son début.");
        }
        Stage stage = new Stage();
        if (request.organismeId() != null) {
            stage.setOrganisme(organismeRepository.findById(request.organismeId())
                .orElseThrow(() -> new IllegalArgumentException("Cet organisme n'existe pas : choisissez-le dans la liste ou saisissez son nom.")));
        } else if (request.nomOrganisme() != null && !request.nomOrganisme().isBlank()) {
            stage.setOrganismePropose(request.nomOrganisme().strip());
        } else {
            throw new IllegalArgumentException("Indiquez l'organisme qui vous accueille.");
        }
        EligibiliteStage.verifier(etudiant, request.typeStage(), true);
        stage.setEtudiant(etudiant);
        stage.setTypeStage(request.typeStage());
        stage.setSujet(request.sujet().strip());
        stage.setLieu(texte(request.lieu()));
        stage.setDateDebut(request.dateDebut());
        stage.setDateFin(request.dateFin());
        stage.setTuteurNom(request.tuteurNom().strip());
        stage.setTuteurFonction(texte(request.tuteurFonction()));
        stage.setTuteurEmail(texte(request.tuteurEmail()));
        stage.setTuteurTelephone(texte(request.tuteurTelephone()));
        stage.setStatut(StatutStage.DECLARE);
        stage.setCreePar(etudiant);
        // Un stage qui chevauche déjà un stage confirmé serait refusé à la validation : autant le dire tout de suite.
        listeDefinitiveService.verifierChevauchement(stage, etudiant);
        stage = stageRepository.save(stage);
        prevenirAdministrateursStages(stage);
        return versReponse(stage, false);
    }

    /** L'étudiant retire sa déclaration tant qu'elle attend : elle disparaît. */
    @Transactional
    public void retirer(UUID id, UtilisateurPrincipal principal) {
        Stage stage = stageRepository.findByIdForUpdate(id)
            .filter(s -> s.getOffre() == null && s.getEtudiant().getId().equals(principal.getUtilisateur().getId()))
            .orElseThrow(OffreStageIntrouvableException::new);
        if (stage.getStatut() != StatutStage.DECLARE) {
            throw new ConflitStageException("Cette déclaration a déjà été traitée par l'école.");
        }
        stageRepository.delete(stage);
    }

    @Transactional(readOnly = true)
    public PageResponse<DeclarationResponse> lister(StatutStage statut, int page, int taille) {
        Sort tri = statut == StatutStage.DECLARE ? Sort.by(Sort.Order.asc("creeLe")) : Sort.by(Sort.Order.desc("decideLe"));
        return PageResponse.depuis(stageRepository.findByOffreIsNullAndStatut(statut, PageRequest.of(page, taille, tri))
            .map(s -> versReponse(s, true)));
    }

    @Transactional(readOnly = true)
    public long nombreATraiter() {
        return stageRepository.countByOffreIsNullAndStatut(StatutStage.DECLARE);
    }

    /** Valide la déclaration : l'organisme est enregistré si besoin, le stage est confirmé. */
    @Transactional
    public DeclarationResponse valider(UUID id, UUID organismeId, String nomNouvelOrganisme, UtilisateurPrincipal principal) {
        Stage stage = chargerATraiter(id);
        Utilisateur etudiant = utilisateurRepository.findByIdForUpdate(stage.getEtudiant().getId()).orElseThrow();
        if (organismeId != null || (nomNouvelOrganisme != null && !nomNouvelOrganisme.isBlank())) {
            stage.setOrganisme(organismeService.resoudreOrganisme(organismeId, nomNouvelOrganisme));
        } else if (stage.getOrganisme() == null) {
            stage.setOrganisme(organismeService.resoudreOrganisme(null, stage.getOrganismePropose()));
        }
        listeDefinitiveService.verifierChevauchement(stage, etudiant);
        stage.confirmer();
        decider(stage, principal);
        prevenir(stage.getEtudiant(), "Votre stage est validé par l'école",
            "Bonjour, l'école a validé le stage que vous avez déclaré : « " + stage.getSujet() + " » chez " + stage.nomOrganisme()
                + ", " + ListeDefinitiveService.periode(stage) + ". Retrouvez-le dans Stages › Mes stages.");
        return versReponse(stage, true);
    }

    @Transactional
    public DeclarationResponse refuser(UUID id, String motif, UtilisateurPrincipal principal) {
        Stage stage = chargerATraiter(id);
        stage.setStatut(StatutStage.REFUSE);
        stage.setMotif(motif.strip());
        decider(stage, principal);
        prevenir(stage.getEtudiant(), "Votre déclaration de stage n'est pas validée",
            "Bonjour, l'école n'a pas validé le stage que vous avez déclaré : « " + stage.getSujet() + " » chez " + stage.nomOrganisme()
                + ". Motif : " + stage.getMotif());
        return versReponse(stage, true);
    }

    private Stage chargerATraiter(UUID id) {
        Stage stage = stageRepository.findByIdForUpdate(id).filter(s -> s.getOffre() == null)
            .orElseThrow(OffreStageIntrouvableException::new);
        if (stage.getStatut() != StatutStage.DECLARE) {
            throw new ConflitStageException("Cette déclaration a déjà été traitée.");
        }
        return stage;
    }

    private void decider(Stage stage, UtilisateurPrincipal principal) {
        stage.setDecidePar(utilisateurRepository.getReferenceById(principal.getUtilisateur().getId()));
        stage.setDecideLe(Instant.now());
    }

    private void prevenir(Utilisateur destinataire, String sujet, String message) {
        if (destinataire.getEmail() != null) evenements.publishEvent(new NotificationCompte(destinataire.getId(), destinataire.getEmail(), sujet, message));
    }

    /** Chaque administrateur Stages actif, super administrateurs compris, est prévenu d'une déclaration à traiter. */
    private void prevenirAdministrateursStages(Stage stage) {
        Utilisateur etudiant = stage.getEtudiant();
        String message = "Bonjour, " + etudiant.getPrenom() + " " + etudiant.getNom() + " a déclaré un stage chez " + stage.nomOrganisme()
            + " (« " + stage.getSujet() + " », " + ListeDefinitiveService.periode(stage) + "). Il attend votre décision dans Stages › Stages déclarés.";
        utilisateurRepository.administrateursActifsAvecUneDe(List.of(PermissionAdmin.GERER_STAGES, PermissionAdmin.GERER_ADMINISTRATEURS))
            .forEach(admin -> evenements.publishEvent(new NotificationCompte(admin.getId(), admin.getEmail(), "Un stage déclaré attend votre décision", message)));
    }

    private static DeclarationResponse versReponse(Stage s, boolean ecole) {
        return new DeclarationResponse(s.getId(), ListeDefinitiveService.etudiant(s.getEtudiant()), ecole ? s.getEtudiant().getEmail() : null,
            s.getOrganisme() == null ? null : s.getOrganisme().getId(), s.nomOrganisme(), s.getTypeStage().name(), s.getSujet(), s.getLieu(),
            s.getDateDebut(), s.getDateFin(), s.getTuteurNom(), s.getTuteurFonction(), s.getTuteurEmail(), s.getTuteurTelephone(),
            s.getStatut().name(), s.getMotif(), s.getCreeLe(), s.getDecideLe());
    }

    private static String texte(String valeur) {
        return valeur == null || valeur.isBlank() ? null : valeur.strip();
    }
}
