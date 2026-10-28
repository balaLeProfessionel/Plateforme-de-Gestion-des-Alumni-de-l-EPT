package ept.edu.sn.alumni_backend.admin.dto;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChangementRoleRequest(
    @NotNull(message = "Choisissez le nouveau rôle") TypeRole role,
    @NotBlank(message = "Le motif est obligatoire") @Size(max = 500) String motif
) {
}
