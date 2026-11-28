package ept.edu.sn.alumni_backend.mobilite.entity;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.mobilite.TypePiece;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Un PDF du dossier de candidature, pour une des pièces que l'offre demande : une seule par type. */
@Entity
@Table(name = "piece_candidature_mobilite",
    uniqueConstraints = @UniqueConstraint(name = "uk_piece_candidature_mobilite_type", columnNames = {"candidature_id", "type_piece"}))
@Getter
@Setter
@NoArgsConstructor
public class PieceCandidatureMobilite {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidature_id", nullable = false)
    private CandidatureMobilite candidature;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_piece", nullable = false, length = 30)
    private TypePiece type;

    @Column(name = "nom_fichier", nullable = false, length = 255)
    private String nomFichier;

    @Column(name = "nom_stocke", nullable = false, length = 60, unique = true)
    private String nomStocke;

    @Column(nullable = false)
    private long taille;

    @Column(name = "deposee_le", nullable = false)
    private Instant deposeeLe;

    public PieceCandidatureMobilite(CandidatureMobilite candidature, TypePiece type) {
        this.candidature = candidature;
        this.type = type;
    }

    /** Nouveau fichier pour cette pièce (dépôt ou remplacement). */
    public void deposer(String nomFichier, String nomStocke, long taille) {
        this.nomFichier = nomFichier;
        this.nomStocke = nomStocke;
        this.taille = taille;
        this.deposeeLe = Instant.now();
    }
}
