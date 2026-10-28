package ept.edu.sn.alumni_backend.admin.evenement;

/** Identifiants d'un compte créé par l'administration, envoyés après le commit. */
public record IdentifiantsCompte(String destinataire, String salutation, String motDePasseProvisoire) {
    /** Le mot de passe ne doit jamais apparaître dans une trace (journal, exception). */
    @Override
    public String toString() {
        return "IdentifiantsCompte[destinataire=" + destinataire + ", motDePasseProvisoire=***]";
    }
}
