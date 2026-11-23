package ept.edu.sn.alumni_backend.admin.dto;

import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.Classe;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Passage annuel : les étudiants choisis quittent classeDepart (null : classe non renseignée) pour classeArrivee.
 * La classe de départ protège d'une double application : un étudiant déjà passé est laissé de côté.
 */
public record PassageClasseRequest(
    @NotEmpty(message = "Choisissez au moins un étudiant") @Size(max = 500) List<@NotNull UUID> ids,
    Classe classeDepart,
    @NotNull(message = "Choisissez la classe d'arrivée") Classe classeArrivee
) {
}
