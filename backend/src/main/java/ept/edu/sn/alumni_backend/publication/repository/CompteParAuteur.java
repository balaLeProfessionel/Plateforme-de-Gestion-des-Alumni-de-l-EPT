package ept.edu.sn.alumni_backend.publication.repository;

import java.util.UUID;

/** Projection d'un comptage groupé par auteur de publication (interactions d'un lecteur avec ses publications). */
public interface CompteParAuteur {
    UUID getAuteurId();
    long getNombre();
}
