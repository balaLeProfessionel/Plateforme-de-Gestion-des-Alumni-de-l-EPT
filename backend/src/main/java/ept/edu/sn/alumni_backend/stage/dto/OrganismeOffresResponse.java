package ept.edu.sn.alumni_backend.stage.dto;

import java.util.UUID;

/** Organisme proposé dans le filtre de la liste des offres. */
public record OrganismeOffresResponse(UUID id, String nom) {
}
