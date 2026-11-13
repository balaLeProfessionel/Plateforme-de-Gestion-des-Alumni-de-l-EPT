package ept.edu.sn.alumni_backend.notification;

import java.util.UUID;

/**
 * Événement publié par les rubriques (mentorat, événements, comptes). La notification n'est écrite
 * qu'après le commit de la transaction d'origine : rien n'apparaît pour un changement annulé.
 */
public record NouvelleNotification(UUID destinataireId, TypeNotification type, String titre, String message, String lien) {
}
