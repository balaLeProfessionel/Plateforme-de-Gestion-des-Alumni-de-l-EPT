package ept.edu.sn.alumni_backend.filiere.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record ChefDepartementRequest(@NotNull(message = "Choisissez le chef de département.") UUID chefId) {
}
