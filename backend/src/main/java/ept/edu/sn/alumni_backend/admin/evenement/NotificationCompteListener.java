package ept.edu.sn.alumni_backend.admin.evenement;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import ept.edu.sn.alumni_backend.auth.EmailService;
import ept.edu.sn.alumni_backend.notification.NotificationService;
import ept.edu.sn.alumni_backend.notification.NouvelleNotification;
import ept.edu.sn.alumni_backend.notification.TypeNotification;
import lombok.RequiredArgsConstructor;

/** Envoie l'e-mail après le commit : rien ne part pour une décision annulée. */
@Component
@RequiredArgsConstructor
public class NotificationCompteListener {
    private final EmailService emailService;
    private final NotificationService notificationService;

    @TransactionalEventListener
    public void notifier(NotificationCompte notification) {
        notificationService.enregistrer(new NouvelleNotification(notification.destinataireId(), TypeNotification.COMPTE,
            notification.sujet(), notification.message(), null));
        emailService.envoyerNotification(
            notification.destinataire(), notification.sujet(), notification.message());
    }

    @TransactionalEventListener
    public void envoyerIdentifiants(IdentifiantsCompte identifiants) {
        emailService.envoyerIdentifiants(
            identifiants.destinataire(), identifiants.salutation(), identifiants.motDePasseProvisoire());
    }
}
