package ept.edu.sn.alumni_backend.stage.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.stage.entity.ConventionStage;

public interface ConventionStageRepository extends JpaRepository<ConventionStage, UUID> {
    Optional<ConventionStage> findByStage_Id(UUID stageId);

    /** Conventions d'une page de stages, en une requête. */
    List<ConventionStage> findByStage_IdIn(Collection<UUID> stageIds);
}
