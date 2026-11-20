package ept.edu.sn.alumni_backend.publication.dto;

import java.time.Instant;
import java.util.UUID;
import ept.edu.sn.alumni_backend.publication.MotifSignalement;
import ept.edu.sn.alumni_backend.publication.StatutPublication;
import ept.edu.sn.alumni_backend.publication.StatutSignalement;
import ept.edu.sn.alumni_backend.publication.TypePublication;

/** Ligne de la file de modération : le signalement et un extrait de la publication visée. */
public record SignalementResponse(UUID id, MotifSignalement motif, String detail, StatutSignalement statut,
    Instant creeLe, Instant traiteLe, String signaleParPrenom, String signaleParNom, String traiteParPrenom,
    String traiteParNom, PublicationSignalee publication) {

    public record PublicationSignalee(UUID id, TypePublication type, String titre, String contenu, String urlImage,
        StatutPublication statut, Instant publieLe, UUID auteurId, String auteurPrenom, String auteurNom) {}
}
