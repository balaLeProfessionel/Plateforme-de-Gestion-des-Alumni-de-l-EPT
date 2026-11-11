package ept.edu.sn.alumni_backend.utilisateur;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;

import java.util.List;
import java.util.Optional;


@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, UUID>,
        JpaSpecificationExecutor<Utilisateur> {
    /** Chargé par le filtre JWT hors transaction : les responsabilités viennent avec le compte. */
    @EntityGraph(attributePaths = "permissionsAdmin")
    Optional<Utilisateur> findByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Utilisateur u where u.id = :id")
    Optional<Utilisateur> findByIdForUpdate(@Param("id") UUID id);

    boolean existsByEmail(String email);

    boolean existsByRole(TypeRole role);

    List<Utilisateur> findByRole(TypeRole role);

    @Query("select u.role from Utilisateur u where u.id = :id")
    Optional<TypeRole> trouverRole(@Param("id") UUID id);

    /**
     * Administrateurs actifs ayant cette permission, verrouillés dans l'ordre des identifiants : deux super
     * administrateurs qui se retirent mutuellement leur statut passent l'un après l'autre.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select u from Utilisateur u
        where u.role = ept.edu.sn.alumni_backend.enums.TypeRole.ADMIN
          and u.statutCompte = ept.edu.sn.alumni_backend.enums.StatutCompte.ACTIF
          and :permission member of u.permissionsAdmin
        order by u.id
        """)
    List<Utilisateur> verrouillerAdministrateursActifsAvec(@Param("permission") PermissionAdmin permission);

    /** Administrateurs actifs qui ont au moins une de ces permissions enregistrées (destinataires d'une alerte). */
    @Query("""
        select distinct u from Utilisateur u join u.permissionsAdmin p
        where u.role = ept.edu.sn.alumni_backend.enums.TypeRole.ADMIN
          and u.statutCompte = ept.edu.sn.alumni_backend.enums.StatutCompte.ACTIF
          and p in :permissions
        """)
    List<Utilisateur> administrateursActifsAvecUneDe(@Param("permissions") java.util.Collection<PermissionAdmin> permissions);

    @Query("""
        select count(u) from Utilisateur u
        where u.role = ept.edu.sn.alumni_backend.enums.TypeRole.ADMIN
          and u.statutCompte = ept.edu.sn.alumni_backend.enums.StatutCompte.ACTIF
          and :permission member of u.permissionsAdmin
        """)
    long compterAdministrateursActifsAvec(@Param("permission") PermissionAdmin permission);

    @Query("select count(u) > 0 from Utilisateur u where u.permissionsAdmin is not empty")
    boolean existeUneResponsabiliteEnregistree();

    long countByRoleAndStatutCompte(TypeRole role, StatutCompte statutCompte);

    List<Utilisateur> findByStatutCompte(StatutCompte statutCompte);

    long countByStatutCompteAndEmailVerifieTrue(StatutCompte statutCompte);

    Optional<Utilisateur> findFirstByStatutCompteAndEmailVerifieTrueOrderByDateCreationAsc(StatutCompte statutCompte);

    long countByEmailVerifieTrueAndDateCreationGreaterThanEqual(LocalDateTime depuis);

    @Query("""
        select u.role as role, count(u) as nombre
        from Utilisateur u
        where u.statutCompte = :statut and u.emailVerifie = true
        group by u.role
        """)
    List<NombreParRoleProjection> compterParRole(@Param("statut") StatutCompte statut);

    @Query("""
        select u.anneeEntree as anneeEntree, f.nom as filiere, count(u) as nombre
        from Utilisateur u left join u.filiere f
        where u.role = ept.edu.sn.alumni_backend.enums.TypeRole.ETUDIANT
          and u.emailVerifie = true
          and u.statutCompte <> ept.edu.sn.alumni_backend.enums.StatutCompte.SUSPENDU
        group by u.anneeEntree, f.nom
        order by u.anneeEntree desc, f.nom
        """)
    List<PromotionProjection> compterEtudiantsParPromotion();

    /** Étudiants non suspendus par classe et filière, pour le passage annuel (classe vide comprise). */
    @Query("""
        select u.classe as classe, f.nom as filiere, count(u) as nombre
        from Utilisateur u left join u.filiere f
        where u.role = ept.edu.sn.alumni_backend.enums.TypeRole.ETUDIANT
          and u.emailVerifie = true
          and u.statutCompte <> ept.edu.sn.alumni_backend.enums.StatutCompte.SUSPENDU
        group by u.classe, f.nom
        """)
    List<ClasseEtudianteProjection> compterEtudiantsParClasse();

    interface ClasseEtudianteProjection {
        ept.edu.sn.alumni_backend.enums.Classe getClasse();
        String getFiliere();
        long getNombre();
    }

    interface PromotionProjection {
        Integer getAnneeEntree();
        String getFiliere();
        Long getNombre();
    }

    interface NombreParRoleProjection {
        TypeRole getRole();
        Long getNombre();
    }
}
