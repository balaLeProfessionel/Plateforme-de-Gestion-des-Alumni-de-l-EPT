package ept.edu.sn.alumni_backend.mentorat.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.mentorat.StatutMentorat;
import ept.edu.sn.alumni_backend.mentorat.StatutProgramme;
import ept.edu.sn.alumni_backend.mentorat.dto.ProgrammeRequest;
import ept.edu.sn.alumni_backend.mentorat.dto.ProgrammeResponse;
import ept.edu.sn.alumni_backend.mentorat.entity.JalonProgramme;
import ept.edu.sn.alumni_backend.mentorat.entity.Mentorat;
import ept.edu.sn.alumni_backend.mentorat.entity.ParticipationProgramme;
import ept.edu.sn.alumni_backend.mentorat.entity.ProfilMentor;
import ept.edu.sn.alumni_backend.mentorat.entity.ProgrammeMentorat;
import ept.edu.sn.alumni_backend.mentorat.evenement.NotificationMentorat;
import ept.edu.sn.alumni_backend.mentorat.exception.ConflitMentoratException;
import ept.edu.sn.alumni_backend.mentorat.exception.MentoratIntrouvableException;
import ept.edu.sn.alumni_backend.mentorat.repository.JalonProgrammeRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.MentoratRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.ParticipationProgrammeRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.ProfilMentorRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.ProgrammeMentoratRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Programmes de mentorat encadrés par l'école : seule l'administration les crée et les gère.
 * Un brouillon n'est visible que d'elle.
 */
@Service
@RequiredArgsConstructor
public class ProgrammeMentoratService {
    private final ProgrammeMentoratRepository programmeRepository;
    private final JalonProgrammeRepository jalonRepository;
    private final MentoratRepository mentoratRepository;
    private final ParticipationProgrammeRepository participationRepository;
    private final ProfilMentorRepository profilMentorRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MentoratMapper mapper;
    private final ApplicationEventPublisher evenements;

    /** Tous les programmes, pour l'administration qui les gère. */
    @Transactional(readOnly = true)
    public List<ProgrammeResponse> listerGeres(UtilisateurPrincipal principal) {
        exigerGestionnaire(principal);
        return versResponses(programmeRepository.findAllByOrderByCreeLeDesc(), principal);
    }

    /** Programmes ouverts et pas encore terminés, proposés à tous les membres. */
    @Transactional(readOnly = true)
    public List<ProgrammeResponse> listerOuverts(UtilisateurPrincipal principal) {
        return versResponses(programmeRepository.findByStatutAndDateFinGreaterThanEqualOrderByDateDebutAscTitreAsc(
            StatutProgramme.OUVERT, ProgrammeMentorat.aujourdhui()), principal);
    }

    @Transactional(readOnly = true)
    public ProgrammeResponse obtenir(UUID programmeId, UtilisateurPrincipal principal) {
        return versResponses(List.of(chargerVisible(programmeId, principal)), principal).getFirst();
    }

    @Transactional
    public ProgrammeResponse creer(ProgrammeRequest request, UtilisateurPrincipal principal) {
        exigerGestionnaire(principal);
        if (request.etapes().stream().anyMatch(etape -> etape.id() != null)) {
            throw new IllegalArgumentException("Un nouveau programme ne peut pas reprendre des étapes existantes.");
        }
        exigerFinAVenir(request);
        ProgrammeMentorat programme = new ProgrammeMentorat();
        programme.setResponsable(utilisateurRepository.getReferenceById(principal.getUtilisateur().getId()));
        appliquer(programme, request);
        programmeRepository.saveAndFlush(programme);
        remplacerEtapes(programme, request.etapes());
        return obtenir(programme.getId(), principal);
    }

