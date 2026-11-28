package ept.edu.sn.alumni_backend.emploi.repository;

import ept.edu.sn.alumni_backend.emploi.entity.OffreEmploi;
import jakarta.persistence.LockModeType;
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

public interface OffreEmploiRepository extends JpaRepository<OffreEmploi, UUID>, JpaSpecificationExecutor<OffreEmploi> {
    long countByStatut(ept.edu.sn.alumni_backend.emploi.StatutOffreEmploi statut);

    @Override
    @EntityGraph(attributePaths = {"auteur", "auteur.filiere", "organisme"})
    Page<OffreEmploi> findAll(Specification<OffreEmploi> specification, Pageable pageable);

    @EntityGraph(attributePaths = {"auteur", "auteur.filiere", "organisme"})
    Optional<OffreEmploi> findWithAuteurById(UUID id);

    @EntityGraph(attributePaths = {"auteur", "auteur.filiere", "organisme"})
    List<OffreEmploi> findByAuteurIdOrderByCreeeLeDesc(UUID auteurId);

    @EntityGraph(attributePaths = {"auteur", "auteur.filiere", "organisme"})
    List<OffreEmploi> findByOrganismeIdAndModeOrderByCreeeLeDesc(UUID organismeId, ept.edu.sn.alumni_backend.emploi.ModeOffreEmploi mode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from OffreEmploi o join fetch o.auteur where o.id = :id")
    Optional<OffreEmploi> findByIdForUpdate(@Param("id") UUID id);
}
