package ept.edu.sn.alumni_backend.messagerie.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    /** Vide le contexte de persistance : les participants déjà chargés n'existent plus. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from Participant participant where participant.conversation.id = :conversationId")
    void supprimerDeConversation(@Param("conversationId") UUID conversationId);

    long countByConversationIdAndRole(UUID conversationId, RoleParticipant role);

    /** Les personnes à prévenir en temps réel d'un changement dans la conversation. */
    @Query("select participant.utilisateur.id from Participant participant where participant.conversation.id = :conversationId")
    Set<UUID> findUtilisateurIds(@Param("conversationId") UUID conversationId);

    /** Nombre de membres de chaque communauté demandée, en une requête. */
    @Query("""
        select participant.conversation.id as conversationId, count(participant.id) as nombre
        from Participant participant where participant.conversation.id in :conversationIds
        group by participant.conversation.id
        """)
    List<MessageRepository.NombreParConversation> compterParConversation(
        @Param("conversationIds") Collection<UUID> conversationIds);

    /** Membres d'une promo donnée dans chaque communauté demandée (« 23 de votre promo »). */
    @Query("""
        select participant.conversation.id as conversationId, count(participant.id) as nombre
        from Participant participant
        where participant.conversation.id in :conversationIds and participant.utilisateur.anneeSortie = :anneeSortie
        group by participant.conversation.id
        """)
    List<MessageRepository.NombreParConversation> compterDeLaPromoParConversation(
        @Param("conversationIds") Collection<UUID> conversationIds, @Param("anneeSortie") int anneeSortie);
}
