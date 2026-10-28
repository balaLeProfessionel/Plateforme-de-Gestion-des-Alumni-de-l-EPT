package ept.edu.sn.alumni_backend.evenement.dto;

import java.util.List;

import org.springframework.data.domain.Page;

public record PageParticipantsResponse(
    List<ParticipantEvenementResponse> contenu,
    int page,
    int taille,
    long totalElements,
    int totalPages
) {
    public static PageParticipantsResponse depuis(Page<ParticipantEvenementResponse> page) {
        return new PageParticipantsResponse(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
    }
}
