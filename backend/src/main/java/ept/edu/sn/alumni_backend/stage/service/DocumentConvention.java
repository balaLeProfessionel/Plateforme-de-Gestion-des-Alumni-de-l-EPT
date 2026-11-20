package ept.edu.sn.alumni_backend.stage.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.stage.ConventionProperties;
import ept.edu.sn.alumni_backend.stage.TypeStage;
import ept.edu.sn.alumni_backend.stage.entity.ConventionStage;
import ept.edu.sn.alumni_backend.stage.entity.Stage;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

/**
 * Convention de stage pré-remplie (STA-05), à partir du modèle de l'EPT : resources/modeles/convention-stage.docx.
 * - Chaque balise {{nom}} du modèle est remplacée par la donnée du stage ; une donnée absente devient des pointillés,
 *   à compléter à la main avant signature (représentant de l'organisme, allocation…).
 * - Un paragraphe qui commence par {{?condition}} n'est gardé que si la condition est vraie (clause de confidentialité,
 *   conditions particulières).
 * - Le document reste un .docx modifiable : l'organisme peut demander des retouches avant signature.
 * Le modèle se remplace par celui de l'école sans toucher au code, tant qu'il garde les mêmes balises, chacune tapée d'un seul tenant.
 */
@Component
public class DocumentConvention {
    static final String MODELE = "modeles/convention-stage.docx";
    static final String POINTILLES = "……………………";
    private static final Pattern BALISE = Pattern.compile("\\{\\{([a-z_]+)\\}\\}");
    /** Paragraphe Word entier dont le texte commence par une condition. */
    private static final Pattern PARAGRAPHE_CONDITIONNEL =
        Pattern.compile("<w:p>(?:(?!</w:p>).)*?\\{\\{\\?([a-z_]+)\\}\\}(?:(?!</w:p>).)*?</w:p>", Pattern.DOTALL);
    private static final Pattern RUN_CONDITION =
        Pattern.compile("<w:r>(?:<w:rPr>(?:(?!</w:r>).)*?</w:rPr>)?<w:t xml:space=\"preserve\">\\{\\{\\?[a-z_]+\\}\\}</w:t></w:r>");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.FRENCH);
    private static final String[] NOMBRES = {"zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
        "dix", "onze", "douze"};

    private final ConventionProperties ecole;

    public DocumentConvention(ConventionProperties ecole) {
        this.ecole = ecole;
    }

    /** Le .docx rempli ; convention peut être nulle (clauses pas encore saisies). */
    public byte[] generer(Stage stage, ConventionStage convention) {
        Map<String, String> valeurs = valeurs(stage, convention);
        Map<String, Boolean> conditions = conditions(convention);
        try (InputStream modele = new ClassPathResource(MODELE).getInputStream();
             ZipInputStream entree = new ZipInputStream(modele);
             ByteArrayOutputStream octets = new ByteArrayOutputStream();
             ZipOutputStream sortie = new ZipOutputStream(octets)) {
            for (ZipEntry partie; (partie = entree.getNextEntry()) != null; ) {
                byte[] contenu = entree.readAllBytes();
                if (partie.getName().equals("word/document.xml")) {
                    contenu = remplir(new String(contenu, StandardCharsets.UTF_8), valeurs, conditions).getBytes(StandardCharsets.UTF_8);
                }
                sortie.putNextEntry(new ZipEntry(partie.getName()));
                sortie.write(contenu);
                sortie.closeEntry();
            }
            sortie.finish();
            return octets.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("Modèle de convention illisible : " + MODELE, e);
        }
    }

    static String remplir(String xml, Map<String, String> valeurs, Map<String, Boolean> conditions) {
        Matcher paragraphe = PARAGRAPHE_CONDITIONNEL.matcher(xml);
        StringBuilder filtre = new StringBuilder();
        while (paragraphe.find()) {
            boolean garder = conditions.getOrDefault(paragraphe.group(1), false);
            String remplacement = garder ? RUN_CONDITION.matcher(paragraphe.group()).replaceFirst("") : "";
            paragraphe.appendReplacement(filtre, Matcher.quoteReplacement(remplacement));
        }
        paragraphe.appendTail(filtre);

        Matcher balise = BALISE.matcher(filtre);
        StringBuilder rempli = new StringBuilder();
        while (balise.find()) {
            String valeur = valeurs.get(balise.group(1));
            if (valeur == null) throw new IllegalStateException("Balise inconnue dans le modèle de convention : " + balise.group());
            balise.appendReplacement(rempli, Matcher.quoteReplacement(xml(valeur)));
        }
        balise.appendTail(rempli);
        return rempli.toString();
    }

    Map<String, String> valeurs(Stage stage, ConventionStage convention) {
        Utilisateur etudiant = stage.getEtudiant();
        TypeStage type = stage.getTypeStage();
        String filiere = etudiant.getNomFiliere();
        Map<String, String> v = new HashMap<>();
        v.put("intitule", intitule(type, filiere));
        v.put("organisme", ouPointilles(stage.nomOrganisme()));
        String adresse = stage.getOrganisme() == null ? null : texte(stage.getOrganisme().getAdresse());
        v.put("organisme_siege", adresse == null ? "" : ", dont le siège est situé " + adresse);
        v.put("representant_organisme", POINTILLES);
        v.put("directeur", ecole.directeur());
        v.put("directeur_titre", ecole.directeurTitre());
        v.put("etudiant", ouPointilles(nomComplet(etudiant)));
        v.put("classe", etudiant.getClasse() == null ? POINTILLES : etudiant.getClasse().libelle());
        v.put("filiere", filiere == null ? "" : ", filière " + filiere + ",");
        v.put("nature_stage", nature(type));
        v.put("sujet", ouPointilles(stage.getSujet()));
        v.put("duree", duree(stage.getDateDebut(), stage.getDateFin()));
        v.put("date_debut", date(stage.getDateDebut()));
        v.put("date_fin", date(stage.getDateFin()));
        v.put("tuteur", ouPointilles(stage.getTuteurNom()));
        String fonction = texte(stage.getTuteurFonction());
        v.put("tuteur_fonction", fonction == null ? "" : ", " + fonction);
        v.put("encadrant_interne", stage.getEncadrantInterne() == null ? POINTILLES : ouPointilles(nomComplet(stage.getEncadrantInterne())));
        String indemnite = convention == null ? null : texte(convention.getIndemnite());
        v.put("indemnite", indemnite == null ? POINTILLES + " FCFA" : indemnite);
        v.put("fin_de_stage", finDeStage(type, stage.nomOrganisme()));
        v.put("assurance", convention == null ? "" : texteOuVide(convention.getAssurance()));
        v.put("logement", convention == null ? "" : texteOuVide(convention.getLogement()));
        return v;
    }

    private static Map<String, Boolean> conditions(ConventionStage convention) {
        boolean assurance = convention != null && texte(convention.getAssurance()) != null;
        boolean logement = convention != null && texte(convention.getLogement()) != null;
        return Map.of(
            "confidentialite", convention != null && convention.isClauseConfidentialite(),
            "assurance", assurance,
            "logement", logement,
            "conditions", assurance || logement);
    }

    static String intitule(TypeStage type, String filiere) {
        String debut = switch (type) {
            case OUVRIER -> "POUR UN STAGE OUVRIER";
            case INCLUSION -> "POUR UN STAGE D’INCLUSION";
            case MAITRISE -> "POUR UN STAGE DE MAÎTRISE";
            case PFE -> "POUR UN PROJET DE FIN D’ÉTUDES";
            case ALTERNANCE -> "POUR UN STAGE EN ALTERNANCE";
            case RECHERCHE -> "POUR UN STAGE DE RECHERCHE";
        };
        return filiere == null ? debut : debut + " EN " + filiere.toUpperCase(Locale.FRENCH);
    }

    static String nature(TypeStage type) {
        return switch (type) {
            case OUVRIER -> "son stage ouvrier";
            case INCLUSION -> "son stage d’inclusion";
            case MAITRISE -> "son stage de maîtrise";
            case PFE -> "son projet de fin d’études";
            case ALTERNANCE -> "son stage en alternance";
            case RECHERCHE -> "son stage de recherche";
        };
    }

    /** Article 9 : le PFE et la recherche se concluent par un mémoire soutenu devant un jury, les autres par un rapport. */
    static String finDeStage(TypeStage type, String organisme) {
        if (type == TypeStage.PFE || type == TypeStage.RECHERCHE) {
            return "À la fin de son stage, le stagiaire produira un mémoire qu’il devra remettre à son maître de stage, "
                + "et le soutiendra devant un jury à l’École Polytechnique de Thiès, conformément au règlement pédagogique en vigueur.";
        }
        return "À la fin de son stage, le stagiaire produira un rapport de stage qu’il devra soumettre à son maître de stage "
            + "pour signature ; il sera ensuite déposé auprès de son département à l’EPT. Le maître de stage au sein de "
            + ouPointilles(organisme) + " établit une évaluation du stagiaire à l’issue du stage.";
    }

    /** « trois (03) mois », « deux (02) mois et 10 jours », « 20 jours ». */
    static String duree(LocalDate debut, LocalDate fin) {
        if (debut == null || fin == null || fin.isBefore(debut)) return POINTILLES;
        Period p = Period.between(debut, fin);
        int mois = p.getYears() * 12 + p.getMonths();
        String jours = p.getDays() == 0 ? "" : p.getDays() + (p.getDays() == 1 ? " jour" : " jours");
        if (mois == 0) return jours.isEmpty() ? "1 jour" : jours;
        String texteMois = (mois < NOMBRES.length ? NOMBRES[mois] : String.valueOf(mois)) + " (%02d) mois".formatted(mois);
        return jours.isEmpty() ? texteMois : texteMois + " et " + jours;
    }

    private static String date(LocalDate date) {
        return date == null ? POINTILLES : DATE.format(date);
    }

    private static String nomComplet(Utilisateur u) {
        String nom = ((u.getPrenom() == null ? "" : u.getPrenom()) + " " + (u.getNom() == null ? "" : u.getNom())).strip();
        return nom.isEmpty() ? null : nom;
    }

    private static String ouPointilles(String valeur) {
        String t = texte(valeur);
        return t == null ? POINTILLES : t;
    }

    private static String texteOuVide(String valeur) {
        String t = texte(valeur);
        return t == null ? "" : t;
    }

    private static String texte(String valeur) {
        return valeur == null || valeur.isBlank() ? null : valeur.strip();
    }

    /** Échappement XML : une saisie ne doit pas pouvoir casser le document. */
    private static String xml(String valeur) {
        return valeur.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
