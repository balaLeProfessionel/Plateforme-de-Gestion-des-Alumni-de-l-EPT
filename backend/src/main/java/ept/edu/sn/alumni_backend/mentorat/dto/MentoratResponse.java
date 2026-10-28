package ept.edu.sn.alumni_backend.mentorat.dto;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.mentorat.RoleMentorat;
import ept.edu.sn.alumni_backend.mentorat.StatutMentorat;

public record MentoratResponse(
    UUID id,
    StatutMentorat statut,
    DomaineMentoratResponse domaine,
    String objectif,
    String motifRefus,
    String motifAnnulation,
    Instant creeLe,
    Instant reponduLe,
    Instant clotureLe,
    ParticipantMentoratResponse mentor,
    ParticipantMentoratResponse mentore,
    RoleMentorat monRole,
    ProgrammeResumeResponse programme
) {
}
