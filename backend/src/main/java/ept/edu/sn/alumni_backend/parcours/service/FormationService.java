package ept.edu.sn.alumni_backend.parcours.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.service.OrganismeService;
import ept.edu.sn.alumni_backend.parcours.dto.FormationRequest;
import ept.edu.sn.alumni_backend.parcours.dto.FormationResponse;
import ept.edu.sn.alumni_backend.parcours.entity.Formation;
import ept.edu.sn.alumni_backend.parcours.mapper.FormationMapper;
import ept.edu.sn.alumni_backend.parcours.repository.FormationRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FormationService {
    private final FormationRepository formationRepository;
    private final OrganismeService organismeService;
    private final FormationMapper formationMapper;

    public List<FormationResponse> listerPour(Utilisateur utilisateur) {
        return this.formationRepository.findByUtilisateurOrderByDateDebutDesc(utilisateur)
            .stream()
            .map(this.formationMapper::versResponse)
            .toList();
    }

    @Transactional
    public FormationResponse creer(Utilisateur utilisateur, FormationRequest request) {
        Organisme organisme = organismeService.resoudreOrganisme(
            request.organismeId(), request.nomNouvelOrganisme());

        Formation formation = new Formation();
        formation.setUtilisateur(utilisateur);
        formation.setOrganisme(organisme);
        this.formationMapper.appliquer(formation, request);
        formation.setEstValide(true);

        return this.formationMapper.versResponse(formationRepository.save(formation));
    }

    @Transactional
    public FormationResponse modifier(Utilisateur utilisateur, UUID id, FormationRequest request) {
        Formation formation = trouverEtVerifierProprietaire(utilisateur, id);

        // Si l'organisme change, on le re-résout
        Organisme organisme = organismeService.resoudreOrganisme(
            request.organismeId(), request.nomNouvelOrganisme());
        formation.setOrganisme(organisme);
        this.formationMapper.appliquer(formation, request);

        return this.formationMapper.versResponse(formationRepository.save(formation));
    }

    @Transactional
    public void supprimer(Utilisateur utilisateur, UUID id) {
        Formation formation = trouverEtVerifierProprietaire(utilisateur, id);
        formationRepository.delete(formation);
    }


    // Sécurité essentielle : on vérifie que la formation appartient bien
    // à l'utilisateur qui la modifie/supprime
    private Formation trouverEtVerifierProprietaire(Utilisateur utilisateur, UUID id) {
        Formation formation = formationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Formation introuvable"));
        if (!formation.getUtilisateur().getId().equals(utilisateur.getId())) {
            throw new SecurityException("Cette formation ne vous appartient pas");
        }
        return formation;
    }
}
