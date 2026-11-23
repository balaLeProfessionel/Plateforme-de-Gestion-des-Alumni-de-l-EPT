package ept.edu.sn.alumni_backend.mobilite.service;

import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.common.stockage.ApresTransaction;
import ept.edu.sn.alumni_backend.common.stockage.FichierIntrouvableException;
import ept.edu.sn.alumni_backend.mobilite.dto.OffreMobiliteResponse;
import ept.edu.sn.alumni_backend.mobilite.entity.OffreMobilite;
import ept.edu.sn.alumni_backend.mobilite.entity.PieceJointeOffreMobilite;
import ept.edu.sn.alumni_backend.mobilite.exception.ConflitMobiliteException;
import ept.edu.sn.alumni_backend.mobilite.repository.PieceJointeOffreMobiliteRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

/**
 * Documents PDF d'une offre de mobilité, 5 au plus. L'institut de l'offre et le chef du service mobilité les ajoutent
 * ou les retirent tant que l'offre n'est pas retirée ; quiconque voit l'offre les télécharge. Un fichier n'est effacé
 * du dépôt qu'une fois la base à jour, et un fichier écrit pour une requête annulée est effacé.
 */
@Service
@RequiredArgsConstructor
public class FichiersOffreMobiliteService {
    private final OffresMobiliteService offresService;
    private final PieceJointeOffreMobiliteRepository pieceRepository;
    private final StockageFichiersMobilite stockage;

    @Transactional
    public OffreMobiliteResponse ajouter(UUID offreId, MultipartFile fichier, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        // L'offre est verrouillée : deux envois simultanés ne dépassent pas la limite.
        OffreMobilite offre = offresService.chargerPourGestion(offreId, auteur);
        if (pieceRepository.countByOffre_Id(offreId) >= PieceJointeOffreMobilite.NOMBRE_MAXIMAL) {
            throw new ConflitMobiliteException("Une offre compte " + PieceJointeOffreMobilite.NOMBRE_MAXIMAL
                + " documents au plus : retirez-en un avant d'en ajouter un autre.");
        }
        String nomStocke = stockage.getDocumentsOffres().stocker(fichier);
        ApresTransaction.siAnnulee(() -> stockage.getDocumentsOffres().supprimer(nomStocke));
        PieceJointeOffreMobilite piece = pieceRepository.save(
            new PieceJointeOffreMobilite(offre, nomAffiche(fichier.getOriginalFilename()), nomStocke, fichier.getSize()));
        offre.getPiecesJointes().add(piece);
        return offresService.reponseComplete(offre, auteur);
    }

    @Transactional
    public OffreMobiliteResponse supprimer(UUID offreId, UUID pieceId, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        OffreMobilite offre = offresService.chargerPourGestion(offreId, auteur);
        PieceJointeOffreMobilite piece = pieceRepository.findByIdAndOffre_Id(pieceId, offreId).orElseThrow(FichierIntrouvableException::new);
        offre.getPiecesJointes().remove(piece);
        pieceRepository.delete(piece);
        String nomStocke = piece.getNomStocke();
        ApresTransaction.siValidee(() -> stockage.getDocumentsOffres().supprimer(nomStocke));
        return offresService.reponseComplete(offre, auteur);
    }

    @Transactional(readOnly = true)
    public Telechargement telecharger(UUID offreId, UUID pieceId, UtilisateurPrincipal principal) {
        offresService.chargerVisible(offreId, principal.getUtilisateur());
        PieceJointeOffreMobilite piece = pieceRepository.findByIdAndOffre_Id(pieceId, offreId).orElseThrow(FichierIntrouvableException::new);
        return new Telechargement(piece.getNomFichier(), stockage.getDocumentsOffres().lire(piece.getNomStocke()));
    }

    public record Telechargement(String nomFichier, Resource contenu) {
    }

    /** Nom proposé au téléchargement : sans chemin ni caractère de contrôle, 255 caractères au plus. */
    static String nomAffiche(String nomOriginal) {
        String nom = nomOriginal == null ? "" : nomOriginal.replaceAll("^.*[\\\\/]", "").replaceAll("\\p{Cntrl}", "").strip();
        if (nom.isEmpty()) nom = "document.pdf";
        return nom.length() > 255 ? nom.substring(nom.length() - 255) : nom;
    }
}
