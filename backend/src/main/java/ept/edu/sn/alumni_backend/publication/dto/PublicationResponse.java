package ept.edu.sn.alumni_backend.publication.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.publication.AudiencePublication;
import ept.edu.sn.alumni_backend.publication.TypePublication;

/**
 * {@code jaime} : le lecteur aime cette publication ; les deux nombres évitent d'ouvrir les commentaires pour compter.
 * {@code apercuCommentaire} : dernier commentaire, montré sous la publication dans le fil (absent s'il n'y en a pas).
 * {@code lien} : lien partagé avec son aperçu, absent s'il n'y en a pas.
 */
public record PublicationResponse(UUID id, TypePublication type, String titre, String contenu,
    AudiencePublication audience, String urlImage, String texteAlternatif, LocalDate dateLimite, Instant publieLe,
    Instant modifieLe, UUID auteurId, String auteurNom, String auteurPrenom, TypeRole auteurRole, String auteurPhoto,
    long nombreJaime, boolean jaime, long nombreCommentaires, CommentairePublicationResponse apercuCommentaire,
    LienPublicationResponse lien) {}
