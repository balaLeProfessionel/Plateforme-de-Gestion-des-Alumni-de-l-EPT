package ept.edu.sn.alumni_backend.partenariat.service;

import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.common.stockage.ApresTransaction;
import ept.edu.sn.alumni_backend.common.stockage.FichierIntrouvableException;
import ept.edu.sn.alumni_backend.partenariat.ActionConvention;
import ept.edu.sn.alumni_backend.partenariat.StatutConvention;
import ept.edu.sn.alumni_backend.partenariat.dto.ConventionResponse;
import ept.edu.sn.alumni_backend.partenariat.entity.ConventionPartenariat;
import ept.edu.sn.alumni_backend.partenariat.entity.PieceConventionPartenariat;
import ept.edu.sn.alumni_backend.partenariat.exception.ConflitConventionException;
import ept.edu.sn.alumni_backend.partenariat.repository.PieceConventionPartenariatRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

/**
 * Documents PDF d'une convention, 10 au plus. L'organisme en dépose pendant sa demande ; le chef du service des
 * Relations extérieures en dépose à tout moment (exemplaire signé, avenant). Un fichier n'est effacé du dépôt qu'une
 * fois la base à jour, et un fichier écrit pour une requête annulée est effacé.
 */
@Service
@RequiredArgsConstructor
public class PiecesConventionService {
    private final ConventionsPartenariatService conventionsService;
    private final PieceConventionPartenariatRepository pieceRepository;
    private final StockageFichiersPartenariat stockage;

    @Transactional
    public ConventionResponse ajouter(UUID conventionId, MultipartFile fichier, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        ConventionPartenariat convention = conventionsService.chargerPourGestion(conventionId, auteur);
        boolean chef = AccesPartenariat.estChef(auteur);
        StatutConvention statut = convention.getStatut();
        if (!chef && !statut.estEnCours()) {
            throw new ConflitConventionException("Les documents se déposent pendant le traitement de la demande.");
        }
        if (statut == StatutConvention.ANNULEE || statut == StatutConvention.REFUSEE) {
            throw new ConflitConventionException("Cette demande est close : elle ne reçoit plus de document.");
        }
        if (pieceRepository.countByConvention_Id(conventionId) >= PieceConventionPartenariat.NOMBRE_MAXIMAL) {
            throw new ConflitConventionException("Une convention compte " + PieceConventionPartenariat.NOMBRE_MAXIMAL
                + " documents au plus : retirez-en un avant d'en ajouter un autre.");
        }
        String nomStocke = stockage.getDocuments().stocker(fichier);
        ApresTransaction.siAnnulee(() -> stockage.getDocuments().supprimer(nomStocke));
        String nom = nomAffiche(fichier.getOriginalFilename());
        PieceConventionPartenariat piece = pieceRepository.save(
            new PieceConventionPartenariat(convention, nom, nomStocke, fichier.getSize(), !chef, auteur));
        convention.getPieces().add(piece);
        conventionsService.consigner(convention, ActionConvention.AJOUT_PIECE, nom, null, auteur);
        return conventionsService.reponse(convention, auteur, true);
    }

    @Transactional
    public ConventionResponse supprimer(UUID conventionId, UUID pieceId, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        ConventionPartenariat convention = conventionsService.chargerPourGestion(conventionId, auteur);
        PieceConventionPartenariat piece = pieceRepository.findByIdAndConvention_Id(pieceId, conventionId).orElseThrow(FichierIntrouvableException::new);
        if (!ConventionsPartenariatService.peutRetirer(convention, piece, auteur)) {
            throw new ConflitConventionException("Ce document ne peut plus être retiré : il fait partie du dossier de la convention.");
        }
        convention.getPieces().remove(piece);
        pieceRepository.delete(piece);
        String nomStocke = piece.getNomStocke();
        ApresTransaction.siValidee(() -> stockage.getDocuments().supprimer(nomStocke));
        conventionsService.consigner(convention, ActionConvention.RETRAIT_PIECE, piece.getNomFichier(), null, auteur);
        return conventionsService.reponse(convention, auteur, true);
    }

    @Transactional(readOnly = true)
    public Telechargement telecharger(UUID conventionId, UUID pieceId, UtilisateurPrincipal principal) {
        conventionsService.chargerVisible(conventionId, principal.getUtilisateur());
        PieceConventionPartenariat piece = pieceRepository.findByIdAndConvention_Id(pieceId, conventionId).orElseThrow(FichierIntrouvableException::new);
        return new Telechargement(piece.getNomFichier(), stockage.getDocuments().lire(piece.getNomStocke()));
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
