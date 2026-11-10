package ept.edu.sn.alumni_backend.filiere.entity;

import java.text.Normalizer;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;

import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Filière de l'école (TRA-14), gérée par l'administration. Une filière retirée n'est plus proposée, mais reste sur
 * les comptes qui l'ont. La clé rend le nom unique sans tenir compte de la casse, des accents ni des espaces :
 * « Génie civil » et « genie  Civil » sont la même filière.
 */
@Entity
@Table(name = "filiere", uniqueConstraints = @UniqueConstraint(name = "uk_filiere_cle", columnNames = "cle"))
@BatchSize(size = 50)
@Getter
@Setter
@NoArgsConstructor
public class Filiere {
    public static final int LONGUEUR_NOM = 120;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = LONGUEUR_NOM)
    private String nom;

    @Column(nullable = false, length = LONGUEUR_NOM)
    private String cle;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "creee_le", nullable = false, updatable = false)
    private Instant creeeLe;

    /** Vide pour les filières de départ et celles reprises des anciens comptes. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creee_par_id")
    private Utilisateur creeePar;

    public Filiere(String nom, Utilisateur creeePar) {
        renommer(nom);
        this.creeePar = creeePar;
    }

    public void renommer(String nouveauNom) {
        this.nom = nettoyer(nouveauNom);
        this.cle = cle(nouveauNom);
    }

    @PrePersist
    void initialiserDate() {
        creeeLe = Instant.now();
    }

    /** Espaces superflus retirés : c'est le nom affiché. */
    public static String nettoyer(String nom) {
        return nom == null ? "" : nom.strip().replaceAll("\\s+", " ");
    }

    /** Nom sans casse, accents ni espaces superflus : deux noms de même clé désignent la même filière. */
    public static String cle(String nom) {
        String sansAccents = Normalizer.normalize(nettoyer(nom), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return sansAccents.toLowerCase(Locale.ROOT);
    }
}
