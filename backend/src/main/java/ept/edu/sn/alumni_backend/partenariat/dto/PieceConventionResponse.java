package ept.edu.sn.alumni_backend.partenariat.dto;

import java.time.Instant;
import java.util.UUID;

/** Un document de la convention ; supprimable indique si la personne connectée peut le retirer. */
public record PieceConventionResponse(UUID id, String nomFichier, long taille, boolean deposeeParOrganisme, Instant ajouteeLe, boolean supprimable) {
}
