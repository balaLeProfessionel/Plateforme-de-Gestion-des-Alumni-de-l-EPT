package ept.edu.sn.alumni_backend.stage.entity;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.stage.AvisOrganisme;
import ept.edu.sn.alumni_backend.stage.StatutCandidature;
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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Candidature d'un étudiant à une offre (STA-03) : une seule par offre et par étudiant. Retirée puis renvoyée, c'est
 * la même ligne qui repasse à ENVOYEE.
 */
@Entity
@Table(name = "candidature",
    uniqueConstraints = @UniqueConstraint(name = "uk_candidature_offre_etudiant", columnNames = {"offre_id", "etudiant_id"}),
    indexes = @Index(name = "ix_candidature_etudiant", columnList = "etudiant_id"))
@Getter
@Setter
@NoArgsConstructor
public class Candidature {
    public static final int LONGUEUR_LETTRE = 3000;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offre_id", nullable = false)
    private OffreStage offre;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "etudiant_id", nullable = false)
    private Utilisateur etudiant;

    /** CV PDF (nom de stockage) et nom du fichier envoyé. */
    @Column(name = "cv", nullable = false, length = 60)
    private String cv;

    @Column(name = "nom_cv", nullable = false, length = 255)
    private String nomCv;

    @Column(name = "lettre_motivation", length = LONGUEUR_LETTRE)
    private String lettreMotivation;

    @Convert(converter = EnumTexteConverters.StatutCandidatureConverter.class)
    @Column(nullable = false, length = 20)
    private StatutCandidature statut;

    @Convert(converter = EnumTexteConverters.AvisOrganismeConverter.class)
    @Column(name = "avis_organisme", nullable = false, length = 20)
    private AvisOrganisme avisOrganisme = AvisOrganisme.EN_ATTENTE;

    @Column(name = "envoyee_le", nullable = false)
    private Instant envoyeeLe;

    @Column(name = "retiree_le")
    private Instant retireeLe;

    @Column(name = "avis_donne_le")
    private Instant avisDonneLe;

    @Version
    private long version;

    public Candidature(OffreStage offre, Utilisateur etudiant) {
        this.offre = offre;
        this.etudiant = etudiant;
    }

    /** Envoi ou renvoi : l'avis éventuel de l'organisme repart de zéro, puisqu'il portait sur l'envoi précédent. */
    public void envoyer(String lettre) {
        statut = StatutCandidature.ENVOYEE;
        lettreMotivation = lettre;
        envoyeeLe = Instant.now();
        retireeLe = null;
        avisOrganisme = AvisOrganisme.EN_ATTENTE;
        avisDonneLe = null;
    }

    public void retirer() {
        statut = StatutCandidature.RETIREE;
        retireeLe = Instant.now();
    }
}
