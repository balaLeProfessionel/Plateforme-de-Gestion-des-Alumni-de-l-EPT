package ept.edu.sn.alumni_backend.messagerie.service;

import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.messagerie.TypePieceJointe;
import ept.edu.sn.alumni_backend.messagerie.dto.ApercuMessageResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.MembreConversationResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.MessageResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.PieceJointeResponse;
import ept.edu.sn.alumni_backend.messagerie.entity.Message;
import ept.edu.sn.alumni_backend.messagerie.entity.Participant;
import ept.edu.sn.alumni_backend.messagerie.entity.PieceJointe;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

@Component
public class MessagerieMapper {
    private static final int LONGUEUR_APERCU = 120;

    public MembreConversationResponse versMembre(Participant participant) {
        Utilisateur utilisateur = participant.getUtilisateur();
        return new MembreConversationResponse(utilisateur.getId(), utilisateur.getPrenom(), utilisateur.getNom(),
            nomAffiche(utilisateur), utilisateur.getUrlPhoto(), utilisateur.getRole(), participant.getRole());
    }

    public MessageResponse versMessage(Message message, UUID moi) {
        Utilisateur auteur = message.getAuteur();
        return new MessageResponse(message.getId(), auteur.getId(), nomAffiche(auteur), auteur.getUrlPhoto(),
            message.estSupprime() ? null : message.getContenu(), message.estSupprime(), message.getEnvoyeLe(),
            auteur.getId().equals(moi), versPieceJointe(message), message.isSysteme());
    }

    public ApercuMessageResponse versApercu(Message message) {
        String texte = message.getContenu();
        // Un fichier envoyé seul s'annonce par son nom dans la liste.
        if (texte.isBlank() && message.aPieceJointe()) texte = "Pièce jointe : " + message.getPieceJointe().getNom();
        String contenu = message.estSupprime() ? null : tronquer(texte);
        return new ApercuMessageResponse(message.getAuteur().getId(), nomAffiche(message.getAuteur()), contenu,
            message.estSupprime(), message.getEnvoyeLe(), message.isSysteme());
    }

    private static PieceJointeResponse versPieceJointe(Message message) {
        if (message.estSupprime() || !message.aPieceJointe()) return null;
        PieceJointe piece = message.getPieceJointe();
        boolean image = TypePieceJointe.depuisTypeMime(piece.getType()).map(TypePieceJointe::image).orElse(false);
        return new PieceJointeResponse(piece.getNom(), piece.getType(), piece.getTaille(), image);
    }

    /** Prénom et nom, ou nom de l'organisme pour un compte organisme ; jamais l'adresse e-mail. */
    public static String nomAffiche(Utilisateur utilisateur) {
        String nom = Stream.of(utilisateur.getPrenom(), utilisateur.getNom())
            .filter(Objects::nonNull).map(String::trim).filter(partie -> !partie.isEmpty())
            .collect(Collectors.joining(" "));
        if (!nom.isEmpty()) return nom;
        if (utilisateur.getOrganisme() != null && utilisateur.getOrganisme().getNom() != null) {
            return utilisateur.getOrganisme().getNom();
        }
        return "Membre EPT";
    }

    private static String tronquer(String texte) {
        return texte.length() <= LONGUEUR_APERCU ? texte : texte.substring(0, LONGUEUR_APERCU - 1) + "…";
    }
}
