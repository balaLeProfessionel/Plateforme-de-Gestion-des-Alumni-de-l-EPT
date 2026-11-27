package ept.edu.sn.alumni_backend.emploi.dto;

import java.time.Instant;

/** CV de la dernière candidature du membre (stage ou emploi), qu'il peut reprendre au lieu d'en envoyer un nouveau. */
public record DernierCvResponse(String nomCv, Instant envoyeLe) {
}
