package ept.edu.sn.alumni_backend.publication.dto;

import java.time.Instant;
import java.util.UUID;

public record CommentairePublicationResponse(UUID id, UUID publicationId, UUID parentId,
        UUID auteurId, String auteurNom, String auteurPrenom, String auteurPhoto,
        String contenu, Instant creeLe) {}
