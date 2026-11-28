package ept.edu.sn.alumni_backend.partenariat.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.common.stockage.ApresTransaction;
import ept.edu.sn.alumni_backend.common.stockage.FichierIntrouvableException;
import ept.edu.sn.alumni_backend.partenariat.ActionAccord;
import ept.edu.sn.alumni_backend.partenariat.StatutAccord;
import ept.edu.sn.alumni_backend.partenariat.dto.AccordResponse;
import ept.edu.sn.alumni_backend.partenariat.entity.AccordCollaboration;
import ept.edu.sn.alumni_backend.partenariat.entity.PieceAccord;
import ept.edu.sn.alumni_backend.partenariat.exception.ConflitConventionException;
import ept.edu.sn.alumni_backend.partenariat.repository.PieceAccordRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

/**
 * Documents PDF d'un accord, 10 au plus. L'organisme en dépose tant que l'accord est proposé ; l'école à tout moment,
 * sauf sur un accord refusé ou retiré.
 */
@Service
@RequiredArgsConstructor
public class PiecesAccordService {
    private final AccordsService accordsService;
    private final PieceAccordRepository pieceRepository;
    private final StockageFichiersPartenariat stockage;

    @Transactional
    public AccordResponse ajouter(UUID accordId, MultipartFile fichier, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        AccordCollaboration accord = accordsService.chargerPourGestion(accordId, auteur);
        boolean chef = AccesPartenariat.estChef(auteur);
        StatutAccord statut = accord.getStatut();
        if (statut == StatutAccord.REFUSE || statut == StatutAccord.RETIRE) {
            throw new ConflitConventionException("Cette proposition est close : elle ne reçoit plus de document.");
        }
        if (!chef && statut != StatutAccord.PROPOSE) {
            throw new ConflitConventionException("Les documents se déposent tant que l'accord est proposé.");
        }
        if (pieceRepository.countByAccord_Id(accordId) >= PieceAccord.NOMBRE_MAXIMAL) {
            throw new ConflitConventionException("Un accord compte " + PieceAccord.NOMBRE_MAXIMAL + " documents au plus : retirez-en un avant d'en ajouter un autre.");
        }
        String nomStocke = stockage.getDocumentsAccords().stocker(fichier);
        ApresTransaction.siAnnulee(() -> stockage.getDocumentsAccords().supprimer(nomStocke));
        String nom = PiecesConventionService.nomAffiche(fichier.getOriginalFilename());
        PieceAccord piece = pieceRepository.save(new PieceAccord(accord, nom, nomStocke, fichier.getSize(), !chef, auteur));
        accord.getPieces().add(piece);
        accordsService.consigner(accord, ActionAccord.AJOUT_PIECE, nom, null, auteur);
        return accordsService.reponse(accord, auteur, true);
    }

    @Transactional
    public AccordResponse supprimer(UUID accordId, UUID pieceId, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        AccordCollaboration accord = accordsService.chargerPourGestion(accordId, auteur);
        PieceAccord piece = pieceRepository.findByIdAndAccord_Id(pieceId, accordId).orElseThrow(FichierIntrouvableException::new);
        if (!AccordsService.peutRetirer(accord, piece, auteur)) {
            throw new ConflitConventionException("Ce document ne peut plus être retiré : il fait partie du dossier de l'accord.");
        }
        accord.getPieces().remove(piece);
        pieceRepository.delete(piece);
        String nomStocke = piece.getNomStocke();
        ApresTransaction.siValidee(() -> stockage.getDocumentsAccords().supprimer(nomStocke));
        accordsService.consigner(accord, ActionAccord.RETRAIT_PIECE, piece.getNomFichier(), null, auteur);
        return accordsService.reponse(accord, auteur, true);
    }

    @Transactional(readOnly = true)
    public PiecesConventionService.Telechargement telecharger(UUID accordId, UUID pieceId, UtilisateurPrincipal principal) {
        accordsService.chargerVisible(accordId, principal.getUtilisateur());
        PieceAccord piece = pieceRepository.findByIdAndAccord_Id(pieceId, accordId).orElseThrow(FichierIntrouvableException::new);
        return new PiecesConventionService.Telechargement(piece.getNomFichier(), stockage.getDocumentsAccords().lire(piece.getNomStocke()));
    }
}
