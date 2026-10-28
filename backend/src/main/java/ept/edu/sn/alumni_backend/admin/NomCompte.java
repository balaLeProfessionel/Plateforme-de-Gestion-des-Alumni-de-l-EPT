package ept.edu.sn.alumni_backend.admin;

import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

/** Noms d'un compte pour le journal et les e-mails : un contact d'organisme n'a pas toujours de prénom. */
public final class NomCompte {
    private NomCompte() {
    }

    public static String complet(Utilisateur utilisateur) {
        String nom = Stream.of(utilisateur.getPrenom(), utilisateur.getNom())
            .filter(Objects::nonNull).map(String::trim).filter(partie -> !partie.isEmpty())
            .collect(Collectors.joining(" "));
        return nom.isEmpty() ? utilisateur.getEmail() : nom;
    }

    /** Pour « Bonjour … » : le prénom s'il existe, sinon le nom complet. */
    public static String salutation(Utilisateur utilisateur) {
        String prenom = utilisateur.getPrenom();
        return prenom != null && !prenom.isBlank() ? prenom.trim() : complet(utilisateur);
    }
}
