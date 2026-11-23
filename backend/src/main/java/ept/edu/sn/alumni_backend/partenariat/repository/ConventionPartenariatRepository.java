package ept.edu.sn.alumni_backend.partenariat.repository;

import java.time.LocalDate;
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

import ept.edu.sn.alumni_backend.partenariat.StatutConvention;
import ept.edu.sn.alumni_backend.partenariat.entity.ConventionPartenariat;
import jakarta.persistence.LockModeType;

public interface ConventionPartenariatRepository extends JpaRepository<ConventionPartenariat, UUID>, JpaSpecificationExecutor<ConventionPartenariat> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ConventionPartenariat c where c.id = :id")
    Optional<ConventionPartenariat> findByIdForUpdate(@Param("id") UUID id);

    @Override
    @EntityGraph(attributePaths = "organisme")
    Page<ConventionPartenariat> findAll(Specification<ConventionPartenariat> specification, Pageable pageable);

    @EntityGraph(attributePaths = "organisme")
    List<ConventionPartenariat> findByOrganisme_IdOrderByCreeeLeDesc(UUID organismeId);

    boolean existsByOrganisme_IdAndStatutIn(UUID organismeId, Collection<StatutConvention> statuts);

    /** Conventions actives arrivées à leur date de fin (la veille au plus tard). */
    @Query("select c from ConventionPartenariat c join fetch c.organisme where c.statut = ept.edu.sn.alumni_backend.partenariat.StatutConvention.ACTIVE and c.dateFin < :aujourdhui")
    List<ConventionPartenariat> echues(@Param("aujourdhui") LocalDate aujourdhui);

    /** Conventions actives dont la fin approche et dont l'alerte n'est pas partie. */
    @Query("""
        select c from ConventionPartenariat c join fetch c.organisme
        where c.statut = ept.edu.sn.alumni_backend.partenariat.StatutConvention.ACTIVE
          and c.alerteExpirationEnvoyee = false and c.dateFin >= :aujourdhui and c.dateFin <= :limite
        """)
    List<ConventionPartenariat> aAlerter(@Param("aujourdhui") LocalDate aujourdhui, @Param("limite") LocalDate limite);
}
