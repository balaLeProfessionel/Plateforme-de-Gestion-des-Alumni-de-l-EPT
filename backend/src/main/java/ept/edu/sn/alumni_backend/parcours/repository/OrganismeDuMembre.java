package ept.edu.sn.alumni_backend.parcours.repository;

import java.util.UUID;

/** Organisme (et son secteur) où un membre a travaillé, d'après son parcours. */
public interface OrganismeDuMembre {
    UUID getUtilisateurId();
    UUID getOrganismeId();
    String getSecteur();
}
