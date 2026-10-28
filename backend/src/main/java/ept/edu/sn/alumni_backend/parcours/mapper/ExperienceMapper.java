package ept.edu.sn.alumni_backend.parcours.mapper;

import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.parcours.dto.ExperienceRequest;
import ept.edu.sn.alumni_backend.parcours.dto.ExperienceResponse;
import ept.edu.sn.alumni_backend.parcours.entity.ExperienceProfessionelle;

@Component
public class ExperienceMapper {

    public ExperienceResponse versResponse(ExperienceProfessionelle exp) {
        return new ExperienceResponse(
            exp.getId(),
            exp.getPoste(),
            exp.getDescription(),
            exp.getTypeContrat(),
            exp.getDateDebut(),
            exp.getDateFin(),
            exp.isEstStage(),
            exp.getDateFin() == null,
            exp.getOrganisme().getId(),
            exp.getOrganisme().getNom(),
            exp.getOrganisme().isEtablissementEpt()
        );
    }

    public void appliquer(ExperienceProfessionelle exp, ExperienceRequest request) {
        exp.setPoste(request.poste());
        exp.setDescription(request.description());
        exp.setTypeContrat(request.typeContrat());
        exp.setDateDebut(request.dateDebut());
        exp.setDateFin(request.dateFin());
        exp.setEstStage(request.estStage());
    }
}
