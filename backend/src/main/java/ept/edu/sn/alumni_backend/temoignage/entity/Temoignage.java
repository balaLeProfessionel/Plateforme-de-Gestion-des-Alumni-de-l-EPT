package ept.edu.sn.alumni_backend.temoignage.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Témoignage affiché sur la page publique : il n'y paraît qu'une fois publié. */
@Entity
@Table(name = "temoignages")
@Getter
@Setter
public class Temoignage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nom;

    /** Promotion telle qu'affichée, par exemple « D1994 ». */
    private String promotion;

    @Column(nullable = false)
    private String fonction;

    private String organisation;

    private String pays;

    @Column(nullable = false, length = 600)
    private String texte;

    private String urlPhoto;

    @Column(nullable = false)
    private boolean publie = false;

    @Column(nullable = false)
    private int ordre = 0;

    @Column(nullable = false, updatable = false)
    private Instant creeLe;

    @PrePersist
    void avantCreation() {
        creeLe = Instant.now();
    }
}
