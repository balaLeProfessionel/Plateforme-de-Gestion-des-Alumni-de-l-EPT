package ept.edu.sn.alumni_backend.stage.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;

import ept.edu.sn.alumni_backend.stage.TypeSollicitation;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Message envoyé aux organismes par l'administrateur Stages (STA-11). Les destinataires sont copiés tels qu'au moment
 * de l'envoi (nom et adresse) : l'historique reste juste si un organisme change d'adresse ou disparaît.
 */
@Entity
@Table(name = "sollicitation")
@Getter
@Setter
@NoArgsConstructor
public class Sollicitation {
    public static final int LONGUEUR_OBJET = 200;
    public static final int LONGUEUR_MESSAGE = 5000;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TypeSollicitation type;

    @Column(nullable = false, length = LONGUEUR_OBJET)
    private String objet;

    @Column(nullable = false, length = LONGUEUR_MESSAGE)
    private String message;

    @ElementCollection
    @BatchSize(size = 50)
    @CollectionTable(name = "sollicitation_destinataire", joinColumns = @JoinColumn(name = "sollicitation_id"))
    @OrderColumn(name = "rang")
    private List<Destinataire> destinataires = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "envoyee_par_id", nullable = false)
    private Utilisateur envoyeePar;

    @Column(name = "envoyee_le", nullable = false, updatable = false)
    private Instant envoyeeLe;

    @PrePersist
    void initialiserDate() {
        envoyeeLe = Instant.now();
    }

    @Embeddable
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Destinataire {
        @Column(name = "organisme_id")
        private UUID organismeId;

        @Column(name = "nom", nullable = false, length = 150)
        private String nom;

        @Column(name = "email", nullable = false, length = 150)
        private String email;
    }
}
