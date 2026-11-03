package ept.edu.sn.alumni_backend.publication.dto;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.publication.AudiencePublication;
import ept.edu.sn.alumni_backend.publication.TypePublication;

public record PublicationResponse(UUID id, TypePublication type, String titre, String contenu,
    AudiencePublication audience, String urlImage, String texteAlternatif, Instant publieLe, Instant modifieLe,
    UUID auteurId, String auteurNom, String auteurPrenom, TypeRole auteurRole, String auteurPhoto) {}
