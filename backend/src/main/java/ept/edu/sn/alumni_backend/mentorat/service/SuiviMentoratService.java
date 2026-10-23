package ept.edu.sn.alumni_backend.mentorat.service;

import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.mentorat.StatutMentorat;
import ept.edu.sn.alumni_backend.mentorat.StatutSeance;
import ept.edu.sn.alumni_backend.mentorat.dto.EvaluationMentoratRequest;
import ept.edu.sn.alumni_backend.mentorat.dto.EvaluationMentoratResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.MentoratDetailResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.SeanceMentoratRequest;
import ept.edu.sn.alumni_backend.mentorat.dto.SeanceMentoratResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.SuiviSeanceRequest;
import ept.edu.sn.alumni_backend.mentorat.entity.EvaluationMentorat;
import ept.edu.sn.alumni_backend.mentorat.entity.Mentorat;
import ept.edu.sn.alumni_backend.mentorat.entity.SeanceMentorat;
import ept.edu.sn.alumni_backend.mentorat.evenement.NotificationMentorat;
import ept.edu.sn.alumni_backend.mentorat.exception.ConflitMentoratException;
import ept.edu.sn.alumni_backend.mentorat.exception.MentoratIntrouvableException;
import ept.edu.sn.alumni_backend.mentorat.repository.EvaluationMentoratRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.SeanceMentoratRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/** Suivi d'un mentorat : séances planifiées ou consignées, étapes du programme, puis évaluation de fin. */
@Service
@RequiredArgsConstructor
public class SuiviMentoratService {
    private final AccesMentorat acces;
    private final SeanceMentoratRepository seanceRepository;
    private final EvaluationMentoratRepository evaluationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MentoratMapper mapper;
    private final EtapesMentoratService etapes;
    private final ApplicationEventPublisher evenements;

    @Transactional(readOnly = true)
    public MentoratDetailResponse obtenir(UUID mentoratId, UtilisateurPrincipal principal) {
        Mentorat mentorat = acces.chargerPourParticipant(mentoratId, principal);
        UUID moi = principal.getUtilisateur().getId();
        var evaluations = evaluationRepository.findByMentorat_Id(mentoratId);
        boolean dejaEvalue = evaluations.stream().anyMatch(e -> e.getAuteur().getId().equals(moi));
        return new MentoratDetailResponse(
            mapper.versResponse(mentorat, moi),
            seanceRepository.findByMentorat_IdOrderByDebutDesc(mentoratId).stream().map(mapper::versResponse).toList(),
            evaluations.stream().map(mapper::versResponse).toList(),
            etapes.lister(mentorat),
            mentorat.getStatut() == StatutMentorat.TERMINEE && !dejaEvalue);
    }

    @Transactional
    public SeanceMentoratResponse planifier(
            UUID mentoratId, SeanceMentoratRequest request, UtilisateurPrincipal principal) {
        Mentorat mentorat = acces.chargerPourParticipant(mentoratId, principal);
        exigerMentoratEnCours(mentorat);
        SeanceMentorat seance = new SeanceMentorat();
        seance.setMentorat(mentorat);
        appliquer(seance, request);
        seance.setProposeePar(utilisateurRepository.getReferenceById(principal.getUtilisateur().getId()));
        seanceRepository.save(seance);
        evenements.publishEvent(new NotificationMentorat(
            acces.autreParticipant(mentorat, principal).getEmail(),
            "Nouvelle séance de mentorat",
            "Une séance est prévue le " + request.debut() + " (" + request.dureeMinutes() + " min)."));
        return mapper.versResponse(seance);
    }

    /** Déplace une séance encore planifiée (date, durée, modalité ou lieu) et prévient l'autre participant. */
    @Transactional
    public SeanceMentoratResponse modifier(
            UUID mentoratId, UUID seanceId, SeanceMentoratRequest request, UtilisateurPrincipal principal) {
        Mentorat mentorat = acces.chargerPourParticipant(mentoratId, principal);
        exigerMentoratEnCours(mentorat);
        SeanceMentorat seance = charger(seanceId, mentorat);
        if (seance.getStatut() != StatutSeance.PLANIFIEE) {
            throw new ConflitMentoratException("Seule une séance planifiée peut être modifiée.");
        }
        appliquer(seance, request);
        evenements.publishEvent(new NotificationMentorat(
            acces.autreParticipant(mentorat, principal).getEmail(),
            "Séance de mentorat modifiée",
            "La séance a été déplacée au " + request.debut() + " (" + request.dureeMinutes() + " min)."));
        return mapper.versResponse(seance);
    }

    @Transactional
    public SeanceMentoratResponse suivre(
            UUID mentoratId, UUID seanceId, SuiviSeanceRequest request, UtilisateurPrincipal principal) {
        Mentorat mentorat = acces.chargerPourParticipant(mentoratId, principal);
        exigerMentoratEnCours(mentorat);
        SeanceMentorat seance = charger(seanceId, mentorat);
        if (!seance.getStatut().peutPasserA(request.statut())) {
            throw new ConflitMentoratException("Cette séance ne peut plus passer à ce statut.");
        }
        if (request.statut() != StatutSeance.REALISEE && request.compteRendu() != null
                && !request.compteRendu().isBlank()) {
            throw new IllegalArgumentException("Seule une séance réalisée peut avoir un compte rendu.");
        }
        seance.setStatut(request.statut());
        seance.setCompteRendu(texteOuNull(request.compteRendu()));
        return mapper.versResponse(seance);
    }

    @Transactional
    public EvaluationMentoratResponse evaluer(
            UUID mentoratId, EvaluationMentoratRequest request, UtilisateurPrincipal principal) {
        Mentorat mentorat = acces.chargerPourParticipant(mentoratId, principal);
        UUID moi = principal.getUtilisateur().getId();
        if (mentorat.getStatut() != StatutMentorat.TERMINEE) {
            throw new ConflitMentoratException("Un mentorat s'évalue une fois terminé.");
        }
        if (evaluationRepository.existsByMentorat_IdAndAuteur_Id(mentoratId, moi)) {
            throw new ConflitMentoratException("Vous avez déjà évalué ce mentorat.");
        }
        EvaluationMentorat evaluation = new EvaluationMentorat();
        evaluation.setMentorat(mentorat);
        evaluation.setAuteur(utilisateurRepository.getReferenceById(moi));
        evaluation.setNote(request.note());
        evaluation.setCommentaire(texteOuNull(request.commentaire()));
        return mapper.versResponse(evaluationRepository.saveAndFlush(evaluation));
    }

    private SeanceMentorat charger(UUID seanceId, Mentorat mentorat) {
        return seanceRepository.findByIdAndMentorat_Id(seanceId, mentorat.getId())
            .orElseThrow(() -> new MentoratIntrouvableException("Cette séance est introuvable."));
    }

    private static void appliquer(SeanceMentorat seance, SeanceMentoratRequest request) {
        seance.setDebut(request.debut());
        seance.setDureeMinutes(request.dureeMinutes());
        seance.setModalite(request.modalite());
        seance.setLieuOuLien(texteOuNull(request.lieuOuLien()));
    }

    private static void exigerMentoratEnCours(Mentorat mentorat) {
        if (mentorat.getStatut() != StatutMentorat.ACCEPTEE) {
            throw new ConflitMentoratException("Les séances se gèrent uniquement pendant un mentorat en cours.");
        }
    }

    private static String texteOuNull(String texte) {
        return texte == null || texte.isBlank() ? null : texte.trim();
    }
}
