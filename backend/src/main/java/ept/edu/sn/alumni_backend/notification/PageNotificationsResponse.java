package ept.edu.sn.alumni_backend.notification;

import java.util.List;

/** Une page de notifications, avec le nombre total de non lues pour la pastille de la cloche. */
public record PageNotificationsResponse(
    List<NotificationResponse> contenu,
    int page,
    int taille,
    long totalElements,
    int totalPages,
    long nonLues
) {
}
