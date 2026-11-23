package ept.edu.sn.alumni_backend.stage.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.stage.entity.EvaluationStage;

public interface EvaluationStageRepository extends JpaRepository<EvaluationStage, UUID> {
    Optional<EvaluationStage> findByStage_Id(UUID stageId);

    List<EvaluationStage> findByStage_IdIn(Collection<UUID> stageIds);
}
