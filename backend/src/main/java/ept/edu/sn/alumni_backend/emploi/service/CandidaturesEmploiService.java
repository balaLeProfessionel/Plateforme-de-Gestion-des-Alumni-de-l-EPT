package ept.edu.sn.alumni_backend.emploi.service;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.common.stockage.ApresTransaction;
import ept.edu.sn.alumni_backend.common.stockage.StockageDocuments;
import ept.edu.sn.alumni_backend.emploi.ModeOffreEmploi;
import ept.edu.sn.alumni_backend.emploi.StatutCandidatureEmploi;
import ept.edu.sn.alumni_backend.emploi.StatutOffreEmploi;
import ept.edu.sn.alumni_backend.emploi.TypeQuestionOffre;
import ept.edu.sn.alumni_backend.emploi.dto.DernierCvResponse;
import ept.edu.sn.alumni_backend.emploi.dto.MaCandidatureEmploiResponse;
import ept.edu.sn.alumni_backend.emploi.dto.ReponseQuestionRequest;
import ept.edu.sn.alumni_backend.emploi.entity.CandidatureEmploi;
import ept.edu.sn.alumni_backend.emploi.entity.OffreEmploi;
import ept.edu.sn.alumni_backend.emploi.entity.QuestionOffreEmploi;
import ept.edu.sn.alumni_backend.emploi.entity.ReponseCandidatureEmploi;
import ept.edu.sn.alumni_backend.emploi.exception.ConflitOffreEmploiException;
import ept.edu.sn.alumni_backend.emploi.exception.OffreEmploiIntrouvableException;
import ept.edu.sn.alumni_backend.emploi.repository.CandidatureEmploiRepository;
import ept.edu.sn.alumni_backend.emploi.repository.OffreEmploiRepository;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.entity.Candidature;
import ept.edu.sn.alumni_backend.stage.repository.CandidatureRepository;
import ept.edu.sn.alumni_backend.stage.service.StockageFichiersCandidature;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Candidatures aux offres gérées (#222).
 * - Un étudiant ou un alumni actif postule à une offre gérée publiée et non expirée : CV en PDF (nouveau, ou repris de
 *   sa dernière candidature), lettre si l'offre l'exige, réponses aux questions obligatoires.
 * - Une seule candidature par offre ; retirée, elle peut être renvoyée tant que l'offre est ouverte.
 * - Le candidat la retire tant qu'elle n'est pas traitée (RECUE).
 * - Le CV n'est lisible que du candidat, des comptes de l'organisme de l'offre et de l'administration des offres ;
 *   pour tout autre, il n'existe pas (404).
 */
@Service
@RequiredArgsConstructor
public class CandidaturesEmploiService {
    private static final Set<TypeRole> ROLES_CANDIDATS = EnumSet.of(TypeRole.ETUDIANT, TypeRole.ALUMNI);

    private final CandidatureEmploiRepository candidatureRepository;
    private final OffreEmploiRepository offreRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final OffresEmploiService offresService;
    private final StockageFichiersCandidature stockageCandidatures;
    private final CandidatureRepository candidaturesStageRepository;

    @Transactional(readOnly = true)
    public Optional<MaCandidatureEmploiResponse> maCandidature(UUID offreId, UtilisateurPrincipal principal) {
        return candidatureRepository.findByOffreIdAndCandidatId(offreId, principal.getUtilisateur().getId()).map(this::versReponse);
    }

    @Transactional(readOnly = true)
    public List<MaCandidatureEmploiResponse> mesCandidatures(UtilisateurPrincipal principal) {
        return candidatureRepository.findByCandidatIdOrderByEnvoyeeLeDesc(principal.getUtilisateur().getId()).stream()
            .map(this::versReponse).toList();
    }

    /** CV de la dernière candidature du membre, d'emploi ou de stage, qu'il peut reprendre sans le renvoyer. */
    @Transactional(readOnly = true)
    public Optional<DernierCvResponse> dernierCv(UtilisateurPrincipal principal) {
        return dernierCvStocke(principal.getUtilisateur().getId()).map(cv -> new DernierCvResponse(cv.nomAffiche(), cv.envoyeLe()));
    }

    @Transactional
    public MaCandidatureEmploiResponse postuler(UUID offreId, MultipartFile cv, boolean reprendreDernierCv, String lettre,
            List<ReponseQuestionRequest> reponses, UtilisateurPrincipal principal) {
        Utilisateur candidat = utilisateurRepository.findById(principal.getUtilisateur().getId())
            .orElseThrow(() -> new SecurityException("Compte introuvable."));
        if (!ROLES_CANDIDATS.contains(candidat.getRole()) || candidat.getStatutCompte() != StatutCompte.ACTIF) {
            throw new SecurityException("Seuls les étudiants et les alumni de l'EPT postulent à une offre d'emploi.");
        }
        // L'offre est verrouillée : deux envois simultanés du même candidat ne créent pas deux candidatures.
        OffreEmploi offre = offreRepository.findByIdForUpdate(offreId).orElseThrow(OffreEmploiIntrouvableException::new);
        offresService.chargerVisible(offreId, candidat);
        if (offre.getMode() != ModeOffreEmploi.GEREE) {
            throw new ConflitOffreEmploiException("Pour cette offre, postulez sur l'annonce d'origine.");
        }
        if (offre.getStatut() != StatutOffreEmploi.PUBLIEE) {
            throw new ConflitOffreEmploiException("Cette offre n'accepte pas de candidature.");
        }
        if (offre.estExpiree(OffresEmploiService.aujourdhui())) {
            throw new ConflitOffreEmploiException("La date d'expiration de cette offre est passée.");
        }
        String lettrePropre = lettre == null || lettre.isBlank() ? null : lettre.strip();
        if (lettrePropre == null && offre.isLettreExigee()) {
            throw new IllegalArgumentException("Cette offre exige une lettre de motivation.");
        }
        if (lettrePropre != null && lettrePropre.length() > CandidatureEmploi.LONGUEUR_LETTRE) {
            throw new IllegalArgumentException("La lettre de motivation ne doit pas dépasser " + CandidatureEmploi.LONGUEUR_LETTRE + " caractères.");
        }
        CandidatureEmploi candidature = candidatureRepository.findByOffreIdAndCandidatId(offreId, candidat.getId())
            .orElseGet(() -> new CandidatureEmploi(offre, candidat));
        if (candidature.getStatut() != null && candidature.getStatut() != StatutCandidatureEmploi.RETIREE) {
            throw new ConflitOffreEmploiException("Vous avez déjà postulé à cette offre.");
        }
        List<ReponseCandidatureEmploi> nouvellesReponses = verifierReponses(offre, candidature, reponses);
        joindreCv(candidature, cv, reprendreDernierCv, candidat.getId());
        candidature.remplacerReponses(nouvellesReponses);
        candidature.envoyer(lettrePropre);
        return versReponse(candidatureRepository.save(candidature));
    }

    @Transactional
    public MaCandidatureEmploiResponse retirer(UUID offreId, UtilisateurPrincipal principal) {
        CandidatureEmploi candidature = candidatureRepository.findByOffreIdAndCandidatId(offreId, principal.getUtilisateur().getId())
            .orElseThrow(OffreEmploiIntrouvableException::new);
        if (candidature.getStatut() == StatutCandidatureEmploi.RETIREE) {
            throw new ConflitOffreEmploiException("Cette candidature est déjà retirée.");
        }
        if (candidature.getStatut() != StatutCandidatureEmploi.RECUE) {
            throw new ConflitOffreEmploiException("Le recruteur a déjà traité cette candidature : elle ne peut plus être retirée.");
        }
        candidature.retirer();
        return versReponse(candidature);
    }

    /** CV d'une candidature : son candidat, l'organisme de l'offre tant qu'elle n'est pas retirée, l'administration. */
    @Transactional(readOnly = true)
    public CvTelechargeable cv(UUID candidatureId, UtilisateurPrincipal principal) {
        Utilisateur lecteur = principal.getUtilisateur();
        CandidatureEmploi candidature = candidatureRepository.findWithOffreById(candidatureId).orElseThrow(OffreEmploiIntrouvableException::new);
        boolean autorise = candidature.getCandidat().getId().equals(lecteur.getId())
            || PermissionAdmin.accordee(lecteur, PermissionAdmin.GERER_OFFRES_EMPLOI)
            || (OffresEmploiService.gere(candidature.getOffre(), lecteur) && candidature.getStatut() != StatutCandidatureEmploi.RETIREE);
        if (!autorise) {
            throw new OffreEmploiIntrouvableException();
        }
        return new CvTelechargeable(candidature.getNomCv(), stockage().lire(candidature.getCv()));
    }

    public record CvTelechargeable(String nomFichier, Resource contenu) {
    }

    /** Une réponse par question : obligatoires remplies, « OUI » ou « NON » pour une question oui/non. */
    private static List<ReponseCandidatureEmploi> verifierReponses(OffreEmploi offre, CandidatureEmploi candidature,
            List<ReponseQuestionRequest> reponses) {
        Map<UUID, String> valeurs = new HashMap<>();
        if (reponses != null) {
            for (ReponseQuestionRequest reponse : reponses) {
                if (reponse == null || reponse.questionId() == null) continue;
                valeurs.put(reponse.questionId(), reponse.valeur() == null ? "" : reponse.valeur().strip());
            }
        }
        Set<UUID> connues = new java.util.HashSet<>();
        offre.getQuestions().forEach(q -> connues.add(q.getId()));
        if (!connues.containsAll(valeurs.keySet())) {
            throw new IllegalArgumentException("Une réponse ne correspond à aucune question de l'offre.");
        }
        List<ReponseCandidatureEmploi> resultat = new ArrayList<>();
        for (QuestionOffreEmploi question : offre.getQuestions()) {
            String valeur = valeurs.getOrDefault(question.getId(), "");
            if (valeur.isEmpty()) {
                if (question.isObligatoire()) {
                    throw new IllegalArgumentException("Répondez à la question : « " + question.getIntitule() + " »");
                }
                continue;
            }
            if (question.getType() == TypeQuestionOffre.OUI_NON && !valeur.equals("OUI") && !valeur.equals("NON")) {
                throw new IllegalArgumentException("Répondez par oui ou par non : « " + question.getIntitule() + " »");
            }
            if (valeur.length() > ReponseCandidatureEmploi.LONGUEUR_REPONSE) {
                throw new IllegalArgumentException("Une réponse ne doit pas dépasser " + ReponseCandidatureEmploi.LONGUEUR_REPONSE + " caractères.");
            }
            resultat.add(new ReponseCandidatureEmploi(candidature, question, valeur));
        }
        return resultat;
    }

    /** Nouveau CV, ou copie du dernier CV envoyé ; au renvoi d'une candidature retirée, l'ancien CV reste valable. */
    private void joindreCv(CandidatureEmploi candidature, MultipartFile cv, boolean reprendreDernierCv, UUID candidatId) {
        String ancien = candidature.getCv();
        String nom;
        String nomAffiche;
        if (cv != null && !cv.isEmpty()) {
            nom = stockage().stocker(cv);
            nomAffiche = nomAffiche(cv.getOriginalFilename());
        } else if (reprendreDernierCv) {
            CvStocke dernier = dernierCvStocke(candidatId)
                .orElseThrow(() -> new IllegalArgumentException("Aucun CV précédent à reprendre : joignez votre CV en PDF."));
            nom = stockage().copier(dernier.nomStocke());
            nomAffiche = dernier.nomAffiche();
        } else if (ancien != null) {
            return;
        } else {
            throw new IllegalArgumentException("Joignez votre CV en PDF.");
        }
        String nomFinal = nom;
        ApresTransaction.siAnnulee(() -> stockage().supprimer(nomFinal));
        if (ancien != null) ApresTransaction.siValidee(() -> stockage().supprimer(ancien));
        candidature.setCv(nom);
        candidature.setNomCv(nomAffiche);
    }

    private record CvStocke(String nomStocke, String nomAffiche, Instant envoyeLe) {
    }

    private Optional<CvStocke> dernierCvStocke(UUID membreId) {
        Optional<CvStocke> emploi = candidatureRepository.findByCandidatIdOrderByEnvoyeeLeDesc(membreId).stream()
            .findFirst().map(c -> new CvStocke(c.getCv(), c.getNomCv(), c.getEnvoyeeLe()));
        Optional<CvStocke> stage = candidaturesStageRepository.findByEtudiant_IdOrderByEnvoyeeLeDesc(membreId).stream()
            .filter(c -> c.getCv() != null && c.getEnvoyeeLe() != null).findFirst()
            .map((Candidature c) -> new CvStocke(c.getCv(), c.getNomCv(), c.getEnvoyeeLe()));
        if (emploi.isEmpty()) return stage;
        if (stage.isEmpty()) return emploi;
        return emploi.get().envoyeLe().isAfter(stage.get().envoyeLe()) ? emploi : stage;
    }

    private StockageDocuments stockage() {
        return stockageCandidatures.getCv();
    }

    /** Nom proposé au téléchargement : sans chemin ni caractère de contrôle, 255 caractères au plus. */
    private static String nomAffiche(String nomOriginal) {
        String nom = nomOriginal == null ? "" : nomOriginal.replaceAll("^.*[\\\\/]", "").replaceAll("\\p{Cntrl}", "").strip();
        if (nom.isEmpty()) nom = "cv.pdf";
        return nom.length() > 255 ? nom.substring(nom.length() - 255) : nom;
    }

    private MaCandidatureEmploiResponse versReponse(CandidatureEmploi c) {
        OffreEmploi offre = c.getOffre();
        List<MaCandidatureEmploiResponse.Reponse> reponses = c.getReponses().stream()
            .map(r -> new MaCandidatureEmploiResponse.Reponse(r.getQuestion().getId(), r.getQuestion().getIntitule(), r.getValeur()))
            .toList();
        return new MaCandidatureEmploiResponse(c.getId(), offre.getId(), offre.getTitre(), offre.entrepriseAffichee(),
            offre.getDateExpiration(), offre.estExpiree(OffresEmploiService.aujourdhui()), c.getStatut().name(), c.getNomCv(),
            c.getLettreMotivation(), reponses, c.getEnvoyeeLe(), c.getRetireeLe(), c.getStatut() == StatutCandidatureEmploi.RECUE);
    }
}
