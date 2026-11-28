package ept.edu.sn.alumni_backend.emploi.dto;

import ept.edu.sn.alumni_backend.emploi.TypeQuestionOffre;
import ept.edu.sn.alumni_backend.emploi.entity.QuestionOffreEmploi;
import ept.edu.sn.alumni_backend.enums.TypeContrat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Offre publiée par un organisme, dont il reçoit les candidatures dans la plateforme (#222). L'entreprise est
 * l'organisme du compte ; le recruteur dit si la lettre est exigée et pose jusqu'à 5 questions.
 */
public record OffreGereeRequest(
    @NotBlank(message = "Le titre est obligatoire.") @Size(max = 150, message = "150 caractères au maximum.") String titre,
    @NotBlank(message = "La description est obligatoire.") @Size(max = 5000, message = "5000 caractères au maximum.") String description,
    @NotNull(message = "Le type de contrat est obligatoire.") TypeContrat typeContrat,
    @NotBlank(message = "Le lieu est obligatoire.") @Size(max = 150, message = "150 caractères au maximum.") String lieu,
    @NotNull(message = "La date d'expiration est obligatoire.") LocalDate dateExpiration,
    @Size(max = 15, message = "15 compétences au maximum.") List<@NotBlank @Size(max = 80, message = "80 caractères au maximum par compétence.") String> competences,
    @Size(max = 10, message = "10 filières au maximum.") List<@NotNull UUID> filieres,
    boolean lettreExigee,
    @Size(max = 5, message = "5 questions au maximum.") List<@NotNull @Valid Question> questions
) implements ContenuOffreRequest {
    public record Question(
        @NotBlank(message = "L'intitulé de la question est obligatoire.")
        @Size(max = QuestionOffreEmploi.LONGUEUR_INTITULE, message = "300 caractères au maximum.") String intitule,
        @NotNull(message = "Le type de réponse est obligatoire.") TypeQuestionOffre type,
        boolean obligatoire
    ) {
    }
}
