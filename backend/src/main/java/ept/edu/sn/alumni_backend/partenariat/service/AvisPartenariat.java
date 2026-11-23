package ept.edu.sn.alumni_backend.partenariat.service;

import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.notification.NouvelleNotification;
import ept.edu.sn.alumni_backend.notification.TypeNotification;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/** Notifications des partenariats : au service des Relations extérieures, ou au compte de l'organisme. Envoyées après commit. */
@Component
@RequiredArgsConstructor
class AvisPartenariat {
    private final UtilisateurRepository utilisateurRepository;
    private final ApplicationEventPublisher evenements;

    void auxRelationsExterieures(String titre, String message, String lien) {
        utilisateurRepository.administrateursActifsAvecUneDe(List.of(PermissionAdmin.GERER_PARTENARIATS, PermissionAdmin.GERER_ADMINISTRATEURS))
            .forEach(chef -> evenements.publishEvent(new NouvelleNotification(chef.getId(), TypeNotification.PARTENARIAT, titre, message, lien)));
    }

    void aLOrganisme(Organisme organisme, String titre, String message, String lien) {
        Utilisateur contact = organisme.getContact();
        if (contact != null) {
            evenements.publishEvent(new NouvelleNotification(contact.getId(), TypeNotification.PARTENARIAT, titre, message, lien));
        }
    }
}
