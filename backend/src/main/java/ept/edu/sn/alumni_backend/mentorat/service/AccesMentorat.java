package ept.edu.sn.alumni_backend.mentorat.service;

import java.util.UUID;

import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.mentorat.RoleMentorat;
import ept.edu.sn.alumni_backend.mentorat.entity.Mentorat;
import ept.edu.sn.alumni_backend.mentorat.exception.MentoratIntrouvableException;
import ept.edu.sn.alumni_backend.mentorat.repository.MentoratRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

/** Accès à un mentorat réservé à ses deux participants. */
@Component
@RequiredArgsConstructor
public class AccesMentorat {
    private final MentoratRepository mentoratRepository;

    /**
     * Pour toute autre personne, le mentorat n'existe pas : 404 plutôt que 403,
     * pour ne pas révéler son existence.
     */
    public Mentorat chargerPourParticipant(UUID mentoratId, UtilisateurPrincipal principal) {
        UUID moi = principal.getUtilisateur().getId();
        return mentoratRepository.findById(mentoratId)
            .filter(mentorat -> mentorat.getMentore().getId().equals(moi) || mentorDe(mentorat).getId().equals(moi))
            .orElseThrow(() -> new MentoratIntrouvableException("Ce mentorat est introuvable."));
    }

    public RoleMentorat roleDe(Mentorat mentorat, UtilisateurPrincipal principal) {
        return mentorDe(mentorat).getId().equals(principal.getUtilisateur().getId())
            ? RoleMentorat.MENTOR
            : RoleMentorat.MENTORE;
    }

    public Utilisateur autreParticipant(Mentorat mentorat, UtilisateurPrincipal principal) {
        return roleDe(mentorat, principal) == RoleMentorat.MENTOR ? mentorat.getMentore() : mentorDe(mentorat);
    }

    private static Utilisateur mentorDe(Mentorat mentorat) {
        return mentorat.getProfilMentor().getUtilisateur();
    }
}
