package ept.edu.sn.alumni_backend.mobilite.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Une mobilité, sortante ou entrante. L'e-mail d'un accueilli n'est rempli que pour le chef et son établissement. */
public record MobiliteResponse(
    UUID id,
    String sens,
    String statut,
    String type,
    String anneeUniversitaire,
    LocalDate dateDebut,
    LocalDate dateFin,
    Organisme organisme,
    /** Sortante : le membre de l'EPT ; entrante : l'étudiant accueilli. */
    Personne personne,
    String programmeOrigine,
    String filiereAccueil,
    UUID filiereAccueilId,
    /** Sortante : l'offre d'origine. */
    Offre offre,
    String motif,
    Instant creeeLe
) {
    public record Organisme(UUID id, String nom) {
    }

    public record Personne(UUID id, String prenom, String nom, String email) {
    }

    public record Offre(UUID id, String titre, String periode) {
    }
}
