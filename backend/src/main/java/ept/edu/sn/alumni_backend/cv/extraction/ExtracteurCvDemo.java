package ept.edu.sn.alumni_backend.cv.extraction;

import java.util.List;

/**
 * Pour le développement et les démonstrations, sans clé d'API ni coût : renvoie toujours le même profil
 * fictif, quel que soit le CV déposé. Activé par CV_IA_FOURNISSEUR=demo, jamais par défaut en production.
 */
class ExtracteurCvDemo implements ExtracteurCv {
    private static final long DELAI_SIMULE_MS = 2_000;

    @Override
    public boolean disponible() {
        return true;
    }

    @Override
    public boolean imagesAcceptees() {
        return true;
    }

    @Override
    public String nomFournisseur() {
        return "Démonstration (aucune IA, profil fictif)";
    }

    @Override
    public ResultatExtraction extraire(ContenuCv contenu) {
        try {
            Thread.sleep(DELAI_SIMULE_MS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        ProfilExtrait profil = new ProfilExtrait(
            new ProfilExtrait.Identite(
                "Awa", "Ndiaye (démo)", "+221 70 000 00 00", "Dakar", "SN",
                "Ingénieure logiciel",
                "Ingénieure en informatique, j'aime concevoir des services numériques utiles au quotidien.",
                "https://www.linkedin.com/in/profil-demo", null),
            List.of(
                new ProfilExtrait.FormationExtraite(
                    "Diplôme d'ingénieur de conception en génie informatique", "École Polytechnique de Thiès",
                    "DIPLOMANTE", "2016-10", "2021-07", false, null),
                new ProfilExtrait.FormationExtraite(
                    "Certification Scrum Master", "Organisme de formation (démo)",
                    "CERTIFICATION", "2023", "2023", false, null)),
            List.of(
                new ProfilExtrait.ExperienceExtraite(
                    "Ingénieure logiciel", "Entreprise fictive (démo)", "CDI", "2021-09", null, true, false,
                    "Conception d'applications web et mobiles."),
                new ProfilExtrait.ExperienceExtraite(
                    "Stagiaire développeuse", "Start-up fictive (démo)", "STAGE", "2021-02", "2021-07", false, true,
                    "Projet de fin d'études.")),
            List.of("Java", "Spring Boot", "Angular", "PostgreSQL", "Gestion de projet"),
            List.of(
                new ProfilExtrait.LangueExtraite("fr", "COURANT"),
                new ProfilExtrait.LangueExtraite("wo", "MATERNELLE"),
                new ProfilExtrait.LangueExtraite("en", "INTERMEDIAIRE")));
        return new ResultatExtraction(profil, "demo", "demo", 0, 0);
    }
}
