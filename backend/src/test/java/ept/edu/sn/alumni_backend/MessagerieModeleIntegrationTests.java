package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.messagerie.RoleParticipant;
import ept.edu.sn.alumni_backend.messagerie.TypeConversation;
import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;
import ept.edu.sn.alumni_backend.messagerie.entity.Message;
import ept.edu.sn.alumni_backend.messagerie.entity.Participant;
import ept.edu.sn.alumni_backend.messagerie.repository.ConversationRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.MessageRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.ParticipantRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Modèle de la messagerie (#209) : contraintes portées par la base, sans service ni API. */
@SpringBootTest
@Transactional
class MessagerieModeleIntegrationTests {
    @Autowired private ConversationRepository conversations;
    @Autowired private ParticipantRepository participants;
    @Autowired private MessageRepository messages;
    @Autowired private UtilisateurRepository utilisateurs;

    private Utilisateur membre(TypeRole role) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("messagerie." + UUID.randomUUID() + "@example.invalid");
        utilisateur.setPassword("hash-de-test");
        utilisateur.setRole(role);
        utilisateur.setStatutCompte(StatutCompte.ACTIF);
        utilisateur.setEmailVerifie(true);
        return utilisateurs.saveAndFlush(utilisateur);
    }

    @Test
    void enregistreUneConversationDirecteAvecSesDeuxParticipantsEtUnMessage() {
        Utilisateur awa = membre(TypeRole.ALUMNI);
        Utilisateur moussa = membre(TypeRole.ETUDIANT);

        Conversation conversation = conversations.saveAndFlush(Conversation.directe(awa.getId(), moussa.getId()));
        participants.saveAndFlush(Participant.de(conversation, awa, RoleParticipant.MEMBRE));
        participants.saveAndFlush(Participant.de(conversation, moussa, RoleParticipant.MEMBRE));

        Message message = new Message();
        message.setConversation(conversation);
        message.setAuteur(awa);
        message.setContenu("Bonjour Moussa, bienvenue dans le réseau.");
        Message enregistre = messages.saveAndFlush(message);

        assertThat(conversation.getType()).isEqualTo(TypeConversation.DIRECTE);
        assertThat(conversation.getNom()).isNull();
        assertThat(conversation.getCreeLe()).isNotNull();
        assertThat(conversation.getDernierMessageLe()).isEqualTo(conversation.getCreeLe());
        assertThat(participants.findByConversationIdOrderByRejointLeAsc(conversation.getId()))
            .extracting(p -> p.getUtilisateur().getId())
            .containsExactly(awa.getId(), moussa.getId());
        assertThat(participants.findByConversationIdAndUtilisateurId(conversation.getId(), moussa.getId()))
            .hasValueSatisfying(p -> assertThat(p.getDernierLuLe()).isNull());
        assertThat(enregistre.getEnvoyeLe()).isNotNull();
        assertThat(enregistre.estSupprime()).isFalse();
        assertThat(messages.countByConversationId(conversation.getId())).isEqualTo(1);
    }

    @Test
    void retrouveLaConversationDirecteQuelQueSoitLOrdreDesDeuxPersonnes() {
        Utilisateur awa = membre(TypeRole.ALUMNI);
        Utilisateur moussa = membre(TypeRole.ALUMNI);
        Conversation conversation = conversations.saveAndFlush(Conversation.directe(awa.getId(), moussa.getId()));

        assertThat(conversations.findByCleDirecte(Conversation.cleDirecte(moussa.getId(), awa.getId())))
            .hasValueSatisfying(trouvee -> assertThat(trouvee.getId()).isEqualTo(conversation.getId()));
    }

    @Test
    void refuseUneSecondeConversationDirecteEntreLesMemesPersonnes() {
        Utilisateur awa = membre(TypeRole.ALUMNI);
        Utilisateur moussa = membre(TypeRole.PERSONNEL);
        conversations.saveAndFlush(Conversation.directe(awa.getId(), moussa.getId()));

        assertThatThrownBy(() -> conversations.saveAndFlush(Conversation.directe(moussa.getId(), awa.getId())))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void refuseUneConversationDirecteAvecSoiMeme() {
        UUID seul = UUID.randomUUID();
        assertThatThrownBy(() -> Conversation.directe(seul, seul)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void enregistreUnGroupeAvecSonAdministrateur() {
        Utilisateur createur = membre(TypeRole.ALUMNI);
        Conversation groupe = conversations.saveAndFlush(Conversation.groupe("Promotion 2018"));
        Participant administrateur = participants.saveAndFlush(Participant.de(groupe, createur, RoleParticipant.ADMINISTRATEUR));

        assertThat(groupe.getType()).isEqualTo(TypeConversation.GROUPE);
        assertThat(groupe.getCleDirecte()).isNull();
        assertThat(administrateur.getRole()).isEqualTo(RoleParticipant.ADMINISTRATEUR);
        assertThat(administrateur.getRejointLe()).isNotNull();
    }

    @Test
    void refuseUnGroupeSansNom() {
        Conversation groupe = Conversation.groupe(null);
        assertThatThrownBy(() -> conversations.saveAndFlush(groupe)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void refuseUneConversationDirecteSansCle() {
        Conversation directe = new Conversation();
        directe.setType(TypeConversation.DIRECTE);
        assertThatThrownBy(() -> conversations.saveAndFlush(directe)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void refuseDeuxFoisLeMemeParticipant() {
        Utilisateur membre = membre(TypeRole.ALUMNI);
        Conversation groupe = conversations.saveAndFlush(Conversation.groupe("Génie informatique"));
        participants.saveAndFlush(Participant.de(groupe, membre, RoleParticipant.MEMBRE));

        assertThatThrownBy(() -> participants.saveAndFlush(Participant.de(groupe, membre, RoleParticipant.MEMBRE)))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void refuseUnMessageTropLong() {
        Utilisateur auteur = membre(TypeRole.ALUMNI);
        Conversation groupe = conversations.saveAndFlush(Conversation.groupe("Sénégal"));
        Message message = new Message();
        message.setConversation(groupe);
        message.setAuteur(auteur);
        message.setContenu("a".repeat(Message.LONGUEUR_MAX_CONTENU + 1));

        assertThatThrownBy(() -> messages.saveAndFlush(message)).isInstanceOf(DataIntegrityViolationException.class);
    }
}
