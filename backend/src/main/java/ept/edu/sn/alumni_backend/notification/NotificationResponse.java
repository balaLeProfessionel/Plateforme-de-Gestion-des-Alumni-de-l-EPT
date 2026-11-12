package ept.edu.sn.alumni_backend.notification;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
    UUID id,
    TypeNotification type,
    String titre,
    String message,
    String lien,
    boolean lue,
    Instant creeLe
) {
    static NotificationResponse depuis(Notification notification) {
        return new NotificationResponse(notification.getId(), notification.getType(), notification.getTitre(),
            notification.getMessage(), notification.getLien(), notification.isLue(), notification.getCreeLe());
    }
}
