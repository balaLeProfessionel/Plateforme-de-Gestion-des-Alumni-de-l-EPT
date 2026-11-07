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

    /**
     * Diplômés trouvables sans compte. Un compte créé par l'administration et jamais ouvert en est exclu :
     * son titulaire n'a pas encore eu accès au réglage de retrait.
     */
    public static Specification<Utilisateur> trouvableSansCompte() {
        return (racine, requete, cb) -> cb.and(
            cb.isTrue(racine.get("emailVerifie")),
            cb.equal(racine.get("statutCompte"), StatutCompte.ACTIF),
            cb.equal(racine.get("role"), TypeRole.ALUMNI),
            cb.isTrue(racine.get("recherchePublique")),
            cb.isFalse(racine.get("doitChangerMotDePasse"))
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
