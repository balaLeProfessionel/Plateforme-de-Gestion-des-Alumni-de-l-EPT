package ept.edu.sn.alumni_backend.mentorat.dto;

import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeRole;

/** Carte d'un mentor dans la recherche. */
public record MentorResponse(
    UUID profilId,
    UUID utilisateurId,
    String nom,
    String prenom,
    String urlPhoto,
    String posteActuel,
    String filiere,
    Integer anneeSortie,
    String presentation,
    List<DomaineMentoratResponse> domaines,
    boolean disponible,
    int placesRestantes,
    boolean demandeEnCours,
    TypeRole role
) {
}
