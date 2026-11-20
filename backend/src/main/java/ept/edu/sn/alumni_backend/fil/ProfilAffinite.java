package ept.edu.sn.alumni_backend.fil;

import java.util.Set;
import java.util.UUID;

/** Ce qui rapproche deux membres : promotion, filière, ville et organismes de leur parcours. */
public record ProfilAffinite(UUID id, Integer promotion, String filiere, String ville,
        Set<UUID> organismes, Set<String> secteurs) {

    public static ProfilAffinite inconnu(UUID id) {
        return new ProfilAffinite(id, null, null, null, Set.of(), Set.of());
    }
}
