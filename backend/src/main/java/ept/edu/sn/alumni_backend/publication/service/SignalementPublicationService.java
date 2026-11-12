package ept.edu.sn.alumni_backend.publication.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.publication.MotifSignalement;
import ept.edu.sn.alumni_backend.publication.StatutPublication;
import ept.edu.sn.alumni_backend.publication.StatutSignalement;
import ept.edu.sn.alumni_backend.publication.dto.PageSignalementsResponse;
import ept.edu.sn.alumni_backend.publication.dto.SignalementRequest;
import ept.edu.sn.alumni_backend.publication.dto.SignalementResponse;
import ept.edu.sn.alumni_backend.publication.entity.Publication;
import ept.edu.sn.alumni_backend.publication.entity.SignalementPublication;
import ept.edu.sn.alumni_backend.publication.exception.ConflitPublicationException;
import ept.edu.sn.alumni_backend.publication.exception.SignalementIntrouvableException;
import ept.edu.sn.alumni_backend.publication.repository.SignalementPublicationRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.IdentitePublique;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

/** Signalements des membres et file de modération de l'administration. */
@Service
@RequiredArgsConstructor
public class SignalementPublicationService {
    private static final List<StatutSignalement> TRAITES =
        List.of(StatutSignalement.PUBLICATION_MASQUEE, StatutSignalement.REJETE);

    private final SignalementPublicationRepository signalements;
    private final PublicationService publications;

    @Transactional
    public void signaler(UUID publicationId, SignalementRequest demande, UtilisateurPrincipal principal) {
        Publication publication = publications.chargerVisible(publicationId, principal);
        Utilisateur auteur = principal.getUtilisateur();
        if (publication.getAuteur().getId().equals(auteur.getId())) {
            throw new IllegalArgumentException("Vous ne pouvez pas signaler votre propre publication.");
        }
        String detail = demande.detail() == null || demande.detail().isBlank() ? null : demande.detail().strip();
        if (demande.motif() == MotifSignalement.AUTRE && detail == null) {
            throw new IllegalArgumentException("Précisez la raison du signalement.");
        }
        if (signalements.existsByPublication_IdAndAuteur_Id(publicationId, auteur.getId())) {
            throw new ConflitPublicationException("Vous avez déjà signalé cette publication.");
        }
        SignalementPublication signalement = new SignalementPublication();
        signalement.setPublication(publication);
        signalement.setAuteur(auteur);
        signalement.setMotif(demande.motif());
        signalement.setDetail(detail);
        try {
            signalements.saveAndFlush(signalement);
        } catch (DataIntegrityViolationException doublon) {
            throw new ConflitPublicationException("Vous avez déjà signalé cette publication.");
        }
    }

    @Transactional(readOnly = true)
    public PageSignalementsResponse lister(boolean traites, int page, int taille) {
        var statuts = traites ? TRAITES : List.of(StatutSignalement.EN_ATTENTE);
        var tri = traites ? Sort.by(Sort.Order.desc("traiteLe"), Sort.Order.desc("id"))
            : Sort.by(Sort.Order.asc("creeLe"), Sort.Order.asc("id"));
        return PageSignalementsResponse.depuis(signalements.findByStatutIn(statuts, PageRequest.of(page, taille, tri))
            .map(this::versResponse));
    }

    @Transactional(readOnly = true)
    public long compterEnAttente() {
        return signalements.countByStatut(StatutSignalement.EN_ATTENTE);
    }

    /** Retire la publication du fil et clôt tous les signalements en attente qui la visent. */
    @Transactional
    public SignalementResponse masquerPublication(UUID id, UtilisateurPrincipal principal) {
        SignalementPublication signalement = enAttente(id);
        Publication publication = signalement.getPublication();
        publication.setStatut(StatutPublication.MASQUE);
        Instant maintenant = Instant.now();
        for (SignalementPublication autre : signalements.findByPublication_IdAndStatut(
                publication.getId(), StatutSignalement.EN_ATTENTE)) {
            cloturer(autre, StatutSignalement.PUBLICATION_MASQUEE, principal.getUtilisateur(), maintenant);
        }
        cloturer(signalement, StatutSignalement.PUBLICATION_MASQUEE, principal.getUtilisateur(), maintenant);
        signalements.flush();
        return versResponse(signalement);
    }

    /** La publication reste visible ; seul ce signalement est clos. */
    @Transactional
    public SignalementResponse rejeter(UUID id, UtilisateurPrincipal principal) {
        SignalementPublication signalement = enAttente(id);
        cloturer(signalement, StatutSignalement.REJETE, principal.getUtilisateur(), Instant.now());
        signalements.flush();
        return versResponse(signalement);
    }

    private SignalementPublication enAttente(UUID id) {
        SignalementPublication signalement = signalements.findById(id).orElseThrow(SignalementIntrouvableException::new);
        if (signalement.getStatut() != StatutSignalement.EN_ATTENTE) {
            throw new ConflitPublicationException("Ce signalement a déjà été traité.");
        }
        return signalement;
    }

    private void cloturer(SignalementPublication signalement, StatutSignalement statut, Utilisateur admin, Instant quand) {
        signalement.setStatut(statut);
        signalement.setTraitePar(admin);
        signalement.setTraiteLe(quand);
    }

    private SignalementResponse versResponse(SignalementPublication s) {
        Publication p = s.getPublication();
        Utilisateur auteurPublication = p.getAuteur();
        Utilisateur traitePar = s.getTraitePar();
        return new SignalementResponse(s.getId(), s.getMotif(), s.getDetail(), s.getStatut(), s.getCreeLe(),
            s.getTraiteLe(), s.getAuteur().getPrenom(), s.getAuteur().getNom(),
            traitePar == null ? null : traitePar.getPrenom(), traitePar == null ? null : traitePar.getNom(),
            new SignalementResponse.PublicationSignalee(p.getId(), p.getType(), p.getTitre(), p.getContenu(),
                PublicationService.urlImage(p), p.getStatut(), p.getPublieLe(), auteurPublication.getId(),
                IdentitePublique.de(auteurPublication).prenom(), IdentitePublique.de(auteurPublication).nom()));
    }
}
