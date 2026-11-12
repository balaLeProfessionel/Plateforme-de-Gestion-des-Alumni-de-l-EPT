package ept.edu.sn.alumni_backend.publication.dto;

import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentairePublicationRequest(@NotBlank @Size(max = 2000) String contenu, UUID parentId) {}
