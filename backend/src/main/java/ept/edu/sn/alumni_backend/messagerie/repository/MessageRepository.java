package ept.edu.sn.alumni_backend.messagerie.repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.messagerie.entity.Message;

/**
 * Un message est non lu pour un participant s'il a été écrit par un autre, n'est pas supprimé et a été envoyé
 * après le {@code dernierLuLe} de ce participant (ou si celui-ci n'a jamais ouvert la conversation).
 */
public interface MessageRepository extends JpaRepository<Message, UUID> {
    long countByConversationId(UUID conversationId);

    /** Derniers messages, du plus récent au plus ancien. */
    @EntityGraph(attributePaths = "auteur")
    List<Message> findByConversationIdOrderByEnvoyeLeDescIdDesc(UUID conversationId, Limit limite);

    /** Messages envoyés avant {@code avant} : la page précédente de l'historique. */
    @EntityGraph(attributePaths = "auteur")
    List<Message> findByConversationIdAndEnvoyeLeBeforeOrderByEnvoyeLeDescIdDesc(UUID conversationId, Instant avant,
                                                                               Limit limite);

    /** Dernier message de chaque conversation demandée (deux messages au même instant : le service n'en garde qu'un). */
    @Query("""
        select message from Message message join fetch message.auteur
        where message.conversation.id in :conversationIds
          and message.envoyeLe = (select max(autre.envoyeLe) from Message autre where autre.conversation = message.conversation)
        """)
    List<Message> findDerniersMessages(@Param("conversationIds") Collection<UUID> conversationIds);

    /** Non-lus d'un membre, par conversation : une seule requête pour toute une page de la liste. */
    @Query("""
        select message.conversation.id as conversationId, count(message.id) as nombre
        from Message message, Participant participant
        where participant.conversation = message.conversation
          and participant.utilisateur.id = :utilisateurId
          and message.conversation.id in :conversationIds
          and message.auteur.id <> :utilisateurId
          and message.supprimeLe is null
          and (participant.dernierLuLe is null or message.envoyeLe > participant.dernierLuLe)
        group by message.conversation.id
        """)
    List<NombreParConversation> compterNonLusParConversation(@Param("utilisateurId") UUID utilisateurId,
                                                             @Param("conversationIds") Collection<UUID> conversationIds);

    /** Total des non-lus d'un membre, toutes conversations confondues. */
    @Query("""
        select count(message.id)
        from Message message, Participant participant
        where participant.conversation = message.conversation
          and participant.utilisateur.id = :utilisateurId
          and message.auteur.id <> :utilisateurId
          and message.supprimeLe is null
          and (participant.dernierLuLe is null or message.envoyeLe > participant.dernierLuLe)
        """)
    long compterNonLus(@Param("utilisateurId") UUID utilisateurId);

    /** Non-lus de chaque participant d'une conversation : sert à ne notifier qu'au premier message non lu. */
    @Query("""
        select participant.utilisateur.id as utilisateurId, count(message.id) as nombre
        from Participant participant, Message message
        where participant.conversation.id = :conversationId
          and message.conversation = participant.conversation
          and message.auteur.id <> participant.utilisateur.id
          and message.supprimeLe is null
          and (participant.dernierLuLe is null or message.envoyeLe > participant.dernierLuLe)
        group by participant.utilisateur.id
        """)
    List<NombreParUtilisateur> compterNonLusParParticipant(@Param("conversationId") UUID conversationId);

    interface NombreParConversation {
        UUID getConversationId();
        Long getNombre();
    }

    interface NombreParUtilisateur {
        UUID getUtilisateurId();
        Long getNombre();
    }
}
