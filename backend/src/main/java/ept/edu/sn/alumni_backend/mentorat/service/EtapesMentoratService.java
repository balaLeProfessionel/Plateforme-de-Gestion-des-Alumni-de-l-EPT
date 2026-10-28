package ept.edu.sn.alumni_backend.mentorat.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.mentorat.StatutMentorat;
import ept.edu.sn.alumni_backend.mentorat.StatutProgramme;
import ept.edu.sn.alumni_backend.mentorat.dto.EtapeSuivieResponse;
import ept.edu.sn.alumni_backend.mentorat.entity.JalonProgramme;
import ept.edu.sn.alumni_backend.mentorat.entity.Mentorat;
import ept.edu.sn.alumni_backend.mentorat.entity.ProgressionJalon;
import ept.edu.sn.alumni_backend.mentorat.evenement.NotificationMentorat;
import ept.edu.sn.alumni_backend.mentorat.exception.ConflitMentoratException;
import ept.edu.sn.alumni_backend.mentorat.exception.MentoratIntrouvableException;
import ept.edu.sn.alumni_backend.mentorat.repository.JalonProgrammeRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.ProgressionJalonRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Étapes du programme dans le suivi d'un mentorat : le mentor ou le mentoré valide une étape,
 * dans l'ordre qu'il veut, pendant que le mentorat est en cours.
 */
@Service
@RequiredArgsConstructor
public class EtapesMentoratService {
    private final AccesMentorat acces;
    private final JalonProgrammeRepository jalonRepository;
    private final ProgressionJalonRepository progressionRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ApplicationEventPublisher evenements;

    /** Les étapes du programme et leur avancement ; vide pour un mentorat libre. */
    @Transactional(readOnly = true)
    public List<EtapeSuivieResponse> lister(Mentorat mentorat) {
        if (mentorat.getProgramme() == null) return List.of();
        Map<UUID, ProgressionJalon> franchies = progressionRepository.findByMentorat_Id(mentorat.getId()).stream()
            .collect(Collectors.toMap(p -> p.getJalon().getId(), Function.identity()));
        return jalonRepository.findByProgramme_IdOrderByOrdreAsc(mentorat.getProgramme().getId()).stream()
            .map(jalon -> versResponse(jalon, franchies.get(jalon.getId())))
            .toList();
    }

    @Transactional
    public EtapeSuivieResponse valider(UUID mentoratId, UUID etapeId, String commentaire, UtilisateurPrincipal principal) {
        Mentorat mentorat = acces.chargerPourParticipant(mentoratId, principal);
        JalonProgramme etape = chargerEtape(mentorat, etapeId);
        exigerModifiable(mentorat);
        // Valider deux fois ne change rien : la première validation fait foi.
        ProgressionJalon progression = progressionRepository.findByMentorat_IdAndJalon_Id(mentoratId, etapeId)
            .orElseGet(() -> {
                ProgressionJalon nouvelle = new ProgressionJalon();
                nouvelle.setMentorat(mentorat);
                nouvelle.setJalon(etape);
                nouvelle.setAtteintLe(Instant.now());
                nouvelle.setValidePar(utilisateurRepository.getReferenceById(principal.getUtilisateur().getId()));
                nouvelle.setCommentaire(texteOuNull(commentaire));
                evenements.publishEvent(new NotificationMentorat(
                    acces.autreParticipant(mentorat, principal).getEmail(),
                    "Étape de mentorat franchie",
                    nomComplet(principal.getUtilisateur()) + " a validé l'étape « " + etape.getTitre() + " »."));
                return progressionRepository.saveAndFlush(nouvelle);
            });
        return versResponse(etape, progression);
    }

    /** Revient sur une validation faite par erreur. */
    @Transactional
    public EtapeSuivieResponse annulerValidation(UUID mentoratId, UUID etapeId, UtilisateurPrincipal principal) {
        Mentorat mentorat = acces.chargerPourParticipant(mentoratId, principal);
        JalonProgramme etape = chargerEtape(mentorat, etapeId);
        exigerModifiable(mentorat);
        progressionRepository.findByMentorat_IdAndJalon_Id(mentoratId, etapeId).ifPresent(progressionRepository::delete);
        progressionRepository.flush();
        return versResponse(etape, null);
    }

    private JalonProgramme chargerEtape(Mentorat mentorat, UUID etapeId) {
        return jalonRepository.findById(etapeId)
            .filter(jalon -> mentorat.getProgramme() != null
                && jalon.getProgramme().getId().equals(mentorat.getProgramme().getId()))
            .orElseThrow(() -> new MentoratIntrouvableException("Cette étape est introuvable."));
    }

    private static void exigerModifiable(Mentorat mentorat) {
        if (mentorat.getStatut() != StatutMentorat.ACCEPTEE) {
            throw new ConflitMentoratException("Les étapes se valident uniquement pendant un mentorat en cours.");
        }
        if (mentorat.getProgramme().getStatut() == StatutProgramme.CLOS) {
            throw new ConflitMentoratException("Ce programme est clos : ses étapes ne se valident plus.");
        }
    }

    private static EtapeSuivieResponse versResponse(JalonProgramme jalon, ProgressionJalon progression) {
        return new EtapeSuivieResponse(
            jalon.getId(),
            jalon.getOrdre(),
            jalon.getTitre(),
            jalon.getDescription(),
            progression != null ? progression.getAtteintLe() : null,
            progression != null ? nomComplet(progression.getValidePar()) : null,
            progression != null ? progression.getCommentaire() : null);
    }

    private static String nomComplet(Utilisateur utilisateur) {
        return (utilisateur.getPrenom() + " " + utilisateur.getNom()).trim();
    }

    private static String texteOuNull(String texte) {
        return texte == null || texte.isBlank() ? null : texte.trim();
    }
}
