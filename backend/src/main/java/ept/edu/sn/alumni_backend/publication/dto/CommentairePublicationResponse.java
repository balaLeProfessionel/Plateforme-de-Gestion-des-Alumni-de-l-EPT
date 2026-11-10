package ept.edu.sn.alumni_backend.publication.dto;

import java.time.Instant;
import java.util.UUID;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.publication.entity.CommentairePublication;
import ept.edu.sn.alumni_backend.utilisateur.IdentitePublique;

public record CommentairePublicationResponse(UUID id, UUID publicationId, UUID parentId,
        UUID auteurId, String auteurNom, String auteurPrenom, TypeRole auteurRole, String auteurPhoto,
        String contenu, Instant creeLe, UUID auteurOrganismeId) {

    public static CommentairePublicationResponse depuis(CommentairePublication c) {
        var auteur = c.getAuteur();
        var identite = IdentitePublique.de(auteur);
        return new CommentairePublicationResponse(c.getId(), c.getPublication().getId(),
            c.getParent() == null ? null : c.getParent().getId(), auteur.getId(), identite.nom(),
            identite.prenom(), auteur.getRole(), identite.photo(), c.getContenu(), c.getCreeLe(), identite.organismeId());
    }
}
