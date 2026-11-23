package ept.edu.sn.alumni_backend.mobilite.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.common.stockage.ApresTransaction;
import ept.edu.sn.alumni_backend.common.stockage.FichierIntrouvableException;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.mobilite.ActionHistorique;
import ept.edu.sn.alumni_backend.mobilite.ObjetHistorique;
import ept.edu.sn.alumni_backend.mobilite.StatutCandidatureMobilite;
import ept.edu.sn.alumni_backend.mobilite.TypePiece;
import ept.edu.sn.alumni_backend.mobilite.dto.CandidatureMobiliteResponse;
import ept.edu.sn.alumni_backend.mobilite.entity.CandidatureMobilite;
import ept.edu.sn.alumni_backend.mobilite.entity.OffreMobilite;
import ept.edu.sn.alumni_backend.mobilite.entity.PieceCandidatureMobilite;
import ept.edu.sn.alumni_backend.mobilite.exception.ConflitMobiliteException;
import ept.edu.sn.alumni_backend.mobilite.exception.OffreMobiliteIntrouvableException;
import ept.edu.sn.alumni_backend.mobilite.repository.CandidatureMobiliteRepository;
import ept.edu.sn.alumni_backend.mobilite.repository.OffreMobiliteRepository;
import ept.edu.sn.alumni_backend.mobilite.repository.PieceCandidatureMobiliteRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Candidatures aux offres de mobilité.
 * - Un étudiant ou un enseignant éligible dépose un dossier : un PDF par pièce demandée par l'offre.
 * - Jusqu'à la date limite, il remplace une pièce, retire sa candidature ou la renvoie (même ligne, pièces gardées).
 * - Les pièces se lisent par le candidat et le chef du service mobilité ; par l'institut, seulement pour un candidat retenu.
 */
@Service
@RequiredArgsConstructor
public class CandidaturesMobiliteService {
    private final OffreMobiliteRepository offreRepository;
    private final CandidatureMobiliteRepository candidatureRepository;
    private final PieceCandidatureMobiliteRepository pieceRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final StockageFichiersMobilite stockage;
    private final HistoriqueMobiliteService historique;

    @Transactional(readOnly = true)
    public Optional<CandidatureMobiliteResponse> maCandidature(UUID offreId, UtilisateurPrincipal principal) {
        return candidatureRepository.findByOffre_IdAndCandidat_Id(offreId, principal.getUtilisateur().getId()).map(this::versReponse);
    }

    @Transactional(readOnly = true)
    public List<CandidatureMobiliteResponse> mesCandidatures(UtilisateurPrincipal principal) {
        return candidatureRepository.findByCandidat_IdOrderBySoumiseLeDesc(principal.getUtilisateur().getId()).stream().map(this::versReponse).toList();
    }

    /**
     * Dépose, complète ou renvoie le dossier. Chaque fichier reçu remplace la pièce de même type ; une pièce demandée
     * sans fichier doit avoir été déposée avant. L'offre est verrouillée : deux envois simultanés ne créent pas deux lignes.
     */
    @Transactional
    public CandidatureMobiliteResponse soumettre(UUID offreId, Map<TypePiece, MultipartFile> fichiers, UtilisateurPrincipal principal) {
        Utilisateur candidat = utilisateurRepository.findById(principal.getUtilisateur().getId())
            .orElseThrow(() -> new SecurityException("Compte introuvable."));
        OffreMobilite offre = offreRepository.findByIdForUpdate(offreId).orElseThrow(OffreMobiliteIntrouvableException::new);
        if (!offre.visible() || offre.getOrganisme().getStatutValidation() == StatutCompte.SUSPENDU || !offre.getPublicVise().admet(candidat.getRole())) {
            if (!AccesMobilite.estCandidatPossible(candidat)) {
                throw new SecurityException("Seuls les étudiants et les enseignants candidatent à une mobilité.");
            }
            throw new OffreMobiliteIntrouvableException();
        }
        String raison = AccesMobilite.raisonInelegibilite(offre, candidat);
        if (raison != null) throw new ConflitMobiliteException(raison);
        if (!offre.candidaturesOuvertes(aujourdhui())) {
            throw new ConflitMobiliteException("Cette offre ne reçoit plus de candidatures.");
        }
        for (TypePiece type : fichiers.keySet()) {
            if (!offre.getPiecesDemandees().contains(type)) {
                throw new IllegalArgumentException("Cette offre ne demande pas de pièce « " + type.name() + " ».");
            }
        }
        CandidatureMobilite candidature = candidatureRepository.findByOffre_IdAndCandidat_Id(offreId, candidat.getId())
            .orElseGet(() -> new CandidatureMobilite(offre, candidat));
        if (candidature.getStatut() != null && candidature.getStatut() != StatutCandidatureMobilite.SOUMISE
                && candidature.getStatut() != StatutCandidatureMobilite.RETIREE) {
            throw new ConflitMobiliteException("L'école a déjà rendu sa décision sur cette candidature.");
        }
        Map<TypePiece, PieceCandidatureMobilite> existantes = new EnumMap<>(TypePiece.class);
        candidature.getPieces().forEach(piece -> existantes.put(piece.getType(), piece));
        List<String> manquantes = new ArrayList<>();
        for (TypePiece type : offre.getPiecesDemandees()) {
            if (!fichiers.containsKey(type) && !existantes.containsKey(type)) manquantes.add(type.name());
        }
        if (!manquantes.isEmpty()) {
            throw new IllegalArgumentException("Pièces manquantes : " + String.join(", ", manquantes) + ".");
        }
        boolean premiere = candidature.getStatut() != StatutCandidatureMobilite.SOUMISE;
        candidature.soumettre();
        candidature = candidatureRepository.save(candidature);
        for (Map.Entry<TypePiece, MultipartFile> entree : fichiers.entrySet()) {
            MultipartFile fichier = entree.getValue();
            String nomStocke = stockage.getPiecesCandidatures().stocker(fichier);
            ApresTransaction.siAnnulee(() -> stockage.getPiecesCandidatures().supprimer(nomStocke));
            PieceCandidatureMobilite piece = existantes.get(entree.getKey());
            if (piece == null) {
                piece = new PieceCandidatureMobilite(candidature, entree.getKey());
                candidature.getPieces().add(piece);
            } else {
                String ancien = piece.getNomStocke();
                ApresTransaction.siValidee(() -> stockage.getPiecesCandidatures().supprimer(ancien));
            }
            piece.deposer(FichiersOffreMobiliteService.nomAffiche(fichier.getOriginalFilename()), nomStocke, fichier.getSize());
            pieceRepository.save(piece);
        }
        if (premiere) {
            historique.consigner(ObjetHistorique.CANDIDATURE, candidature.getId(), ActionHistorique.SOUMISSION_CANDIDATURE, null, null, candidat.getId());
        }
        return versReponse(candidature);
    }

