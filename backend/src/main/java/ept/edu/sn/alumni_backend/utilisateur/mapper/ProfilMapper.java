package ept.edu.sn.alumni_backend.utilisateur.mapper;

import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.dto.ProfilRequest;
import ept.edu.sn.alumni_backend.utilisateur.dto.ProfilResponse;

@Component
public class ProfilMapper {

    public ProfilResponse versResponse(Utilisateur u) {
        return new ProfilResponse(
            u.getId(),
            u.getNom(),
            u.getPrenom(),
            u.getEmail(),
            u.getRole().name(),
            u.getStatutCompte().name(),
            u.getBio(),
            u.getVilleResidence(),
            u.getPosteActuel(),
            u.getLienLinkedin(),
            u.getLienPortfolio(),
            u.getUrlPhoto(),
            u.getTelephone(),
            u.getDateNaissance(),
            u.getFiliere(),
            u.getAnneeSortie()
        );
    }

    // Applique uniquement les champs non-null : permet une mise a jour partielle
    public void appliquer(Utilisateur u, ProfilRequest request) {
        if (request.bio() != null) u.setBio(request.bio());
        if (request.villeResidence() != null) u.setVilleResidence(request.villeResidence());
        if (request.posteActuel() != null) u.setPosteActuel(request.posteActuel());
        if (request.lienLinkedin() != null) u.setLienLinkedin(request.lienLinkedin());
        if (request.lienPortfolio() != null) u.setLienPortfolio(request.lienPortfolio());
        if (request.urlPhoto() != null) u.setUrlPhoto(request.urlPhoto());
        if (request.telephone() != null) u.setTelephone(request.telephone());
        if (Boolean.TRUE.equals(request.effacerDateNaissance())) {
            u.setDateNaissance(null);
        } else if (request.dateNaissance() != null) {
            u.setDateNaissance(request.dateNaissance());
        }
    }
}
