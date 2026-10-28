package ept.edu.sn.alumni_backend.mentorat.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.mentorat.entity.ProgressionJalon;

public interface ProgressionJalonRepository extends JpaRepository<ProgressionJalon, UUID> {
    @EntityGraph(attributePaths = "validePar")
    List<ProgressionJalon> findByMentorat_Id(UUID mentoratId);

    Optional<ProgressionJalon> findByMentorat_IdAndJalon_Id(UUID mentoratId, UUID jalonId);

    /** Toutes les étapes franchies dans un programme, en une requête, pour son tableau de bord. */
    @Query("""
        select progression.mentorat.id as mentoratId, progression.jalon.id as jalonId
        from ProgressionJalon progression
        where progression.jalon.programme.id = :programmeId
        """)
    List<EtapeFranchie> listerParProgramme(@Param("programmeId") UUID programmeId);

    interface EtapeFranchie {
        UUID getMentoratId();

        UUID getJalonId();
    }
}
