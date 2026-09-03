package ept.edu.sn.alumni_backend.parcours.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.service.OrganismeService;
import ept.edu.sn.alumni_backend.parcours.dto.ExperienceRequest;
import ept.edu.sn.alumni_backend.parcours.dto.ExperienceResponse;
import ept.edu.sn.alumni_backend.parcours.entity.ExperienceProfessionelle;
import ept.edu.sn.alumni_backend.parcours.mapper.ExperienceMapper;
import ept.edu.sn.alumni_backend.parcours.repository.ExperienceRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExperienceService {
    private final ExperienceRepository experienceRepository;
    private final OrganismeService organismeService;
    private final ExperienceMapper experienceMapper;

    public List<ExperienceResponse> listerPour(Utilisateur utilisateur) {
        return this.experienceRepository.findByUtilisateurOrderByDateDebutDesc(utilisateur)
            .stream()
            .map(this.experienceMapper::versResponse)
            .toList();
    }

    public ExperienceResponse creer(Utilisateur utilisateur, ExperienceRequest request) {
        Organisme organisme = organismeService.resoudreOrganisme(
            request.organismeId(), request.nomNouvelOrganisme());

        ExperienceProfessionelle exp = new ExperienceProfessionelle();
        exp.setUtilisateur(utilisateur);
        exp.setOrganisme(organisme);
        this.experienceMapper.appliquer(exp, request);
        exp.setEstValide(true);

        return this.experienceMapper.versResponse(experienceRepository.save(exp));
    }

    public ExperienceResponse modifier(Utilisateur utilisateur, UUID id, ExperienceRequest request) {
        ExperienceProfessionelle exp = trouverEtVerifierProprietaire(utilisateur, id);

        // Si l'organisme change, on le re-résout
        Organisme organisme = organismeService.resoudreOrganisme(
            request.organismeId(), request.nomNouvelOrganisme());
        exp.setOrganisme(organisme);
        this.experienceMapper.appliquer(exp, request);

        return this.experienceMapper.versResponse(experienceRepository.save(exp));
    }

    public void supprimer(Utilisateur utilisateur, UUID id) {
        ExperienceProfessionelle exp = trouverEtVerifierProprietaire(utilisateur, id);
        experienceRepository.delete(exp);
    }


    // Sécurité essentielle : on vérifie que l'expérience appartient bien
    // à l'utilisateur qui la modifie/supprime
    private ExperienceProfessionelle trouverEtVerifierProprietaire(Utilisateur utilisateur, UUID id) {
        ExperienceProfessionelle exp = experienceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Expérience introuvable"));
        if (!exp.getUtilisateur().getId().equals(utilisateur.getId())) {
            throw new SecurityException("Cette expérience ne vous appartient pas");
        }
        return exp;
    }
}
