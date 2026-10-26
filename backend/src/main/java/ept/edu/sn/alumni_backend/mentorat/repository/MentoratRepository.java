package ept.edu.sn.alumni_backend.mentorat.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.mentorat.StatutMentorat;
import ept.edu.sn.alumni_backend.mentorat.entity.Mentorat;

@Repository
public interface MentoratRepository extends JpaRepository<Mentorat, UUID> {
    long countByProfilMentor_IdAndStatut(UUID profilMentorId, StatutMentorat statut);

    long countByMentore_IdAndStatut(UUID mentoreId, StatutMentorat statut);

    long countByStatut(StatutMentorat statut);

    boolean existsByMentore_IdAndProfilMentor_IdAndStatutIn(
        UUID mentoreId, UUID profilMentorId, Collection<StatutMentorat> statuts);

    @EntityGraph(attributePaths = {"mentore", "profilMentor", "profilMentor.utilisateur", "domaine", "programme"})
    Page<Mentorat> findByMentore_IdAndStatutIn(
        UUID mentoreId, Collection<StatutMentorat> statuts, Pageable pageable);

    @EntityGraph(attributePaths = {"mentore", "profilMentor", "profilMentor.utilisateur", "domaine", "programme"})
    Page<Mentorat> findByProfilMentor_Utilisateur_IdAndStatutIn(
        UUID mentorId, Collection<StatutMentorat> statuts, Pageable pageable);

    long countByProfilMentor_Utilisateur_IdAndStatut(UUID mentorId, StatutMentorat statut);

    @Query("""
        select mentorat.profilMentor.id as profilMentorId, count(mentorat.id) as nombre
        from Mentorat mentorat
        where mentorat.profilMentor.id in :profilIds
          and mentorat.statut = :statut
        group by mentorat.profilMentor.id
        """)
    List<NombreParProfilProjection> compterParProfils(
        @Param("profilIds") Collection<UUID> profilIds,
        @Param("statut") StatutMentorat statut);

    @Query("""
        select mentorat.profilMentor.id
        from Mentorat mentorat
        where mentorat.profilMentor.id in :profilIds
          and mentorat.mentore.id = :mentoreId
          and mentorat.statut in :statuts
        """)
    List<UUID> trouverProfilsAvecDemandeEnCours(
        @Param("profilIds") Collection<UUID> profilIds,
        @Param("mentoreId") UUID mentoreId,
        @Param("statuts") Collection<StatutMentorat> statuts);

    boolean existsByProgramme_Id(UUID programmeId);

    @EntityGraph(attributePaths = {"mentore", "profilMentor", "profilMentor.utilisateur"})
    List<Mentorat> findByProgramme_IdOrderByCreeLeDesc(UUID programmeId);

    @EntityGraph(attributePaths = "mentore")
    List<Mentorat> findByProgramme_IdAndProfilMentor_Utilisateur_IdAndStatut(UUID programmeId, UUID mentorId, StatutMentorat statut);

    @Query("""
        select mentorat.programme.id as programmeId, count(mentorat) as nombre
        from Mentorat mentorat
        where mentorat.programme.id in :programmeIds
        group by mentorat.programme.id
        """)
    List<NombreParProgrammeProjection> compterParProgrammes(@Param("programmeIds") Collection<UUID> programmeIds);

    interface NombreParProgrammeProjection {
        UUID getProgrammeId();
        Long getNombre();
    }

    interface NombreParProfilProjection {
        UUID getProfilMentorId();
        Long getNombre();
    }
}
