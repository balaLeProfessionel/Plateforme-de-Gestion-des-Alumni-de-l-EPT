package ept.edu.sn.alumni_backend.emploi.entity;

import ept.edu.sn.alumni_backend.emploi.TypeQuestionOffre;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

/** Question posée aux candidats d'une offre gérée (#222), à réponse libre ou oui/non. */
@Entity
@Table(name = "question_offre_emploi")
@Getter
@Setter
@NoArgsConstructor
public class QuestionOffreEmploi {
    public static final int LONGUEUR_INTITULE = 300;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offre_id", nullable = false)
    private OffreEmploi offre;

    @Column(nullable = false)
    private int ordre;

    @Column(nullable = false, length = LONGUEUR_INTITULE)
    private String intitule;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TypeQuestionOffre type;

    @Column(nullable = false)
    private boolean obligatoire;

    public QuestionOffreEmploi(OffreEmploi offre, int ordre, String intitule, TypeQuestionOffre type, boolean obligatoire) {
        this.offre = offre;
        this.ordre = ordre;
        this.intitule = intitule;
        this.type = type;
        this.obligatoire = obligatoire;
    }

    /** Même question pour le candidat : intitulé, type et caractère obligatoire. */
    public boolean equivalente(String autreIntitule, TypeQuestionOffre autreType, boolean autreObligatoire) {
        return intitule.equals(autreIntitule) && type == autreType && obligatoire == autreObligatoire;
    }
}
