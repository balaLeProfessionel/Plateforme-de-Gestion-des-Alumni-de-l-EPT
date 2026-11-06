package ept.edu.sn.alumni_backend.evenement.dto;

import java.time.Instant;

/** Ce qu'une personne sans compte voit d'un événement officiel : ni identifiant, ni organisateur, ni participants. */
public record EvenementPublicResponse(
    String titre,
    String lieu,
    Instant dateDebut,
    String urlImage
) {}
