package ept.edu.sn.alumni_backend.mobilite.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.enums.Classe;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.mobilite.entity.OffreMobilite;
import jakarta.persistence.LockModeType;

public interface OffreMobiliteRepository extends JpaRepository<OffreMobilite, UUID>, JpaSpecificationExecutor<OffreMobilite> {
    @Override
    @EntityGraph(attributePaths = "organisme")
    Page<OffreMobilite> findAll(Specification<OffreMobilite> specification, Pageable pageable);

    @EntityGraph(attributePaths = "organisme")
    Optional<OffreMobilite> findWithOrganismeById(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from OffreMobilite o join fetch o.organisme where o.id = :id")
    Optional<OffreMobilite> findByIdForUpdate(@Param("id") UUID id);

    /**
     * Comptes actifs d'un rôle admis par l'offre : destinataires de l'annonce d'une nouvelle offre. Filières et classes
     * ne filtrent que les étudiants. Les drapeaux « toutes » évitent une liste vide dans le IN.
     */
    @Query("""
        select u.id from Utilisateur u left join u.filiere f
        where u.role in :roles and u.statutCompte = ept.edu.sn.alumni_backend.enums.StatutCompte.ACTIF
          and (u.role <> ept.edu.sn.alumni_backend.enums.TypeRole.ETUDIANT or (
            (:toutesFilieres = true or f.id in :filieres) and (:toutesClasses = true or u.classe in :classes)))
        """)
    List<UUID> destinatairesAnnonce(@Param("roles") Collection<TypeRole> roles,
            @Param("toutesFilieres") boolean toutesFilieres, @Param("filieres") Collection<UUID> filieres,
            @Param("toutesClasses") boolean toutesClasses, @Param("classes") Collection<Classe> classes);
}
