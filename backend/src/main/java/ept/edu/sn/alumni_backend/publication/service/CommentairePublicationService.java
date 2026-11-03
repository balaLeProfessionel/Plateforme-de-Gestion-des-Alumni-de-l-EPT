package ept.edu.sn.alumni_backend.publication.service;

import java.util.UUID;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ept.edu.sn.alumni_backend.publication.dto.CommentairePublicationRequest;
import ept.edu.sn.alumni_backend.publication.dto.CommentairePublicationResponse;
import ept.edu.sn.alumni_backend.publication.dto.PageCommentairesPublicationResponse;
import ept.edu.sn.alumni_backend.publication.entity.CommentairePublication;
import ept.edu.sn.alumni_backend.publication.entity.Publication;
import ept.edu.sn.alumni_backend.publication.exception.PublicationIntrouvableException;
import ept.edu.sn.alumni_backend.publication.repository.CommentairePublicationRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommentairePublicationService {
    private final CommentairePublicationRepository commentaires;
    private final PublicationService publications;
    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public PageCommentairesPublicationResponse lister(UUID publicationId, int page, int taille, UtilisateurPrincipal principal) {
        publications.obtenir(publicationId, principal);
        var tri = Sort.by(Sort.Order.asc("creeLe"), Sort.Order.asc("id"));
        return PageCommentairesPublicationResponse.depuis(commentaires.findByPublication_IdOrderByCreeLeAscIdAsc(
            publicationId, PageRequest.of(page, taille, tri)).map(this::versResponse));
    }

    @Transactional
    public CommentairePublicationResponse creer(UUID publicationId, CommentairePublicationRequest demande,
            UtilisateurPrincipal principal) {
        publications.obtenir(publicationId, principal);
        CommentairePublication commentaire = new CommentairePublication();
        commentaire.setPublication(entityManager.getReference(Publication.class, publicationId));
        commentaire.setAuteur(principal.getUtilisateur());
        commentaire.setContenu(demande.contenu().strip());
        if (demande.parentId() != null) {
            CommentairePublication parent = commentaires.findById(demande.parentId())
                .filter(c -> c.getPublication().getId().equals(publicationId) && c.getParent() == null)
                .orElseThrow(PublicationIntrouvableException::new);
            commentaire.setParent(parent);
        }
        return versResponse(commentaires.saveAndFlush(commentaire));
    }

    private CommentairePublicationResponse versResponse(CommentairePublication c) {
        var auteur = c.getAuteur();
        return new CommentairePublicationResponse(c.getId(), c.getPublication().getId(),
            c.getParent() == null ? null : c.getParent().getId(), auteur.getId(), auteur.getNom(),
            auteur.getPrenom(), auteur.getUrlPhoto(), c.getContenu(), c.getCreeLe());
    }
}
