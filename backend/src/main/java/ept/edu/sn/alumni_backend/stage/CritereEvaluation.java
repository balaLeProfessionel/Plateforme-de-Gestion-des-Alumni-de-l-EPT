package ept.edu.sn.alumni_backend.stage;

/** Critères de la fiche d'évaluation de l'école (STA-06), dans l'ordre de la fiche : 8 techniques, 6 personnels. */
public enum CritereEvaluation {
    RESPECT_SECURITE(Section.TECHNIQUE, "Respect des consignes de sécurité"),
    COMPREHENSION_TACHES(Section.TECHNIQUE, "Compréhension des tâches confiées"),
    ADAPTATION(Section.TECHNIQUE, "Capacité d’adaptation"),
    CONNAISSANCES_THEORIQUES(Section.TECHNIQUE, "Application des connaissances théoriques"),
    QUALITE_TRAVAIL(Section.TECHNIQUE, "Qualité du travail réalisé"),
    ORGANISATION(Section.TECHNIQUE, "Sens de l’organisation"),
    AUTONOMIE(Section.TECHNIQUE, "Autonomie dans le travail"),
    DELAIS_OBJECTIFS(Section.TECHNIQUE, "Respect des délais et objectifs"),
    MOTIVATION(Section.PERSONNELLE, "Motivation et implication"),
    INITIATIVE(Section.PERSONNELLE, "Esprit d’initiative"),
    COMMUNICATION(Section.PERSONNELLE, "Communication orale et écrite"),
    TRAVAIL_EQUIPE(Section.PERSONNELLE, "Travail en équipe"),
    SAVOIR_ETRE(Section.PERSONNELLE, "Comportement et savoir-être"),
    PONCTUALITE(Section.PERSONNELLE, "Ponctualité et assiduité");

    public enum Section { TECHNIQUE, PERSONNELLE }

    private final Section section;
    private final String libelle;

    CritereEvaluation(Section section, String libelle) {
        this.section = section;
        this.libelle = libelle;
    }

    public Section section() {
        return section;
    }

    public String libelle() {
        return libelle;
    }
}
