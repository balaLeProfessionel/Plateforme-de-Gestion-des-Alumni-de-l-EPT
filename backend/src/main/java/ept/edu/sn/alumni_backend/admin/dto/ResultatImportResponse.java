package ept.edu.sn.alumni_backend.admin.dto;

import java.util.List;
import java.util.UUID;

/** Rapport d'import : une entrée par ligne, avec le mot de passe provisoire des comptes créés. */
public record ResultatImportResponse(int crees, List<Ligne> lignes) {
    public record Ligne(int numero, String email, boolean creee, String message, UUID id, String motDePasseTemporaire) {
    }
}
