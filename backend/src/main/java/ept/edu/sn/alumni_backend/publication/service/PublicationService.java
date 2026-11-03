package ept.edu.sn.alumni_backend.publication.service;

import java.util.UUID;
import java.time.Duration;
import java.time.Instant;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.publication.AudiencePublication;
import ept.edu.sn.alumni_backend.publication.StatutPublication;
import ept.edu.sn.alumni_backend.publication.TypePublication;
import ept.edu.sn.alumni_backend.publication.PublicationProperties;
import ept.edu.sn.alumni_backend.publication.dto.PagePublicationsResponse;
import ept.edu.sn.alumni_backend.publication.dto.PublicationRequest;
import ept.edu.sn.alumni_backend.publication.dto.PublicationResponse;
import ept.edu.sn.alumni_backend.publication.entity.Publication;
import ept.edu.sn.alumni_backend.publication.exception.PublicationIntrouvableException;
import ept.edu.sn.alumni_backend.publication.exception.LimiteCreationPublicationAtteinteException;
import ept.edu.sn.alumni_backend.publication.repository.PublicationRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PublicationService {
    private final PublicationRepository publications;
    private final UtilisateurRepository utilisateurs;
    private final PublicationProperties proprietes;
    private final StockageImagePublication stockageImages;

    @Transactional
    public PublicationResponse creer(PublicationRequest demande, UtilisateurPrincipal principal) {
        return creerInterne(demande, principal, null);
    }

    @Transactional
    public PublicationResponse creerAvecImage(PublicationRequest demande, MultipartFile image, UtilisateurPrincipal principal) {
        return creerInterne(demande, principal, image);
    }

    private PublicationResponse creerInterne(PublicationRequest demande, UtilisateurPrincipal principal, MultipartFile image) {
        Utilisateur auteur = utilisateurs.findByIdForUpdate(principal.getUtilisateur().getId())
            .orElseThrow(() -> new SecurityException("Compte indisponible."));
        if (!auteur.isEmailVerifie() || (auteur.getStatutCompte() != StatutCompte.ACTIF
                && auteur.getStatutCompte() != StatutCompte.EN_ATTENTE)) {
            throw new SecurityException("Compte indisponible.");
        }
        if (demande.type() == TypePublication.ANNONCE_OFFICIELLE && auteur.getRole() != TypeRole.ADMIN) {
            throw new SecurityException("Seule l'administration peut publier une annonce officielle.");
        }
        if (demande.type() == TypePublication.APPEL_PROJET) {
            throw new IllegalArgumentException("Les appels à projets ne sont pas encore disponibles.");
        }
        if (publications.countByAuteur_IdAndPublieLeGreaterThanEqual(
                auteur.getId(), Instant.now().minus(Duration.ofHours(24))) >= proprietes.limiteCreations24h()) {
            throw new LimiteCreationPublicationAtteinteException();
        }
        Publication publication = new Publication();
        publication.setAuteur(auteur);
        publication.setType(demande.type());
        publication.setTitre(demande.titre() == null || demande.titre().isBlank() ? null : demande.titre().strip());
        publication.setContenu(demande.contenu().strip());
        publication.setAudience(demande.audience());
        if (image != null) {
            String identifiant = stockageImages.stocker(image);
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCompletion(int status) {
                    if (status != STATUS_COMMITTED) stockageImages.supprimer(identifiant);
                }
            });
            publication.setUrlImage("stockage:" + identifiant);
            publication.setTexteAlternatif(demande.texteAlternatif() == null || demande.texteAlternatif().isBlank()
                ? null : demande.texteAlternatif().strip());
        }
        return versResponse(publications.saveAndFlush(publication));
    }

    @Transactional(readOnly = true)
    public PagePublicationsResponse lister(UtilisateurPrincipal principal, int page, int taille) {
        Specification<Publication> visible = (racine, requete, cb) -> {
            var tous = cb.equal(racine.get("audience"), AudiencePublication.TOUS);
            var auteur = cb.equal(racine.get("auteur").get("id"), principal.getUtilisateur().getId());
            AudiencePublication role = audienceDuRole(principal.getUtilisateur().getRole());
            var audience = role == null ? cb.or(tous, auteur)
                : cb.or(tous, auteur, cb.equal(racine.get("audience"), role));
            return cb.and(cb.equal(racine.get("statut"), StatutPublication.PUBLIE), audience);
        };
        var tri = Sort.by(Sort.Order.desc("publieLe"), Sort.Order.desc("id"));
        return PagePublicationsResponse.depuis(publications.findAll(visible, PageRequest.of(page, taille, tri))
            .map(this::versResponse));
    }

    @Transactional(readOnly = true)
    public PublicationResponse obtenir(UUID id, UtilisateurPrincipal principal) {
        return versResponse(publicationVisible(id, principal));
    }

    @Transactional(readOnly = true)
    public Resource image(UUID id, UtilisateurPrincipal principal) {
        String url = publicationVisible(id, principal).getUrlImage();
        if (url == null || !url.startsWith("stockage:")) throw new PublicationIntrouvableException();
        return stockageImages.lire(url.substring("stockage:".length()));
    }

    private Publication publicationVisible(UUID id, UtilisateurPrincipal principal) {
        return publications.findById(id)
            .filter(p -> p.getStatut() == StatutPublication.PUBLIE)
            .filter(p -> p.getAudience() == AudiencePublication.TOUS
                || p.getAudience() == audienceDuRole(principal.getUtilisateur().getRole())
                || p.getAuteur().getId().equals(principal.getUtilisateur().getId()))
            .orElseThrow(PublicationIntrouvableException::new);
    }

    private AudiencePublication audienceDuRole(TypeRole role) {
        return switch (role) {
            case ALUMNI -> AudiencePublication.ALUMNI;
            case ETUDIANT -> AudiencePublication.ETUDIANTS;
            default -> null;
        };
    }

    private PublicationResponse versResponse(Publication p) {
        Utilisateur auteur = p.getAuteur();
        String image = p.getUrlImage() != null && p.getUrlImage().startsWith("stockage:")
            ? "/api/publications/" + p.getId() + "/image" : p.getUrlImage();
        return new PublicationResponse(p.getId(), p.getType(), p.getTitre(), p.getContenu(), p.getAudience(), image,
            p.getTexteAlternatif(), p.getPublieLe(), p.getModifieLe(), auteur.getId(), auteur.getNom(), auteur.getPrenom(),
            auteur.getRole(), auteur.getUrlPhoto());
    }
}
