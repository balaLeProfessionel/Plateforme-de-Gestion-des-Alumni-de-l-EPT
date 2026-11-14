package ept.edu.sn.alumni_backend.messagerie.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
