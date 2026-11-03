package ept.edu.sn.alumni_backend.publication.entity;

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
import lombok.Setter;

@Entity
@Table(name = "commentaires_publication", indexes = {
    @Index(name = "ix_commentaires_publication_date", columnList = "publication_id, cree_le")
})
@Getter
@Setter
public class CommentairePublication {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "publication_id", nullable = false)
    private Publication publication;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private CommentairePublication parent;

    @Column(nullable = false, length = 2000)
    private String contenu;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private Instant creeLe;

    @PrePersist
    void initialiserDate() { creeLe = Instant.now(); }
}
