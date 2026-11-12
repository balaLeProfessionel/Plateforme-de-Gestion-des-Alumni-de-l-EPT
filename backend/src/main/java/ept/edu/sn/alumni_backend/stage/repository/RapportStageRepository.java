package ept.edu.sn.alumni_backend.stage.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.stage.entity.RapportStage;

public interface RapportStageRepository extends JpaRepository<RapportStage, UUID> {
    Optional<RapportStage> findByStage_Id(UUID stageId);

    List<RapportStage> findByStage_IdIn(Collection<UUID> stageIds);
}
