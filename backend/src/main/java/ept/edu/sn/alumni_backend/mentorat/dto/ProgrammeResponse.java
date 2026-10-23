package ept.edu.sn.alumni_backend.mentorat.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.mentorat.StatutProgramme;

/**
 * Un programme et ses étapes. {@code gerable} : la personne connectée peut le modifier
 * (administration) ; {@code jeParticipe} : elle y est mentor volontaire ; {@code termine} : sa date
 * de fin est passée, il n'accepte plus ni demande ni mentor volontaire.
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
    boolean jeParticipe,
    boolean termine
) {
    public record Etape(UUID id, String titre, String description, int ordre) {
    }
}
