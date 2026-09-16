package ept.edu.sn.alumni_backend.utilisateur;

import java.util.EnumSet;
import java.util.Set;

import org.springframework.data.jpa.domain.Specification;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;

public final class MembreVisibilite {
    public static final Set<TypeRole> ROLES_PROFIL_PUBLIC = Set.copyOf(EnumSet.of(
        TypeRole.ETUDIANT,
        TypeRole.ALUMNI,
        TypeRole.PERSONNEL,
        TypeRole.VISITEUR
    ));
    public static final Set<TypeRole> ROLES_ANNUAIRE = Set.copyOf(EnumSet.of(
        TypeRole.ETUDIANT,
        TypeRole.ALUMNI,
        TypeRole.PERSONNEL,
        TypeRole.VISITEUR,
        TypeRole.ORGANISME
    ));

    private MembreVisibilite() {
    }

    public static Specification<Utilisateur> visibleDansAnnuaire() {
        return (racine, requete, cb) -> cb.and(
            cb.isTrue(racine.get("emailVerifie")),
            racine.get("statutCompte").in(StatutCompte.ACTIF, StatutCompte.EN_ATTENTE),
            racine.get("role").in(ROLES_ANNUAIRE),
            cb.or(
                cb.notEqual(racine.get("role"), TypeRole.ORGANISME),
                cb.isNotNull(racine.get("organisme"))
            )
        );
    }

    public static Specification<Utilisateur> profilPublicVisible() {
        return (racine, requete, cb) -> cb.and(
            cb.isTrue(racine.get("emailVerifie")),
            racine.get("statutCompte").in(StatutCompte.ACTIF, StatutCompte.EN_ATTENTE),
            racine.get("role").in(ROLES_PROFIL_PUBLIC)
        );
    }
}
