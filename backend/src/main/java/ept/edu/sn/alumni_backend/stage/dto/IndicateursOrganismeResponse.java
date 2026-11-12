package ept.edu.sn.alumni_backend.stage.dto;

import java.util.List;

/**
 * Indicateurs de la collaboration d'un organisme avec l'école (STA-13), calculés à partir de ses offres, des
 * candidatures reçues et des stages confirmés chez lui. Une offre compte l'année de sa publication.
 */
public record IndicateursOrganismeResponse(
    long offresPubliees,
    long candidaturesRecues,
    long etudiantsAccueillis,
    List<ParAnnee> parAnnee,
    List<Repartition> accueillisParType,
    List<Repartition> accueillisParFiliere
) {
    public record ParAnnee(int annee, long offres, long candidatures) {
    }

    /** cle : code du type de stage, ou nom de la filière (« Filière non renseignée » si vide). */
    public record Repartition(String cle, long nombre) {
    }
}
