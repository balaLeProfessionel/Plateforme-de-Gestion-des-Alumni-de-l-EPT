package ept.edu.sn.alumni_backend.competence.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

/**
 * Compétence du référentiel commun, créée à la volée quand un membre en cite une nouvelle.
 * La clé normalisée (sans accents ni casse) fusionne « Spring Boot » et « spring-boot ».
 */
@Entity
@Table(name = "competences",
    uniqueConstraints = @UniqueConstraint(name = "uk_competences_cle", columnNames = "cle"))
@Getter
@Setter
public class Competence {
    public static final int LONGUEUR_MAX = 80;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Forme affichée, telle que saisie par le premier membre qui l'a citée. */
    @Column(nullable = false, length = LONGUEUR_MAX)
    private String libelle;

    @Column(nullable = false, length = LONGUEUR_MAX)
    private String cle;
}
