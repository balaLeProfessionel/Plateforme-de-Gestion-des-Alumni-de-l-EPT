package ept.edu.sn.alumni_backend.messagerie.tempsreel;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Temps réel de la messagerie par Server-Sent Events : chaque onglet ouvert garde une connexion HTTP
 * et le serveur y écrit un court signal quand une de ses conversations change.
 *
 * <p>Les connexions sont gardées en mémoire : cela suffit pour un seul serveur. Elles durent
 * {@link #DUREE_CONNEXION} au plus, puis le navigateur se reconnecte (avec un jeton à jour).
 */
@Component
public class DiffuseurMessagerie {
    static final Duration DUREE_CONNEXION = Duration.ofMinutes(10);
    /** Un membre a rarement plus de quelques onglets : au-delà, la plus ancienne connexion est fermée. */
    static final int CONNEXIONS_MAX_PAR_MEMBRE = 5;

    private final Map<UUID, Set<SseEmitter>> connexions = new ConcurrentHashMap<>();

    public SseEmitter ouvrir(UUID utilisateurId) {
        SseEmitter connexion = new SseEmitter(DUREE_CONNEXION.toMillis());
        Set<SseEmitter> siennes = connexions.computeIfAbsent(utilisateurId, id -> new CopyOnWriteArraySet<>());
        while (siennes.size() >= CONNEXIONS_MAX_PAR_MEMBRE) {
            siennes.stream().findFirst().ifPresent(ancienne -> {
                siennes.remove(ancienne);
                ancienne.complete();
            });
        }
        siennes.add(connexion);
        connexion.onCompletion(() -> retirer(utilisateurId, connexion));
        connexion.onTimeout(() -> {
            retirer(utilisateurId, connexion);
            connexion.complete();
        });
        connexion.onError(erreur -> retirer(utilisateurId, connexion));
        // Premier événement : le navigateur sait que le flux est ouvert et se resynchronise.
        envoyer(utilisateurId, connexion, SseEmitter.event().name("pret").data("{}", MediaType.APPLICATION_JSON));
        return connexion;
    }

    /** Diffusé après la validation en base : on ne signale jamais un changement annulé. */
    @TransactionalEventListener(fallbackExecution = true)
    public void diffuser(EvenementMessagerie evenement) {
        String donnees = "{\"conversationId\":\"" + evenement.conversationId() + "\"}";
        for (UUID destinataire : evenement.destinataires()) {
            for (SseEmitter connexion : connexions.getOrDefault(destinataire, Set.of())) {
                envoyer(destinataire, connexion, SseEmitter.event()
                    .name(evenement.type().nomEvenement())
                    .data(donnees, MediaType.APPLICATION_JSON));
            }
        }
    }

    /** Un commentaire régulier garde la connexion ouverte à travers les proxys et repère les onglets fermés. */
    @Scheduled(fixedRate = 25_000)
    void entretenir() {
        connexions.forEach((utilisateurId, siennes) -> siennes.forEach(connexion ->
            envoyer(utilisateurId, connexion, SseEmitter.event().comment("ok"))));
    }

    int nombreConnexions(UUID utilisateurId) {
        return connexions.getOrDefault(utilisateurId, Set.of()).size();
    }

    private void envoyer(UUID utilisateurId, SseEmitter connexion, SseEmitter.SseEventBuilder evenement) {
        try {
            connexion.send(evenement);
        } catch (IOException | IllegalStateException fermee) {
            // Onglet fermé ou connexion déjà terminée : on l'oublie.
            retirer(utilisateurId, connexion);
        }
    }

    private void retirer(UUID utilisateurId, SseEmitter connexion) {
        connexions.computeIfPresent(utilisateurId, (id, siennes) -> {
            siennes.remove(connexion);
            return siennes.isEmpty() ? null : siennes;
        });
    }
}
