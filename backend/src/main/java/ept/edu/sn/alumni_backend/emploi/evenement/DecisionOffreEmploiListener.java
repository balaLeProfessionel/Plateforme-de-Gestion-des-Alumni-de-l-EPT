package ept.edu.sn.alumni_backend.emploi.evenement;

import ept.edu.sn.alumni_backend.auth.EmailService;
import ept.edu.sn.alumni_backend.notification.NotificationService;
import ept.edu.sn.alumni_backend.notification.NouvelleNotification;
import ept.edu.sn.alumni_backend.notification.TypeNotification;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/** Prévient l'auteur après le commit : rien ne part pour une décision annulée. */
@Component
@RequiredArgsConstructor
public class DecisionOffreEmploiListener {
    private final EmailService emailService;
    private final NotificationService notificationService;

    @TransactionalEventListener
    public void prevenir(DecisionOffreEmploi decision) {
        notificationService.enregistrer(new NouvelleNotification(decision.destinataireId(), TypeNotification.EMPLOI,
            decision.sujet(), decision.message(), decision.lien()));
        if (decision.email() != null) {
            emailService.envoyerNotification(decision.email(), decision.sujet(), "Bonjour, " + decision.message());
        }
    }
}
