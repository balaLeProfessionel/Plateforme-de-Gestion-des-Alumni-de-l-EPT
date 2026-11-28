package ept.edu.sn.alumni_backend.emploi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Réponse d'un candidat à une question de l'offre (#222) ; « OUI » ou « NON » pour une question oui/non. */
@Entity
@Table(name = "reponse_candidature_emploi")
@Getter
@Setter
@NoArgsConstructor
public class ReponseCandidatureEmploi {
    public static final int LONGUEUR_REPONSE = 2000;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidature_id", nullable = false)
    private CandidatureEmploi candidature;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private QuestionOffreEmploi question;

    @Column(nullable = false, length = LONGUEUR_REPONSE)
    private String valeur;

    public ReponseCandidatureEmploi(CandidatureEmploi candidature, QuestionOffreEmploi question, String valeur) {
        this.candidature = candidature;
        this.question = question;
        this.valeur = valeur;
    }
}
