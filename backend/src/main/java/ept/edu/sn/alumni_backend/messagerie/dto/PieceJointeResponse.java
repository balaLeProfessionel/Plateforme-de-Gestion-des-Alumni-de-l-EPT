package ept.edu.sn.alumni_backend.messagerie.dto;

/**
 * Fichier joint, décrit sans son contenu. Le fichier se demande à
 * {@code GET /api/messagerie/conversations/{id}/messages/{messageId}/piece-jointe}.
 * {@code image} : affiché dans le fil plutôt que proposé au téléchargement.
 */
public record PieceJointeResponse(String nom, String type, long taille, boolean image) {}
