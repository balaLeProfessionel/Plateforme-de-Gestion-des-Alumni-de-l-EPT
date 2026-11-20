package ept.edu.sn.alumni_backend.mentorat.evenement;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import ept.edu.sn.alumni_backend.auth.EmailService;
import ept.edu.sn.alumni_backend.notification.NotificationService;
import ept.edu.sn.alumni_backend.notification.NouvelleNotification;
import ept.edu.sn.alumni_backend.notification.TypeNotification;
import lombok.RequiredArgsConstructor;

/** Après le commit seulement : rien ne part pour un changement annulé. Cloche d'abord, puis e-mail. */
@Component
@RequiredArgsConstructor
public class NotificationMentoratListener {
    private final EmailService emailService;
    private final NotificationService notificationService;

    @TransactionalEventListener
    public void notifier(NotificationMentorat notification) {
        notificationService.enregistrer(new NouvelleNotification(notification.destinataireId(), TypeNotification.MENTORAT,
            notification.sujet(), notification.message(), notification.lien()));
        emailService.envoyerNotification(
            notification.destinataire(), notification.sujet(), notification.message());
    }
}
