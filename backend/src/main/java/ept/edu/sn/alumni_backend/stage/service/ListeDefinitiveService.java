package ept.edu.sn.alumni_backend.stage.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.enums.Classe;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.StatutOffre;
import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.dto.CandidatureRecueResponse;
import ept.edu.sn.alumni_backend.stage.dto.EtudiantSuggestionResponse;
import ept.edu.sn.alumni_backend.stage.dto.LigneListeResponse;
import ept.edu.sn.alumni_backend.stage.dto.ListeDefinitiveResponse;
import ept.edu.sn.alumni_backend.stage.dto.MonStageResponse;
import ept.edu.sn.alumni_backend.stage.dto.StagiaireResponse;
import ept.edu.sn.alumni_backend.stage.entity.Candidature;
import ept.edu.sn.alumni_backend.stage.entity.OffreStage;
import ept.edu.sn.alumni_backend.stage.entity.Stage;
import ept.edu.sn.alumni_backend.stage.exception.ConflitStageException;
import ept.edu.sn.alumni_backend.stage.exception.OffreStageIntrouvableException;
import ept.edu.sn.alumni_backend.stage.repository.CandidatureRepository;
import ept.edu.sn.alumni_backend.stage.repository.OffreStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.StageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Liste définitive d'une offre (STA-04), arrêtée par l'administrateur Stages.
 * - Elle peut contenir n'importe quel étudiant actif, qu'il ait postulé ou non, quel que soit l'avis de l'organisme.
 * - En brouillon, elle est invisible pour l'organisme et les étudiants ; une ligne retirée est supprimée.
 * - Sa publication confirme chaque ligne, clôt les candidatures et prévient par e-mail l'organisme et les étudiants.
 * - Après publication, un ajout est confirmé aussitôt et un retrait annule le stage avec un motif ; les deux sont notifiés.
 * - Un étudiant n'a jamais deux stages confirmés aux dates qui se chevauchent.
 */
