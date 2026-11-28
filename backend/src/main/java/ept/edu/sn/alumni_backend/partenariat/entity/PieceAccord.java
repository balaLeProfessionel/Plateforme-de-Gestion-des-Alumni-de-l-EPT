package ept.edu.sn.alumni_backend.partenariat.entity;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
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

/** Document PDF d'un accord (texte de l'accord, annexe, exemplaire signé), 10 au plus. */
@Entity
@Table(name = "piece_accord", indexes = @Index(name = "ix_piece_accord", columnList = "accord_id"))
@Getter
@NoArgsConstructor
public class PieceAccord {
    public static final int NOMBRE_MAXIMAL = 10;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "accord_id", nullable = false)
    private AccordCollaboration accord;

    @Column(name = "nom_fichier", nullable = false, length = 255)
    private String nomFichier;

    @Column(name = "nom_stocke", nullable = false, length = 60, unique = true)
    private String nomStocke;

    @Column(nullable = false)
    private long taille;

    @Column(name = "deposee_par_organisme", nullable = false)
    private boolean deposeeParOrganisme;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ajoutee_par_id", nullable = false)
    private Utilisateur ajouteePar;

    @Column(name = "ajoutee_le", nullable = false, updatable = false)
    private Instant ajouteeLe;

    public PieceAccord(AccordCollaboration accord, String nomFichier, String nomStocke, long taille, boolean deposeeParOrganisme, Utilisateur ajouteePar) {
        this.accord = accord;
        this.nomFichier = nomFichier;
        this.nomStocke = nomStocke;
        this.taille = taille;
        this.deposeeParOrganisme = deposeeParOrganisme;
        this.ajouteePar = ajouteePar;
    }

    @PrePersist
    void initialiserDate() {
        ajouteeLe = Instant.now();
    }
}
