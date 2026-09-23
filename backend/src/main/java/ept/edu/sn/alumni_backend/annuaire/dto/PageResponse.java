package ept.edu.sn.alumni_backend.annuaire.dto;

import java.util.List;

import org.springframework.data.domain.Page;

public record PageResponse<T>(
    List<T> contenu,
    int page,
    int taille,
    long totalElements,
    int totalPages
) {
    public static <T> PageResponse<T> depuis(Page<T> page) {
        return new PageResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
    }
}
