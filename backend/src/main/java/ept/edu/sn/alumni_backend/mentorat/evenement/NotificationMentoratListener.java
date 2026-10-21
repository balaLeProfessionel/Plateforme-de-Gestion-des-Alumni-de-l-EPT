package ept.edu.sn.alumni_backend.mentorat.evenement;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import ept.edu.sn.alumni_backend.auth.EmailService;
import lombok.RequiredArgsConstructor;

/**
 * Envoie les notifications après le commit : aucun e-mail ne part pour un changement annulé.
 * Quand les notifications internes (TRA-06) existeront, elles se brancheront ici.
 */
@Component
@RequiredArgsConstructor
public class NotificationMentoratListener {
    private final EmailService emailService;

    @TransactionalEventListener
    public void notifier(NotificationMentorat notification) {
        emailService.envoyerNotification(
            notification.destinataire(), notification.sujet(), notification.message());
    }
}
