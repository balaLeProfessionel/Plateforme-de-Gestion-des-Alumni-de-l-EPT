package ept.edu.sn.alumni_backend.publication.dto;

import java.util.List;
import org.springframework.data.domain.Page;

public record PageCommentairesPublicationResponse(List<CommentairePublicationResponse> contenu,
        int page, int taille, long totalElements, int totalPages) {
    public static PageCommentairesPublicationResponse depuis(Page<CommentairePublicationResponse> page) {
        return new PageCommentairesPublicationResponse(page.getContent(), page.getNumber(), page.getSize(),
            page.getTotalElements(), page.getTotalPages());
    }
}
