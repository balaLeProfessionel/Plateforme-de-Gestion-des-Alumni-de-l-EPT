package ept.edu.sn.alumni_backend.mentorat.dto;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.mentorat.ModaliteSeance;
import ept.edu.sn.alumni_backend.mentorat.StatutSeance;

public record SeanceMentoratResponse(
    UUID id,
    Instant debut,
    int dureeMinutes,
    ModaliteSeance modalite,
    String lieuOuLien,
    StatutSeance statut,
    String compteRendu,
    UUID proposeeParId
) {
}
