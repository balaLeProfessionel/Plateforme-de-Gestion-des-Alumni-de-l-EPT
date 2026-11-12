package ept.edu.sn.alumni_backend.publication.entity;

import java.time.Instant;
import java.util.UUID;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** « J'aime » d'un membre sur une publication : au plus un par membre et par publication (contrainte en base). */
@Entity
@Table(name = "jaimes_publication",
    uniqueConstraints = @UniqueConstraint(name = "uk_jaime_publication_utilisateur",
        columnNames = {"publication_id", "utilisateur_id"}),
    indexes = @Index(name = "ix_jaimes_publication", columnList = "publication_id"))
@Getter
@Setter
public class JaimePublication {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "publication_id", nullable = false)
    private Publication publication;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private Instant creeLe;

    @PrePersist
    void dater() { creeLe = Instant.now(); }
}
