package ept.edu.sn.alumni_backend.messagerie.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.messagerie.entity.Participant;

public interface ParticipantRepository extends JpaRepository<Participant, UUID> {
    Optional<Participant> findByConversationIdAndUtilisateurId(UUID conversationId, UUID utilisateurId);

    boolean existsByConversationIdAndUtilisateurId(UUID conversationId, UUID utilisateurId);

    @EntityGraph(attributePaths = "utilisateur")
    List<Participant> findByConversationIdOrderByRejointLeAsc(UUID conversationId);
}
