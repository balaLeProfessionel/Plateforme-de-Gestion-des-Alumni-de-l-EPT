package ept.edu.sn.alumni_backend.cv.service;

import java.time.Year;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.competence.NiveauLangue;
import ept.edu.sn.alumni_backend.competence.service.CompetencesLanguesService;
import ept.edu.sn.alumni_backend.cv.extraction.ProfilExtrait;
import ept.edu.sn.alumni_backend.cv.extraction.ProfilExtrait.ExperienceExtraite;
import ept.edu.sn.alumni_backend.cv.extraction.ProfilExtrait.FormationExtraite;
import ept.edu.sn.alumni_backend.cv.extraction.ProfilExtrait.Identite;
import ept.edu.sn.alumni_backend.cv.extraction.ProfilExtrait.LangueExtraite;
import ept.edu.sn.alumni_backend.enums.TypeContrat;
import ept.edu.sn.alumni_backend.enums.TypeFormation;

/**
 * Ne fait pas confiance à l'IA : chaque champ est contrôlé et ramené aux limites du profil
 * (longueurs, valeurs permises, dates, adresses web). Ce qui ne passe pas est vidé.
 */
@Component
class VerificationProfilExtrait {
    private static final int FORMATIONS_MAX = 20;
    private static final int EXPERIENCES_MAX = 30;
    private static final int COMPETENCES_MAX = 30;
    private static final int LANGUES_MAX = 15;
    private static final Pattern DATE = Pattern.compile("^(\\d{4})(?:-(\\d{1,2}))?");
    private static final Pattern LIEN = Pattern.compile("^https?://\\S+$");
    private static final Pattern TELEPHONE = Pattern.compile("^[+0-9 ().\\-]{6,30}$");
    private static final Set<String> PAYS = Set.of(Locale.getISOCountries());
    private static final Set<String> TYPES_CONTRAT = noms(TypeContrat.values());
    private static final Set<String> TYPES_FORMATION = noms(TypeFormation.values());
    private static final Set<String> NIVEAUX = noms(NiveauLangue.values());

    ProfilExtrait verifier(ProfilExtrait brut) {
        if (brut == null) {
            throw new IllegalStateException("Réponse vide");
        }
        return new ProfilExtrait(
            identite(brut.identite()),
            liste(brut.formations()).stream().filter(Objects::nonNull).map(this::formation)
                .filter(Objects::nonNull).limit(FORMATIONS_MAX).toList(),
            liste(brut.experiences()).stream().filter(Objects::nonNull).map(this::experience)
                .filter(Objects::nonNull).limit(EXPERIENCES_MAX).toList(),
            competences(liste(brut.competences())),
            langues(liste(brut.langues())));
    }

    private Identite identite(Identite i) {
        if (i == null) {
            return new Identite(null, null, null, null, null, null, null, null, null);
        }
        String telephone = texte(i.telephone(), 30);
        // Jamais tronqué : « Senegal » deviendrait « SE » (la Suède)
        String pays = texte(i.paysResidence(), 100);
        pays = pays == null || pays.length() != 2 ? null : pays.toUpperCase(Locale.ROOT);
        return new Identite(
            texte(i.prenom(), 100),
            texte(i.nom(), 100),
            telephone != null && TELEPHONE.matcher(telephone).matches() ? telephone : null,
            texte(i.villeResidence(), 255),
            pays != null && PAYS.contains(pays) ? pays : null,
            texte(i.posteActuel(), 255),
            texte(i.bio(), 1000),
            lien(i.lienLinkedin()),
            lien(i.lienPortfolio()));
    }

    private FormationExtraite formation(FormationExtraite f) {
        String libelle = texte(f.libelle(), 255);
        if (libelle == null) return null;
        String debut = date(f.dateDebut());
        boolean enCours = Boolean.TRUE.equals(f.enCours());
        String fin = enCours ? null : finCoherente(debut, date(f.dateFin()));
        String type = valeur(f.typeFormation(), TYPES_FORMATION);
        return new FormationExtraite(libelle, texte(f.etablissement(), 255),
            type == null ? TypeFormation.AUTRE.name() : type, debut, fin, enCours, texte(f.description(), 2000));
    }

