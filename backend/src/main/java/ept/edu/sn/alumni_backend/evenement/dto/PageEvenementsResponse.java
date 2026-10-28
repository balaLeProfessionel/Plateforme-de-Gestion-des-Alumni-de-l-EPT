package ept.edu.sn.alumni_backend.evenement.dto;

import java.util.List;

import org.springframework.data.domain.Page;

public record PageEvenementsResponse(
    List<EvenementResponse> contenu,
    int page,
    int taille,
    long totalElements,
    int totalPages
) {
    public static PageEvenementsResponse depuis(Page<EvenementResponse> page) {
        return new PageEvenementsResponse(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
    }
}
