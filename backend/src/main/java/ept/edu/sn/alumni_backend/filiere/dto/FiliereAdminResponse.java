package ept.edu.sn.alumni_backend.filiere.dto;

import java.time.Instant;
import java.util.UUID;

/** Une ligne de l'écran « Filières » de l'administration. */
public record FiliereAdminResponse(UUID id, String nom, boolean active, long nombreComptes, Chef chef) {
    /** Chef de département, ou null. */
    public record Chef(UUID id, String prenom, String nom, Instant designeLe) {
    }
}
