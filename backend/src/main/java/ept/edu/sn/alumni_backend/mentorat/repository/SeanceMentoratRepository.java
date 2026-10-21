package ept.edu.sn.alumni_backend.mentorat.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.mentorat.entity.SeanceMentorat;

@Repository
public interface SeanceMentoratRepository extends JpaRepository<SeanceMentorat, UUID> {
    List<SeanceMentorat> findByMentorat_IdOrderByDebutDesc(UUID mentoratId);

    Optional<SeanceMentorat> findByIdAndMentorat_Id(UUID id, UUID mentoratId);
}
