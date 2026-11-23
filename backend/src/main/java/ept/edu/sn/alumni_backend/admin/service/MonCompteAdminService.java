package ept.edu.sn.alumni_backend.admin.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.NomCompte;
import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.dto.IdentiteAdminRequest;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/** Ce qu'un administrateur modifie sur son propre compte : il n'a pas de profil de membre pour le faire. */
@Service
@RequiredArgsConstructor
public class MonCompteAdminService {
    private final UtilisateurRepository utilisateurRepository;
    private final TraceCompte trace;

    @Transactional
    public void modifierIdentite(IdentiteAdminRequest request, UtilisateurPrincipal principal) {
        Utilisateur compte = utilisateurRepository.findByIdForUpdate(principal.getUtilisateur().getId()).orElseThrow();
        String ancien = NomCompte.complet(compte);
        compte.setPrenom(request.prenom().trim());
        compte.setNom(request.nom().trim());
        String nouveau = NomCompte.complet(compte);
        if (!ancien.equals(nouveau)) {
            trace.consigner(principal, compte, TypeActionAdmin.MODIFICATION_IDENTITE, null, ancien + " → " + nouveau);
        }
    }
}
