package ept.edu.sn.alumni_backend.partenariat.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.partenariat.TypeAccord;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Proposition ou correction d'un accord. organismeId n'est lu que pour une proposition de l'école ; l'organisme
 * propose toujours en son propre nom. conventionId rattache l'accord à une convention-cadre active, s'il y a lieu.
 */
public record AccordRequest(
    UUID organismeId,
    UUID conventionId,
    @NotNull(message = "Le type d'accord est obligatoire") TypeAccord type,
    @NotBlank(message = "L'objet est obligatoire") @Size(max = 200) String objet,
    @Size(max = 2000) String description,
    @Min(value = 1, message = "Au moins une place") Integer nombrePlaces,
    @Size(max = 30) List<UUID> filiereIds,
    @NotNull(message = "La date de début est obligatoire") LocalDate dateDebut,
    @NotNull(message = "La date de fin est obligatoire") LocalDate dateFin
) {
}
