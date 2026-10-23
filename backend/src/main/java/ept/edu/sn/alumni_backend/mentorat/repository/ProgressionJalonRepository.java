package ept.edu.sn.alumni_backend.mentorat.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.mentorat.entity.ProgressionJalon;

public interface ProgressionJalonRepository extends JpaRepository<ProgressionJalon, UUID> {
    @EntityGraph(attributePaths = "validePar")
    List<ProgressionJalon> findByMentorat_Id(UUID mentoratId);

    Optional<ProgressionJalon> findByMentorat_IdAndJalon_Id(UUID mentoratId, UUID jalonId);
}
