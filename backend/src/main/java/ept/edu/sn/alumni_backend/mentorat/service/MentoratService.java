package ept.edu.sn.alumni_backend.mentorat.service;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.mentorat.ParticipationMentorat;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.mentorat.RoleMentorat;
import ept.edu.sn.alumni_backend.mentorat.StatutMentorat;
import ept.edu.sn.alumni_backend.mentorat.dto.CompteursMentoratResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.DemandeMentoratRequest;
import ept.edu.sn.alumni_backend.mentorat.dto.MentoratResponse;
import ept.edu.sn.alumni_backend.mentorat.entity.DomaineMentorat;
import ept.edu.sn.alumni_backend.mentorat.entity.Mentorat;
import ept.edu.sn.alumni_backend.mentorat.entity.ProfilMentor;
import ept.edu.sn.alumni_backend.mentorat.evenement.NotificationMentorat;
import ept.edu.sn.alumni_backend.mentorat.exception.ConflitMentoratException;
import ept.edu.sn.alumni_backend.mentorat.exception.MentoratIntrouvableException;
import ept.edu.sn.alumni_backend.mentorat.repository.MentoratRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.ProfilMentorRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/** Demandes de mentorat et changements de statut. */
@Service
@RequiredArgsConstructor
public class MentoratService {
    private final MentoratRepository mentoratRepository;
    private final ProfilMentorRepository profilMentorRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MentoratMapper mapper;
    private final AccesMentorat acces;
    private final ApplicationEventPublisher evenements;

