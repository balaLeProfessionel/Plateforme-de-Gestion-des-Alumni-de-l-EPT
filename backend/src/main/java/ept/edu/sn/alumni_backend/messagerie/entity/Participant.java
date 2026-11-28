package ept.edu.sn.alumni_backend.messagerie.entity;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.messagerie.RoleParticipant;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * Appartenance d'un utilisateur à une conversation. Porte aussi son état de lecture :
 * les messages envoyés après {@code dernierLuLe} par les autres sont ses non-lus.
 */
@Entity
@Table(
    name = "participants_conversation",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_participant_conversation_utilisateur",
        columnNames = {"conversation_id", "utilisateur_id"}
    ),
    indexes = @Index(name = "ix_participant_utilisateur", columnList = "utilisateur_id")
)
@Getter
@Setter
public class Participant {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private RoleParticipant role = RoleParticipant.MEMBRE;

    @Column(nullable = false, updatable = false)
    private Instant rejointLe;

    /** Absent tant que la personne n'a jamais ouvert la conversation : tout est alors non lu. */
    private Instant dernierLuLe;

    @PrePersist
    void avantCreation() {
        if (rejointLe == null) rejointLe = Instant.now();
    }

    public static Participant de(Conversation conversation, Utilisateur utilisateur, RoleParticipant role) {
        Participant participant = new Participant();
        participant.setConversation(conversation);
        participant.setUtilisateur(utilisateur);
        participant.setRole(role);
        return participant;
    }
}
