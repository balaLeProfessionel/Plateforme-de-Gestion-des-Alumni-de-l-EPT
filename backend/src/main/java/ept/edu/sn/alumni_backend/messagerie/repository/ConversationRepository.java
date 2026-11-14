package ept.edu.sn.alumni_backend.messagerie.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    /** Conversation directe existante entre deux personnes (clé de {@link Conversation#cleDirecte}). */
    Optional<Conversation> findByCleDirecte(String cleDirecte);
}
