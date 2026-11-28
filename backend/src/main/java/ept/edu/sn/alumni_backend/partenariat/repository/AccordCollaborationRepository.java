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

import ept.edu.sn.alumni_backend.partenariat.OrigineConvention;
import ept.edu.sn.alumni_backend.partenariat.StatutAccord;
import ept.edu.sn.alumni_backend.partenariat.TypeAccord;

import ept.edu.sn.alumni_backend.partenariat.entity.AccordCollaboration;
import jakarta.persistence.LockModeType;

public interface AccordCollaborationRepository extends JpaRepository<AccordCollaboration, UUID>, JpaSpecificationExecutor<AccordCollaboration> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from AccordCollaboration a where a.id = :id")
    Optional<AccordCollaboration> findByIdForUpdate(@Param("id") UUID id);

    @Override
    @EntityGraph(attributePaths = {"organisme", "convention"})
    Page<AccordCollaboration> findAll(Specification<AccordCollaboration> specification, Pageable pageable);

    @EntityGraph(attributePaths = {"organisme", "convention"})
    List<AccordCollaboration> findByOrganisme_IdOrderByCreeLeDesc(UUID organismeId);

    /** Accords acceptés dont la date de début est arrivée. */
    @Query("select a from AccordCollaboration a join fetch a.organisme where a.statut = ept.edu.sn.alumni_backend.partenariat.StatutAccord.A_VENIR and a.dateDebut <= :aujourdhui")
    List<AccordCollaboration> aDemarrer(@Param("aujourdhui") LocalDate aujourdhui);

    /** Accords en vigueur dont la date de fin est dépassée. */
    @Query("""
        select a from AccordCollaboration a join fetch a.organisme
        where a.statut in (ept.edu.sn.alumni_backend.partenariat.StatutAccord.A_VENIR, ept.edu.sn.alumni_backend.partenariat.StatutAccord.ACTIF)
          and a.dateFin < :aujourdhui
        """)
    List<AccordCollaboration> echus(@Param("aujourdhui") LocalDate aujourdhui);

    /** Résiliations dont le préavis est écoulé. */
    @Query("""
        select a from AccordCollaboration a join fetch a.organisme
        where a.statut in (ept.edu.sn.alumni_backend.partenariat.StatutAccord.A_VENIR, ept.edu.sn.alumni_backend.partenariat.StatutAccord.ACTIF)
          and a.dateEffetResiliation <= :aujourdhui
        """)
    List<AccordCollaboration> resiliationsEchues(@Param("aujourdhui") LocalDate aujourdhui);

    // ----- Indicateurs -----

    interface ComptageAnneeType {
        int getAnnee();
        TypeAccord getType();
        long getNombre();
    }

    long countByTypeAndStatut(TypeAccord type, StatutAccord statut);

    long countByStatut(StatutAccord statut);

    long countByStatutAndProposePar(StatutAccord statut, OrigineConvention proposePar);

    long countByStatutInAndDateEffetResiliationIsNotNull(Collection<StatutAccord> statuts);

    long countByOrganisme_IdAndTypeAndStatut(UUID organismeId, TypeAccord type, StatutAccord statut);

    long countByOrganisme_IdAndStatut(UUID organismeId, StatutAccord statut);

    long countByOrganisme_IdAndStatutAndProposePar(UUID organismeId, StatutAccord statut, OrigineConvention proposePar);

    @EntityGraph(attributePaths = "organisme")
    List<AccordCollaboration> findTop6ByStatutAndProposeParOrderByCreeLeAsc(StatutAccord statut, OrigineConvention proposePar);

    @EntityGraph(attributePaths = "organisme")
    List<AccordCollaboration> findTop6ByStatutInAndDateEffetResiliationIsNotNullOrderByDateEffetResiliationAsc(Collection<StatutAccord> statuts);

    /** Accords acceptés par année civile d'acceptation et par type (d'après l'historique). */
    @Query("""
        select extract(year from h.dateAction) as annee, a.type as type, count(h) as nombre
        from HistoriqueAccord h, AccordCollaboration a
        where h.accordId = a.id and h.action = ept.edu.sn.alumni_backend.partenariat.ActionAccord.ACCEPTATION and h.dateAction >= :depuis
        group by extract(year from h.dateAction), a.type
        """)
    List<ComptageAnneeType> acceptesParAnnee(@Param("depuis") java.time.Instant depuis);

    interface TypeEnVigueur {
        UUID getOrganismeId();
        TypeAccord getType();
    }

    /** Types d'accords en vigueur pour ces organismes. */
    @Query("""
        select distinct a.organisme.id as organismeId, a.type as type from AccordCollaboration a
        where a.organisme.id in :ids and a.statut = ept.edu.sn.alumni_backend.partenariat.StatutAccord.ACTIF
        """)
    List<TypeEnVigueur> typesEnVigueur(@Param("ids") Collection<UUID> ids);
}
