package ept.edu.sn.alumni_backend.stage.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.common.stockage.ApresTransaction;
import ept.edu.sn.alumni_backend.common.stockage.FichierIntrouvableException;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.dto.RapportResponse;
import ept.edu.sn.alumni_backend.stage.entity.RapportStage;
import ept.edu.sn.alumni_backend.stage.entity.Stage;
import ept.edu.sn.alumni_backend.stage.exception.ConflitStageException;
import ept.edu.sn.alumni_backend.stage.exception.OffreStageIntrouvableException;
import ept.edu.sn.alumni_backend.stage.repository.RapportStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.StageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

/**
 * Rapport de stage (STA-07).
 * - L'administrateur Stages fixe la date limite, pour un ou plusieurs stages confirmés ; l'étudiant est prévenu.
 * - L'étudiant dépose son PDF tant que la date limite n'est pas dépassée, et le remplace s'il le veut.
 * - Lu par l'étudiant, l'administrateur Stages, l'encadrant interne, le chef de département de la filière et
 *   l'organisme d'accueil (pour le maître de stage) ; pour tout autre, il n'existe pas (404).
 */
@Service
@RequiredArgsConstructor
public class RapportsStageService {
    private static final DateTimeFormatter FORMAT_DATE = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.FRENCH);

    private final StageRepository stageRepository;
    private final RapportStageRepository rapportRepository;
    private final AccesStage acces;
    private final StockageFichiersRapport stockage;
    private final ApplicationEventPublisher evenements;

    /** Renvoie le nombre de stages mis à jour. */
    @Transactional
    public int fixerDateLimite(List<UUID> stageIds, LocalDate dateLimite, UtilisateurPrincipal principal) {
        List<Stage> stages = stageRepository.findAllById(stageIds).stream().filter(s -> s.getStatut() == StatutStage.CONFIRME).toList();
        if (stages.size() != stageIds.stream().distinct().count()) {
            throw new ConflitStageException("Une date limite ne se fixe que pour des stages confirmés.");
        }
        for (Stage stage : stages) {
            RapportStage rapport = rapportRepository.findByStage_Id(stage.getId()).orElseGet(() -> new RapportStage(stage));
            if (dateLimite.equals(rapport.getDateLimite())) continue;
            rapport.setDateLimite(dateLimite);
            rapport.setDateLimitePar(principal.getUtilisateur());
            rapportRepository.save(rapport);
            prevenir(stage.getEtudiant(), "Date limite de votre rapport de stage", "Bonjour, déposez votre rapport du stage « " + stage.getSujet()
                + " » au format PDF avant le " + FORMAT_DATE.format(dateLimite) + " inclus, dans Stages › Mes stages.");
        }
        return stages.size();
    }

    @Transactional
    public RapportResponse deposer(UUID stageId, MultipartFile fichier, UtilisateurPrincipal principal) {
        Stage stage = stageRepository.findByIdForUpdate(stageId)
            .filter(s -> s.getStatut() == StatutStage.CONFIRME && s.getEtudiant().getId().equals(principal.getUtilisateur().getId()))
            .orElseThrow(OffreStageIntrouvableException::new);
        RapportStage rapport = rapportRepository.findByStage_Id(stageId).orElse(null);
        if (rapport == null || rapport.getDateLimite() == null) {
            throw new ConflitStageException("L'école n'a pas encore fixé la date limite de dépôt du rapport.");
        }
        if (!rapport.depotOuvert(aujourdhui())) {
            throw new ConflitStageException("La date limite de dépôt est dépassée : le dépôt est fermé.");
        }
        boolean premier = rapport.getFichier() == null;
        String ancien = rapport.getFichier();
        String nom = stockage.getRapports().stocker(fichier);
        ApresTransaction.siAnnulee(() -> stockage.getRapports().supprimer(nom));
        if (ancien != null) ApresTransaction.siValidee(() -> stockage.getRapports().supprimer(ancien));
        rapport.setFichier(nom);
        rapport.setNomOriginal(FichiersOffreService.nomAffiche(fichier.getOriginalFilename()));
        rapport.setDeposeLe(Instant.now());
        Utilisateur encadrant = stage.getEncadrantInterne();
        if (premier && encadrant != null) {
            prevenir(encadrant, "Rapport de stage déposé", "Bonjour, " + stage.getEtudiant().getPrenom() + " " + stage.getEtudiant().getNom()
                + " a déposé son rapport du stage « " + stage.getSujet() + " ». Retrouvez-le dans Stages › Suivi des stages.");
        }
        return versReponse(rapportRepository.saveAndFlush(rapport));
    }

    @Transactional(readOnly = true)
    public FichiersOffreService.Telechargement fichier(UUID stageId, UtilisateurPrincipal principal, boolean ecole) {
        Stage stage = stageRepository.findById(stageId).filter(s -> s.getStatut() == StatutStage.CONFIRME)
            .orElseThrow(OffreStageIntrouvableException::new);
        if (!ecole && !acces.peutLireDocuments(stage, principal.getUtilisateur())) throw new OffreStageIntrouvableException();
        RapportStage rapport = rapportRepository.findByStage_Id(stageId).filter(r -> r.getFichier() != null)
            .orElseThrow(FichierIntrouvableException::new);
        return new FichiersOffreService.Telechargement(rapport.getNomOriginal(), stockage.getRapports().lire(rapport.getFichier()));
    }

    public static RapportResponse versReponse(RapportStage r) {
        LocalDate aujourdhui = aujourdhui();
        if (r == null || r.getDateLimite() == null && r.getFichier() == null) {
            return new RapportResponse(null, null, null, "SANS_DATE", false);
        }
        String etat = r.getFichier() != null ? "DEPOSE" : r.depotOuvert(aujourdhui) ? "ATTENDU" : "EN_RETARD";
        return new RapportResponse(r.getDateLimite(), r.getFichier() == null ? null : r.getNomOriginal(), r.getDeposeLe(), etat,
            r.depotOuvert(aujourdhui));
    }

    private void prevenir(Utilisateur destinataire, String sujet, String message) {
        if (destinataire.getEmail() != null) evenements.publishEvent(new NotificationCompte(destinataire.getEmail(), sujet, message));
    }

    private static LocalDate aujourdhui() {
        return LocalDate.now(OffresStageService.FUSEAU);
    }
}
