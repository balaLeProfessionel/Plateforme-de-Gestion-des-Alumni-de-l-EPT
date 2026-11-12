package ept.edu.sn.alumni_backend.apercu;

/**
 * Ce que la page dit d'elle-même (balises Open Graph, Twitter, {@code <title>}). Tout peut manquer sauf l'adresse
 * et le site : LinkedIn, par exemple, refuse souvent la lecture automatique.
 */
public record ApercuLienResponse(String url, String titre, String description, String image, String site) {
    public boolean lisible() {
        return titre != null || description != null;
    }
}
