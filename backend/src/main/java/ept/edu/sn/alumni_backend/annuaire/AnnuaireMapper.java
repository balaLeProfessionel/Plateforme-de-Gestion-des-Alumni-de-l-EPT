package ept.edu.sn.alumni_backend.annuaire;

import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.annuaire.dto.AnnuaireMembreResponse;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

@Component
public class AnnuaireMapper {
    public AnnuaireMembreResponse versResponse(Utilisateur utilisateur) {
        if (utilisateur.getRole() == TypeRole.ORGANISME
                && utilisateur.getOrganisme() != null) {
            var organisme = utilisateur.getOrganisme();
            return new AnnuaireMembreResponse(
                utilisateur.getId(),
                organisme.getNom(),
                null,
                utilisateur.getRole().name(),
                utilisateur.getStatutCompte().name(),
                organisme.getLogoUrl(),
                organisme.getSecteurActivite(),
                organisme.getAdresse() != null ? organisme.getAdresse() : organisme.getPays(),
                null,
                null,
                organisme.getId()
            );
        }
        return new AnnuaireMembreResponse(
            utilisateur.getId(),
            utilisateur.getNom(),
            utilisateur.getPrenom(),
            utilisateur.getRole().name(),
            utilisateur.getStatutCompte().name(),
            utilisateur.getUrlPhoto(),
            utilisateur.getPosteActuel(),
            utilisateur.getVilleResidence(),
            utilisateur.getFiliere(),
            utilisateur.getAnneeSortie(),
            null
        );
    }
}
