package ept.edu.sn.alumni_backend.mentorat.service;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.mentorat.StatutMentorat;
import ept.edu.sn.alumni_backend.mentorat.dto.TableauProgrammeResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.TableauProgrammeResponse.AvancementEtape;
import ept.edu.sn.alumni_backend.mentorat.dto.TableauProgrammeResponse.MentorVolontaire;
import ept.edu.sn.alumni_backend.mentorat.dto.TableauProgrammeResponse.MentoratSuivi;
import ept.edu.sn.alumni_backend.mentorat.entity.JalonProgramme;
import ept.edu.sn.alumni_backend.mentorat.entity.Mentorat;
import ept.edu.sn.alumni_backend.mentorat.entity.ProgrammeMentorat;
import ept.edu.sn.alumni_backend.mentorat.repository.JalonProgrammeRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.MentoratRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.ParticipationProgrammeRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.ProgressionJalonRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import lombok.RequiredArgsConstructor;

/** Tableau de bord d'un programme : quatre requêtes, quelle que soit sa taille. */
@Service
@RequiredArgsConstructor
public class TableauProgrammeService {
    /** Mentorats dont on suit l'avancement dans les étapes. */
    private static final Set<StatutMentorat> SUIVIS = EnumSet.of(StatutMentorat.ACCEPTEE, StatutMentorat.TERMINEE);

    private final ProgrammeMentoratService programmes;
    private final JalonProgrammeRepository jalonRepository;
    private final MentoratRepository mentoratRepository;
    private final ProgressionJalonRepository progressionRepository;
    private final ParticipationProgrammeRepository participationRepository;
    private final MentoratMapper mapper;

    @Transactional(readOnly = true)
    public TableauProgrammeResponse obtenir(UUID programmeId, UtilisateurPrincipal principal) {
        ProgrammeMentorat programme = programmes.chargerPourTableau(programmeId, principal);
        List<JalonProgramme> etapes = jalonRepository.findByProgramme_IdOrderByOrdreAsc(programme.getId());
        List<Mentorat> mentorats = mentoratRepository.findByProgramme_IdOrderByCreeLeDesc(programme.getId());
        var progressions = progressionRepository.listerParProgramme(programme.getId());

        Map<StatutMentorat, Long> parStatut = mentorats.stream()
            .collect(Collectors.groupingBy(Mentorat::getStatut, Collectors.counting()));
        Set<UUID> suivis = mentorats.stream()
            .filter(mentorat -> SUIVIS.contains(mentorat.getStatut()))
            .map(Mentorat::getId)
            .collect(Collectors.toSet());
        var franchiesSuivies = progressions.stream().filter(p -> suivis.contains(p.getMentoratId())).toList();
        Map<UUID, Long> parMentorat = franchiesSuivies.stream()
            .collect(Collectors.groupingBy(ProgressionJalonRepository.EtapeFranchie::getMentoratId, Collectors.counting()));
        Map<UUID, Long> parEtape = franchiesSuivies.stream()
            .collect(Collectors.groupingBy(ProgressionJalonRepository.EtapeFranchie::getJalonId, Collectors.counting()));
        Map<UUID, Long> mentoresEnCours = mentorats.stream()
            .filter(mentorat -> mentorat.getStatut() == StatutMentorat.ACCEPTEE)
            .collect(Collectors.groupingBy(mentorat -> mentorat.getProfilMentor().getId(), Collectors.counting()));

        long attendues = (long) suivis.size() * etapes.size();
        int progressionMoyenne = attendues == 0 ? 0 : (int) Math.round(100.0 * franchiesSuivies.size() / attendues);

        return new TableauProgrammeResponse(
            parStatut.getOrDefault(StatutMentorat.EN_ATTENTE, 0L),
            parStatut.getOrDefault(StatutMentorat.ACCEPTEE, 0L),
            parStatut.getOrDefault(StatutMentorat.TERMINEE, 0L),
            parStatut.getOrDefault(StatutMentorat.REFUSEE, 0L) + parStatut.getOrDefault(StatutMentorat.ANNULEE, 0L),
            progressionMoyenne,
            etapes.stream()
                .map(etape -> new AvancementEtape(etape.getId(), etape.getOrdre(), etape.getTitre(),
                    parEtape.getOrDefault(etape.getId(), 0L), suivis.size()))
                .toList(),
            mentorats.stream()
                .map(mentorat -> new MentoratSuivi(
                    mentorat.getId(),
                    mentorat.getStatut(),
                    mapper.participant(mentorat.getProfilMentor().getUtilisateur()),
                    mapper.participant(mentorat.getMentore()),
                    parMentorat.getOrDefault(mentorat.getId(), 0L).intValue(),
                    mentorat.getCreeLe()))
                .toList(),
            participationRepository.findByProgramme_IdOrderByCreeLeAsc(programme.getId()).stream()
                .map(participation -> new MentorVolontaire(
                    mapper.participant(participation.getProfilMentor().getUtilisateur()),
                    mentoresEnCours.getOrDefault(participation.getProfilMentor().getId(), 0L),
                    participation.getProfilMentor().isDisponible()))
                .toList());
    }
}
