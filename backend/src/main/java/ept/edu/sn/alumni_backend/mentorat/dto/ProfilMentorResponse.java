package ept.edu.sn.alumni_backend.mentorat.dto;

import java.util.List;
import java.util.UUID;

public record ProfilMentorResponse(
    UUID id,
    String presentation,
    boolean disponible,
    int capaciteMax,
    long mentoresActifs,
    List<DomaineMentoratResponse> domaines
) {
}