    private ExperienceExtraite experience(ExperienceExtraite e) {
        String poste = texte(e.poste(), 255);
        if (poste == null) return null;
        String debut = date(e.dateDebut());
        boolean enCours = Boolean.TRUE.equals(e.enCours());
        String fin = enCours ? null : finCoherente(debut, date(e.dateFin()));
        String type = valeur(e.typeContrat(), TYPES_CONTRAT);
        boolean stage = Boolean.TRUE.equals(e.estStage()) || TypeContrat.STAGE.name().equals(type);
        return new ExperienceExtraite(poste, texte(e.organisme(), 255), type, debut, fin, enCours, stage,
            texte(e.description(), 2000));
    }

    private List<String> competences(List<String> brutes) {
        Map<String, String> parCle = new LinkedHashMap<>();
        for (String brute : brutes) {
            String libelle = texte(brute, 80);
            if (libelle == null) continue;
            String cle = CompetencesLanguesService.cle(libelle);
            if (!cle.isEmpty()) parCle.putIfAbsent(cle, libelle);
        }
        return parCle.values().stream().limit(COMPETENCES_MAX).toList();
    }

    private List<LangueExtraite> langues(List<LangueExtraite> brutes) {
        Map<String, LangueExtraite> parCode = new LinkedHashMap<>();
        for (LangueExtraite brute : brutes) {
            if (brute == null || brute.code() == null) continue;
            String code = brute.code().trim().toLowerCase(Locale.ROOT);
            if (!CompetencesLanguesService.codeLangueConnu(code)) continue;
            // Niveau inconnu : laissé vide, le membre le choisira à la relecture
            parCode.putIfAbsent(code, new LangueExtraite(code, valeur(brute.niveau(), NIVEAUX)));
        }
        return new ArrayList<>(parCode.values()).stream().limit(LANGUES_MAX).toList();
    }

    /** « 2018-03 », « 2018-3-15 » → « 2018-03 » ; « 2018 » reste « 2018 » ; tout le reste → null. */
    static String date(String brute) {
        if (brute == null) return null;
        Matcher m = DATE.matcher(brute.trim());
        if (!m.find()) return null;
        int annee = Integer.parseInt(m.group(1));
        if (annee < 1950 || annee > Year.now().getValue() + 6) return null;
        if (m.group(2) == null) return String.valueOf(annee);
        int mois = Integer.parseInt(m.group(2));
        return mois >= 1 && mois <= 12 ? YearMonth.of(annee, mois).toString() : String.valueOf(annee);
    }

    /** Une fin antérieure au début est une erreur de lecture : on la vide plutôt que de la garder. */
    private static String finCoherente(String debut, String fin) {
        if (debut == null || fin == null) return fin;
        return fin.compareTo(debut.substring(0, 4)) < 0 ? null : fin;
    }

    private static String texte(String brut, int longueurMax) {
        if (brut == null) return null;
        String propre = brut.strip().replaceAll("[\\p{Cntrl}&&[^\\n]]", " ").replaceAll("[ \\t]+", " ");
        if (propre.isEmpty() || "null".equalsIgnoreCase(propre)) return null;
        return propre.length() > longueurMax ? propre.substring(0, longueurMax).strip() : propre;
    }

    private static String lien(String brut) {
        String lien = texte(brut, 255);
        if (lien == null) return null;
        if (!lien.startsWith("http")) lien = "https://" + lien;
        return LIEN.matcher(lien).matches() ? lien : null;
    }

    private static String valeur(String brute, Set<String> permises) {
        if (brute == null) return null;
        String v = brute.trim().toUpperCase(Locale.ROOT);
        return permises.contains(v) ? v : null;
    }

    private static <T> List<T> liste(List<T> liste) {
        return liste == null ? List.of() : liste;
    }

    private static Set<String> noms(Enum<?>[] valeurs) {
        return Arrays.stream(valeurs).map(Enum::name).collect(Collectors.toUnmodifiableSet());
    }
}
