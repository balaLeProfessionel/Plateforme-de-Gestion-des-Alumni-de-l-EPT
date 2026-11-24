package ept.edu.sn.alumni_backend.messagerie.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.function.IntConsumer;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.messagerie.MessagerieProperties;
import ept.edu.sn.alumni_backend.messagerie.TypeConversation;
import ept.edu.sn.alumni_backend.messagerie.TypePieceJointe;
import ept.edu.sn.alumni_backend.messagerie.entity.PieceJointe;
import ept.edu.sn.alumni_backend.messagerie.dto.MessageResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.PageMessagesResponse;
import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;
import ept.edu.sn.alumni_backend.messagerie.entity.Message;
import ept.edu.sn.alumni_backend.messagerie.entity.Participant;
import ept.edu.sn.alumni_backend.messagerie.exception.LimiteEnvoisAtteinteException;
import ept.edu.sn.alumni_backend.messagerie.exception.MessagerieIntrouvableException;
import ept.edu.sn.alumni_backend.messagerie.repository.MessageRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.ParticipantRepository;
import ept.edu.sn.alumni_backend.messagerie.tempsreel.EvenementMessagerie;
import ept.edu.sn.alumni_backend.notification.NotificationService;
import ept.edu.sn.alumni_backend.notification.NouvelleNotification;
import ept.edu.sn.alumni_backend.notification.TypeNotification;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/** Messages d'une conversation : historique, envoi, suppression, lecture et non-lus. */
@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messages;
    private final ParticipantRepository participants;
    private final AccesConversation acces;
    private final MessagerieMapper mapper;
    private final ApplicationEventPublisher evenements;
    private final StockagePieceJointe stockage;
    private final MessagerieProperties proprietes;
    private final NotificationService notifications;
    private final UtilisateurRepository utilisateurs;

    /** Page de l'historique : les {@code taille} messages avant {@code avant} (ou les derniers), du plus ancien au plus récent. */
    @Transactional(readOnly = true)
    public PageMessagesResponse lister(UUID conversationId, UUID moi, Instant avant, int taille) {
        acces.chargerParticipant(conversationId, moi);
        Limit limite = Limit.of(taille + 1);
        List<Message> lus = avant == null
            ? messages.findByConversationIdOrderByEnvoyeLeDescIdDesc(conversationId, limite)
            : messages.findByConversationIdAndEnvoyeLeBeforeOrderByEnvoyeLeDescIdDesc(conversationId, avant, limite);
        boolean plusAnciens = lus.size() > taille;
        List<Message> page = new ArrayList<>(lus.subList(0, Math.min(taille, lus.size())));
        Collections.reverse(page);
        return new PageMessagesResponse(page.stream().map(m -> mapper.versMessage(m, moi)).toList(), plusAnciens);
    }

    @Transactional
    public MessageResponse envoyer(UUID conversationId, UUID moi, String contenu) {
        return envoyer(conversationId, moi, contenu, null);
    }

    /**
     * Texte, fichier ou les deux. Le droit d'écrire est vérifié avant d'écrire le fichier sur le disque ;
     * si la transaction échoue ensuite, le fichier est retiré.
     */
    @Transactional
    public MessageResponse envoyer(UUID conversationId, UUID moi, String contenu, MultipartFile fichier) {
        Participant auteur = acces.chargerParticipant(conversationId, moi);
        Conversation conversation = auteur.getConversation();
        acces.exigerEcriture(conversation, moi);
        // Mes envois passent un par un (verrou sur ma ligne) : des envois simultanés ne contournent pas la limite.
        utilisateurs.findByIdForUpdate(moi);
        if (messages.countByAuteurIdAndEnvoyeLeGreaterThanEqual(moi, Instant.now().minus(Duration.ofMinutes(1)))
                >= proprietes.limiteEnvoisParMinute()) {
            throw new LimiteEnvoisAtteinteException();
        }
        String texte = contenu == null ? "" : contenu.strip();
        boolean avecFichier = fichier != null && !fichier.isEmpty();
        if (texte.isEmpty() && !avecFichier) throw new IllegalArgumentException("Écrivez un message ou joignez un fichier.");
        if (texte.length() > Message.LONGUEUR_MAX_CONTENU) {
            throw new IllegalArgumentException("Un message fait au plus " + Message.LONGUEUR_MAX_CONTENU + " caractères");
        }

        Message message = new Message();
        message.setConversation(conversation);
        message.setAuteur(auteur.getUtilisateur());
        message.setContenu(texte);
        if (avecFichier) {
            PieceJointe piece = stockage.stocker(fichier);
            apresTransaction(statut -> { if (statut != TransactionSynchronization.STATUS_COMMITTED) stockage.supprimer(piece.getFichier()); });
            message.setPieceJointe(piece);
        }
        messages.save(message);
        conversation.setDernierMessageLe(message.getEnvoyeLe());
        auteur.setDernierLuLe(message.getEnvoyeLe());
        messages.flush();

        notifierPremierNonLu(conversation, message);
        signaler(conversationId, EvenementMessagerie.Type.MESSAGE);
        return mapper.versMessage(message, moi);
    }

    /** Seul l'auteur supprime son message ; le texte est effacé, la ligne reste (« Message supprimé »). */
    @Transactional
    public void supprimer(UUID conversationId, UUID messageId, UUID moi) {
        acces.chargerParticipant(conversationId, moi);
        Message message = messages.findById(messageId)
            .filter(m -> m.getConversation().getId().equals(conversationId))
            .orElseThrow(() -> new MessagerieIntrouvableException("Ce message est introuvable."));
        if (!message.getAuteur().getId().equals(moi)) {
            throw new SecurityException("Vous ne pouvez supprimer que vos propres messages.");
        }
        if (message.estSupprime()) return;
        message.setSupprimeLe(Instant.now());
        message.setContenu("");
        if (message.aPieceJointe()) {
            String fichier = message.getPieceJointe().getFichier();
            message.setPieceJointe(null);
            // Le fichier ne quitte le disque qu'une fois la suppression enregistrée.
            apresTransaction(statut -> { if (statut == TransactionSynchronization.STATUS_COMMITTED) stockage.supprimer(fichier); });
        }
        signaler(conversationId, EvenementMessagerie.Type.MESSAGE);
    }

    /** Fichier joint d'un message, pour un participant seulement ; 404 pour les autres ou un message supprimé. */
    @Transactional(readOnly = true)
    public FichierJoint lirePieceJointe(UUID conversationId, UUID messageId, UUID moi) {
        acces.chargerParticipant(conversationId, moi);
        Message message = messages.findById(messageId)
            .filter(m -> m.getConversation().getId().equals(conversationId) && !m.estSupprime() && m.aPieceJointe())
            .orElseThrow(() -> new MessagerieIntrouvableException("Ce fichier est introuvable."));
        PieceJointe piece = message.getPieceJointe();
        boolean image = TypePieceJointe.depuisTypeMime(piece.getType()).map(TypePieceJointe::image).orElse(false);
        return new FichierJoint(stockage.lire(piece.getFichier()), piece.getNom(), piece.getType(), image);
    }

    public record FichierJoint(Resource contenu, String nom, String type, boolean image) {}

    private static void apresTransaction(IntConsumer action) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int statut) {
                action.accept(statut);
            }
        });
    }

    @Transactional
    public void marquerLu(UUID conversationId, UUID moi) {
        acces.chargerParticipant(conversationId, moi).setDernierLuLe(Instant.now());
        // La notification « X vous a écrit » de cette conversation n'a plus lieu d'être : la cloche suit.
        notifications.marquerLuesVers(moi, TypeNotification.MESSAGE, lienConversation(conversationId));
        // Mes autres onglets effacent la pastille de cette conversation.
        evenements.publishEvent(new EvenementMessagerie(Set.of(moi), EvenementMessagerie.Type.LU, conversationId));
    }

    @Transactional(readOnly = true)
    public long compterNonLus(UUID moi) {
        return messages.compterNonLus(moi);
    }

    /** Prévient en temps réel tous les participants, auteur compris (ses autres onglets). */
    private void signaler(UUID conversationId, EvenementMessagerie.Type type) {
        evenements.publishEvent(new EvenementMessagerie(participants.findUtilisateurIds(conversationId), type, conversationId));
    }

    /**
     * Une notification par conversation tant qu'elle reste non lue : seulement pour qui n'a que ce message à lire.
     * Pas de notification pour une communauté.
     */
    private void notifierPremierNonLu(Conversation conversation, Message message) {
        // Une communauté réunit des centaines de membres : sa pastille suffit, sans notification à chacun.
        if (conversation.estCommunaute()) return;
        UUID auteurId = message.getAuteur().getId();
        String auteurNom = MessagerieMapper.nomAffiche(message.getAuteur());
        String texte = conversation.getType() == TypeConversation.GROUPE
            ? auteurNom + " a écrit dans « " + conversation.getNom() + " »."
            : auteurNom + " vous a écrit.";
        messages.compterNonLusParParticipant(conversation.getId()).stream()
            .filter(nonLus -> !nonLus.getUtilisateurId().equals(auteurId) && nonLus.getNombre() == 1)
            .forEach(nonLus -> evenements.publishEvent(new NouvelleNotification(nonLus.getUtilisateurId(),
                TypeNotification.MESSAGE, "Nouveau message", texte, lienConversation(conversation.getId()))));
    }

    private static String lienConversation(UUID conversationId) {
        return "/messagerie/" + conversationId;
    }
}
