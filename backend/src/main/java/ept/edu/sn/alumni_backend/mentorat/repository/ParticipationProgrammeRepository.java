package ept.edu.sn.alumni_backend.mentorat.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.mentorat.entity.ParticipationProgramme;

public interface ParticipationProgrammeRepository extends JpaRepository<ParticipationProgramme, UUID> {
    Optional<ParticipationProgramme> findByProgramme_IdAndProfilMentor_Utilisateur_Id(UUID programmeId, UUID utilisateurId);

    boolean existsByProgramme_IdAndProfilMentor_Id(UUID programmeId, UUID profilMentorId);

    void deleteByProgramme_Id(UUID programmeId);

    @EntityGraph(attributePaths = {"profilMentor", "profilMentor.utilisateur"})
    List<ParticipationProgramme> findByProgramme_IdOrderByCreeLeAsc(UUID programmeId);

    @Query("""
        select participation.programme.id as programmeId, count(participation) as nombre
        from ParticipationProgramme participation
        where participation.programme.id in :programmeIds
        group by participation.programme.id
        """)
    List<MentoratRepository.NombreParProgrammeProjection> compterParProgrammes(@Param("programmeIds") Collection<UUID> programmeIds);

    @Query("""
        select participation.programme.id
        from ParticipationProgramme participation
        where participation.programme.id in :programmeIds
          and participation.profilMentor.utilisateur.id = :utilisateurId
        """)
    List<UUID> programmesOuParticipe(@Param("programmeIds") Collection<UUID> programmeIds, @Param("utilisateurId") UUID utilisateurId);
}
