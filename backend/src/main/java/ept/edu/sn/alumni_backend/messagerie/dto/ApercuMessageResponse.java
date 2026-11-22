package ept.edu.sn.alumni_backend.messagerie.dto;

import java.time.Instant;
import java.util.UUID;

/** Dernier message d'une conversation, dans la liste. {@code contenu} est vide pour un message supprimé. */
public record ApercuMessageResponse(UUID auteurId, String auteurNom, String contenu, boolean supprime, Instant envoyeLe,
    boolean systeme) {}
