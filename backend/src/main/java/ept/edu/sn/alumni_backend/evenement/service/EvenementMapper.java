package ept.edu.sn.alumni_backend.evenement.service;

import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.evenement.dto.EvenementResponse;
import ept.edu.sn.alumni_backend.evenement.entity.Evenement;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

@Component
public class EvenementMapper {
    public EvenementResponse versResponse(Evenement evenement, long nombreParticipants) {
        Utilisateur organisateur = evenement.getOrganisateur();
        boolean estOrganisme = organisateur.getRole() == TypeRole.ORGANISME;
        String nom = estOrganisme && organisateur.getOrganisme() != null
            ? organisateur.getOrganisme().getNom()
            : organisateur.getNom();
        String prenom = estOrganisme ? null : organisateur.getPrenom();

        return new EvenementResponse(
            evenement.getId(),
            evenement.getTitre(),
            evenement.getDescription(),
            evenement.getLieu(),
            evenement.getDateDebut(),
            evenement.getDateFin(),
            evenement.getAudience(),
            evenement.getNombrePlaces(),
            evenement.isOfficielEpt(),
            evenement.getStatut(),
            organisateur.getId(),
            nom,
            prenom,
            nombreParticipants
        );
    }
}
