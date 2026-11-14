package ept.edu.sn.alumni_backend.messagerie.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;
import jakarta.persistence.LockModeType;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    /** Conversation directe existante entre deux personnes (clé de {@link Conversation#cleDirecte}). */
    Optional<Conversation> findByCleDirecte(String cleDirecte);

    /** Mes conversations, la plus récemment active d'abord. */
    @Query(value = """
        select conversation from Participant participant join participant.conversation conversation
        where participant.utilisateur.id = :utilisateurId
        order by conversation.dernierMessageLe desc, conversation.id
        """,
        countQuery = "select count(participant) from Participant participant where participant.utilisateur.id = :utilisateurId")
    Page<Conversation> findDeParticipant(@Param("utilisateurId") UUID utilisateurId, Pageable pageable);

    /** Verrou de la conversation pendant un changement de membres : un groupe garde toujours un administrateur. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select conversation from Conversation conversation where conversation.id = :id")
    Optional<Conversation> findByIdForUpdate(@Param("id") UUID id);
}
