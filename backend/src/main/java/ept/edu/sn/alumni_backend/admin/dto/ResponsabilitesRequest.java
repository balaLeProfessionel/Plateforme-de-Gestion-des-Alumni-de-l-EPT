package ept.edu.sn.alumni_backend.admin.dto;

import java.util.Set;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import jakarta.validation.constraints.NotNull;

/** Responsabilités d'un administrateur : la liste remplace les précédentes ; vide, il ne voit que le tableau de bord. */
public record ResponsabilitesRequest(
    @NotNull(message = "Indiquez les responsabilités, même aucune") Set<@NotNull PermissionAdmin> responsabilites
) {
}
