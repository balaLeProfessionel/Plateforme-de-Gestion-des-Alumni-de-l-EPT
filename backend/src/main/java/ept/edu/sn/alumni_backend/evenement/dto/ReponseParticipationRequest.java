package ept.edu.sn.alumni_backend.evenement.dto;

import ept.edu.sn.alumni_backend.evenement.ReponseParticipation;
import jakarta.validation.constraints.NotNull;

public record ReponseParticipationRequest(@NotNull ReponseParticipation reponse) {}
