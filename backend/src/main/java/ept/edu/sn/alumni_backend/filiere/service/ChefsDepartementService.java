package ept.edu.sn.alumni_backend.filiere.service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.NomCompte;
import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.service.GardeSuperAdministrateur;
import ept.edu.sn.alumni_backend.admin.service.TraceCompte;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.filiere.dto.ChefPossibleResponse;
import ept.edu.sn.alumni_backend.filiere.dto.FiliereAdminResponse;
import ept.edu.sn.alumni_backend.filiere.entity.ChefDepartement;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.filiere.exception.ConflitFiliereException;
import ept.edu.sn.alumni_backend.filiere.exception.FiliereIntrouvableException;
import ept.edu.sn.alumni_backend.filiere.repository.ChefDepartementRepository;
import ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Chefs de département (TRA-14), désignés par un super administrateur parmi les comptes actifs du personnel.
 * Un seul chef par filière : en désigner un autre remplace le précédent. Chaque changement est inscrit au journal
 * et annoncé par e-mail aux personnes concernées.
 */
@Service
@RequiredArgsConstructor
public class ChefsDepartementService {
    private final FiliereRepository filiereRepository;
    private final ChefDepartementRepository chefDepartementRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final GardeSuperAdministrateur garde;
    private final TraceCompte trace;
    private final FiliereService filiereService;

    @Transactional(readOnly = true)
    public List<ChefPossibleResponse> chefsPossibles() {
        return utilisateurRepository.findByRole(TypeRole.PERSONNEL).stream()
            .filter(ChefsDepartementService::peutDiriger)
            .sorted(Comparator.comparing((Utilisateur u) -> NomCompte.salutation(u).toLowerCase()))
            .map(u -> new ChefPossibleResponse(u.getId(), u.getPrenom(), u.getNom(), u.getEmail()))
            .toList();
    }

    @Transactional
    public FiliereAdminResponse designer(UUID filiereId, UUID chefId, UtilisateurPrincipal principal) {
        garde.exiger(principal);
        Filiere filiere = filiereRepository.findByIdForUpdate(filiereId).orElseThrow(FiliereIntrouvableException::new);
        Utilisateur chef = utilisateurRepository.findById(chefId)
            .filter(ChefsDepartementService::peutDiriger)
            .orElseThrow(() -> new IllegalArgumentException(
                "Le chef de département doit être un compte actif du personnel de l'école."));
        ChefDepartement actuel = chefDepartementRepository.findById(filiereId).orElse(null);
        if (actuel == null) {
            chefDepartementRepository.save(new ChefDepartement(filiere, chef, principal.getUtilisateur()));
        } else {
            Utilisateur ancien = actuel.getChef();
            if (ancien.getId().equals(chefId)) {
                throw new ConflitFiliereException(NomCompte.salutation(chef) + " dirige déjà ce département.");
            }
            actuel.designer(chef, principal.getUtilisateur());
            annoncerRetrait(principal, ancien, filiere);
        }
        trace.consigner(principal, chef, TypeActionAdmin.DESIGNATION_CHEF_DEPARTEMENT, null, filiere.getNom());
        trace.notifier(chef, "Vous êtes chef de département sur EPT Alumni",
            "Bonjour " + NomCompte.salutation(chef) + ", un super administrateur de l'EPT vous a désigné chef du département "
                + filiere.getNom() + ". Vous pourrez suivre les stages des étudiants de cette filière.");
        return filiereService.ligne(filiereId);
    }

    @Transactional
    public FiliereAdminResponse retirer(UUID filiereId, UtilisateurPrincipal principal) {
        garde.exiger(principal);
        Filiere filiere = filiereRepository.findByIdForUpdate(filiereId).orElseThrow(FiliereIntrouvableException::new);
        ChefDepartement actuel = chefDepartementRepository.findById(filiereId)
            .orElseThrow(() -> new ConflitFiliereException("Ce département n'a pas de chef."));
        Utilisateur ancien = actuel.getChef();
        chefDepartementRepository.delete(actuel);
        annoncerRetrait(principal, ancien, filiere);
        return filiereService.ligne(filiereId);
    }

    private void annoncerRetrait(UtilisateurPrincipal principal, Utilisateur ancien, Filiere filiere) {
        trace.consigner(principal, ancien, TypeActionAdmin.RETRAIT_CHEF_DEPARTEMENT, null, filiere.getNom());
        trace.notifier(ancien, "Vous n'êtes plus chef de département sur EPT Alumni",
            "Bonjour " + NomCompte.salutation(ancien) + ", un super administrateur de l'EPT a mis fin à votre mission de chef "
                + "du département " + filiere.getNom() + ".");
    }

    private static boolean peutDiriger(Utilisateur compte) {
        return compte.getRole() == TypeRole.PERSONNEL && compte.isEmailVerifie() && compte.getStatutCompte() == StatutCompte.ACTIF;
    }
}
