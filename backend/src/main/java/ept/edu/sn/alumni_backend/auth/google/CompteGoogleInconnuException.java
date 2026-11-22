package ept.edu.sn.alumni_backend.auth.google;

/** Aucun compte n'utilise l'adresse du compte Google : l'identité sert à pré-remplir l'inscription. */
public class CompteGoogleInconnuException extends RuntimeException {
    private final transient IdentiteGoogle identite;

    public CompteGoogleInconnuException(IdentiteGoogle identite) {
        super("Aucun compte EPT Alumni n'utilise cette adresse Google. Complétez votre inscription.");
        this.identite = identite;
    }

    public IdentiteGoogle identite() {
        return identite;
    }
}
