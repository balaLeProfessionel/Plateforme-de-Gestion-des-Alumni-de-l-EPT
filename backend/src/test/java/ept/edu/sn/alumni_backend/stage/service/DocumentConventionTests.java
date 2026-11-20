package ept.edu.sn.alumni_backend.stage.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.LocalDate;
import java.util.Map;

import org.junit.jupiter.api.Test;

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
        assertEquals("<w:p><w:r><w:t xml:space=\"preserve\">NB a &amp; b</w:t></w:r></w:p><w:p><w:r><w:t xml:space=\"preserve\">Fin</w:t></w:r></w:p>",
            DocumentConvention.remplir(xml, Map.of("x", "a & b"), Map.of("nb", true)));
        assertEquals("<w:p><w:r><w:t xml:space=\"preserve\">Fin</w:t></w:r></w:p>",
            DocumentConvention.remplir(xml, Map.of("x", "a"), Map.of("nb", false)));
    }

    @Test
    void uneBaliseInconnueEstSignaleeEtPasLaisseeDansLeDocument() {
        assertThrows(IllegalStateException.class,
            () -> DocumentConvention.remplir("<w:t>{{inconnue}}</w:t>", Map.of(), Map.of()));
    }
}
