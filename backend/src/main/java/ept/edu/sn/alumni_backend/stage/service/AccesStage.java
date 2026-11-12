package ept.edu.sn.alumni_backend.stage.service;

import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.filiere.repository.ChefDepartementRepository;
import ept.edu.sn.alumni_backend.stage.entity.Stage;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

/**
 * Qui, hors administration, peut lire les documents d'un stage (convention signée, rapport) : l'étudiant, l'organisme
 * d'accueil (pour le maître de stage), l'encadrant interne et le chef de département de la filière de l'étudiant.
 */
@Component
@RequiredArgsConstructor
public class AccesStage {
    private final ChefDepartementRepository chefRepository;

    public boolean peutLireDocuments(Stage stage, Utilisateur moi) {
        if (stage.getEtudiant().getId().equals(moi.getId())) return true;
        if (moi.getRole() == TypeRole.ORGANISME) {
            return moi.getOrganisme() != null && stage.getOrganisme() != null && moi.getOrganisme().getId().equals(stage.getOrganisme().getId());
        }
        if (moi.getRole() != TypeRole.PERSONNEL) return false;
        if (stage.getEncadrantInterne() != null && stage.getEncadrantInterne().getId().equals(moi.getId())) return true;
        var filiere = stage.getEtudiant().getFiliere();
        return filiere != null && chefRepository.existsByChef_IdAndFiliereId(moi.getId(), filiere.getId());
    }
}
