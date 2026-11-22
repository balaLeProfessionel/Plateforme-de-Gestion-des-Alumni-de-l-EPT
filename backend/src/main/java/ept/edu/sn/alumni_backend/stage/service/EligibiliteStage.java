package ept.edu.sn.alumni_backend.stage.service;

import java.util.Set;

import ept.edu.sn.alumni_backend.enums.Classe;
import ept.edu.sn.alumni_backend.stage.TypeStage;
import ept.edu.sn.alumni_backend.stage.exception.ConflitStageException;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

/**
 * Type de stage ouvert à un étudiant selon sa classe (règle de l'école) :
 * ouvrier en TC2 et DIC1, maîtrise en DIC2 et Master 1, PFE en DIC3 et Master 2 ; alternance réservée à la filière
 * Génie Informatique et Télécommunications ; recherche réservée aux doctorants, qui ne font que celui-là ; inclusion
 * sans condition de classe. La classe doit être renseignée. Contrôlé quand l'étudiant postule, déclare un stage, ou est placé sur une liste définitive.
 */
public final class EligibiliteStage {
    private EligibiliteStage() {
    }

    /** Lève un conflit (409) expliquant pourquoi ce type de stage n'est pas ouvert à cet étudiant. */
    public static void verifier(Utilisateur etudiant, TypeStage type, boolean parLEtudiant) {
        String qui = parLEtudiant ? "votre classe" : "la classe de " + etudiant.getPrenom() + " " + etudiant.getNom();
        Classe classe = etudiant.getClasse();
        if (classe == null) {
            throw new ConflitStageException((parLEtudiant ? "Votre classe n'est pas renseignée : demandez à l'école de la mettre à jour."
                : "La classe de " + etudiant.getPrenom() + " " + etudiant.getNom() + " n'est pas renseignée : mettez-la à jour sur sa fiche."));
        }
        boolean doctorant = classe.name().startsWith("DOCTORAT");
        if (doctorant != (type == TypeStage.RECHERCHE)) {
            throw new ConflitStageException(doctorant
                ? "Les doctorants font des stages de recherche ; " + qui + " est " + classe.libelle() + "."
                : "Un stage « Recherche » est réservé aux doctorants ; " + qui + " est " + classe.libelle() + ".");
        }
        Set<Classe> ouvertes = switch (type) {
            case OUVRIER -> Set.of(Classe.TC2, Classe.DIC1);
            case MAITRISE -> Set.of(Classe.DIC2, Classe.MASTER1);
            case PFE -> Set.of(Classe.DIC3, Classe.MASTER2);
            case ALTERNANCE, INCLUSION, RECHERCHE -> null;
        };
        if (ouvertes != null && !ouvertes.contains(classe)) {
            throw new ConflitStageException("Un stage « " + type.libelle() + " » est réservé aux " + switch (type) {
                case OUVRIER -> "TC2 et DIC1";
                case MAITRISE -> "DIC2 et Master 1";
                default -> "DIC3 et Master 2";
            } + " ; " + qui + " est " + classe.libelle() + ".");
        }
        if (type == TypeStage.ALTERNANCE && !informatique(etudiant)) {
            throw new ConflitStageException("L'alternance est réservée aux étudiants de la filière Génie Informatique et Télécommunications.");
        }
    }

    private static boolean informatique(Utilisateur etudiant) {
        var filiere = etudiant.getFiliere();
        return filiere != null && filiere.getCle() != null && filiere.getCle().contains("informatique");
    }
}
