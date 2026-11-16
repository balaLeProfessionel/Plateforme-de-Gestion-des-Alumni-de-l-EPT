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
import ept.edu.sn.alumni_backend.messagerie.repository.BlocageRepository;
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

    /** Message de la personne qui a bloqué. */
    static final String J_AI_BLOQUE = "Vous avez bloqué ce membre. Débloquez-le pour lui écrire.";
    /** Message de la personne bloquée : il ne dit pas qu'elle l'est. */
    static final String ECRITURE_FERMEE = "Vous ne pouvez plus écrire dans cette conversation.";

    private final ParticipantRepository participants;
    private final UtilisateurRepository utilisateurs;
    private final BlocageRepository blocages;

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

    /** Un blocage, dans un sens ou dans l'autre, ferme l'écriture d'une conversation directe ; un groupe reste ouvert. */
    public void exigerEcriture(Conversation conversation, UUID moi) {
        if (conversation.getType() != TypeConversation.DIRECTE) return;
        UUID autre = conversation.interlocuteurDe(moi);
        if (blocages.existsByBloqueurIdAndBloqueId(moi, autre)) throw new ConflitMessagerieException(J_AI_BLOQUE);
        if (blocages.existsByBloqueurIdAndBloqueId(autre, moi)) throw new ConflitMessagerieException(ECRITURE_FERMEE);
    }

    public void exigerGroupe(Conversation conversation, String message) {
        if (conversation.getType() != TypeConversation.GROUPE) throw new ConflitMessagerieException(message);
    }

    public void exigerAdministrateur(Participant participant, String message) {
        if (participant.getRole() != RoleParticipant.ADMINISTRATEUR) throw new SecurityException(message);
    }
}
