package ept.edu.sn.alumni_backend.stage.repository;

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

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.stage.StatutOffre;
import ept.edu.sn.alumni_backend.stage.entity.OffreStage;
import jakarta.persistence.LockModeType;

public interface OffreStageRepository extends JpaRepository<OffreStage, UUID>, JpaSpecificationExecutor<OffreStage> {
    @Override
    @EntityGraph(attributePaths = "organisme")
    Page<OffreStage> findAll(Specification<OffreStage> specification, Pageable pageable);

    @EntityGraph(attributePaths = "organisme")
    Optional<OffreStage> findWithOrganismeById(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from OffreStage o join fetch o.organisme where o.id = :id")
    Optional<OffreStage> findByIdForUpdate(@Param("id") UUID id);

    long countByStatut(StatutOffre statut);

    /** Organismes qui ont au moins une offre publiée visible : choix du filtre « Organisme ». */
    @Query("""
        select distinct o.organisme.id as id, o.organisme.nom as nom from OffreStage o
        where o.statut = :statut and o.organisme.statutValidation <> :suspendu
        order by o.organisme.nom
        """)
    List<OrganismeOffresProjection> organismesAvecOffres(@Param("statut") StatutOffre statut, @Param("suspendu") StatutCompte suspendu);

    interface OrganismeOffresProjection {
        UUID getId();
        String getNom();
    }
}
