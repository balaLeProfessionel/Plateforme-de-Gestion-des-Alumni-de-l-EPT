package ept.edu.sn.alumni_backend.messagerie.service;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.messagerie.RoleParticipant;
import ept.edu.sn.alumni_backend.messagerie.TypeConversation;
import ept.edu.sn.alumni_backend.messagerie.dto.ConversationDetailResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.ConversationResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.GroupeRequest;
import ept.edu.sn.alumni_backend.messagerie.dto.MembreConversationResponse;
import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;
import ept.edu.sn.alumni_backend.messagerie.entity.Message;
import ept.edu.sn.alumni_backend.messagerie.entity.Participant;
import ept.edu.sn.alumni_backend.messagerie.exception.ConflitMessagerieException;
import ept.edu.sn.alumni_backend.messagerie.exception.MessagerieIntrouvableException;
import ept.edu.sn.alumni_backend.messagerie.repository.ConversationRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.MessageRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.ParticipantRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Conversations : liste, ouverture d'une conversation directe, groupes et leurs membres. */
@Service
public class ConversationService {
    private final ConversationRepository conversations;
    private final ParticipantRepository participants;
    private final MessageRepository messages;
    private final UtilisateurRepository utilisateurs;
    private final AccesConversation acces;
    private final MessagerieMapper mapper;
    private final TransactionTemplate transaction;

    public ConversationService(ConversationRepository conversations, ParticipantRepository participants,
                               MessageRepository messages, UtilisateurRepository utilisateurs, AccesConversation acces,
                               MessagerieMapper mapper, PlatformTransactionManager gestionnaire) {
        this.conversations = conversations;
        this.participants = participants;
        this.messages = messages;
        this.utilisateurs = utilisateurs;
        this.acces = acces;
        this.mapper = mapper;
        this.transaction = new TransactionTemplate(gestionnaire);
    }

    /** Résultat de l'ouverture d'une conversation directe : {@code creee} décide entre 201 et 200. */
    public record Ouverture(ConversationResponse conversation, boolean creee) {}

    @Transactional(readOnly = true)
    public PageResponse<ConversationResponse> lister(UUID moi, int page, int taille) {
        Page<Conversation> resultat = conversations.findDeParticipant(moi, PageRequest.of(page, taille));
        List<UUID> ids = resultat.getContent().stream().map(Conversation::getId).toList();
        if (ids.isEmpty()) return PageResponse.depuis(resultat.map(c -> (ConversationResponse) null));

        Map<UUID, List<Participant>> membres = participants.findByConversationIdInOrderByRejointLeAsc(ids).stream()
            .collect(Collectors.groupingBy(p -> p.getConversation().getId()));
        Map<UUID, Message> derniers = messages.findDerniersMessages(ids).stream()
            .collect(Collectors.toMap(m -> m.getConversation().getId(), Function.identity(),
                (a, b) -> a.getId().compareTo(b.getId()) > 0 ? a : b));
        Map<UUID, Long> nonLus = messages.compterNonLusParConversation(moi, ids).stream()
            .collect(Collectors.toMap(MessageRepository.NombreParConversation::getConversationId,
                MessageRepository.NombreParConversation::getNombre));

        return PageResponse.depuis(resultat.map(conversation -> versLigne(conversation, moi,
            membres.getOrDefault(conversation.getId(), List.of()), derniers.get(conversation.getId()),
            nonLus.getOrDefault(conversation.getId(), 0L))));
    }

    /**
     * Ouvre la conversation directe avec un membre, ou renvoie celle qui existe. Si les deux personnes l'ouvrent au
     * même instant, la contrainte unique de la base refuse la seconde création : on relit alors celle de l'autre.
     */
    public Ouverture ouvrirDirecte(UUID moi, UUID destinataireId) {
        if (moi.equals(destinataireId)) {
            throw new IllegalArgumentException("Vous ne pouvez pas vous écrire à vous-même.");
        }
        String cle = Conversation.cleDirecte(moi, destinataireId);
        Ouverture existante = transaction.execute(statut -> {
            acces.chargerJoignable(destinataireId);
            return conversations.findByCleDirecte(cle).map(c -> new Ouverture(ligne(c, moi), false)).orElse(null);
        });
        if (existante != null) return existante;
        try {
            return transaction.execute(statut -> {
                Conversation conversation = conversations.saveAndFlush(Conversation.directe(moi, destinataireId));
                participants.save(Participant.de(conversation, utilisateurs.getReferenceById(moi), RoleParticipant.MEMBRE));
                participants.save(Participant.de(conversation, acces.chargerJoignable(destinataireId), RoleParticipant.MEMBRE));
                participants.flush();
                return new Ouverture(ligne(conversation, moi), true);
            });
        } catch (DataIntegrityViolationException doublon) {
            return transaction.execute(statut -> conversations.findByCleDirecte(cle)
                .map(c -> new Ouverture(ligne(c, moi), false))
                .orElseThrow(() -> doublon));
        }
    }

    @Transactional
    public ConversationDetailResponse creerGroupe(UUID moi, GroupeRequest requete) {
        Set<UUID> membreIds = new LinkedHashSet<>(requete.membreIds() == null ? Set.of() : requete.membreIds());
        membreIds.remove(moi);
        List<Utilisateur> membres = membreIds.stream().map(acces::chargerJoignable).toList();

        Conversation groupe = conversations.save(Conversation.groupe(requete.nom().trim()));
        participants.save(Participant.de(groupe, utilisateurs.getReferenceById(moi), RoleParticipant.ADMINISTRATEUR));
        membres.forEach(membre -> participants.save(Participant.de(groupe, membre, RoleParticipant.MEMBRE)));
        participants.flush();
        return detail(groupe, moi);
    }

