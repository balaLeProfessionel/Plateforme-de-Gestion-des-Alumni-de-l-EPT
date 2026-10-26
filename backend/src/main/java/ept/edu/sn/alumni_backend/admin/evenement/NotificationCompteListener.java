package ept.edu.sn.alumni_backend.admin.evenement;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import ept.edu.sn.alumni_backend.auth.EmailService;
import lombok.RequiredArgsConstructor;

/** Envoie l'e-mail après le commit : rien ne part pour une décision annulée. */
@Component
@RequiredArgsConstructor
public class NotificationCompteListener {
    private final EmailService emailService;

    @TransactionalEventListener
    public void notifier(NotificationCompte notification) {
        emailService.envoyerNotification(
            notification.destinataire(), notification.sujet(), notification.message());
    }
}
