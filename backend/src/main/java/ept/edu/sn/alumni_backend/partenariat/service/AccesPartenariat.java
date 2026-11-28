package ept.edu.sn.alumni_backend.partenariat.service;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.partenariat.entity.ConventionPartenariat;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

/**
 * Qui fait quoi dans les partenariats : l'organisme ne voit que ses conventions ; le chef du service des Relations
 * extérieures (GERER_PARTENARIATS) les gère toutes.
 */
public final class AccesPartenariat {
    private AccesPartenariat() {
    }

    public static boolean estChef(Utilisateur utilisateur) {
        return PermissionAdmin.accordee(utilisateur, PermissionAdmin.GERER_PARTENARIATS);
    }

    public static boolean estDeLOrganisme(ConventionPartenariat convention, Utilisateur utilisateur) {
        return utilisateur.getRole() == TypeRole.ORGANISME && utilisateur.getOrganisme() != null
            && utilisateur.getOrganisme().getId().equals(convention.getOrganisme().getId());
    }
}
