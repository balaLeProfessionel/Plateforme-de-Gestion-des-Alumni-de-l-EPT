package ept.edu.sn.alumni_backend.stage.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.common.stockage.ApresTransaction;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.AvisOrganisme;
import ept.edu.sn.alumni_backend.stage.StatutCandidature;
import ept.edu.sn.alumni_backend.stage.StatutOffre;
import ept.edu.sn.alumni_backend.stage.dto.CandidatureRecueResponse;
import ept.edu.sn.alumni_backend.stage.dto.MaCandidatureResponse;
import ept.edu.sn.alumni_backend.stage.entity.Candidature;
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
 * Candidatures aux offres de stage (STA-03) et avis de l'organisme (STA-09).
 * - Un étudiant actif postule à une offre publiée, avant sa date limite, avec un CV PDF ; une seule candidature par
 *   offre. Il peut la retirer, puis la renvoyer avant la date limite (même ligne).
 * - L'organisme voit les candidatures envoyées à ses offres et donne un avis, jamais montré à l'étudiant.
 * - L'administrateur Stages voit toutes les candidatures, retirées comprises, et l'avis de l'organisme.
 * - Une fois la liste définitive publiée (STA-04), l'étudiant voit « retenue » ou « non retenue » et ne retire plus.
 */
@Service
@RequiredArgsConstructor
public class CandidaturesService {
    private final CandidatureRepository candidatureRepository;
    private final OffreStageRepository offreRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final OffresStageService offresService;
    private final StockageFichiersCandidature stockage;
    private final StageRepository stageRepository;

    @Transactional(readOnly = true)
    public Optional<MaCandidatureResponse> maCandidature(UUID offreId, UtilisateurPrincipal principal) {
        UUID etudiantId = principal.getUtilisateur().getId();
        Set<UUID> confirmees = Set.copyOf(stageRepository.offresConfirmees(etudiantId));
        return candidatureRepository.findByOffre_IdAndEtudiant_Id(offreId, etudiantId).map(c -> versMaCandidature(c, confirmees));
    }

    @Transactional(readOnly = true)
    public List<MaCandidatureResponse> mesCandidatures(UtilisateurPrincipal principal) {
        UUID etudiantId = principal.getUtilisateur().getId();
        Set<UUID> confirmees = Set.copyOf(stageRepository.offresConfirmees(etudiantId));
        return candidatureRepository.findByEtudiant_IdOrderByEnvoyeeLeDesc(etudiantId).stream()
            .map(c -> versMaCandidature(c, confirmees)).toList();
    }

    @Transactional
    public MaCandidatureResponse postuler(UUID offreId, MultipartFile cv, String lettre, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        if (auteur.getRole() != TypeRole.ETUDIANT || auteur.getStatutCompte() != StatutCompte.ACTIF) {
            throw new SecurityException("Seuls les étudiants de l'EPT peuvent postuler à une offre de stage.");
        }
        String lettrePropre = lettre == null || lettre.isBlank() ? null : lettre.strip();
        if (lettrePropre != null && lettrePropre.length() > Candidature.LONGUEUR_LETTRE) {
            throw new IllegalArgumentException("La lettre de motivation ne doit pas dépasser " + Candidature.LONGUEUR_LETTRE + " caractères.");
        }
        // L'offre est verrouillée : deux envois simultanés du même étudiant ne créent pas deux candidatures.
        OffreStage offre = offreRepository.findByIdForUpdate(offreId).orElseThrow(OffreStageIntrouvableException::new);
        offresService.chargerVisible(offreId, auteur);
        if (!offre.candidaturesOuvertes(aujourdhui())) {
            throw new ConflitStageException("La date limite de candidature est passée.");
        }
        EligibiliteStage.verifier(utilisateurRepository.findById(auteur.getId()).orElseThrow(), offre.getTypeStage(), true);
        Candidature candidature = candidatureRepository.findByOffre_IdAndEtudiant_Id(offreId, auteur.getId())
            .orElseGet(() -> new Candidature(offre, utilisateurRepository.getReferenceById(auteur.getId())));
        if (candidature.getStatut() == StatutCandidature.ENVOYEE) {
            throw new ConflitStageException("Vous avez déjà postulé à cette offre.");
        }
        boolean nouveauCv = cv != null && !cv.isEmpty();
        if (!nouveauCv && candidature.getCv() == null) {
            throw new IllegalArgumentException("Joignez votre CV en PDF.");
        }
        if (nouveauCv) {
            String ancien = candidature.getCv();
            String nom = stockage.getCv().stocker(cv);
            ApresTransaction.siAnnulee(() -> stockage.getCv().supprimer(nom));
            if (ancien != null) ApresTransaction.siValidee(() -> stockage.getCv().supprimer(ancien));
            candidature.setCv(nom);
            candidature.setNomCv(FichiersOffreService.nomAffiche(cv.getOriginalFilename()));
        }
        candidature.envoyer(lettrePropre);
        return versMaCandidature(candidatureRepository.save(candidature), Set.of());
    }

