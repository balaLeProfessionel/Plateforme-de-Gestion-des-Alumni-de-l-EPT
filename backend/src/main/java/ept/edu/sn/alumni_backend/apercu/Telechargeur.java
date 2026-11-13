package ept.edu.sn.alumni_backend.apercu;

import java.io.IOException;
import java.net.URI;
import java.util.function.Predicate;

/** Lecture d'une ressource web publique ; isolée pour que les tests n'aillent pas sur Internet. */
public interface Telechargeur {
    /**
     * @param typeAccepte reçoit le {@code Content-Type} ; un type refusé arrête la lecture
     * @param tronquer vrai : au-delà de {@code poidsMax}, garder le début ; faux : refuser la ressource
     * @return {@code null} si la ressource n'est pas lisible (statut, type, poids)
     */
    Ressource lire(URI adresse, long poidsMax, Predicate<String> typeAccepte, boolean tronquer) throws IOException;

    record Ressource(URI adresse, String type, byte[] contenu) {}
}
