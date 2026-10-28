package ept.edu.sn.alumni_backend.utilisateur;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;

import java.util.List;
import java.util.Optional;


@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, UUID>,
        JpaSpecificationExecutor<Utilisateur> {
    Optional<Utilisateur> findByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Utilisateur u where u.id = :id")
    Optional<Utilisateur> findByIdForUpdate(@Param("id") UUID id);

    boolean existsByEmail(String email);

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
        select u.anneeEntree as anneeEntree, u.filiere as filiere, count(u) as nombre
        from Utilisateur u
        where u.role = ept.edu.sn.alumni_backend.enums.TypeRole.ETUDIANT
          and u.emailVerifie = true
          and u.statutCompte <> ept.edu.sn.alumni_backend.enums.StatutCompte.SUSPENDU
        group by u.anneeEntree, u.filiere
        order by u.anneeEntree desc, u.filiere
        """)
    List<PromotionProjection> compterEtudiantsParPromotion();

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
