package ept.edu.sn.alumni_backend.publication.dto;

import java.util.List;
import org.springframework.data.domain.Page;

public record PagePublicationsResponse(List<PublicationResponse> contenu, int page, int taille,
    long totalElements, int totalPages) {
    public static PagePublicationsResponse depuis(Page<PublicationResponse> page) {
        return new PagePublicationsResponse(page.getContent(), page.getNumber(), page.getSize(),
            page.getTotalElements(), page.getTotalPages());
    }
}
