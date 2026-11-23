package ept.edu.sn.alumni_backend.stage.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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
 * Le modèle se modifie dans Word par un développeur, en gardant les mêmes balises. Word découpe souvent une balise tapée à la main en plusieurs morceaux de texte (correcteur, historique de
 * saisie) : chaque paragraphe est d'abord recollé (normaliser) avant le remplacement.
 */
@Component
public class DocumentConvention {
    static final String MODELE = "modeles/convention-stage.docx";
    static final String POINTILLES = "……………………";
    private static final Pattern BALISE = Pattern.compile("\\{\\{([a-z_]+)\\}\\}");
    private static final Pattern CONDITION = Pattern.compile("\\{\\{\\?([a-z_]+)\\}\\}");
    /** Balise ou condition, une fois le texte du paragraphe recollé. */
    private static final Pattern BALISE_OU_CONDITION = Pattern.compile("\\{\\{\\??[a-z_]+\\}\\}");
    /** Un paragraphe Word, avec ou sans attributs (Word en ajoute : w14:paraId, w:rsidR…) ; pas <w:pPr>, <w:pBdr> ni <w:p/> vide. */
    private static final Pattern PARAGRAPHE = Pattern.compile("<w:p(?=[\\s>])[^>]*(?<!/)>.*?</w:p>", Pattern.DOTALL);
    /** Un morceau de texte d'un paragraphe : <w:t> ou <w:t xml:space="preserve">, pas <w:tab/> ni <w:tbl>. */
    private static final Pattern TEXTE = Pattern.compile("<w:t(?:\\s[^>]*)?>([^<]*)</w:t>");
    /** Parties du .docx qui portent du texte : corps, en-têtes, pieds de page. */
    private static final Pattern PARTIE_TEXTE = Pattern.compile("word/(document|header\\d*|footer\\d*)\\.xml");
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
                if (PARTIE_TEXTE.matcher(partie.getName()).matches()) {
                    String xml = normaliser(new String(contenu, StandardCharsets.UTF_8));
                    contenu = remplir(xml, valeurs, conditions).getBytes(StandardCharsets.UTF_8);
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

    /**
     * Recolle dans chaque paragraphe les balises que Word a coupées : chaque caractère d'une balise rejoint le morceau
     * de texte où elle commence, les autres morceaux perdent les caractères qu'ils en portaient. La mise en forme de la
     * balise est donc celle de son premier caractère ; le reste du paragraphe ne change pas.
     */
    static String normaliser(String xml) {
        Matcher paragraphe = PARAGRAPHE.matcher(xml);
        StringBuilder sortie = new StringBuilder();
        while (paragraphe.find()) {
            paragraphe.appendReplacement(sortie, Matcher.quoteReplacement(recoller(paragraphe.group())));
        }
        paragraphe.appendTail(sortie);
        return sortie.toString();
    }

    private static String recoller(String paragraphe) {
        Matcher morceau = TEXTE.matcher(paragraphe);
        List<String> textes = new ArrayList<>();
        while (morceau.find()) textes.add(morceau.group(1));
        if (textes.size() < 2) return paragraphe;
        StringBuilder tout = new StringBuilder();
        List<Integer> proprietaire = new ArrayList<>();
        for (int i = 0; i < textes.size(); i++) {
            tout.append(textes.get(i));
            for (int c = 0; c < textes.get(i).length(); c++) proprietaire.add(i);
        }
        boolean coupee = false;
        Matcher balise = BALISE_OU_CONDITION.matcher(tout);
        while (balise.find()) {
            int premier = proprietaire.get(balise.start());
            for (int c = balise.start(); c < balise.end(); c++) {
                if (proprietaire.get(c) != premier) coupee = true;
                proprietaire.set(c, premier);
            }
        }
        if (!coupee) return paragraphe;
        StringBuilder[] nouveaux = new StringBuilder[textes.size()];
        for (int i = 0; i < nouveaux.length; i++) nouveaux[i] = new StringBuilder();
        for (int c = 0; c < tout.length(); c++) nouveaux[proprietaire.get(c)].append(tout.charAt(c));
        StringBuilder sortie = new StringBuilder();
        int[] rang = {0};
        Matcher remplacement = TEXTE.matcher(paragraphe);
        while (remplacement.find()) {
            // xml:space="preserve" : un morceau qui commence ou finit désormais par une espace la garde.
            remplacement.appendReplacement(sortie, Matcher.quoteReplacement(
                "<w:t xml:space=\"preserve\">" + nouveaux[rang[0]++] + "</w:t>"));
        }
        remplacement.appendTail(sortie);
        return sortie.toString();
    }

    static String remplir(String xml, Map<String, String> valeurs, Map<String, Boolean> conditions) {
        Matcher paragraphe = PARAGRAPHE.matcher(xml);
        StringBuilder filtre = new StringBuilder();
        while (paragraphe.find()) {
            String contenu = paragraphe.group();
            Matcher condition = CONDITION.matcher(contenu);
            if (condition.find()) {
                // Un paragraphe sous condition est retiré entier, ou gardé sans le texte de sa condition.
                boolean garder = conditions.getOrDefault(condition.group(1), false);
                contenu = garder ? CONDITION.matcher(contenu).replaceAll("") : "";
            }
            paragraphe.appendReplacement(filtre, Matcher.quoteReplacement(contenu));
        }
        paragraphe.appendTail(filtre);

        Matcher balise = BALISE.matcher(filtre);
        StringBuilder rempli = new StringBuilder();
        while (balise.find()) {
            String valeur = valeurs.get(balise.group(1));
            if (valeur == null) throw new IllegalStateException("Balise inconnue dans le modèle de convention : " + balise.group());
            balise.appendReplacement(rempli, Matcher.quoteReplacement(xml(insecables(valeur))));
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

    /**
     * Ponctuation française : l'espace avant « : ; ! ? » » et après « « » devient insécable, pour que Word ne renvoie
     * jamais le signe seul en début ou en fin de ligne. Vaut pour les textes du code comme pour les saisies.
     */
    static String insecables(String valeur) {
        return valeur.replaceAll(" ([:;!?»])", " $1").replace("« ", "« ");
    }

    /** Échappement XML : une saisie ne doit pas pouvoir casser le document. */
    private static String xml(String valeur) {
        return valeur.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
