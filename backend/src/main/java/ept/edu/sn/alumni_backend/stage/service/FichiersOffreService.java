package ept.edu.sn.alumni_backend.stage.service;

import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.common.stockage.ApresTransaction;
import ept.edu.sn.alumni_backend.common.stockage.FichierIntrouvableException;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.dto.OffreStageResponse;
import ept.edu.sn.alumni_backend.stage.entity.OffreStage;
import ept.edu.sn.alumni_backend.stage.entity.PieceJointeOffre;
import ept.edu.sn.alumni_backend.stage.exception.ConflitStageException;
import ept.edu.sn.alumni_backend.stage.repository.PieceJointeOffreRepository;
import lombok.RequiredArgsConstructor;

/**
 * Image et pièces jointes PDF d'une offre de stage. L'organisme de l'offre (tant qu'elle est en attente ou publiée)
 * et l'administrateur Stages les modifient ; quiconque voit l'offre peut télécharger ses pièces jointes.
 * Un fichier n'est supprimé du disque qu'une fois la base à jour, et un fichier écrit pour une requête annulée est effacé.
 */
@Service
@RequiredArgsConstructor
public class FichiersOffreService {
    private final OffresStageService offresService;
    private final PieceJointeOffreRepository pieceRepository;
    private final StockageFichiersOffre stockage;

    @Transactional
    public OffreStageResponse joindreImage(UUID offreId, MultipartFile image, UtilisateurPrincipal principal) {
        OffreStage offre = offresService.chargerPourGestion(offreId, principal.getUtilisateur());
        String ancienne = offre.getUrlImage();
        String nouvelle = stockage.getImages().stocker(image);
        ApresTransaction.siAnnulee(() -> stockage.getImages().supprimerSiGeree(nouvelle));
        ApresTransaction.siValidee(() -> stockage.getImages().supprimerSiGeree(ancienne));
        offre.setUrlImage(nouvelle);
        return OffresStageService.reponseComplete(offre, true);
    }

    @Transactional
    public OffreStageResponse supprimerImage(UUID offreId, UtilisateurPrincipal principal) {
        OffreStage offre = offresService.chargerPourGestion(offreId, principal.getUtilisateur());
        String ancienne = offre.getUrlImage();
        offre.setUrlImage(null);
        ApresTransaction.siValidee(() -> stockage.getImages().supprimerSiGeree(ancienne));
        return OffresStageService.reponseComplete(offre, true);
    }

    @Transactional
    public OffreStageResponse ajouterPiece(UUID offreId, MultipartFile fichier, UtilisateurPrincipal principal) {
        // L'offre est verrouillée : deux envois simultanés ne dépassent pas la limite.
        OffreStage offre = offresService.chargerPourGestion(offreId, principal.getUtilisateur());
        if (pieceRepository.countByOffre_Id(offreId) >= PieceJointeOffre.NOMBRE_MAXIMAL) {
            throw new ConflitStageException("Une offre compte " + PieceJointeOffre.NOMBRE_MAXIMAL
                + " pièces jointes au plus : retirez-en une avant d'en ajouter une autre.");
        }
        String nomStocke = stockage.getDocuments().stocker(fichier);
        ApresTransaction.siAnnulee(() -> stockage.getDocuments().supprimer(nomStocke));
        PieceJointeOffre piece = pieceRepository.save(new PieceJointeOffre(offre, nomAffiche(fichier.getOriginalFilename()), nomStocke, fichier.getSize()));
        offre.getPiecesJointes().add(piece);
        return OffresStageService.reponseComplete(offre, true);
    }

    @Transactional
    public OffreStageResponse supprimerPiece(UUID offreId, UUID pieceId, UtilisateurPrincipal principal) {
        OffreStage offre = offresService.chargerPourGestion(offreId, principal.getUtilisateur());
        PieceJointeOffre piece = pieceRepository.findByIdAndOffre_Id(pieceId, offreId).orElseThrow(FichierIntrouvableException::new);
        offre.getPiecesJointes().remove(piece);
        pieceRepository.delete(piece);
        String nomStocke = piece.getNomStocke();
        ApresTransaction.siValidee(() -> stockage.getDocuments().supprimer(nomStocke));
        return OffresStageService.reponseComplete(offre, true);
    }

    @Transactional(readOnly = true)
    public Telechargement telecharger(UUID offreId, UUID pieceId, UtilisateurPrincipal principal) {
        offresService.chargerVisible(offreId, principal.getUtilisateur());
        PieceJointeOffre piece = pieceRepository.findByIdAndOffre_Id(pieceId, offreId).orElseThrow(FichierIntrouvableException::new);
        return new Telechargement(piece.getNomFichier(), stockage.getDocuments().lire(piece.getNomStocke()));
    }

    public record Telechargement(String nomFichier, Resource contenu) {
    }

    /** Nom proposé au téléchargement : sans chemin ni caractère de contrôle, 255 caractères au plus. */
    static String nomAffiche(String nomOriginal) {
        String nom = nomOriginal == null ? "" : nomOriginal.replaceAll("^.*[\\\\/]", "").replaceAll("\\p{Cntrl}", "").strip();
        if (nom.isEmpty()) nom = "piece-jointe.pdf";
        return nom.length() > 255 ? nom.substring(nom.length() - 255) : nom;
    }
}
