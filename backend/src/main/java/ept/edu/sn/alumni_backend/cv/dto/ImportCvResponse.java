package ept.edu.sn.alumni_backend.cv.dto;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.cv.extraction.ProfilExtrait;

/** État d'un import ; le profil extrait n'est présent que lorsque le statut vaut PRET. */
public record ImportCvResponse(
    UUID id,
    String statut,
    String typeSource,
    String message,
    ProfilExtrait profil,
    Instant expireLe
) {}
