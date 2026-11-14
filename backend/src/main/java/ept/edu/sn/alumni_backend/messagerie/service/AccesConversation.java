package ept.edu.sn.alumni_backend.messagerie.service;

import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.messagerie.RoleParticipant;
import ept.edu.sn.alumni_backend.messagerie.TypeConversation;
import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;
import ept.edu.sn.alumni_backend.messagerie.entity.Participant;
import ept.edu.sn.alumni_backend.messagerie.exception.ConflitMessagerieException;
import ept.edu.sn.alumni_backend.messagerie.exception.MessagerieIntrouvableException;
import ept.edu.sn.alumni_backend.messagerie.repository.ParticipantRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/** Contrôles d'accès communs : seule une personne qui participe à une conversation la voit (404 sinon). */
@Component
@RequiredArgsConstructor
public class AccesConversation {
    static final String CONVERSATION_INTROUVABLE = "Cette conversation est introuvable.";
    private static final Set<StatutCompte> STATUTS_JOIGNABLES = Set.of(StatutCompte.ACTIF, StatutCompte.EN_ATTENTE);

    private final ParticipantRepository participants;
    private final UtilisateurRepository utilisateurs;

    public Participant chargerParticipant(UUID conversationId, UUID utilisateurId) {
        return participants.findByConversationIdAndUtilisateurId(conversationId, utilisateurId)
            .orElseThrow(() -> new MessagerieIntrouvableException(CONVERSATION_INTROUVABLE));
    }

    /** Un compte vérifié, actif ou en attente de validation, peut recevoir des messages. */
    public Utilisateur chargerJoignable(UUID utilisateurId) {
        return utilisateurs.findById(utilisateurId)
            .filter(utilisateur -> utilisateur.isEmailVerifie() && STATUTS_JOIGNABLES.contains(utilisateur.getStatutCompte()))
            .orElseThrow(() -> new MessagerieIntrouvableException("Ce membre est introuvable."));
    }

    public void exigerGroupe(Conversation conversation, String message) {
        if (conversation.getType() != TypeConversation.GROUPE) throw new ConflitMessagerieException(message);
    }

    public void exigerAdministrateur(Participant participant, String message) {
        if (participant.getRole() != RoleParticipant.ADMINISTRATEUR) throw new SecurityException(message);
    }
}
