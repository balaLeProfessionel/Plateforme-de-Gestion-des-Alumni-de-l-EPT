package ept.edu.sn.alumni_backend.stage.dto;

import java.util.UUID;

/** Étudiant proposé par la recherche (nom, classe, filière), pour l'ajouter à une liste définitive. */
public record EtudiantSuggestionResponse(UUID id, String prenom, String nom, String filiere, String classe, Integer anneeEntree, String urlPhoto) {
}
