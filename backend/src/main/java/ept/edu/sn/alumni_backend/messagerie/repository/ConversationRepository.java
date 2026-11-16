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

    /** Lettres accentuées et leur forme sans accent, une à une (pour {@code translate}, connu de PostgreSQL et de H2). */
    String AVEC_ACCENTS = "àâäáãåçéèêëíìîïñóòôöõúùûüýÿ";
    String SANS_ACCENTS = "aaaaaaceeeeiiiinooooouuuuyy";
    String FILTRE_RECHERCHE = """
        from Participant participant join participant.conversation conversation
        where participant.utilisateur.id = :utilisateurId
          and (cast(function('translate', lower(conversation.nom), '""" + AVEC_ACCENTS + "', '" + SANS_ACCENTS + """
        ') as String) like :motif escape '\\'
            or exists (select autre from Participant autre join autre.utilisateur personne
                       where autre.conversation = conversation and personne.id <> :utilisateurId
                         and conversation.type = ept.edu.sn.alumni_backend.messagerie.TypeConversation.DIRECTE
                         and cast(function('translate', lower(concat(coalesce(personne.prenom, ''), ' ', coalesce(personne.nom, ''))),
                           '""" + AVEC_ACCENTS + "', '" + SANS_ACCENTS + """
        ') as String) like :motif escape '\\'))
        """;

    /**
     * Mes conversations dont le nom contient le motif : nom du groupe, ou prénom et nom de l'interlocuteur d'une
     * conversation directe, sans tenir compte des majuscules ni des accents. {@code motif} est déjà en minuscules,
     * sans accents, entouré de {@code %}, avec {@code \} pour échapper.
     */
    @Query(value = "select conversation " + FILTRE_RECHERCHE + " order by conversation.dernierMessageLe desc, conversation.id",
        countQuery = "select count(conversation) " + FILTRE_RECHERCHE)
    Page<Conversation> rechercherDeParticipant(@Param("utilisateurId") UUID utilisateurId, @Param("motif") String motif,
                                               Pageable pageable);

    /** Verrou de la conversation pendant un changement de membres : un groupe garde toujours un administrateur. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select conversation from Conversation conversation where conversation.id = :id")
    Optional<Conversation> findByIdForUpdate(@Param("id") UUID id);
}
