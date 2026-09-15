package ept.edu.sn.alumni_backend.annuaire;

import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.annuaire.dto.AnnuaireMembreResponse;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

@Component
public class AnnuaireMapper {
    public AnnuaireMembreResponse versResponse(Utilisateur utilisateur) {
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
            utilisateur.getAnneeSortie()
        );
    }
}
