package ept.edu.sn.alumni_backend.stage.dto;

import java.time.LocalDate;
import java.util.UUID;

import ept.edu.sn.alumni_backend.stage.TypeStage;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Stage trouvé par l'étudiant hors offre (STA-10). L'organisme est choisi parmi ceux de la plateforme (organismeId)
 * ou nommé librement (nomOrganisme) ; l'administrateur Stages l'enregistre alors à la validation.
 */
public record DeclarationStageRequest(
    UUID organismeId,
    @Size(max = 150, message = "150 caractères au plus pour l'organisme") String nomOrganisme,
    @NotNull(message = "Choisissez le type de stage") TypeStage typeStage,
    @NotBlank(message = "Le sujet est obligatoire") @Size(max = 150, message = "150 caractères au plus pour le sujet") String sujet,
    @Size(max = 150, message = "150 caractères au plus pour le lieu") String lieu,
    @NotNull(message = "La date de début est obligatoire") LocalDate dateDebut,
    @NotNull(message = "La date de fin est obligatoire") LocalDate dateFin,
    @NotBlank(message = "Le nom du maître de stage est obligatoire") @Size(max = 150) String tuteurNom,
    @Size(max = 150) String tuteurFonction,
    @Email(message = "Adresse e-mail du maître de stage invalide") @Size(max = 150) String tuteurEmail,
    @Size(max = 30) String tuteurTelephone
) {
}
