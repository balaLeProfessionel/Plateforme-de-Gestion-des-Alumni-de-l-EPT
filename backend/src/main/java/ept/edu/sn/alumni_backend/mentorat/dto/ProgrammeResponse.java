package ept.edu.sn.alumni_backend.mentorat.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.mentorat.StatutProgramme;

/**
 * Un programme et ses étapes. {@code gerable} : la personne connectée peut le modifier
 * (responsable ou administrateur) ; {@code jeParticipe} : elle y est mentor volontaire.
 */
public record ProgrammeResponse(
    UUID id,
    String titre,
    String description,
    LocalDate dateDebut,
    LocalDate dateFin,
    StatutProgramme statut,
    ParticipantMentoratResponse responsable,
    List<Etape> etapes,
    long nombreMentorats,
    long nombreMentors,
    boolean gerable,
    boolean jeParticipe
) {
    public record Etape(UUID id, String titre, String description, int ordre) {
    }
}