    @Transactional
    public ProgrammeResponse modifier(UUID programmeId, ProgrammeRequest request, UtilisateurPrincipal principal) {
        ProgrammeMentorat programme = chargerPourGestion(programmeId, principal);
        if (!programme.getStatut().estModifiable()) {
            throw new ConflitMentoratException("Un programme clos ne se modifie plus.");
        }
        if (programme.getStatut() != StatutProgramme.BROUILLON && request.etapes().isEmpty()) {
            throw new ConflitMentoratException("Un programme ouvert garde au moins une étape.");
        }
        // Un programme déjà terminé reste modifiable (titre, étapes…) tant qu'on ne repousse pas sa fin dans le passé.
        if (!request.dateFin().equals(programme.getDateFin())) {
            exigerFinAVenir(request);
        }
        appliquer(programme, request);
        remplacerEtapes(programme, request.etapes());
        return obtenir(programme.getId(), principal);
    }

    @Transactional
    public ProgrammeResponse changerStatut(UUID programmeId, StatutProgramme cible, UtilisateurPrincipal principal) {
        ProgrammeMentorat programme = chargerPourGestion(programmeId, principal);
        if (!programme.getStatut().peutPasserA(cible)) {
            throw new ConflitMentoratException("Ce programme ne peut pas passer de « "
                + libelle(programme.getStatut()) + " » à « " + libelle(cible) + " ».");
        }
        if (cible == StatutProgramme.OUVERT && jalonRepository.findByProgramme_IdOrderByOrdreAsc(programmeId).isEmpty()) {
            throw new ConflitMentoratException("Ajoutez au moins une étape avant d'ouvrir le programme.");
        }
        if (cible == StatutProgramme.BROUILLON && mentoratRepository.existsByProgramme_Id(programmeId)) {
            throw new ConflitMentoratException("Des mentorats suivent déjà ce programme : il ne peut plus redevenir un brouillon.");
        }
        programme.setStatut(cible);
        return obtenir(programmeId, principal);
    }

    /**
     * Je deviens mentor volontaire du programme : il faut qu'il soit ouvert et que je propose déjà
     * du mentorat (mon offre fixe mes domaines et ma capacité). Sans effet si j'y participe déjà.
     */
    @Transactional
    public ProgrammeResponse participer(UUID programmeId, UtilisateurPrincipal principal) {
        ProgrammeMentorat programme = chargerVisible(programmeId, principal);
        if (programme.getStatut() != StatutProgramme.OUVERT) {
            throw new ConflitMentoratException("On ne rejoint un programme que lorsqu'il est ouvert.");
        }
        if (programme.estTermine()) {
            throw new ConflitMentoratException("Ce programme est terminé depuis le "
                + programme.dateFinEnToutesLettres() + " : on ne le rejoint plus.");
        }
        ProfilMentor profil = profilMentorRepository.findByUtilisateur_Id(principal.getUtilisateur().getId())
            .orElseThrow(() -> new ConflitMentoratException(
                "Proposez d'abord du mentorat (Mon offre) pour participer au programme comme mentor."));
        if (!participationRepository.existsByProgramme_IdAndProfilMentor_Id(programmeId, profil.getId())) {
            ParticipationProgramme participation = new ParticipationProgramme();
            participation.setProgramme(programme);
            participation.setProfilMentor(profil);
            participationRepository.saveAndFlush(participation);
        }
        return obtenir(programmeId, principal);
    }

    /**
     * Je ne suis plus mentor volontaire : mes demandes en attente dans ce programme sont annulées et
     * leurs auteurs prévenus ; les mentorats déjà acceptés continuent.
     */
    @Transactional
    public ProgrammeResponse seRetirer(UUID programmeId, UtilisateurPrincipal principal) {
        ProgrammeMentorat programme = chargerVisible(programmeId, principal);
        Utilisateur moi = principal.getUtilisateur();
        participationRepository.findByProgramme_IdAndProfilMentor_Utilisateur_Id(programmeId, moi.getId())
            .ifPresent(participationRepository::delete);
        participationRepository.flush();
        Instant maintenant = Instant.now();
        String motif = "Annulée car " + (moi.getPrenom() + " " + moi.getNom()).trim() + " a quitté le programme « "
            + programme.getTitre() + " ». Vous pouvez solliciter un autre mentor du programme.";
        for (Mentorat demande : mentoratRepository.findByProgramme_IdAndProfilMentor_Utilisateur_IdAndStatut(
                programmeId, moi.getId(), StatutMentorat.EN_ATTENTE)) {
            demande.setStatut(StatutMentorat.ANNULEE);
            demande.setClotureLe(maintenant);
            demande.setMotifAnnulation(motif);
            evenements.publishEvent(new NotificationMentorat(demande.getMentore().getEmail(), "Demande de mentorat annulée", motif));
        }
        return obtenir(programmeId, principal);
    }