    @Transactional
    public CandidatureMobiliteResponse retirer(UUID offreId, UtilisateurPrincipal principal) {
        UUID candidatId = principal.getUtilisateur().getId();
        OffreMobilite offre = offreRepository.findByIdForUpdate(offreId).orElseThrow(OffreMobiliteIntrouvableException::new);
        CandidatureMobilite candidature = candidatureRepository.findByOffre_IdAndCandidat_Id(offreId, candidatId)
            .orElseThrow(OffreMobiliteIntrouvableException::new);
        if (candidature.getStatut() != StatutCandidatureMobilite.SOUMISE) {
            throw new ConflitMobiliteException("Seule une candidature envoyée, sans décision de l'école, se retire.");
        }
        if (!offre.candidaturesOuvertes(aujourdhui())) {
            throw new ConflitMobiliteException("Les candidatures sont closes : la candidature ne se retire plus.");
        }
        candidature.retirer();
        historique.consigner(ObjetHistorique.CANDIDATURE, candidature.getId(), ActionHistorique.RETRAIT_CANDIDATURE, null, null, candidatId);
        return versReponse(candidature);
    }

    /** Une pièce du dossier : le candidat, le chef du service mobilité, ou l'institut de l'offre si le candidat est retenu. Sinon 404. */
    @Transactional(readOnly = true)
    public Telechargement telecharger(UUID candidatureId, UUID pieceId, UtilisateurPrincipal principal) {
        Utilisateur lecteur = principal.getUtilisateur();
        CandidatureMobilite candidature = candidatureRepository.findWithOffreById(candidatureId).orElseThrow(FichierIntrouvableException::new);
        boolean autorise = candidature.getCandidat().getId().equals(lecteur.getId()) || AccesMobilite.estChef(lecteur)
            || (AccesMobilite.estDeLInstitut(candidature.getOffre(), lecteur) && candidature.getStatut() == StatutCandidatureMobilite.RETENUE
                && candidature.getOffre().getStatut() == ept.edu.sn.alumni_backend.mobilite.StatutOffreMobilite.LISTE_PUBLIEE);
        if (!autorise) throw new FichierIntrouvableException();
        PieceCandidatureMobilite piece = pieceRepository.findByIdAndCandidature_Id(pieceId, candidatureId).orElseThrow(FichierIntrouvableException::new);
        return new Telechargement(piece.getNomFichier(), stockage.getPiecesCandidatures().lire(piece.getNomStocke()));
    }

    public record Telechargement(String nomFichier, Resource contenu) {
    }

    private static LocalDate aujourdhui() {
        return LocalDate.now(OffresMobiliteService.FUSEAU);
    }

    private CandidatureMobiliteResponse versReponse(CandidatureMobilite candidature) {
        OffreMobilite offre = candidature.getOffre();
        boolean ouvertes = offre.candidaturesOuvertes(aujourdhui());
        StatutCandidatureMobilite statut = candidature.getStatut();
        // La décision reste interne à l'école jusqu'à la publication de la liste.
        boolean decisionCachee = offre.getStatut() != ept.edu.sn.alumni_backend.mobilite.StatutOffreMobilite.LISTE_PUBLIEE
            && (statut == StatutCandidatureMobilite.RETENUE || statut == StatutCandidatureMobilite.LISTE_ATTENTE
                || statut == StatutCandidatureMobilite.NON_RETENUE);
        if (decisionCachee) statut = StatutCandidatureMobilite.SOUMISE;
        return new CandidatureMobiliteResponse(candidature.getId(),
            new CandidatureMobiliteResponse.Offre(offre.getId(), offre.getTitre(), offre.getOrganisme().getNom(), offre.getType().name(),
                offre.getPeriode().name(), offre.getDureeSemaines(), offre.getAnneeUniversitaire(), offre.getDateLimite(), ouvertes,
                offre.getStatut().name(), offre.getPiecesDemandees().stream().sorted().map(Enum::name).toList()),
            statut.name(), decisionCachee ? null : candidature.getRangAttente(), candidature.getSoumiseLe(), candidature.getRetireeLe(),
            candidature.getPieces().stream().sorted((a, b) -> a.getType().compareTo(b.getType()))
                .map(p -> new CandidatureMobiliteResponse.Piece(p.getId(), p.getType().name(), p.getNomFichier(), p.getTaille())).toList(),
            ouvertes && (statut == StatutCandidatureMobilite.SOUMISE || statut == StatutCandidatureMobilite.RETIREE));
    }
}
