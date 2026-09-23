package ept.edu.sn.alumni_backend.utilisateur;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.utilisateur.dto.ProfilRequest;
import ept.edu.sn.alumni_backend.utilisateur.dto.ProfilResponse;
import ept.edu.sn.alumni_backend.utilisateur.dto.ProfilPublicResponse;
import ept.edu.sn.alumni_backend.utilisateur.exception.ProfilIntrouvableException;
import ept.edu.sn.alumni_backend.utilisateur.mapper.ProfilMapper;
import ept.edu.sn.alumni_backend.parcours.service.ExperienceService;
import ept.edu.sn.alumni_backend.parcours.service.FormationService;
import ept.edu.sn.alumni_backend.utilisateur.photo.StockagePhotoProfil;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UtilisateurProfilService {
    private final UtilisateurRepository utilisateurRepository;
    private final ProfilMapper profilMapper;
    private final ExperienceService experienceService;
    private final FormationService formationService;
    private final StockagePhotoProfil stockagePhoto;

    public ProfilResponse obtenirProfil(Utilisateur utilisateur) {
        return this.profilMapper.versResponse(utilisateur);
    }

    @Transactional(readOnly = true)
    public ProfilPublicResponse obtenirProfilPublic(UUID id) {
        Utilisateur utilisateur = utilisateurRepository.findOne(
            MembreVisibilite.profilPublicVisible().and(
                (racine, requete, cb) -> cb.equal(racine.get("id"), id)
            )
        ).orElseThrow(ProfilIntrouvableException::new);

        return profilMapper.versResponsePublique(
            utilisateur,
            experienceService.listerPour(utilisateur),
            formationService.listerPour(utilisateur)
        );
    }

    @Transactional
    public ProfilResponse mettreAJour(Utilisateur utilisateur, ProfilRequest request) {
        // On recharge l'utilisateur dans la transaction pour travailler sur une
        // entite geree par Hibernate (le principal ne sert qu'a obtenir l'id)
        Utilisateur gere = this.utilisateurRepository.findById(utilisateur.getId())
            .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));

        this.profilMapper.appliquer(gere, request);
        return this.profilMapper.versResponse(utilisateurRepository.save(gere));
    }

    @Transactional
    public ProfilResponse mettreAJourPhoto(Utilisateur utilisateur, MultipartFile photo) {
        Utilisateur gere = utilisateurRepository.findById(utilisateur.getId())
            .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));
        String ancienneUrl = gere.getUrlPhoto();
        String nouvelleUrl = stockagePhoto.stocker(photo);
        try {
            gere.setUrlPhoto(nouvelleUrl);
            ProfilResponse response = profilMapper.versResponse(utilisateurRepository.save(gere));
            stockagePhoto.supprimerSiGeree(ancienneUrl);
            return response;
        } catch (RuntimeException e) {
            stockagePhoto.supprimerSiGeree(nouvelleUrl);
            throw e;
        }
    }

    @Transactional
    public ProfilResponse supprimerPhoto(Utilisateur utilisateur) {
        Utilisateur gere = utilisateurRepository.findById(utilisateur.getId())
            .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));
        String ancienneUrl = gere.getUrlPhoto();
        gere.setUrlPhoto(null);
        ProfilResponse response = profilMapper.versResponse(utilisateurRepository.save(gere));
        stockagePhoto.supprimerSiGeree(ancienneUrl);
        return response;
    }
}
