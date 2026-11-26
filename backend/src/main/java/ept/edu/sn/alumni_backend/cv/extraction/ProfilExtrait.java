package ept.edu.sn.alumni_backend.cv.extraction;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

/**
 * Profil lu dans un CV. C'est aussi le schéma JSON demandé à l'IA : les descriptions guident l'extraction.
 * Tout champ absent du CV vaut null, sauf les champs obligatoires du profil (valeur probable). Les dates sont « AAAA-MM » ou « AAAA ».
 */
public record ProfilExtrait(
    Identite identite,
    List<FormationExtraite> formations,
    List<ExperienceExtraite> experiences,
    @JsonPropertyDescription("Compétences techniques et métier, courtes (ex. « Java », « Gestion de projet »), 30 au plus")
    List<String> competences,
    List<LangueExtraite> langues
) {
    public record Identite(
        String prenom,
        String nom,
        @JsonPropertyDescription("Numéro de téléphone tel qu'écrit dans le CV")
        String telephone,
        @JsonPropertyDescription("Ville de résidence actuelle")
        String villeResidence,
        @JsonPropertyDescription("Pays de résidence, code ISO 3166-1 alpha-2 en majuscules (SN, FR, CA…)")
        String paysResidence,
        @JsonPropertyDescription("Intitulé du poste actuel, seulement si une expérience est en cours")
        String posteActuel,
        @JsonPropertyDescription("Résumé ou accroche écrit dans le CV, recopié et raccourci à 1000 caractères ; null s'il n'y en a pas")
        String bio,
        @JsonPropertyDescription("Adresse complète du profil LinkedIn, commençant par https://")
        String lienLinkedin,
        @JsonPropertyDescription("Adresse d'un site personnel, portfolio ou GitHub, commençant par https://")
        String lienPortfolio
    ) {}

    public record FormationExtraite(
        @JsonPropertyDescription("Intitulé du diplôme ou de la formation")
        String libelle,
        @JsonPropertyDescription("École, université ou organisme de formation")
        String etablissement,
        @JsonPropertyDescription("DIPLOMANTE, CERTIFICATION, SEMINAIRE ou AUTRE")
        String typeFormation,
        @JsonPropertyDescription("Début, au format AAAA-MM, ou AAAA si le mois est inconnu")
        String dateDebut,
        @JsonPropertyDescription("Fin, au format AAAA-MM ou AAAA ; null si en cours")
        String dateFin,
        Boolean enCours,
        String description
    ) {}

    public record ExperienceExtraite(
        String poste,
        @JsonPropertyDescription("Entreprise, administration ou organisation")
        String organisme,
        @JsonPropertyDescription("CDI, CDD, STAGE, FREELANCE ou FONCTION_PUBLIQUE ; valeur la plus probable si le CV ne le précise pas")
        String typeContrat,
        @JsonPropertyDescription("Début, au format AAAA-MM, ou AAAA si le mois est inconnu")
        String dateDebut,
        @JsonPropertyDescription("Fin, au format AAAA-MM ou AAAA ; null si le poste est actuel")
        String dateFin,
        Boolean enCours,
        Boolean estStage,
        @JsonPropertyDescription("Missions et réalisations, 2000 caractères au plus")
        String description
    ) {}

    public record LangueExtraite(
        @JsonPropertyDescription("Code ISO 639-1 en minuscules (fr, en, wo, ar…) ; srr pour le sérère, dyo pour le diola, snk pour le soninké, mnk pour le mandingue")
        String code,
        @JsonPropertyDescription("NOTIONS, INTERMEDIAIRE, COURANT, BILINGUE ou MATERNELLE ; valeur la plus probable si le CV ne le précise pas")
        String niveau
    ) {}
}
