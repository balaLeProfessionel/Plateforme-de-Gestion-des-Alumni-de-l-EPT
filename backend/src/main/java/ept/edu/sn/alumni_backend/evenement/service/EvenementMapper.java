package ept.edu.sn.alumni_backend.evenement.service;

import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.evenement.dto.EvenementResponse;
import ept.edu.sn.alumni_backend.evenement.ReponseParticipation;
import ept.edu.sn.alumni_backend.evenement.entity.Evenement;
import ept.edu.sn.alumni_backend.utilisateur.IdentitePublique;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

@Component
public class EvenementMapper {
    public EvenementResponse versResponse(Evenement evenement, long nombreParticipants) {
        return versResponse(evenement, nombreParticipants, null);
    }

    public EvenementResponse versResponse(
            Evenement evenement,
            long nombreParticipants,
            ReponseParticipation maReponse) {
        Utilisateur organisateur = evenement.getOrganisateur();
        IdentitePublique identite = IdentitePublique.de(organisateur);

        return new EvenementResponse(
            evenement.getId(),
            evenement.getTitre(),
            evenement.getDescription(),
            evenement.getLieu(),
            evenement.getUrlImage(),
            evenement.getDateDebut(),
            evenement.estPonctuel() ? null : evenement.getDateFin(),
            evenement.getAudience(),
            evenement.getNombrePlaces(),
            evenement.isOfficielEpt(),
            evenement.getStatut(),
            organisateur.getId(),
            identite.nom(),
            identite.prenom(),
            nombreParticipants,
            maReponse,
            evenement.isParticipantsVisibles(),
            identite.organismeId()
        );
    }
}