    @Transactional
    public MentoratResponse demander(DemandeMentoratRequest request, UtilisateurPrincipal principal) {
        Utilisateur demandeur = principal.getUtilisateur();
        if (!ParticipationMentorat.autorise(demandeur.getRole())) {
            throw new SecurityException("Le mentorat est réservé aux membres : étudiants, alumni, personnel et visiteurs.");
        }
        // Un mentor absent de la recherche (compte suspendu, en attente…) ne peut pas non plus être sollicité.
        ProfilMentor profil = profilMentorRepository.findByIdForUpdate(request.profilMentorId())
            .filter(ProfilMentor::estSollicitable)
            .orElseThrow(() -> new MentoratIntrouvableException("Ce mentor est introuvable."));
        if (profil.getUtilisateur().getId().equals(demandeur.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas vous solliciter vous-même.");
        }
        DomaineMentorat domaine = profil.getDomaines().stream()
            .filter(d -> d.getId().equals(request.domaineId()))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Ce mentor n'accompagne pas dans ce domaine."));
        if (!profil.isDisponible() || placesRestantes(profil) <= 0) {
            throw new ConflitMentoratException("Ce mentor n'est pas disponible pour le moment.");
        }
        if (mentoratRepository.existsByMentore_IdAndProfilMentor_IdAndStatutIn(
                demandeur.getId(), profil.getId(), StatutMentorat.EN_COURS)) {
            throw new ConflitMentoratException("Vous avez déjà une demande en cours avec ce mentor.");
        }
        if (mentoratRepository.countByMentore_IdAndStatut(demandeur.getId(), StatutMentorat.EN_ATTENTE)
                >= ParticipationMentorat.DEMANDES_EN_ATTENTE_MAX) {
            throw new ConflitMentoratException("Vous avez déjà " + ParticipationMentorat.DEMANDES_EN_ATTENTE_MAX
                + " demandes en attente. Attendez une réponse ou annulez-en une avant d'en envoyer une autre.");
        }

        Mentorat mentorat = new Mentorat();
        mentorat.setMentore(utilisateurRepository.getReferenceById(demandeur.getId()));
        mentorat.setProfilMentor(profil);
        mentorat.setDomaine(domaine);
        mentorat.setObjectif(request.objectif().trim());
        mentoratRepository.save(mentorat);
        notifier(profil.getUtilisateur(), "Nouvelle demande de mentorat",
            nomComplet(demandeur) + " souhaite être accompagné(e) en « " + domaine.getLibelle() + " ».");
        return mapper.versResponse(mentorat, demandeur.getId());
    }

    @Transactional(readOnly = true)
    public PageResponse<MentoratResponse> lister(
            RoleMentorat role,
            Set<StatutMentorat> statuts,
            int page,
            int taille,
            UtilisateurPrincipal principal) {
        UUID moi = principal.getUtilisateur().getId();
        Set<StatutMentorat> filtre = statuts == null || statuts.isEmpty() ? Set.of(StatutMentorat.values()) : statuts;
        Pageable pageable = PageRequest.of(page, taille, Sort.by(Sort.Order.desc("creeLe"), Sort.Order.asc("id")));
        var mentorats = role == RoleMentorat.MENTOR
            ? mentoratRepository.findByProfilMentor_Utilisateur_IdAndStatutIn(moi, filtre, pageable)
            : mentoratRepository.findByMentore_IdAndStatutIn(moi, filtre, pageable);
        return PageResponse.depuis(mentorats.map(mentorat -> mapper.versResponse(mentorat, moi)));
    }

    @Transactional(readOnly = true)
    public CompteursMentoratResponse compter(UtilisateurPrincipal principal) {
        UUID moi = principal.getUtilisateur().getId();
        return new CompteursMentoratResponse(
            mentoratRepository.countByProfilMentor_Utilisateur_IdAndStatut(moi, StatutMentorat.EN_ATTENTE),
            mentoratRepository.countByMentore_IdAndStatut(moi, StatutMentorat.EN_ATTENTE),
            ParticipationMentorat.DEMANDES_EN_ATTENTE_MAX);
    }

    @Transactional
    public MentoratResponse accepter(UUID mentoratId, UtilisateurPrincipal principal) {
        Mentorat mentorat = acces.chargerPourParticipant(mentoratId, principal);
        exigerRole(mentorat, principal, RoleMentorat.MENTOR, "Seul le mentor peut accepter cette demande.");
        exigerTransition(mentorat, StatutMentorat.ACCEPTEE);
        ProfilMentor profil = profilMentorRepository.findByIdForUpdate(mentorat.getProfilMentor().getId())
            .orElseThrow(() -> new MentoratIntrouvableException("Ce mentorat est introuvable."));
        if (placesRestantes(profil) <= 0) {
            throw new ConflitMentoratException("Vous avez atteint votre nombre maximum de mentorés.");
        }
        mentorat.setStatut(StatutMentorat.ACCEPTEE);
        mentorat.setReponduLe(Instant.now());
        notifier(mentorat.getMentore(), "Demande de mentorat acceptée",
            nomComplet(profil.getUtilisateur()) + " a accepté de vous accompagner.");
        return mapper.versResponse(mentorat, principal.getUtilisateur().getId());
    }

    @Transactional
    public MentoratResponse refuser(UUID mentoratId, String motif, UtilisateurPrincipal principal) {
        Mentorat mentorat = acces.chargerPourParticipant(mentoratId, principal);
        exigerRole(mentorat, principal, RoleMentorat.MENTOR, "Seul le mentor peut refuser cette demande.");
        exigerTransition(mentorat, StatutMentorat.REFUSEE);
        mentorat.setStatut(StatutMentorat.REFUSEE);
        mentorat.setMotifRefus(motif == null || motif.isBlank() ? null : motif.trim());
        mentorat.setReponduLe(Instant.now());
        notifier(mentorat.getMentore(), "Demande de mentorat refusée",
            mentorat.getMotifRefus() != null ? "Motif : " + mentorat.getMotifRefus() : "Aucun motif précisé.");
        return mapper.versResponse(mentorat, principal.getUtilisateur().getId());
    }

    @Transactional
    public MentoratResponse annuler(UUID mentoratId, UtilisateurPrincipal principal) {
        Mentorat mentorat = acces.chargerPourParticipant(mentoratId, principal);
        exigerRole(mentorat, principal, RoleMentorat.MENTORE, "Seule la personne qui a fait la demande peut l'annuler.");
        exigerTransition(mentorat, StatutMentorat.ANNULEE);
        mentorat.setStatut(StatutMentorat.ANNULEE);
        mentorat.setClotureLe(Instant.now());
        notifier(mentorat.getProfilMentor().getUtilisateur(), "Demande de mentorat annulée",
            nomComplet(mentorat.getMentore()) + " a annulé sa demande.");
        return mapper.versResponse(mentorat, principal.getUtilisateur().getId());
    }

    @Transactional
    public MentoratResponse terminer(UUID mentoratId, UtilisateurPrincipal principal) {
        Mentorat mentorat = acces.chargerPourParticipant(mentoratId, principal);
        exigerTransition(mentorat, StatutMentorat.TERMINEE);
        mentorat.setStatut(StatutMentorat.TERMINEE);
        mentorat.setClotureLe(Instant.now());
        notifier(acces.autreParticipant(mentorat, principal), "Mentorat terminé",
            "Le mentorat est clôturé. Vous pouvez maintenant l'évaluer.");
        return mapper.versResponse(mentorat, principal.getUtilisateur().getId());
    }

    private void exigerRole(Mentorat mentorat, UtilisateurPrincipal principal, RoleMentorat attendu, String message) {
        if (acces.roleDe(mentorat, principal) != attendu) {
            throw new SecurityException(message);
        }
    }

    private static void exigerTransition(Mentorat mentorat, StatutMentorat cible) {
        if (!mentorat.getStatut().peutPasserA(cible)) {
            throw new ConflitMentoratException("Ce mentorat n'est plus dans un état qui permet cette action.");
        }
    }

    private long placesRestantes(ProfilMentor profil) {
        return profil.getCapaciteMax()
            - mentoratRepository.countByProfilMentor_IdAndStatut(profil.getId(), StatutMentorat.ACCEPTEE);
    }

    private void notifier(Utilisateur destinataire, String sujet, String message) {
        evenements.publishEvent(new NotificationMentorat(destinataire.getEmail(), sujet, message));
    }

    private static String nomComplet(Utilisateur utilisateur) {
        return (utilisateur.getPrenom() + " " + utilisateur.getNom()).trim();
    }
}
