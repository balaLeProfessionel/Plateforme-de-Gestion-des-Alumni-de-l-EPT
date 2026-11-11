package ept.edu.sn.alumni_backend.admin.dto;

import ept.edu.sn.alumni_backend.enums.Classe;
import jakarta.validation.constraints.NotNull;

public record ClasseRequest(@NotNull(message = "Choisissez la classe") Classe classe) {
}
