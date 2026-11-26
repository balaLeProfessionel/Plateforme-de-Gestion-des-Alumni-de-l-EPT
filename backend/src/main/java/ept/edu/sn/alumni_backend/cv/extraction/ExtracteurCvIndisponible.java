package ept.edu.sn.alumni_backend.cv.extraction;

/** Aucun fournisseur configuré : l'import de CV est masqué, la saisie manuelle reste possible. */
class ExtracteurCvIndisponible implements ExtracteurCv {
    @Override
    public boolean disponible() {
        return false;
    }

    @Override
    public boolean imagesAcceptees() {
        return false;
    }

    @Override
    public String nomFournisseur() {
        return null;
    }

    @Override
    public ResultatExtraction extraire(ContenuCv contenu) {
        throw new IllegalStateException("Aucun fournisseur d'IA n'est configuré pour l'import de CV");
    }
}
