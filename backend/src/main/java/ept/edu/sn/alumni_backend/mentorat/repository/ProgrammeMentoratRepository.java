package ept.edu.sn.alumni_backend.mentorat.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.mentorat.StatutProgramme;
import ept.edu.sn.alumni_backend.mentorat.entity.ProgrammeMentorat;
import jakarta.persistence.LockModeType;

public interface ProgrammeMentoratRepository extends JpaRepository<ProgrammeMentorat, UUID> {
    @EntityGraph(attributePaths = "responsable")
    List<ProgrammeMentorat> findAllByOrderByCreeLeDesc();

    @EntityGraph(attributePaths = "responsable")
    List<ProgrammeMentorat> findByResponsable_IdOrderByCreeLeDesc(UUID responsableId);

    @EntityGraph(attributePaths = "responsable")
    List<ProgrammeMentorat> findByStatutOrderByDateDebutAscTitreAsc(StatutProgramme statut);

    /** Modifier un programme (étapes, statut) se fait sous verrou : deux gestionnaires ne se marchent pas dessus. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select programme from ProgrammeMentorat programme where programme.id = :id")
    Optional<ProgrammeMentorat> findByIdForUpdate(@Param("id") UUID id);
}
