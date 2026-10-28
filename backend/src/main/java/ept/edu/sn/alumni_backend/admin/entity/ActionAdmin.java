package ept.edu.sn.alumni_backend.admin.entity;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Une ligne du journal d'administration : jamais modifiée ni supprimée. */
@Entity
@Table(name = "actions_admin", indexes = @Index(name = "ix_action_admin_cible", columnList = "cible_id, date_action"))
@Getter
@Setter
@NoArgsConstructor
public class ActionAdmin {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    private Utilisateur admin;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cible_id", nullable = false)
    private Utilisateur cible;

    @Convert(converter = TypeActionAdminConverter.class)
    @Column(nullable = false, length = 40)
    private TypeActionAdmin type;

    @Column(length = 500)
    private String motif;

    /** Ce qui a changé, lisible tel quel (« ALUMNI → ADMIN », « Promotion 2026 »). */
    @Column(length = 200)
    private String details;

    @Column(name = "date_action", nullable = false, updatable = false)
    private Instant dateAction;

    public ActionAdmin(Utilisateur admin, Utilisateur cible, TypeActionAdmin type, String motif) {
        this(admin, cible, type, motif, null);
    }

    public ActionAdmin(Utilisateur admin, Utilisateur cible, TypeActionAdmin type, String motif, String details) {
        this.admin = admin;
        this.cible = cible;
        this.type = type;
        this.motif = motif;
        this.details = details;
    }

    @PrePersist
    void initialiserDate() {
        dateAction = Instant.now();
    }
}
