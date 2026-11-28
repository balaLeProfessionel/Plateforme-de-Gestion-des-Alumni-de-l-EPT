package ept.edu.sn.alumni_backend.emploi.dto;

import ept.edu.sn.alumni_backend.enums.TypeContrat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Offre vue ailleurs et relayée par un membre (#221). Obligatoires : titre, description, entreprise, type, lieu,
 * date d'expiration et lien vers l'offre d'origine.
 */
public record OffreRelayeeRequest(
    @NotBlank(message = "Le titre est obligatoire.") @Size(max = 150, message = "150 caractères au maximum.") String titre,
    @NotBlank(message = "La description est obligatoire.") @Size(max = 5000, message = "5000 caractères au maximum.") String description,
    @NotBlank(message = "L'entreprise est obligatoire.") @Size(max = 150, message = "150 caractères au maximum.") String entreprise,
    @NotNull(message = "Le type de contrat est obligatoire.") TypeContrat typeContrat,
    @NotBlank(message = "Le lieu est obligatoire.") @Size(max = 150, message = "150 caractères au maximum.") String lieu,
    @NotNull(message = "La date d'expiration est obligatoire.") LocalDate dateExpiration,
    @NotBlank(message = "Le lien vers l'offre d'origine est obligatoire.") @Size(max = 500, message = "500 caractères au maximum.") String lienSource,
    @Size(max = 60, message = "60 caractères au maximum.") String source,
    @Size(max = 15, message = "15 compétences au maximum.") List<@NotBlank @Size(max = 80, message = "80 caractères au maximum par compétence.") String> competences,
    @Size(max = 10, message = "10 filières au maximum.") List<@NotNull UUID> filieres
) implements ContenuOffreRequest {
}
