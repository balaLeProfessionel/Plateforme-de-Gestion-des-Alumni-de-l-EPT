package ept.edu.sn.alumni_backend.mobilite.service;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.enums.Classe;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.mobilite.entity.OffreMobilite;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

/**
 * Qui fait quoi dans les mobilités : les étudiants et les enseignants (PERSONNEL) consultent et candidatent selon le
 * public visé ; un institut (organisme) gère ses offres ; le chef du service mobilité (GERER_MOBILITES) gère tout.
 */
public final class AccesMobilite {
    private AccesMobilite() {
    }

    public static boolean estCandidatPossible(Utilisateur utilisateur) {
        return utilisateur.getRole() == TypeRole.ETUDIANT || utilisateur.getRole() == TypeRole.PERSONNEL;
    }

    public static boolean estChef(Utilisateur utilisateur) {
        return PermissionAdmin.accordee(utilisateur, PermissionAdmin.GERER_MOBILITES);
    }

    public static boolean estDeLInstitut(OffreMobilite offre, Utilisateur utilisateur) {
        return utilisateur.getRole() == TypeRole.ORGANISME && utilisateur.getOrganisme() != null
            && utilisateur.getOrganisme().getId().equals(offre.getOrganisme().getId());
    }

    public static boolean peutGerer(OffreMobilite offre, Utilisateur utilisateur) {
        return estDeLInstitut(offre, utilisateur) || estChef(utilisateur);
    }

    /**
     * Pourquoi ce membre ne peut pas candidater à l'offre, ou null s'il le peut. Filières et classes ne s'appliquent
     * qu'aux étudiants. Ne regarde ni la date limite ni le statut de l'offre.
     */
    public static String raisonInelegibilite(OffreMobilite offre, Utilisateur membre) {
        if (!offre.getPublicVise().admet(membre.getRole())) {
            return switch (offre.getPublicVise()) {
                case ETUDIANTS -> "Cette offre est réservée aux étudiants.";
                case ENSEIGNANTS -> "Cette offre est réservée aux enseignants.";
                case TOUS -> "Cette offre est réservée aux étudiants et aux enseignants.";
            };
        }
        if (membre.getRole() != TypeRole.ETUDIANT) return null;
        Filiere filiere = membre.getFiliere();
        if (!offre.getFilieres().isEmpty() && (filiere == null || offre.getFilieres().stream().noneMatch(f -> f.getId().equals(filiere.getId())))) {
            return "Cette offre est réservée aux filières " + String.join(", ", offre.getFilieres().stream().map(Filiere::getNom).sorted().toList()) + ".";
        }
        Classe classe = membre.getClasse();
        if (!offre.getClasses().isEmpty() && (classe == null || !offre.getClasses().contains(classe))) {
            return "Cette offre est réservée aux classes " + String.join(", ", offre.getClasses().stream().sorted().map(Classe::libelle).toList()) + ".";
        }
        return null;
    }
}
