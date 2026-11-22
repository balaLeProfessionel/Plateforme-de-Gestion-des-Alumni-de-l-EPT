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

import ept.edu.sn.alumni_backend.mobilite.SensMobilite;
import ept.edu.sn.alumni_backend.mobilite.StatutMobilite;
import ept.edu.sn.alumni_backend.mobilite.entity.Mobilite;
import jakarta.persistence.LockModeType;

public interface MobiliteRepository extends JpaRepository<Mobilite, UUID>, JpaSpecificationExecutor<Mobilite> {
    Optional<Mobilite> findByCandidature_Id(UUID candidatureId);

    @Override
    @EntityGraph(attributePaths = {"organisme", "participant", "filiereAccueil", "candidature", "candidature.offre"})
    Page<Mobilite> findAll(Specification<Mobilite> specification, Pageable pageable);

    @EntityGraph(attributePaths = {"organisme", "participant", "filiereAccueil", "candidature", "candidature.offre"})
    Optional<Mobilite> findDetailById(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from Mobilite m join fetch m.organisme where m.id = :id")
    Optional<Mobilite> findByIdForUpdate(@Param("id") UUID id);

    /** Mobilités par établissement et par sens pour une année universitaire : la page « Flux ». */
    @Query("""
        select m.organisme.id as organismeId, m.organisme.nom as organisme, m.sens as sens, count(m) as nombre from Mobilite m
        where m.anneeUniversitaire = :annee and m.statut in :statuts
        group by m.organisme.id, m.organisme.nom, m.sens
        order by m.organisme.nom
        """)
    List<FluxProjection> flux(@Param("annee") String annee, @Param("statuts") Collection<StatutMobilite> statuts);

    @Query("select distinct m.anneeUniversitaire from Mobilite m order by m.anneeUniversitaire desc")
    List<String> annees();

    interface FluxProjection {
        UUID getOrganismeId();
        String getOrganisme();
        SensMobilite getSens();
        long getNombre();
    }
}
