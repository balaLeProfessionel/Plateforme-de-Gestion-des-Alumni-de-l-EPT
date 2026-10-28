package ept.edu.sn.alumni_backend.admin.dto;

import java.util.Map;

/** Nombre de comptes par statut ; les inscriptions en attente sont aussi détaillées par type de compte. */
public record ResumeComptesResponse(long enAttente, long actifs, long suspendus, Map<String, Long> enAttenteParRole) {
}
