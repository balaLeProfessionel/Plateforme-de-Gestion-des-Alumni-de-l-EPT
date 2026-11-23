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

    /** Résiliations dont le préavis est écoulé. */
    @Query("""
        select c from ConventionPartenariat c join fetch c.organisme
        where c.statut = ept.edu.sn.alumni_backend.partenariat.StatutConvention.ACTIVE and c.dateEffetResiliation <= :aujourdhui
        """)
    List<ConventionPartenariat> resiliationsEchues(@Param("aujourdhui") LocalDate aujourdhui);

    // ----- Indicateurs -----

    interface Comptage {
        String getCle();
        long getNombre();
    }

    interface ComptageAnnee {
        int getAnnee();
        long getNombre();
    }

    @Query("select cast(c.statut as string) as cle, count(c) as nombre from ConventionPartenariat c group by c.statut")
    List<Comptage> compterParStatut();

    @Query("select count(distinct c.organisme.id) from ConventionPartenariat c where c.statut = ept.edu.sn.alumni_backend.partenariat.StatutConvention.ACTIVE")
    long compterPartenaires();

    @Query("""
        select cast(o.typeOrganisme as string) as cle, count(distinct o.id) as nombre
        from ConventionPartenariat c join c.organisme o
        where c.statut = ept.edu.sn.alumni_backend.partenariat.StatutConvention.ACTIVE
        group by o.typeOrganisme
        """)
    List<Comptage> partenairesParType();

    /** Conventions signées (devenues actives, même résiliées ou expirées depuis) par année civile de signature. */
    @Query("""
        select extract(year from c.dateSignature) as annee, count(c) as nombre from ConventionPartenariat c
        where c.dateSignature >= :depuis
          and c.statut in (ept.edu.sn.alumni_backend.partenariat.StatutConvention.ACTIVE,
                           ept.edu.sn.alumni_backend.partenariat.StatutConvention.EXPIREE,
                           ept.edu.sn.alumni_backend.partenariat.StatutConvention.RESILIEE)
        group by extract(year from c.dateSignature)
        """)
    List<ComptageAnnee> signeesParAnnee(@Param("depuis") LocalDate depuis);

    @EntityGraph(attributePaths = "organisme")
    List<ConventionPartenariat> findTop6ByStatutInOrderByCreeeLeAsc(Collection<StatutConvention> statuts);

    @EntityGraph(attributePaths = "organisme")
    List<ConventionPartenariat> findTop6ByStatutAndDateFinLessThanEqualAndDateEffetResiliationIsNullOrderByDateFinAsc(StatutConvention statut, LocalDate limite);

    @EntityGraph(attributePaths = "organisme")
    List<ConventionPartenariat> findTop6ByStatutAndDateEffetResiliationIsNotNullOrderByDateEffetResiliationAsc(StatutConvention statut);

    long countByStatutAndDateFinLessThanEqualAndDateEffetResiliationIsNull(StatutConvention statut, LocalDate limite);

    long countByStatutAndDateEffetResiliationIsNotNull(StatutConvention statut);

    @EntityGraph(attributePaths = "organisme")
    List<ConventionPartenariat> findByOrganisme_IdAndStatutOrderByDateFinAsc(UUID organismeId, StatutConvention statut);
}
