package ept.edu.sn.alumni_backend.mobilite.dto;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.Classe;
import ept.edu.sn.alumni_backend.mobilite.PeriodeMobilite;
import ept.edu.sn.alumni_backend.mobilite.PublicVise;
import ept.edu.sn.alumni_backend.mobilite.TypeMobilite;
import ept.edu.sn.alumni_backend.mobilite.TypePiece;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Champs d'une offre de mobilité. Filières et classes vides : offre ouverte à toutes. Les règles qui croisent plusieurs
 * champs (séjour et durée, type et public) sont vérifiées par le service.
 */
public record OffreMobiliteRequest(
    @NotBlank(message = "Le titre est obligatoire.") @Size(max = 150, message = "150 caractères au maximum.") String titre,
    @NotBlank(message = "La description est obligatoire.") @Size(max = 5000, message = "5000 caractères au maximum.") String description,
    @NotNull(message = "Le type de mobilité est obligatoire.") TypeMobilite type,
    @NotNull(message = "Le public visé est obligatoire.") PublicVise publicVise,
    @NotBlank(message = "Le pays est obligatoire.") @Size(max = 100, message = "100 caractères au maximum.") String pays,
    @Size(max = 100, message = "100 caractères au maximum.") String ville,
    @NotBlank(message = "L'année universitaire est obligatoire.")
    @Pattern(regexp = "\\d{4}-\\d{4}", message = "L'année universitaire s'écrit « 2027-2028 ».") String anneeUniversitaire,
    @NotNull(message = "La période est obligatoire.") PeriodeMobilite periode,
    @Min(value = 1, message = "Au moins 1 semaine.") @Max(value = 52, message = "52 semaines au maximum.") Integer dureeSemaines,
    @NotNull(message = "Le nombre de places est obligatoire.") @Min(value = 1, message = "Au moins 1 place.")
    @Max(value = 100, message = "100 places au maximum.") Integer nombrePlaces,
    @NotNull(message = "La date limite de candidature est obligatoire.") LocalDate dateLimite,
    Set<UUID> filiereIds,
    Set<Classe> classes,
    @NotEmpty(message = "Indiquez au moins une pièce à fournir.") Set<TypePiece> piecesDemandees
) {
}
