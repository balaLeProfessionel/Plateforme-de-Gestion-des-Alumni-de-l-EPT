package ept.edu.sn.alumni_backend.messagerie.service;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.messagerie.dto.MembreBloqueResponse;
import ept.edu.sn.alumni_backend.messagerie.entity.Blocage;
import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;
import ept.edu.sn.alumni_backend.messagerie.exception.MessagerieIntrouvableException;
import ept.edu.sn.alumni_backend.messagerie.repository.BlocageRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.ConversationRepository;
import ept.edu.sn.alumni_backend.messagerie.tempsreel.EvenementMessagerie;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/** Bloquer et débloquer un membre. Aucune notification : la personne bloquée n'est pas prévenue. */
@Service
@RequiredArgsConstructor
public class BlocageService {
    private final BlocageRepository blocages;
    private final ConversationRepository conversations;
    private final UtilisateurRepository utilisateurs;
    private final ApplicationEventPublisher evenements;

    @Transactional(readOnly = true)
    public List<MembreBloqueResponse> lister(UUID moi) {
        return blocages.findByBloqueurIdOrderByCreeLeDesc(moi).stream().map(blocage -> {
            Utilisateur bloque = blocage.getBloque();
            return new MembreBloqueResponse(bloque.getId(), bloque.getPrenom(), bloque.getNom(),
                MessagerieMapper.nomAffiche(bloque), bloque.getUrlPhoto(), bloque.getRole(), blocage.getCreeLe());
        }).toList();
    }

    /** Sans effet si le membre est déjà bloqué. */
    @Transactional
    public void bloquer(UUID moi, UUID membreId) {
        if (moi.equals(membreId)) throw new IllegalArgumentException("Vous ne pouvez pas vous bloquer vous-même.");
        Utilisateur membre = utilisateurs.findById(membreId)
            .orElseThrow(() -> new MessagerieIntrouvableException("Ce membre est introuvable."));
        if (blocages.existsByBloqueurIdAndBloqueId(moi, membreId)) return;
        blocages.saveAndFlush(Blocage.de(utilisateurs.getReferenceById(moi), membre));
        signaler(moi, membreId);
    }

    /** Sans effet si le membre n'était pas bloqué. */
    @Transactional
    public void debloquer(UUID moi, UUID membreId) {
        if (blocages.supprimer(moi, membreId) > 0) signaler(moi, membreId);
    }

    /** La zone de saisie de leur conversation directe s'ouvre ou se ferme, dans tous les onglets des deux personnes. */
    private void signaler(UUID moi, UUID membreId) {
        conversations.findByCleDirecte(Conversation.cleDirecte(moi, membreId)).ifPresent(conversation ->
            evenements.publishEvent(new EvenementMessagerie(Set.of(moi, membreId),
                EvenementMessagerie.Type.CONVERSATION, conversation.getId())));
    }
}
