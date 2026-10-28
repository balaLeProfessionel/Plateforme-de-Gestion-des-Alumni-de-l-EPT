package ept.edu.sn.alumni_backend.mentorat.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "jalons_programme", uniqueConstraints = @UniqueConstraint(
    name = "uk_jalon_programme_ordre",
    columnNames = {"programme_id", "ordre"}
))
@Getter
@Setter
public class JalonProgramme {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "programme_id", nullable = false)
    private ProgrammeMentorat programme;

    @Column(nullable = false, length = 150)
    private String titre;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private short ordre;
}
