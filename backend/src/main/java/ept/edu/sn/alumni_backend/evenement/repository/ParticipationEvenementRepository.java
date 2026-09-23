package ept.edu.sn.alumni_backend.evenement.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.evenement.ReponseParticipation;
import ept.edu.sn.alumni_backend.evenement.entity.ParticipationEvenement;

@Repository
public interface ParticipationEvenementRepository extends JpaRepository<ParticipationEvenement, UUID> {
    long countByEvenement_IdAndReponse(UUID evenementId, ReponseParticipation reponse);

    @Query("""
        select participation.evenement.id as evenementId, count(participation.id) as nombre
        from ParticipationEvenement participation
        where participation.evenement.id in :evenementIds
          and participation.reponse = :reponse
        group by participation.evenement.id
        """)
    List<NombreParticipantsProjection> compterParEvenements(
        @Param("evenementIds") Collection<UUID> evenementIds,
        @Param("reponse") ReponseParticipation reponse);

    interface NombreParticipantsProjection {
        UUID getEvenementId();
        Long getNombre();
    }
}
