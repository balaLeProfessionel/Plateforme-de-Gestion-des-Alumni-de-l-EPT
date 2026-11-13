package ept.edu.sn.alumni_backend.admin;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import ept.edu.sn.alumni_backend.enums.TypeRole;

/**
 * Ce qu'un compte peut faire dans l'administration. Les routes vérifient une permission, pas un rôle :
 * un futur rôle (enseignant en lecture seule, modérateur) recevra une partie de ces permissions
 * sans réécrire les contrôles. Aujourd'hui, seul le rôle ADMIN les a, toutes.
 */
public enum PermissionAdmin {
    CONSULTER_TABLEAU_DE_BORD,
    GERER_COMPTES,
    CONSULTER_JOURNAL,
    /** Publier une annonce officielle ou un appel à projet. */
    PUBLIER_ANNONCES,
    /** Traiter les signalements et masquer une publication ; voit aussi les publications de toutes les audiences. */
    MODERER_PUBLICATIONS;

    public static Set<PermissionAdmin> pour(TypeRole role) {
        return role == TypeRole.ADMIN ? EnumSet.allOf(PermissionAdmin.class) : EnumSet.noneOf(PermissionAdmin.class);
    }

    /** Noms transmis au frontend, qui affiche les rubriques correspondantes. */
    public static List<String> noms(TypeRole role) {
        return pour(role).stream().map(Enum::name).toList();
    }
}