    @Transactional(readOnly = true)
    public ConversationDetailResponse obtenir(UUID conversationId, UUID moi) {
        return detail(acces.chargerParticipant(conversationId, moi).getConversation(), moi);
    }

    @Transactional
    public ConversationDetailResponse renommer(UUID conversationId, UUID moi, String nom) {
        Participant participant = acces.chargerParticipant(conversationId, moi);
        Conversation conversation = participant.getConversation();
        acces.exigerGroupe(conversation, "Une conversation directe n'a pas de nom à modifier.");
        acces.exigerAdministrateur(participant, "Seul un administrateur du groupe peut le renommer.");
        conversation.setNom(nom.trim());
        return detail(conversation, moi);
    }

    @Transactional
    public ConversationDetailResponse ajouterParticipants(UUID conversationId, UUID moi, Set<UUID> membreIds) {
        Participant participant = acces.chargerParticipant(conversationId, moi);
        acces.exigerGroupe(participant.getConversation(), "Une conversation directe réunit deux personnes seulement.");
        acces.exigerAdministrateur(participant, "Seul un administrateur du groupe peut ajouter des membres.");
        Conversation groupe = verrouiller(conversationId);

        for (UUID membreId : membreIds) {
            if (participants.existsByConversationIdAndUtilisateurId(conversationId, membreId)) continue;
            participants.save(Participant.de(groupe, acces.chargerJoignable(membreId), RoleParticipant.MEMBRE));
        }
        participants.flush();
        return detail(groupe, moi);
    }

    /** Retire un membre (administrateur) ou quitte le groupe (soi-même). Le groupe garde toujours un administrateur. */
    @Transactional
    public void retirerParticipant(UUID conversationId, UUID moi, UUID utilisateurId) {
        Participant demandeur = acces.chargerParticipant(conversationId, moi);
        acces.exigerGroupe(demandeur.getConversation(), "On ne quitte pas une conversation directe.");
        if (!utilisateurId.equals(moi)) {
            acces.exigerAdministrateur(demandeur, "Seul un administrateur du groupe peut retirer un membre.");
        }
        verrouiller(conversationId);
        Participant retire = participants.findByConversationIdAndUtilisateurId(conversationId, utilisateurId)
            .orElseThrow(() -> new MessagerieIntrouvableException("Ce membre ne fait pas partie du groupe."));
        participants.delete(retire);
        participants.flush();

        if (participants.countByConversationIdAndRole(conversationId, RoleParticipant.ADMINISTRATEUR) == 0) {
            participants.findByConversationIdOrderByRejointLeAsc(conversationId).stream().findFirst()
                .ifPresent(plusAncien -> plusAncien.setRole(RoleParticipant.ADMINISTRATEUR));
        }
    }

    private Conversation verrouiller(UUID conversationId) {
        return conversations.findByIdForUpdate(conversationId)
            .orElseThrow(() -> new MessagerieIntrouvableException(AccesConversation.CONVERSATION_INTROUVABLE));
    }

    private ConversationResponse ligne(Conversation conversation, UUID moi) {
        UUID id = conversation.getId();
        List<Participant> membres = participants.findByConversationIdOrderByRejointLeAsc(id);
        Message dernier = messages.findDerniersMessages(List.of(id)).stream()
            .max(Comparator.comparing(Message::getId)).orElse(null);
        long nonLus = messages.compterNonLusParConversation(moi, List.of(id)).stream()
            .mapToLong(MessageRepository.NombreParConversation::getNombre).sum();
        return versLigne(conversation, moi, membres, dernier, nonLus);
    }

    private ConversationResponse versLigne(Conversation conversation, UUID moi, List<Participant> membres,
                                           Message dernier, long nonLus) {
        Participant interlocuteur = conversation.getType() == TypeConversation.DIRECTE
            ? membres.stream().filter(p -> !p.getUtilisateur().getId().equals(moi)).findFirst().orElse(null)
            : null;
        RoleParticipant monRole = membres.stream().filter(p -> p.getUtilisateur().getId().equals(moi))
            .map(Participant::getRole).findFirst().orElse(RoleParticipant.MEMBRE);
        MembreConversationResponse autre = interlocuteur == null ? null : mapper.versMembre(interlocuteur);
        String nom = conversation.getType() == TypeConversation.GROUPE
            ? conversation.getNom()
            : (autre == null ? "Conversation" : autre.nomAffiche());
        return new ConversationResponse(conversation.getId(), conversation.getType(), nom, autre, membres.size(), monRole,
            dernier == null ? null : mapper.versApercu(dernier), nonLus, conversation.getDernierMessageLe());
    }

    private ConversationDetailResponse detail(Conversation conversation, UUID moi) {
        List<Participant> membres = participants.findByConversationIdOrderByRejointLeAsc(conversation.getId());
        List<MembreConversationResponse> liste = membres.stream().map(mapper::versMembre).toList();
        RoleParticipant monRole = membres.stream().filter(p -> p.getUtilisateur().getId().equals(moi))
            .map(Participant::getRole).findFirst().orElseThrow(
                () -> new MessagerieIntrouvableException(AccesConversation.CONVERSATION_INTROUVABLE));
        String nom = conversation.getType() == TypeConversation.GROUPE
            ? conversation.getNom()
            : liste.stream().filter(m -> !m.id().equals(moi)).map(MembreConversationResponse::nomAffiche)
                .findFirst().orElse("Conversation");
        return new ConversationDetailResponse(conversation.getId(), conversation.getType(), nom, monRole,
            conversation.getCreeLe(), liste);
    }
}
