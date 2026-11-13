package ept.edu.sn.alumni_backend.notification;

import java.time.Instant;
import java.util.UUID;

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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Notification affichée dans la cloche de l'application (TRA-06), en plus de l'e-mail éventuel. */
@Entity
@Table(name = "notifications", indexes = @Index(name = "idx_notification_destinataire", columnList = "destinataire_id, lue"))
@Getter
@Setter
@NoArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "destinataire_id", nullable = false)
    private Utilisateur destinataire;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TypeNotification type;

    @Column(nullable = false, length = 120)
    private String titre;

    @Column(nullable = false, length = 500)
    private String message;

    /** Page de l'application à ouvrir au clic (« /mentorat/suivi/… ») ; absente si rien à ouvrir. */
    @Column(length = 200)
    private String lien;

    @Column(nullable = false)
    private boolean lue = false;

    @Column(nullable = false, updatable = false)
    private Instant creeLe;

    @PrePersist
    void avantCreation() {
        if (creeLe == null) creeLe = Instant.now();
    }
}
