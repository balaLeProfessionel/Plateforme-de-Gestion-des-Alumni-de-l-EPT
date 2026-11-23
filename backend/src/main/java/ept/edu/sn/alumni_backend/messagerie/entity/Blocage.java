package ept.edu.sn.alumni_backend.messagerie.entity;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Check;

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
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

/**
 * Un membre en bloque un autre : aucun des deux n'écrit plus dans leur conversation directe, et la personne bloquée
 * ne peut pas en ouvrir une nouvelle. Les groupes ne sont pas concernés ; la personne bloquée n'est pas prévenue.
 */
@Entity
@Table(
    name = "blocages",
    uniqueConstraints = @UniqueConstraint(name = "uk_blocage_paire", columnNames = {"bloqueur_id", "bloque_id"}),
    indexes = @Index(name = "ix_blocage_bloque", columnList = "bloque_id")
)
@Check(name = "ck_blocage_distincts", constraints = "bloqueur_id <> bloque_id")
@Getter
@Setter
public class Blocage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bloqueur_id", nullable = false)
    private Utilisateur bloqueur;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bloque_id", nullable = false)
    private Utilisateur bloque;

    @Column(nullable = false, updatable = false)
    private Instant creeLe;

    @PrePersist
    void avantCreation() {
        if (creeLe == null) creeLe = Instant.now();
    }

    public static Blocage de(Utilisateur bloqueur, Utilisateur bloque) {
        Blocage blocage = new Blocage();
        blocage.setBloqueur(bloqueur);
        blocage.setBloque(bloque);
        return blocage;
    }
}