    @Transactional
    public MaCandidatureResponse retirer(UUID offreId, UtilisateurPrincipal principal) {
        Candidature candidature = candidatureRepository.findByOffre_IdAndEtudiant_Id(offreId, principal.getUtilisateur().getId())
            .orElseThrow(OffreStageIntrouvableException::new);
        if (candidature.getStatut() != StatutCandidature.ENVOYEE) {
            throw new ConflitStageException("Cette candidature est déjà retirée.");
        }
        if (candidature.getOffre().getStatut() == StatutOffre.LISTE_PUBLIEE) {
            throw new ConflitStageException("La liste définitive de cette offre est publiée : la candidature ne peut plus être retirée.");
        }
        candidature.retirer();
        return versMaCandidature(candidature, Set.of());
    }

    /** Candidatures reçues par une offre : son organisme (envoyées seulement) ou l'administrateur Stages (toutes). */
    @Transactional(readOnly = true)
    public List<CandidatureRecueResponse> recues(UUID offreId, UtilisateurPrincipal principal) {
        Utilisateur lecteur = principal.getUtilisateur();
        OffreStage offre = offreRepository.findWithOrganismeById(offreId).orElseThrow(OffreStageIntrouvableException::new);
        if (!OffresStageService.peutGerer(offre, lecteur)) {
            throw new OffreStageIntrouvableException();
        }
        boolean ecole = estAdministrateurStages(lecteur);
        List<Candidature> candidatures = ecole
            ? candidatureRepository.findByOffre_IdOrderByEnvoyeeLeAsc(offreId)
            : candidatureRepository.findByOffre_IdAndStatutOrderByEnvoyeeLeAsc(offreId, StatutCandidature.ENVOYEE);
        return candidatures.stream().map(c -> versRecue(c, ecole)).toList();
    }

    /** Avis de l'organisme : seulement sur une candidature envoyée à l'une de ses offres. */
    @Transactional
    public CandidatureRecueResponse donnerAvis(UUID candidatureId, AvisOrganisme avis, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        Candidature candidature = candidatureRepository.findByIdForUpdate(candidatureId).orElseThrow(OffreStageIntrouvableException::new);
        if (!estOrganismeDe(candidature.getOffre(), auteur) || candidature.getStatut() != StatutCandidature.ENVOYEE) {
            throw new OffreStageIntrouvableException();
        }
        if (candidature.getOffre().getStatut() != StatutOffre.PUBLIEE) {
            throw new ConflitStageException("Cette offre n'est plus publiée : les avis sont figés.");
        }
        candidature.setAvisOrganisme(avis);
        candidature.setAvisDonneLe(avis == AvisOrganisme.EN_ATTENTE ? null : java.time.Instant.now());
        return versRecue(candidature, false);
    }

    /** CV d'une candidature : son étudiant, l'organisme de l'offre tant qu'elle est envoyée, l'administrateur Stages. */
    @Transactional(readOnly = true)
    public FichiersOffreService.Telechargement cv(UUID candidatureId, UtilisateurPrincipal principal) {
        Utilisateur lecteur = principal.getUtilisateur();
        Candidature candidature = candidatureRepository.findWithOffreById(candidatureId).orElseThrow(OffreStageIntrouvableException::new);
        boolean autorise = candidature.getEtudiant().getId().equals(lecteur.getId())
            || estAdministrateurStages(lecteur)
            || (estOrganismeDe(candidature.getOffre(), lecteur) && candidature.getStatut() == StatutCandidature.ENVOYEE);
        if (!autorise) {
            throw new OffreStageIntrouvableException();
        }
        return new FichiersOffreService.Telechargement(candidature.getNomCv(), stockage.getCv().lire(candidature.getCv()));
    }

    private static boolean estAdministrateurStages(Utilisateur utilisateur) {
        return PermissionAdmin.accordee(utilisateur, PermissionAdmin.GERER_STAGES);
    }

    private static boolean estOrganismeDe(OffreStage offre, Utilisateur utilisateur) {
        return utilisateur.getRole() == TypeRole.ORGANISME && utilisateur.getOrganisme() != null
            && utilisateur.getOrganisme().getId().equals(offre.getOrganisme().getId());
    }

    private MaCandidatureResponse versMaCandidature(Candidature c, Set<UUID> offresConfirmees) {
        OffreStage offre = c.getOffre();
        String resultat = ListeDefinitiveService.resultat(offre, offresConfirmees.contains(offre.getId()),
            c.getStatut() == StatutCandidature.ENVOYEE).orElse(null);
        return new MaCandidatureResponse(c.getId(), offre.getId(), offre.getTitre(), offre.getOrganisme().getNom(),
            offre.getDateLimiteCandidature(), offre.candidaturesOuvertes(aujourdhui()), c.getStatut().name(),
            c.getLettreMotivation(), c.getNomCv(), c.getEnvoyeeLe(), c.getRetireeLe(), resultat);
    }

    private static CandidatureRecueResponse versRecue(Candidature c, boolean ecole) {
        Utilisateur e = c.getEtudiant();
        return new CandidatureRecueResponse(c.getId(),
            new CandidatureRecueResponse.Etudiant(e.getId(), e.getPrenom(), e.getNom(), e.getNomFiliere(),
                e.getClasse() == null ? null : e.getClasse().name(), e.getAnneeEntree(), e.getUrlPhoto()),
            ecole ? e.getEmail() : null, c.getStatut().name(), c.getAvisOrganisme().name(), c.getLettreMotivation(), c.getNomCv(),
            c.getEnvoyeeLe(), c.getAvisDonneLe());
    }

    private static LocalDate aujourdhui() {
        return LocalDate.now(OffresStageService.FUSEAU);
    }
}
