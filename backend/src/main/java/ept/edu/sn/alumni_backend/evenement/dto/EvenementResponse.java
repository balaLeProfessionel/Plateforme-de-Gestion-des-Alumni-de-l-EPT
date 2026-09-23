package ept.edu.sn.alumni_backend.evenement.dto;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.evenement.AudienceEvenement;
import ept.edu.sn.alumni_backend.evenement.ReponseParticipation;
import ept.edu.sn.alumni_backend.evenement.StatutEvenement;

public record EvenementResponse(
    UUID id,
    String titre,
    String description,
    String lieu,
    Instant dateDebut,
    Instant dateFin,
    AudienceEvenement audience,
    Integer nombrePlaces,
    boolean officielEpt,
    StatutEvenement statut,
    UUID organisateurId,
    String organisateurNom,
    String organisateurPrenom,
    long nombreParticipants,
    ReponseParticipation maReponse
) {}
