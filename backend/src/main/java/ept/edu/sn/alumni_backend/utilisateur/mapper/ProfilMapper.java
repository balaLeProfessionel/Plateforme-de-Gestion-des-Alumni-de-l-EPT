package ept.edu.sn.alumni_backend.utilisateur.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.competence.dto.CompetencesLanguesResponse;
import ept.edu.sn.alumni_backend.utilisateur.SituationActuelle;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.dto.ProfilRequest;
import ept.edu.sn.alumni_backend.utilisateur.dto.ProfilResponse;
import ept.edu.sn.alumni_backend.utilisateur.dto.ProfilPublicResponse;
import ept.edu.sn.alumni_backend.parcours.dto.ExperienceResponse;
import ept.edu.sn.alumni_backend.parcours.dto.FormationResponse;

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
            u.getNomFiliere(),
            u.getClasse() == null ? null : u.getClasse().name(),
            u.getAnneeSortie(),
            u.isRecherchePublique(),
            u.getSituationActuelle() == null ? null : u.getSituationActuelle().name(),
            u.getPaysResidence()
        );
    }

    public ProfilPublicResponse versResponsePublique(
            Utilisateur utilisateur,
            List<ExperienceResponse> experiences,
            List<FormationResponse> formations,
            CompetencesLanguesResponse competencesLangues) {
        return new ProfilPublicResponse(
            utilisateur.getId(),
            utilisateur.getNom(),
            utilisateur.getPrenom(),
            utilisateur.getRole().name(),
            utilisateur.getStatutCompte().name(),
            utilisateur.getBio(),
            utilisateur.getVilleResidence(),
            utilisateur.getPosteActuel(),
            utilisateur.getLienLinkedin(),
            utilisateur.getLienPortfolio(),
            utilisateur.getUrlPhoto(),
            utilisateur.getNomFiliere(),
            utilisateur.getClasse() == null ? null : utilisateur.getClasse().name(),
            utilisateur.getAnneeSortie(),
            experiences,
            formations,
            utilisateur.getSituationActuelle() == null ? null : utilisateur.getSituationActuelle().name(),
            utilisateur.getPaysResidence(),
            competencesLangues.competences(),
            competencesLangues.langues()
        );
    }

    // Applique uniquement les champs non-null : permet une mise a jour partielle
    public void appliquer(Utilisateur u, ProfilRequest request) {
        if (request.nom() != null) u.setNom(request.nom().trim());
        if (request.prenom() != null) u.setPrenom(request.prenom().trim());
        if (request.bio() != null) u.setBio(request.bio().trim());
        if (request.villeResidence() != null) u.setVilleResidence(request.villeResidence().trim());
        if (request.posteActuel() != null) u.setPosteActuel(request.posteActuel().trim());
        if (request.lienLinkedin() != null) u.setLienLinkedin(request.lienLinkedin().trim());
        if (request.lienPortfolio() != null) u.setLienPortfolio(request.lienPortfolio().trim());
        if (request.telephone() != null) u.setTelephone(request.telephone().trim());
        if (Boolean.TRUE.equals(request.effacerDateNaissance())) {
            u.setDateNaissance(null);
        } else if (request.dateNaissance() != null) {
            u.setDateNaissance(request.dateNaissance());
        }
        if (request.situationActuelle() != null) {
            u.setSituationActuelle(request.situationActuelle().isEmpty()
                ? null : SituationActuelle.valueOf(request.situationActuelle()));
        }
        if (request.paysResidence() != null) {
            u.setPaysResidence(request.paysResidence().isEmpty() ? null : request.paysResidence());
        }
    }
}
