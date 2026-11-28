package ept.edu.sn.alumni_backend.emploi.dto;

import java.util.UUID;

/** Réponse du candidat à une question de l'offre ; « OUI » ou « NON » pour une question oui/non. */
public record ReponseQuestionRequest(UUID questionId, String valeur) {
}
