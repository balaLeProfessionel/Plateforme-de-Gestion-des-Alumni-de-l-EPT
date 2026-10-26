package ept.edu.sn.alumni_backend.admin.service;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.entity.ActionAdmin;
import ept.edu.sn.alumni_backend.admin.NomCompte;
import ept.edu.sn.alumni_backend.admin.evenement.IdentifiantsCompte;
import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.admin.repository.ActionAdminRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

/** Consigne une décision au journal et prévient le titulaire du compte (après le commit). */
@Component
@RequiredArgsConstructor
public class TraceCompte {
    private final ActionAdminRepository actionAdminRepository;
    private final ApplicationEventPublisher evenements;

    public void consigner(UtilisateurPrincipal principal, Utilisateur cible, TypeActionAdmin type, String motif, String details) {
        actionAdminRepository.save(new ActionAdmin(principal.getUtilisateur(), cible, type, motif, details));
    }

    public void notifier(Utilisateur compte, String sujet, String message) {
        evenements.publishEvent(new NotificationCompte(compte.getEmail(), sujet, message));
    }

    /** Mot de passe provisoire d'un compte créé : un message à part, jamais écrit dans les journaux. */
    public void envoyerIdentifiants(Utilisateur compte, String motDePasseProvisoire) {
        evenements.publishEvent(new IdentifiantsCompte(compte.getEmail(), NomCompte.salutation(compte), motDePasseProvisoire));
    }
}
