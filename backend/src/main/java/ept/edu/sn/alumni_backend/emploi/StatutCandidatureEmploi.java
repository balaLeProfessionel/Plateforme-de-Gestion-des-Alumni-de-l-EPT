package ept.edu.sn.alumni_backend.emploi;

import java.util.EnumSet;
import java.util.Set;

/**
 * Cycle d'une candidature à une offre gérée. Le candidat envoie (RECUE) et peut retirer tant qu'elle n'est pas traitée ;
 * l'organisme la fait avancer (#223) : PRESELECTIONNEE, ENTRETIEN, puis RETENUE ou NON_RETENUE. Le traitement ne revient
 * jamais en arrière ; il peut sauter une étape (retenir directement une candidature reçue, par exemple).
 */
public enum StatutCandidatureEmploi {
    RECUE,
    PRESELECTIONNEE,
    ENTRETIEN,
    RETENUE,
    NON_RETENUE,
    RETIREE;

    /** Statuts où le recruteur doit encore décider : la clôture de l'offre les passe en NON_RETENUE. */
    public boolean estOuverte() {
        return this == RECUE || this == PRESELECTIONNEE || this == ENTRETIEN;
    }

    /** Statuts que le recruteur peut donner ensuite ; vide pour une candidature décidée ou retirée. */
    public Set<StatutCandidatureEmploi> suivants() {
        return switch (this) {
            case RECUE -> EnumSet.of(PRESELECTIONNEE, ENTRETIEN, RETENUE, NON_RETENUE);
            case PRESELECTIONNEE -> EnumSet.of(ENTRETIEN, RETENUE, NON_RETENUE);
            case ENTRETIEN -> EnumSet.of(RETENUE, NON_RETENUE);
            case RETENUE, NON_RETENUE, RETIREE -> EnumSet.noneOf(StatutCandidatureEmploi.class);
        };
    }

    /** Libellé montré au candidat dans ses notifications. */
    public String libelle() {
        return switch (this) {
            case RECUE -> "reçue";
            case PRESELECTIONNEE -> "présélectionnée";
            case ENTRETIEN -> "retenue pour un entretien";
            case RETENUE -> "retenue";
            case NON_RETENUE -> "non retenue";
            case RETIREE -> "retirée";
        };
    }
}
