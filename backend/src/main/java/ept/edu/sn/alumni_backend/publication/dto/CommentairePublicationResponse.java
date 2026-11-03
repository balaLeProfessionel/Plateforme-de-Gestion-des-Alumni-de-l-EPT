package ept.edu.sn.alumni_backend.publication.dto;

import java.time.Instant;
import java.util.UUID;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.publication.entity.CommentairePublication;

public record CommentairePublicationResponse(UUID id, UUID publicationId, UUID parentId,
        UUID auteurId, String auteurNom, String auteurPrenom, TypeRole auteurRole, String auteurPhoto,
        String contenu, Instant creeLe) {

    public static CommentairePublicationResponse depuis(CommentairePublication c) {
        var auteur = c.getAuteur();
        return new CommentairePublicationResponse(c.getId(), c.getPublication().getId(),
            c.getParent() == null ? null : c.getParent().getId(), auteur.getId(), auteur.getNom(),
            auteur.getPrenom(), auteur.getRole(), auteur.getUrlPhoto(), c.getContenu(), c.getCreeLe());
    }
}
