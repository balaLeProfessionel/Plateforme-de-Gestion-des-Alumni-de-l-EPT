package ept.edu.sn.alumni_backend.stage.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Document PDF joint à une offre (fiche de poste, présentation de l'organisme…), 3 au plus par offre. */
@Entity
@Table(name = "piece_jointe_offre", indexes = @Index(name = "ix_piece_jointe_offre", columnList = "offre_id"))
@Getter
@Setter
@NoArgsConstructor
public class PieceJointeOffre {
    public static final int NOMBRE_MAXIMAL = 3;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offre_id", nullable = false)
    private OffreStage offre;

    /** Nom du fichier tel que l'utilisateur l'a envoyé, proposé au téléchargement. */
    @Column(name = "nom_fichier", nullable = false, length = 255)
    private String nomFichier;

    /** Nom aléatoire sur le disque. */
    @Column(name = "nom_stocke", nullable = false, length = 60, unique = true)
    private String nomStocke;

    @Column(nullable = false)
    private long taille;

    @Column(name = "ajoutee_le", nullable = false, updatable = false)
    private Instant ajouteeLe;

    public PieceJointeOffre(OffreStage offre, String nomFichier, String nomStocke, long taille) {
        this.offre = offre;
        this.nomFichier = nomFichier;
        this.nomStocke = nomStocke;
        this.taille = taille;
    }

    @PrePersist
    void initialiserDate() {
        ajouteeLe = Instant.now();
    }
}
