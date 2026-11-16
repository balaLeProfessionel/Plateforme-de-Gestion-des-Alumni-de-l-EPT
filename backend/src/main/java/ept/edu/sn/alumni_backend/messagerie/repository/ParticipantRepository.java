package ept.edu.sn.alumni_backend.messagerie.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.messagerie.RoleParticipant;
import ept.edu.sn.alumni_backend.messagerie.entity.Participant;

public interface ParticipantRepository extends JpaRepository<Participant, UUID> {
    @EntityGraph(attributePaths = "conversation")
    Optional<Participant> findByConversationIdAndUtilisateurId(UUID conversationId, UUID utilisateurId);

    boolean existsByConversationIdAndUtilisateurId(UUID conversationId, UUID utilisateurId);

    @EntityGraph(attributePaths = "utilisateur")
    List<Participant> findByConversationIdOrderByRejointLeAsc(UUID conversationId);

    @EntityGraph(attributePaths = "utilisateur")
    List<Participant> findByConversationIdInOrderByRejointLeAsc(Collection<UUID> conversationIds);

    long countByConversationIdAndRole(UUID conversationId, RoleParticipant role);

    /** Les personnes à prévenir en temps réel d'un changement dans la conversation. */
    @Query("select participant.utilisateur.id from Participant participant where participant.conversation.id = :conversationId")
    Set<UUID> findUtilisateurIds(@Param("conversationId") UUID conversationId);
}
