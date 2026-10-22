package ept.edu.sn.alumni_backend.mentorat.dto;

import java.util.UUID;

/** Le programme auquel un mentorat est rattaché, pour l'afficher et y mener. */
public record ProgrammeResumeResponse(UUID id, String titre) {
}