@Service
@RequiredArgsConstructor
public class ListeDefinitiveService {
    private static final DateTimeFormatter FORMAT_DATE = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.FRENCH);

    private final StageRepository stageRepository;
    private final OffreStageRepository offreRepository;
    private final CandidatureRepository candidatureRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ApplicationEventPublisher evenements;

    @Transactional(readOnly = true)
    public ListeDefinitiveResponse liste(UUID offreId) {
        OffreStage offre = offreRepository.findWithOrganismeById(offreId).orElseThrow(OffreStageIntrouvableException::new);
        return versListe(offre);
    }

    @Transactional
    public ListeDefinitiveResponse ajouter(UUID offreId, UUID etudiantId, LocalDate debut, LocalDate fin, UtilisateurPrincipal principal) {
        OffreStage offre = verrouillerModifiable(offreId);
        Utilisateur etudiant = utilisateurRepository.findByIdForUpdate(etudiantId)
            .filter(u -> u.getRole() == TypeRole.ETUDIANT && u.getStatutCompte() == StatutCompte.ACTIF)
            .orElseThrow(() -> new IllegalArgumentException("Seul un étudiant au compte actif peut figurer sur la liste."));
        Stage stage = stageRepository.findByOffre_IdAndEtudiant_Id(offreId, etudiantId).orElseGet(Stage::new);
        if (stage.getStatut() == StatutStage.EN_PREPARATION || stage.getStatut() == StatutStage.CONFIRME) {
            throw new ConflitStageException(etudiant.getPrenom() + " " + etudiant.getNom() + " figure déjà sur la liste.");
        }
        LocalDate dateDebut = debut != null ? debut : offre.getDateDebutPrevue();
        LocalDate dateFin = fin != null ? fin : finParDefaut(offre, dateDebut);
        verifierDates(dateDebut, dateFin);
        stage.setEtudiant(etudiant);
        stage.setOrganisme(offre.getOrganisme());
        stage.setOffre(offre);
        stage.setCandidature(candidatureRepository.findByOffre_IdAndEtudiant_Id(offreId, etudiantId).orElse(null));
        stage.setTypeStage(offre.getTypeStage());
        stage.setSujet(offre.getTitre());
        stage.setLieu(offre.getLieu());
        stage.setDateDebut(dateDebut);
        stage.setDateFin(dateFin);
        stage.setCreePar(utilisateurRepository.getReferenceById(principal.getUtilisateur().getId()));
        if (offre.getStatut() == StatutOffre.LISTE_PUBLIEE) {
            confirmerApresPublication(stage, etudiant);
            prevenirEtudiant(stage, "Votre stage est confirmé", messageConfirmation(stage));
            prevenirOrganisme(offre, "Un stagiaire ajouté à la liste de votre offre",
                etudiant.getPrenom() + " " + etudiant.getNom() + " a été ajouté par l'école à la liste définitive de votre offre « "
                    + offre.getTitre() + " », " + periode(stage) + ".");
        } else {
            stage.setStatut(StatutStage.EN_PREPARATION);
        }
        stageRepository.save(stage);
        return versListe(offre);
    }

    @Transactional
    public ListeDefinitiveResponse modifierDates(UUID ligneId, LocalDate debut, LocalDate fin) {
        Stage stage = chargerLigne(ligneId);
        OffreStage offre = verrouillerModifiable(stage.getOffre().getId());
        if (stage.getStatut() == StatutStage.ANNULE) {
            throw new ConflitStageException("Ce stage est annulé : ses dates ne se modifient plus.");
        }
        verifierDates(debut, fin);
        stage.setDateDebut(debut);
        stage.setDateFin(fin);
        if (stage.getStatut() == StatutStage.CONFIRME) {
            utilisateurRepository.findByIdForUpdate(stage.getEtudiant().getId());
            verifierChevauchement(stage, stage.getEtudiant());
            prevenirEtudiant(stage, "Les dates de votre stage ont changé", "Bonjour, les dates de votre stage « " + stage.getSujet()
                + " » chez " + offre.getOrganisme().getNom() + " sont désormais : " + periode(stage) + ".");
        }
        return versListe(offre);
    }

    /** En brouillon, la ligne est supprimée ; après publication, le stage est annulé avec un motif. */
    @Transactional
    public ListeDefinitiveResponse retirer(UUID ligneId, String motif) {
        Stage stage = chargerLigne(ligneId);
        OffreStage offre = verrouillerModifiable(stage.getOffre().getId());
        switch (stage.getStatut()) {
            case EN_PREPARATION -> stageRepository.delete(stage);
            case CONFIRME -> {
                if (motif == null || motif.isBlank()) {
                    throw new IllegalArgumentException("Indiquez le motif de l'annulation : l'étudiant et l'organisme le recevront.");
                }
                stage.annuler(motif.strip());
                Utilisateur etudiant = stage.getEtudiant();
                prevenirEtudiant(stage, "Votre stage est annulé", "Bonjour, l'école a annulé votre stage « " + stage.getSujet()
                    + " » chez " + offre.getOrganisme().getNom() + ". Motif : " + stage.getMotif());
                prevenirOrganisme(offre, "Un stagiaire retiré de la liste de votre offre",
                    "le stage de " + etudiant.getPrenom() + " " + etudiant.getNom() + " pour votre offre « " + offre.getTitre()
                        + " » a été annulé par l'école. Motif : " + stage.getMotif());
            }
            case ANNULE -> throw new ConflitStageException("Ce stage est déjà annulé.");
        }
        return versListe(offre);
    }

    @Transactional
    public ListeDefinitiveResponse publier(UUID offreId) {
        OffreStage offre = offreRepository.findByIdForUpdate(offreId).orElseThrow(OffreStageIntrouvableException::new);
        if (offre.getStatut() != StatutOffre.PUBLIEE) {
            throw new ConflitStageException(offre.getStatut() == StatutOffre.LISTE_PUBLIEE
                ? "La liste de cette offre est déjà publiée." : "Seule la liste d'une offre publiée peut être publiée.");
        }
        List<Stage> lignes = stageRepository.findByOffre_IdAndStatutOrderByCreeLeAsc(offreId, StatutStage.EN_PREPARATION);
        List<String> sansDates = lignes.stream().filter(s -> !s.datesRenseignees()).map(s -> nomComplet(s.getEtudiant())).toList();
        if (!sansDates.isEmpty()) {
            throw new IllegalArgumentException("Renseignez les dates de stage de : " + String.join(", ", sansDates) + ".");
        }
        // Étudiants verrouillés dans un ordre fixe : deux publications simultanées ne confirment pas deux stages qui se chevauchent.
        lignes.stream().map(s -> s.getEtudiant().getId()).sorted().forEach(utilisateurRepository::findByIdForUpdate);
        for (Stage stage : lignes) {
            verifierChevauchement(stage, stage.getEtudiant());
        }
        lignes.forEach(Stage::confirmer);
        offre.publierListe();
        for (Stage stage : lignes) {
            prevenirEtudiant(stage, "Votre stage est confirmé", messageConfirmation(stage));
        }
        String noms = lignes.isEmpty() ? "aucun étudiant n'a été retenu." : lignes.stream()
            .map(s -> "- " + nomComplet(s.getEtudiant()) + " (" + periode(s) + ")").reduce("", (a, b) -> a + "\n" + b);
        prevenirOrganisme(offre, "Liste définitive de votre offre de stage",
            "l'école a arrêté la liste définitive de votre offre « " + offre.getTitre() + " » : " + noms);
        return versListe(offre);
    }

    /**
     * Étudiants actifs filtrés par nom (2 caractères au moins), classe et filière, combinables. Sans aucun critère,
     * la liste est vide : on ne parcourt pas toute l'école. 30 résultats au plus, par nom.
     */
    @Transactional(readOnly = true)
    public List<EtudiantSuggestionResponse> suggererEtudiants(String texte, Classe classe, UUID filiereId) {
        String recherche = texte == null ? "" : texte.strip().toLowerCase(Locale.ROOT);
        if (recherche.length() < 2 && classe == null && filiereId == null) return List.of();
        Specification<Utilisateur> criteres = (racine, requete, cb) -> cb.and(
            cb.equal(racine.get("role"), TypeRole.ETUDIANT),
            cb.equal(racine.get("statutCompte"), StatutCompte.ACTIF));
        if (recherche.length() >= 2) {
            String motif = "%" + recherche.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            criteres = criteres.and((racine, requete, cb) -> cb.or(
                cb.like(cb.lower(cb.concat(cb.concat(racine.get("prenom"), " "), racine.get("nom"))), motif, '\\'),
                cb.like(cb.lower(cb.concat(cb.concat(racine.get("nom"), " "), racine.get("prenom"))), motif, '\\')));
        }
        if (classe != null) {
            criteres = criteres.and((racine, requete, cb) -> cb.equal(racine.get("classe"), classe));
        }
        if (filiereId != null) {
            criteres = criteres.and((racine, requete, cb) -> cb.equal(racine.get("filiere").get("id"), filiereId));
        }
        return utilisateurRepository.findAll(criteres, PageRequest.of(0, 30, Sort.by("nom", "prenom"))).stream()
            .map(u -> new EtudiantSuggestionResponse(u.getId(), u.getPrenom(), u.getNom(), u.getNomFiliere(),
                u.getClasse() == null ? null : u.getClasse().name(), u.getAnneeEntree(), u.getUrlPhoto()))
            .toList();
    }

    /** Stagiaires confirmés d'une offre : son organisme une fois la liste publiée, ou l'administrateur Stages. */
    @Transactional(readOnly = true)
    public List<StagiaireResponse> stagiaires(UUID offreId, UtilisateurPrincipal principal) {
        Utilisateur lecteur = principal.getUtilisateur();
        OffreStage offre = offreRepository.findWithOrganismeById(offreId).orElseThrow(OffreStageIntrouvableException::new);
        if (!OffresStageService.peutGerer(offre, lecteur)) {
            throw new OffreStageIntrouvableException();
        }
        if (offre.getStatut() != StatutOffre.LISTE_PUBLIEE && !PermissionAdmin.accordee(lecteur, PermissionAdmin.GERER_STAGES)) {
            return List.of();
        }
        return stageRepository.findByOffre_IdAndStatutOrderByCreeLeAsc(offreId, StatutStage.CONFIRME).stream()
            .map(s -> new StagiaireResponse(s.getId(), etudiant(s.getEtudiant()), s.getDateDebut(), s.getDateFin())).toList();
    }

    /** Stages confirmés de l'étudiant, et ses déclarations en attente ou refusées (STA-10). */
    @Transactional(readOnly = true)
    public List<MonStageResponse> mesStages(UtilisateurPrincipal principal) {
        return stageRepository.findByEtudiant_IdAndStatutInOrderByDateDebutDesc(principal.getUtilisateur().getId(),
                List.of(StatutStage.CONFIRME, StatutStage.DECLARE, StatutStage.REFUSE)).stream()
            .map(s -> new MonStageResponse(s.getId(), s.getOffre() == null ? null : s.getOffre().getId(), s.getSujet(),
                s.nomOrganisme(), s.getTypeStage().name(), s.getLieu(), s.getDateDebut(), s.getDateFin(), s.getConfirmeLe(),
                s.getStatut().name(), s.getStatut() == StatutStage.REFUSE ? s.getMotif() : null, s.getOffre() == null))
            .toList();
    }

    private OffreStage verrouillerModifiable(UUID offreId) {
        OffreStage offre = offreRepository.findByIdForUpdate(offreId).orElseThrow(OffreStageIntrouvableException::new);
        if (offre.getStatut() != StatutOffre.PUBLIEE && offre.getStatut() != StatutOffre.LISTE_PUBLIEE) {
            throw new ConflitStageException("La liste ne se prépare que pour une offre publiée.");
        }
        return offre;
    }

    private Stage chargerLigne(UUID ligneId) {
        Stage stage = stageRepository.findWithOffreById(ligneId).orElseThrow(OffreStageIntrouvableException::new);
        if (stage.getOffre() == null) throw new OffreStageIntrouvableException();
        return stage;
    }

    private void confirmerApresPublication(Stage stage, Utilisateur etudiant) {
        if (!stage.datesRenseignees()) {
            throw new IllegalArgumentException("Renseignez les dates du stage : la liste est publiée, l'ajout est confirmé aussitôt.");
        }
        verifierChevauchement(stage, etudiant);
        stage.confirmer();
    }

    /** 409 si l'étudiant a déjà un stage confirmé aux dates qui touchent celles de ce stage. */
    void verifierChevauchement(Stage stage, Utilisateur etudiant) {
        UUID exclu = stage.getId() == null ? new UUID(0, 0) : stage.getId();
        stageRepository.chevauchements(etudiant.getId(), exclu, stage.getDateDebut(), stage.getDateFin()).stream().findFirst()
            .ifPresent(autre -> {
                throw new ConflitStageException(nomComplet(etudiant) + " a déjà un stage confirmé chez " + autre.getOrganisme().getNom()
                    + " " + periode(autre) + " : les dates se chevauchent.");
            });
    }

    private static void verifierDates(LocalDate debut, LocalDate fin) {
        if ((debut == null) != (fin == null)) {
            throw new IllegalArgumentException("Renseignez les deux dates du stage, ou aucune.");
        }
        if (debut != null && fin.isBefore(debut)) {
            throw new IllegalArgumentException("La fin du stage ne peut pas précéder son début.");
        }
    }

    private static LocalDate finParDefaut(OffreStage offre, LocalDate debut) {
        return debut == null ? null : debut.plusMonths(offre.getDureeMois()).minusDays(1);
    }

    private ListeDefinitiveResponse versListe(OffreStage offre) {
        List<LigneListeResponse> lignes = stageRepository.findByOffre_IdOrderByCreeLeAsc(offre.getId()).stream()
            .sorted(Comparator.comparing((Stage s) -> s.getStatut() == StatutStage.ANNULE)
                .thenComparing(s -> s.getEtudiant().getNom(), String.CASE_INSENSITIVE_ORDER))
            .map(ListeDefinitiveService::versLigne).toList();
        LocalDate debut = offre.getDateDebutPrevue();
        return new ListeDefinitiveResponse(offre.getId(), offre.getTitre(), offre.getOrganisme().getNom(), offre.getStatut().name(),
            offre.getDateLimiteCandidature(), offre.getNombrePlaces(), offre.getListePublieeLe(), debut, finParDefaut(offre, debut), lignes);
    }

    private static LigneListeResponse versLigne(Stage s) {
        Candidature c = s.getCandidature();
        return new LigneListeResponse(s.getId(), etudiant(s.getEtudiant()), s.getEtudiant().getEmail(),
            c == null ? null : c.getId(), c == null ? null : c.getAvisOrganisme().name(), s.getStatut().name(),
            s.getDateDebut(), s.getDateFin(), s.getMotif(), s.getConfirmeLe(), s.getAnnuleLe());
    }

    static CandidatureRecueResponse.Etudiant etudiant(Utilisateur e) {
        return new CandidatureRecueResponse.Etudiant(e.getId(), e.getPrenom(), e.getNom(), e.getNomFiliere(),
                e.getClasse() == null ? null : e.getClasse().name(), e.getAnneeEntree(), e.getUrlPhoto());
    }

    private void prevenirEtudiant(Stage stage, String sujet, String message) {
        String email = stage.getEtudiant().getEmail();
        if (email != null) evenements.publishEvent(new NotificationCompte(email, sujet, message));
    }

    /** Un organisme sans compte n'est pas prévenu : l'école le contacte elle-même. */
    private void prevenirOrganisme(OffreStage offre, String sujet, String message) {
        Utilisateur contact = offre.getOrganisme().getContact();
        if (contact != null && contact.getEmail() != null) {
            evenements.publishEvent(new NotificationCompte(contact.getEmail(), sujet, "Bonjour, " + message));
        }
    }

    private static String messageConfirmation(Stage stage) {
        return "Bonjour, vous figurez sur la liste définitive arrêtée par l'école pour le stage « " + stage.getSujet() + " » chez "
            + stage.getOrganisme().getNom() + ", " + periode(stage) + ". Retrouvez-le dans Stages › Mes stages.";
    }

    static String periode(Stage stage) {
        return "du " + FORMAT_DATE.format(stage.getDateDebut()) + " au " + FORMAT_DATE.format(stage.getDateFin());
    }

    private static String nomComplet(Utilisateur u) {
        return u.getPrenom() + " " + u.getNom();
    }

    static Optional<String> resultat(OffreStage offre, boolean confirme, boolean envoyee) {
        if (confirme) return Optional.of("RETENUE");
        if (offre.getStatut() == StatutOffre.LISTE_PUBLIEE && envoyee) return Optional.of("NON_RETENUE");
        return Optional.empty();
    }
}