    /** Seul un brouillon sans mentorat se supprime ; ensuite, on le clôt pour garder l'historique. */
    @Transactional
    public void supprimer(UUID programmeId, UtilisateurPrincipal principal) {
        ProgrammeMentorat programme = chargerPourGestion(programmeId, principal);
        if (programme.getStatut() != StatutProgramme.BROUILLON || mentoratRepository.existsByProgramme_Id(programmeId)) {
            throw new ConflitMentoratException("Seul un brouillon se supprime. Clôturez plutôt ce programme.");
        }
        participationRepository.deleteByProgramme_Id(programmeId);
        jalonRepository.deleteByProgramme_Id(programmeId);
        programmeRepository.delete(programme);
    }

    private void appliquer(ProgrammeMentorat programme, ProgrammeRequest request) {
        programme.setTitre(request.titre().strip());
        programme.setDescription(texteOuNull(request.description()));
        programme.setDateDebut(request.dateDebut());
        programme.setDateFin(request.dateFin());
    }

    /**
     * Remplace les étapes par la liste reçue, dans son ordre. Les places sont d'abord libérées
     * (ordres négatifs) pour que la contrainte d'unicité (programme, ordre) tienne pendant l'échange.
     */
    private void remplacerEtapes(ProgrammeMentorat programme, List<ProgrammeRequest.Etape> etapes) {
        Map<UUID, JalonProgramme> existantes = jalonRepository.findByProgramme_IdOrderByOrdreAsc(programme.getId())
            .stream().collect(Collectors.toMap(JalonProgramme::getId, Function.identity()));
        Set<UUID> conservees = new HashSet<>();
        for (ProgrammeRequest.Etape etape : etapes) {
            if (etape.id() == null) continue;
            if (!existantes.containsKey(etape.id())) {
                throw new IllegalArgumentException("Une des étapes n'appartient pas à ce programme.");
            }
            if (!conservees.add(etape.id())) {
                throw new IllegalArgumentException("Une étape ne peut apparaître qu'une fois.");
            }
        }
        List<UUID> retirees = existantes.keySet().stream().filter(id -> !conservees.contains(id)).toList();
        if (!retirees.isEmpty() && jalonRepository.estFranchieParUnMentorat(retirees)) {
            throw new ConflitMentoratException("Une étape déjà franchie par un mentorat ne peut pas être retirée.");
        }
        jalonRepository.deleteAllById(retirees);

        short provisoire = -1;
        for (UUID id : conservees) existantes.get(id).setOrdre(provisoire--);
        jalonRepository.flush();

        List<JalonProgramme> resultat = new ArrayList<>();
        for (int i = 0; i < etapes.size(); i++) {
            ProgrammeRequest.Etape etape = etapes.get(i);
            JalonProgramme jalon = etape.id() != null ? existantes.get(etape.id()) : new JalonProgramme();
            jalon.setProgramme(programme);
            jalon.setTitre(etape.titre().strip());
            jalon.setDescription(texteOuNull(etape.description()));
            jalon.setOrdre((short) (i + 1));
            resultat.add(jalon);
        }
        jalonRepository.saveAllAndFlush(resultat);
    }

