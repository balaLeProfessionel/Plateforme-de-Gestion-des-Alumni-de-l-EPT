package ept.edu.sn.alumni_backend.parcours.mapper;

import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.parcours.dto.FormationRequest;
import ept.edu.sn.alumni_backend.parcours.dto.FormationResponse;
import ept.edu.sn.alumni_backend.parcours.entity.Formation;

@Component
public class FormationMapper {

    public FormationResponse versResponse(Formation formation) {
        return new FormationResponse(
            formation.getId(),
            formation.getLibelle(),
            formation.getDescription(),
            formation.getTypeFormation(),
            formation.getDateDebut(),
            formation.getDateFin(),
            formation.isEstStage(),
            formation.getDateFin() == null,
            formation.getOrganisme().getId(),
            formation.getOrganisme().getNom()
        );
    }

    public void appliquer(Formation formation, FormationRequest request) {
        formation.setLibelle(request.libelle());
        formation.setDescription(request.description());
        formation.setTypeFormation(request.typeFormation());
        formation.setDateDebut(request.dateDebut());
        formation.setDateFin(request.dateFin());
        formation.setEstStage(request.estStage());
    }
}
