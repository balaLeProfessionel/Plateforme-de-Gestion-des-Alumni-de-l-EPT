package ept.edu.sn.alumni_backend.mentorat.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.mentorat.entity.EvaluationMentorat;

@Repository
public interface EvaluationMentoratRepository extends JpaRepository<EvaluationMentorat, UUID> {
    List<EvaluationMentorat> findByMentorat_Id(UUID mentoratId);

    boolean existsByMentorat_IdAndAuteur_Id(UUID mentoratId, UUID auteurId);
}
