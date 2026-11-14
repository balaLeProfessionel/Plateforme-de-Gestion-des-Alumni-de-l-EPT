package ept.edu.sn.alumni_backend.messagerie.entity;

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

/**
 * Message d'une conversation. Supprimé, il garde sa ligne (affiché « Message supprimé ») pour que
 * l'historique et les non-lus restent cohérents. L'index sert à charger l'historique page par page.
 */
@Entity
@Table(name = "messages", indexes = @Index(
    name = "ix_message_conversation_envoi",
    columnList = "conversation_id, envoye_le"
))
@Getter
@Setter
public class Message {
    public static final int LONGUEUR_MAX_CONTENU = 2000;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    @Column(nullable = false, length = LONGUEUR_MAX_CONTENU)
    private String contenu;

    @Column(name = "envoye_le", nullable = false, updatable = false)
    private Instant envoyeLe;

    private Instant supprimeLe;

    @PrePersist
    void avantCreation() {
        if (envoyeLe == null) envoyeLe = Instant.now();
    }

    public boolean estSupprime() {
        return supprimeLe != null;
    }
}