    private List<ProgrammeResponse> versResponses(List<ProgrammeMentorat> programmes, UtilisateurPrincipal principal) {
        if (programmes.isEmpty()) return List.of();
        List<UUID> ids = programmes.stream().map(ProgrammeMentorat::getId).toList();
        Map<UUID, List<ProgrammeResponse.Etape>> etapes = jalonRepository.findByProgramme_IdInOrderByOrdreAsc(ids).stream()
            .collect(Collectors.groupingBy(jalon -> jalon.getProgramme().getId(), Collectors.mapping(
                jalon -> new ProgrammeResponse.Etape(jalon.getId(), jalon.getTitre(), jalon.getDescription(), jalon.getOrdre()),
                Collectors.toList())));
        Map<UUID, Long> mentorats = parProgramme(mentoratRepository.compterParProgrammes(ids));
        Map<UUID, Long> mentors = parProgramme(participationRepository.compterParProgrammes(ids));
        Set<UUID> mesParticipations = Set.copyOf(
            participationRepository.programmesOuParticipe(ids, principal.getUtilisateur().getId()));
        return programmes.stream().map(programme -> new ProgrammeResponse(
            programme.getId(),
            programme.getTitre(),
            programme.getDescription(),
            programme.getDateDebut(),
            programme.getDateFin(),
            programme.getStatut(),
            mapper.participant(programme.getResponsable()),
            etapes.getOrDefault(programme.getId(), List.of()),
            mentorats.getOrDefault(programme.getId(), 0L),
            mentors.getOrDefault(programme.getId(), 0L),
            peutGerer(programme, principal),
            mesParticipations.contains(programme.getId()),
            programme.estTermine())).toList();
    }

    private static Map<UUID, Long> parProgramme(List<MentoratRepository.NombreParProgrammeProjection> nombres) {
        return nombres.stream().collect(Collectors.toMap(
            MentoratRepository.NombreParProgrammeProjection::getProgrammeId,
            MentoratRepository.NombreParProgrammeProjection::getNombre));
    }

    /** Un brouillon n'existe que pour ceux qui le gèrent. */
    private ProgrammeMentorat chargerVisible(UUID programmeId, UtilisateurPrincipal principal) {
        return programmeRepository.findById(programmeId)
            .filter(p -> p.getStatut() != StatutProgramme.BROUILLON || peutGerer(p, principal))
            .orElseThrow(ProgrammeMentoratService::introuvable);
    }

    /** Introuvable pour qui ne voit pas un brouillon ; interdit pour qui voit le programme sans le gérer. */
    private ProgrammeMentorat chargerPourGestion(UUID programmeId, UtilisateurPrincipal principal) {
        return exigerGestion(programmeRepository.findByIdForUpdate(programmeId)
            .orElseThrow(ProgrammeMentoratService::introuvable), principal);
    }

    /** Programme lu pour son tableau de bord : mêmes règles que pour le gérer, sans verrou. */
    @Transactional(readOnly = true)
    public ProgrammeMentorat chargerPourTableau(UUID programmeId, UtilisateurPrincipal principal) {
        return exigerGestion(programmeRepository.findById(programmeId)
            .orElseThrow(ProgrammeMentoratService::introuvable), principal);
    }

    private static ProgrammeMentorat exigerGestion(ProgrammeMentorat programme, UtilisateurPrincipal principal) {
        if (!peutGerer(programme, principal)) {
            if (programme.getStatut() == StatutProgramme.BROUILLON) throw introuvable();
            throw new SecurityException("Seule l'administration peut gérer ce programme.");
        }
        return programme;
    }

    /** Le programme garde son responsable (l'administrateur qui l'a créé), mais toute l'administration le gère. */
    private static boolean peutGerer(ProgrammeMentorat programme, UtilisateurPrincipal principal) {
        return principal.getUtilisateur().getRole() == TypeRole.ADMIN;
    }

    private static void exigerFinAVenir(ProgrammeRequest request) {
        if (request.dateFin().isBefore(ProgrammeMentorat.aujourdhui())) {
            throw new IllegalArgumentException("La date de fin d'un programme ne peut pas être déjà passée.");
        }
    }

    private static void exigerGestionnaire(UtilisateurPrincipal principal) {
        if (principal.getUtilisateur().getRole() != TypeRole.ADMIN) {
            throw new SecurityException("Les programmes sont créés et gérés par l'administration.");
        }
    }

    private static MentoratIntrouvableException introuvable() {
        return new MentoratIntrouvableException("Ce programme est introuvable.");
    }

    private static String libelle(StatutProgramme statut) {
        return switch (statut) {
            case BROUILLON -> "Brouillon";
            case OUVERT -> "Ouvert";
            case EN_COURS -> "En cours";
            case CLOS -> "Clos";
        };
    }

    private static String texteOuNull(String texte) {
        return texte == null || texte.isBlank() ? null : texte.strip();
    }
}
