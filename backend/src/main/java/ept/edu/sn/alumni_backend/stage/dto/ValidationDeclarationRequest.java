package ept.edu.sn.alumni_backend.stage.dto;

import java.util.UUID;

import jakarta.validation.constraints.Size;

/**
 * Validation d'une déclaration : l'organisme retenu, existant (organismeId) ou à créer (nomNouvelOrganisme). Sans
 * aucun des deux, celui de la déclaration est repris.
 */
public record ValidationDeclarationRequest(UUID organismeId, @Size(max = 150) String nomNouvelOrganisme) {
}
