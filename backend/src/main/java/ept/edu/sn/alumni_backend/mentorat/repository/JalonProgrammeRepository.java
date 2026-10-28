package ept.edu.sn.alumni_backend.mentorat.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.mentorat.entity.JalonProgramme;

public interface JalonProgrammeRepository extends JpaRepository<JalonProgramme, UUID> {
    List<JalonProgramme> findByProgramme_IdOrderByOrdreAsc(UUID programmeId);

    List<JalonProgramme> findByProgramme_IdInOrderByOrdreAsc(Collection<UUID> programmeIds);

    void deleteByProgramme_Id(UUID programmeId);

    /** Une étape déjà franchie par un mentorat ne peut plus être retirée du programme. */
    @Query("select count(progression) > 0 from ProgressionJalon progression where progression.jalon.id in :jalonIds")
    boolean estFranchieParUnMentorat(@Param("jalonIds") Collection<UUID> jalonIds);
}
