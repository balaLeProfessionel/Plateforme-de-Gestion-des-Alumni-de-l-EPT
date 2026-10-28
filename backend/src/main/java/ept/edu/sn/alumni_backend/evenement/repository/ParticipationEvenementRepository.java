package ept.edu.sn.alumni_backend.evenement.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.evenement.ReponseParticipation;
import ept.edu.sn.alumni_backend.evenement.entity.ParticipationEvenement;
import ept.edu.sn.alumni_backend.enums.TypeRole;

@Repository
public interface ParticipationEvenementRepository extends JpaRepository<ParticipationEvenement, UUID> {
    long countByEvenement_IdAndReponse(UUID evenementId, ReponseParticipation reponse);

    Optional<ParticipationEvenement> findByEvenement_IdAndUtilisateur_Id(UUID evenementId, UUID utilisateurId);

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

    @Query("""
        select participation.evenement.id as evenementId, participation.reponse as reponse
        from ParticipationEvenement participation
        where participation.evenement.id in :evenementIds
          and participation.utilisateur.id = :utilisateurId
        """)
    List<ReponseUtilisateurProjection> trouverReponsesUtilisateur(
        @Param("evenementIds") Collection<UUID> evenementIds,
        @Param("utilisateurId") UUID utilisateurId);

    @Query(value = """
        select utilisateur.id as id,
               utilisateur.nom as nom,
               utilisateur.prenom as prenom,
               utilisateur.role as role,
               utilisateur.urlPhoto as urlPhoto
        from ParticipationEvenement participation
        join participation.utilisateur utilisateur
        where participation.evenement.id = :evenementId
          and participation.reponse = :reponse
        order by utilisateur.nom, utilisateur.prenom, utilisateur.id
        """,
        countQuery = """
        select count(participation.id)
        from ParticipationEvenement participation
        where participation.evenement.id = :evenementId
          and participation.reponse = :reponse
        """)
    Page<ParticipantProjection> listerParticipants(
        @Param("evenementId") UUID evenementId,
        @Param("reponse") ReponseParticipation reponse,
        org.springframework.data.domain.Pageable pageable);

    interface NombreParticipantsProjection {
        UUID getEvenementId();
        Long getNombre();
    }

    interface ReponseUtilisateurProjection {
        UUID getEvenementId();
        ReponseParticipation getReponse();
    }

    interface ParticipantProjection {
        UUID getId();
        String getNom();
        String getPrenom();
        TypeRole getRole();
        String getUrlPhoto();
    }
}
