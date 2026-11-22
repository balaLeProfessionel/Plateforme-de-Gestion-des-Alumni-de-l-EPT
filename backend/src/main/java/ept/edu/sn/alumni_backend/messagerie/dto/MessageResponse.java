package ept.edu.sn.alumni_backend.messagerie.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * {@code contenu} est absent pour un message supprimé ; {@code deMoi} : écrit par la personne connectée.
 * {@code pieceJointe} est absente pour un message sans fichier ou supprimé. {@code systeme} : message de la plateforme
 * (« … a rejoint la communauté »), dont l'auteur est la personne concernée.
 */
public record MessageResponse(UUID id, UUID auteurId, String auteurNom, String auteurPhoto, String contenu,
    boolean supprime, Instant envoyeLe, boolean deMoi, PieceJointeResponse pieceJointe, boolean systeme) {}
