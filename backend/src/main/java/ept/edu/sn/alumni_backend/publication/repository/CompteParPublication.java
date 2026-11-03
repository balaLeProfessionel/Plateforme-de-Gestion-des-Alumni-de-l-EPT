package ept.edu.sn.alumni_backend.publication.repository;

import java.util.UUID;

/** Projection d'un comptage groupé par publication (« J'aime », commentaires). */
public interface CompteParPublication {
    UUID getPublicationId();
    long getNombre();
}
