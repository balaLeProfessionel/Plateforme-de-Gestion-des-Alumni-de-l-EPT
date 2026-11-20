package ept.edu.sn.alumni_backend.utilisateur;

import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeRole;

/**
 * Comment un membre se présente comme auteur ou organisateur. Un compte organisme parle au nom de
 * son organisme : nom et logo de l'organisme, sans prénom, et l'identifiant de sa fiche
 * ({@code /organismes/{organismeId}}) pour que l'interface y mène plutôt qu'à un profil personnel.
 */
public record IdentitePublique(String nom, String prenom, String photo, UUID organismeId) {

    public static IdentitePublique de(Utilisateur utilisateur) {
        var organisme = utilisateur.getOrganisme();
        if (utilisateur.getRole() == TypeRole.ORGANISME && organisme != null) {
            return new IdentitePublique(organisme.getNom(), null, organisme.getLogoUrl(), organisme.getId());
        }
        return new IdentitePublique(utilisateur.getNom(), utilisateur.getPrenom(), utilisateur.getUrlPhoto(), null);
    }
}
