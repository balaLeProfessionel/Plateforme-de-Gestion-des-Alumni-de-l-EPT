package ept.edu.sn.alumni_backend.messagerie.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.messagerie.entity.Message;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    long countByConversationId(UUID conversationId);
}
