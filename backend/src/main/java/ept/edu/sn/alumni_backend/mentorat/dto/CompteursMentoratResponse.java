package ept.edu.sn.alumni_backend.mentorat.dto;

/**
 * Demandes reçues qui attendent ma réponse, et demandes que j'ai envoyées sans réponse encore,
 * avec la limite au-delà de laquelle je ne peux plus en envoyer.
 */
public record CompteursMentoratResponse(
    long demandesRecuesEnAttente,
    long demandesEnvoyeesEnAttente,
    int demandesEnAttenteMax
) {
}
