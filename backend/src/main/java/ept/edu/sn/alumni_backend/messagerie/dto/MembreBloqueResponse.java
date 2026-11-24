package ept.edu.sn.alumni_backend.messagerie.dto;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeRole;

/** Un membre que j'ai bloqué : jamais d'e-mail ni de téléphone. */
public record MembreBloqueResponse(UUID id, String prenom, String nom, String nomAffiche, String urlPhoto, TypeRole role,
    Instant bloqueLe) {}
