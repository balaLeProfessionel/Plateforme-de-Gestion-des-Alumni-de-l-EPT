package ept.edu.sn.alumni_backend.messagerie.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Fichier joint à un message (un seul par message). Le fichier est sur le disque du serveur sous
 * l'identifiant {@code fichier} ; il n'est jamais public : on le sert seulement aux participants.
 * Le type est celui reconnu par le serveur, jamais celui annoncé par le navigateur.
 */
@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class PieceJointe {
    public static final int LONGUEUR_MAX_NOM = 255;

    @Column(name = "piece_jointe_fichier", length = 36)
    private String fichier;

    @Column(name = "piece_jointe_nom", length = LONGUEUR_MAX_NOM)
    private String nom;

    @Column(name = "piece_jointe_type", length = 100)
    private String type;

    @Column(name = "piece_jointe_taille")
    private Long taille;
}
