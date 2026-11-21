package ept.edu.sn.alumni_backend.stage.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import ept.edu.sn.alumni_backend.stage.TypeStage;

/** Textes calculés de la convention générée (STA-05). */
class DocumentConventionTests {

    @Test
    void laDureeSEcritEnMoisPuisEnJours() {
        assertEquals("trois (03) mois", DocumentConvention.duree(LocalDate.of(2025, 12, 21), LocalDate.of(2026, 3, 21)));
        assertEquals("un (01) mois", DocumentConvention.duree(LocalDate.of(2025, 9, 8), LocalDate.of(2025, 10, 8)));
        assertEquals("deux (02) mois et 10 jours", DocumentConvention.duree(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 11)));
        assertEquals("20 jours", DocumentConvention.duree(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 21)));
        assertEquals(DocumentConvention.POINTILLES, DocumentConvention.duree(null, LocalDate.of(2026, 1, 21)));
        assertEquals(DocumentConvention.POINTILLES, DocumentConvention.duree(LocalDate.of(2026, 2, 1), LocalDate.of(2026, 1, 1)));
    }

    @Test
    void lIntituleNommeLeTypeEtLaFiliere() {
        assertEquals("POUR UN STAGE DE MAÎTRISE EN GÉNIE CIVIL", DocumentConvention.intitule(TypeStage.MAITRISE, "Génie civil"));
        assertEquals("POUR UN PROJET DE FIN D’ÉTUDES", DocumentConvention.intitule(TypeStage.PFE, null));
    }

    @Test
    void unParagrapheConditionnelEstGardeSansSaConditionOuRetire() {
        String xml = "<w:p><w:r><w:t xml:space=\"preserve\">{{?nb}}</w:t></w:r><w:r><w:t xml:space=\"preserve\">NB {{x}}</w:t></w:r></w:p>"
            + "<w:p><w:r><w:t xml:space=\"preserve\">Fin</w:t></w:r></w:p>";
        assertEquals("<w:p><w:r><w:t xml:space=\"preserve\"></w:t></w:r><w:r><w:t xml:space=\"preserve\">NB a &amp; b</w:t></w:r></w:p>"
            + "<w:p><w:r><w:t xml:space=\"preserve\">Fin</w:t></w:r></w:p>",
            DocumentConvention.remplir(xml, Map.of("x", "a & b"), Map.of("nb", true)));
        assertEquals("<w:p><w:r><w:t xml:space=\"preserve\">Fin</w:t></w:r></w:p>",
            DocumentConvention.remplir(xml, Map.of("x", "a"), Map.of("nb", false)));
    }

    @Test
    void uneBaliseCoupeeParWordEstRecolleeDansSonPremierMorceau() {
        // Ce qu'écrit Word après une saisie à la main : attributs, correcteur, mise en forme différente par morceau.
        String xml = "<w:p w14:paraId=\"1A2B\" w:rsidR=\"00AB\"><w:r><w:rPr><w:b/></w:rPr><w:t>au sein de {{</w:t></w:r>"
            + "<w:proofErr w:type=\"spellStart\"/><w:r><w:t>organ</w:t></w:r><w:r><w:t>isme}}</w:t></w:r>"
            + "<w:proofErr w:type=\"spellEnd\"/><w:r><w:t xml:space=\"preserve\">, à Thiès</w:t></w:r></w:p>";
        String rempli = DocumentConvention.remplir(DocumentConvention.normaliser(xml), Map.of("organisme", "Sonatel"), Map.of());
        assertEquals("<w:p w14:paraId=\"1A2B\" w:rsidR=\"00AB\"><w:r><w:rPr><w:b/></w:rPr><w:t xml:space=\"preserve\">au sein de Sonatel</w:t></w:r>"
            + "<w:proofErr w:type=\"spellStart\"/><w:r><w:t xml:space=\"preserve\"></w:t></w:r><w:r><w:t xml:space=\"preserve\"></w:t></w:r>"
            + "<w:proofErr w:type=\"spellEnd\"/><w:r><w:t xml:space=\"preserve\">, à Thiès</w:t></w:r></w:p>", rempli);
    }

    @Test
    void uneConditionCoupeeOuColleeAuTexteFonctionneAussi() {
        String xml = "<w:p/><w:p w:rsidR=\"01\"/><w:p w:rsidR=\"02\"><w:r><w:t>{{?</w:t></w:r><w:r><w:t>nb}}NB : texte</w:t></w:r></w:p>"
            + "<w:p><w:r><w:t>Fin</w:t></w:r></w:p>";
        String normalise = DocumentConvention.normaliser(xml);
        assertEquals("<w:p/><w:p w:rsidR=\"01\"/><w:p w:rsidR=\"02\"><w:r><w:t xml:space=\"preserve\"></w:t></w:r>"
                + "<w:r><w:t xml:space=\"preserve\">NB : texte</w:t></w:r></w:p><w:p><w:r><w:t>Fin</w:t></w:r></w:p>",
            DocumentConvention.remplir(normalise, Map.of(), Map.of("nb", true)));
        assertEquals("<w:p/><w:p w:rsidR=\"01\"/><w:p><w:r><w:t>Fin</w:t></w:r></w:p>",
            DocumentConvention.remplir(normalise, Map.of(), Map.of("nb", false)));
    }

    @Test
    void leModeleDeLEcoleResteUtilisableSiWordCoupeToutesSesBalises() throws IOException {
        String original = documentDuModele();
        Map<String, String> valeurs = new HashMap<>();
        Map<String, Boolean> conditions = new HashMap<>();
        Matcher balise = Pattern.compile("\\{\\{(\\??)([a-z_]+)\\}\\}").matcher(original);
        while (balise.find()) {
            if (balise.group(1).isEmpty()) valeurs.put(balise.group(2), "<" + balise.group(2) + ">");
            else conditions.put(balise.group(2), true);
        }
        // Chaque balise coupée en trois morceaux, séparés comme Word le fait.
        String coupe = Pattern.compile("(\\{\\{\\??)([a-z_]+)(\\}\\})").matcher(original)
            .replaceAll("$1</w:t></w:r><w:proofErr w:type=\"spellStart\"/><w:r><w:t>$2</w:t></w:r><w:r><w:t>$3");
        assertFalse(coupe.contains("{{organisme}}"));

        String attendu = texte(DocumentConvention.remplir(original, valeurs, conditions));
        String obtenu = texte(DocumentConvention.remplir(DocumentConvention.normaliser(coupe), valeurs, conditions));
        assertEquals(attendu, obtenu);
        assertFalse(obtenu.contains("{{"));
        assertTrue(obtenu.contains("&lt;organisme&gt;"), "valeur échappée à la place de la balise");
    }

    private static String documentDuModele() throws IOException {
        try (InputStream modele = new ClassPathResource(DocumentConvention.MODELE).getInputStream();
             ZipInputStream zip = new ZipInputStream(modele)) {
            for (ZipEntry partie; (partie = zip.getNextEntry()) != null; ) {
                if (partie.getName().equals("word/document.xml")) return new String(zip.readAllBytes(), StandardCharsets.UTF_8);
            }
        }
        throw new AssertionError("word/document.xml absent du modèle");
    }

    private static String texte(String xml) {
        return xml.replaceAll("</w:p>", "\n").replaceAll("<[^>]+>", "");
    }

    @Test
    void laPonctuationFrancaiseNeSeRetrouveJamaisSeuleEnBordDeLigne() {
        assertEquals("Sujet\u00a0: «\u00a0Réseaux\u00a0», puis rapport\u00a0; soutenance\u00a0?",
            DocumentConvention.insecables("Sujet : « Réseaux », puis rapport ; soutenance ?"));
    }

    @Test
    void uneBaliseInconnueEstSignaleeEtPasLaisseeDansLeDocument() {
        assertThrows(IllegalStateException.class,
            () -> DocumentConvention.remplir("<w:t>{{inconnue}}</w:t>", Map.of(), Map.of()));
    }
}
