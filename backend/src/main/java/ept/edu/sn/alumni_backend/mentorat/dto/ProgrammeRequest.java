package ept.edu.sn.alumni_backend.mentorat.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Présentation d'un programme et liste complète de ses étapes, dans l'ordre voulu : une étape avec
 * un id est conservée (texte et place mis à jour), une étape sans id est créée, une étape absente
 * est retirée.
 */
public record ProgrammeRequest(
    @NotBlank @Size(max = 150) String titre,
    @Size(max = 4000) String description,
    @NotNull LocalDate dateDebut,
    @NotNull LocalDate dateFin,
    @NotNull @Size(max = 10, message = "Un programme compte au plus 10 étapes") List<@Valid @NotNull Etape> etapes
) {
    public record Etape(
        UUID id,
        @NotBlank @Size(max = 150) String titre,
        @Size(max = 500) String description
    ) {
    }

    @AssertTrue(message = "La date de fin doit suivre la date de début")
    public boolean isPeriodeValide() {
        return dateDebut == null || dateFin == null || !dateFin.isBefore(dateDebut);
    }
}
