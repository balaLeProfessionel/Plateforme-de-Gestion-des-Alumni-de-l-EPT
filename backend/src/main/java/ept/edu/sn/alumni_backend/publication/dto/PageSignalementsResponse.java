package ept.edu.sn.alumni_backend.publication.dto;

import java.util.List;
import org.springframework.data.domain.Page;

public record PageSignalementsResponse(List<SignalementResponse> contenu, int page, int taille,
    long totalElements, int totalPages) {
    public static PageSignalementsResponse depuis(Page<SignalementResponse> page) {
        return new PageSignalementsResponse(page.getContent(), page.getNumber(), page.getSize(),
            page.getTotalElements(), page.getTotalPages());
    }
}
