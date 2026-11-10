package ept.edu.sn.alumni_backend.admin;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

/**
 * Ce qu'un compte d'administration peut faire. Les routes et les services vérifient une permission, pas un rôle.
 * Le tableau de bord est ouvert à tout administrateur ; les autres permissions sont des responsabilités que le
 * super administrateur coche pour chaque compte (TRA-13). GERER_ADMINISTRATEURS fait d'un compte un super
 * administrateur : il a alors toutes les permissions.
 */
public enum PermissionAdmin {
    CONSULTER_TABLEAU_DE_BORD("Tableau de bord"),
    GERER_COMPTES("Comptes"),
    CONSULTER_JOURNAL("Journal"),
    GERER_STAGES("Stages"),
    GERER_MOBILITES("Mobilités"),
    GERER_PARTENARIATS("Partenariats"),
    GERER_EVENEMENTS("Événements"),
    GERER_MENTORAT("Mentorat"),
    GERER_ADMINISTRATEURS("Super administrateur");

    private final String libelle;

    PermissionAdmin(String libelle) {
        this.libelle = libelle;
    }

    /** Libellé montré aux membres (e-mails) ; le frontend a les siens. */
    public String libelle() {
        return libelle;
    }

    /** Permissions effectives d'un compte : aucune hors administration. */
    public static Set<PermissionAdmin> pour(Utilisateur utilisateur) {
        if (utilisateur.getRole() != TypeRole.ADMIN) {
            return EnumSet.noneOf(PermissionAdmin.class);
        }
        Set<PermissionAdmin> enregistrees = utilisateur.getPermissionsAdmin();
        if (enregistrees.contains(GERER_ADMINISTRATEURS)) {
            return EnumSet.allOf(PermissionAdmin.class);
        }
        EnumSet<PermissionAdmin> permissions = EnumSet.of(CONSULTER_TABLEAU_DE_BORD);
        permissions.addAll(enregistrees);
        return permissions;
    }

    public static boolean accordee(Utilisateur utilisateur, PermissionAdmin permission) {
        return pour(utilisateur).contains(permission);
    }

    /** Noms transmis au frontend, qui affiche les rubriques correspondantes. */
    public static List<String> noms(Utilisateur utilisateur) {
        return pour(utilisateur).stream().map(Enum::name).toList();
    }
}
