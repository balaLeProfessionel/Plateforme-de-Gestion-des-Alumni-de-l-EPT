package ept.edu.sn.alumni_backend.emploi.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Candidature reçue par une offre gérée, vue par son organisme ou l'administration des offres (#223). Le profil vient du
 * compte du candidat sur la plateforme ; ses coordonnées sont dans son CV. La note privée n'est jamais montrée au candidat.
 */
public record CandidatureRecueEmploiResponse(
    UUID id,
    Candidat candidat,
    String statut,
    /** Statuts que le recruteur peut donner ensuite ; vide une fois la candidature décidée. */
    List<String> statutsSuivants,
    String nomCv,
    /** Faux une fois le CV effacé après la durée de conservation. */
    boolean cvDisponible,
    String lettreMotivation,
    List<MaCandidatureEmploiResponse.Reponse> reponses,
    String notePrivee,
    Instant envoyeeLe,
    List<Changement> historique
) {
    /** Profil vérifié du candidat : filière, promotion (année de sortie pour un alumni), compétences déclarées. */
    public record Candidat(UUID id, String prenom, String nom, String role, String urlPhoto, String filiere, String classe,
            Integer anneeEntree, Integer anneeSortie, List<String> competences) {
    }

    /** « Présélectionnée le 3 décembre par Awa Diop ». */
    public record Changement(String statut, Instant le, String auteur) {
    }
}
