package ept.edu.sn.alumni_backend.mentorat.service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.mentorat.RoleMentorat;
import ept.edu.sn.alumni_backend.mentorat.dto.DomaineMentoratResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.EvaluationMentoratResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.MentorResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.MentoratResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.ParticipantMentoratResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.ProfilMentorResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.ProgrammeResumeResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.SeanceMentoratResponse;
import ept.edu.sn.alumni_backend.mentorat.entity.DomaineMentorat;
import ept.edu.sn.alumni_backend.mentorat.entity.EvaluationMentorat;
import ept.edu.sn.alumni_backend.mentorat.entity.Mentorat;
import ept.edu.sn.alumni_backend.mentorat.entity.ProfilMentor;
import ept.edu.sn.alumni_backend.mentorat.entity.SeanceMentorat;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

@Component
public class MentoratMapper {
    private static final Comparator<DomaineMentorat> ORDRE_DOMAINES =
        Comparator.comparingInt(DomaineMentorat::getOrdre).thenComparing(DomaineMentorat::getLibelle);

    public DomaineMentoratResponse versResponse(DomaineMentorat domaine) {
        return new DomaineMentoratResponse(domaine.getId(), domaine.getCode(), domaine.getLibelle());
    }

    public ProfilMentorResponse versResponse(ProfilMentor profil, long mentoresActifs) {
        return new ProfilMentorResponse(
            profil.getId(),
            profil.getPresentation(),
            profil.isDisponible(),
            profil.getCapaciteMax(),
            mentoresActifs,
            domaines(profil));
    }

    public MentorResponse versCarte(ProfilMentor profil, long mentoresActifs, boolean demandeEnCours) {
        Utilisateur mentor = profil.getUtilisateur();
        int placesRestantes = (int) Math.max(0, profil.getCapaciteMax() - mentoresActifs);
        return new MentorResponse(
            profil.getId(),
            mentor.getId(),
            mentor.getNom(),
            mentor.getPrenom(),
            mentor.getUrlPhoto(),
            mentor.getPosteActuel(),
            mentor.getFiliere(),
            mentor.getAnneeSortie(),
            profil.getPresentation(),
            domaines(profil),
            profil.isDisponible(),
            placesRestantes,
            demandeEnCours,
            mentor.getRole());
    }

    public MentoratResponse versResponse(Mentorat mentorat, UUID utilisateurConnecteId) {
        Utilisateur mentor = mentorat.getProfilMentor().getUtilisateur();
        RoleMentorat monRole = mentor.getId().equals(utilisateurConnecteId)
            ? RoleMentorat.MENTOR
            : RoleMentorat.MENTORE;
        return new MentoratResponse(
            mentorat.getId(),
            mentorat.getStatut(),
            versResponse(mentorat.getDomaine()),
            mentorat.getObjectif(),
            mentorat.getMotifRefus(),
            mentorat.getCreeLe(),
            mentorat.getReponduLe(),
            mentorat.getClotureLe(),
            participant(mentor),
            participant(mentorat.getMentore()),
            monRole,
            mentorat.getProgramme() != null
                ? new ProgrammeResumeResponse(mentorat.getProgramme().getId(), mentorat.getProgramme().getTitre())
                : null);
    }

    public SeanceMentoratResponse versResponse(SeanceMentorat seance) {
        return new SeanceMentoratResponse(
            seance.getId(),
            seance.getDebut(),
            seance.getDureeMinutes(),
            seance.getModalite(),
            seance.getLieuOuLien(),
            seance.getStatut(),
            seance.getCompteRendu(),
            seance.getProposeePar().getId());
    }

    public EvaluationMentoratResponse versResponse(EvaluationMentorat evaluation) {
        return new EvaluationMentoratResponse(
            evaluation.getId(),
            evaluation.getAuteur().getId(),
            evaluation.getNote(),
            evaluation.getCommentaire(),
            evaluation.getCreeLe());
    }

    private List<DomaineMentoratResponse> domaines(ProfilMentor profil) {
        return profil.getDomaines().stream().sorted(ORDRE_DOMAINES).map(this::versResponse).toList();
    }

    /** Identité publique d'une personne (jamais ses coordonnées). */
    public ParticipantMentoratResponse participant(Utilisateur utilisateur) {
        return new ParticipantMentoratResponse(
            utilisateur.getId(),
            utilisateur.getNom(),
            utilisateur.getPrenom(),
            utilisateur.getUrlPhoto(),
            utilisateur.getPosteActuel(),
            utilisateur.getFiliere(),
            utilisateur.getAnneeSortie(),
            utilisateur.getRole());
    }
}
