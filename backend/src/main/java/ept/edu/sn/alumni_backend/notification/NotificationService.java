package ept.edu.sn.alumni_backend.notification;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.server.ResponseStatusException;

import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {
    /** Au-delà, les notifications sont supprimées par le nettoyage horaire. */
    static final Duration CONSERVATION = Duration.ofDays(90);
    private static final int LONGUEUR_TITRE = 120;
    private static final int LONGUEUR_MESSAGE = 500;

    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;

    /** Après le commit de l'action d'origine, dans sa propre transaction. */
    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enregistrer(NouvelleNotification evenement) {
        if (evenement.destinataireId() == null) return;
        Notification notification = new Notification();
        notification.setDestinataire(utilisateurRepository.getReferenceById(evenement.destinataireId()));
        notification.setType(evenement.type());
        notification.setTitre(tronquer(evenement.titre(), LONGUEUR_TITRE));
        notification.setMessage(tronquer(evenement.message() == null ? "" : evenement.message(), LONGUEUR_MESSAGE));
        notification.setLien(evenement.lien());
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public PageNotificationsResponse lister(UUID destinataireId, boolean nonLuesSeulement, int page, int taille) {
        PageRequest pagination = PageRequest.of(page, taille);
        Page<Notification> notifications = nonLuesSeulement
            ? notificationRepository.findByDestinataire_IdAndLueFalseOrderByCreeLeDescIdDesc(destinataireId, pagination)
            : notificationRepository.findByDestinataire_IdOrderByCreeLeDescIdDesc(destinataireId, pagination);
        return new PageNotificationsResponse(
            notifications.map(NotificationResponse::depuis).getContent(),
            notifications.getNumber(),
            notifications.getSize(),
            notifications.getTotalElements(),
            notifications.getTotalPages(),
            notificationRepository.countByDestinataire_IdAndLueFalse(destinataireId));
    }

    @Transactional(readOnly = true)
    public long compterNonLues(UUID destinataireId) {
        return notificationRepository.countByDestinataire_IdAndLueFalse(destinataireId);
    }

    @Transactional
    public void marquerLue(UUID id, UUID destinataireId) {
        // La notification d'un autre membre est « introuvable », comme si elle n'existait pas.
        if (notificationRepository.marquerLue(id, destinataireId) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification introuvable.");
        }
    }

    @Transactional
    public void toutMarquerLu(UUID destinataireId) {
        notificationRepository.toutMarquerLu(destinataireId);
    }

    @Transactional
    public int supprimerAnciennes() {
        return notificationRepository.supprimerAnterieuresA(Instant.now().minus(CONSERVATION));
    }

    private static String tronquer(String texte, int longueur) {
        return texte.length() <= longueur ? texte : texte.substring(0, longueur - 1) + "…";
    }
}
