package ept.edu.sn.alumni_backend.admin.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.EnumSet;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.dto.TableauDeBordAdminResponse;
import ept.edu.sn.alumni_backend.admin.dto.TableauDeBordAdminResponse.AFaire;
import ept.edu.sn.alumni_backend.admin.dto.TableauDeBordAdminResponse.Communaute;
import ept.edu.sn.alumni_backend.admin.repository.ActionAdminRepository;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.evenement.StatutEvenement;
import ept.edu.sn.alumni_backend.evenement.repository.EvenementRepository;
import ept.edu.sn.alumni_backend.mentorat.StatutMentorat;
import ept.edu.sn.alumni_backend.mentorat.StatutProgramme;
import ept.edu.sn.alumni_backend.mentorat.repository.MentoratRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.ProgrammeMentoratRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/** Assemble le tableau de bord à partir de comptages : aucune donnée personnelle hors du journal. */
@Service
@RequiredArgsConstructor
public class TableauDeBordAdminService {
    private static final ZoneId THIES = ZoneId.of("Africa/Dakar");

    private final UtilisateurRepository utilisateurRepository;
    private final MentoratRepository mentoratRepository;
    private final ProgrammeMentoratRepository programmeRepository;
    private final EvenementRepository evenementRepository;
    private final ActionAdminRepository actionAdminRepository;
    private final JournalAdminService journalAdminService;

    @Transactional(readOnly = true)
    public TableauDeBordAdminResponse obtenir() {
        AFaire aTraiter = new AFaire(
            utilisateurRepository.countByStatutCompteAndEmailVerifieTrue(StatutCompte.EN_ATTENTE),
            utilisateurRepository.findFirstByStatutCompteAndEmailVerifieTrueOrderByDateCreationAsc(StatutCompte.EN_ATTENTE)
                .map(Utilisateur::getDateCreation).orElse(null));
        Communaute communaute = new Communaute(
            utilisateurRepository.countByStatutCompteAndEmailVerifieTrue(StatutCompte.ACTIF),
            utilisateurRepository.countByEmailVerifieTrueAndDateCreationGreaterThanEqual(
                LocalDate.now(THIES).withDayOfMonth(1).atStartOfDay()),
            mentoratRepository.countByStatut(StatutMentorat.ACCEPTEE),
            programmeRepository.countByStatutIn(EnumSet.of(StatutProgramme.OUVERT, StatutProgramme.EN_COURS)),
            evenementRepository.countByStatutAndDateDebutAfter(StatutEvenement.PUBLIE, Instant.now()));
        return new TableauDeBordAdminResponse(aTraiter, communaute,
            actionAdminRepository.findTop5ByOrderByDateActionDesc().stream().map(journalAdminService::versEntree).toList());
    }
}
