package ept.edu.sn.alumni_backend.mentorat.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Référentiel des domaines d'accompagnement, modifiable sans redéploiement. */
@Entity
@Table(name = "domaines_mentorat")
@Getter
@Setter
public class DomaineMentorat {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(nullable = false, length = 80)
    private String libelle;

    @Column(nullable = false)
    private boolean actif = true;

    @Column(nullable = false)
    private short ordre;
}
