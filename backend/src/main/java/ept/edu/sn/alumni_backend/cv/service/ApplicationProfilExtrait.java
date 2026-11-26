package ept.edu.sn.alumni_backend.cv.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.competence.NiveauLangue;
import ept.edu.sn.alumni_backend.competence.dto.CompetencesLanguesRequest;
import ept.edu.sn.alumni_backend.competence.dto.CompetencesLanguesResponse;
import ept.edu.sn.alumni_backend.competence.dto.LangueRequest;
import ept.edu.sn.alumni_backend.competence.service.CompetencesLanguesService;
import ept.edu.sn.alumni_backend.cv.extraction.ProfilExtrait;
import ept.edu.sn.alumni_backend.cv.extraction.ProfilExtrait.ExperienceExtraite;
import ept.edu.sn.alumni_backend.cv.extraction.ProfilExtrait.FormationExtraite;
import ept.edu.sn.alumni_backend.cv.extraction.ProfilExtrait.Identite;
import ept.edu.sn.alumni_backend.cv.extraction.ProfilExtrait.LangueExtraite;
import ept.edu.sn.alumni_backend.enums.TypeContrat;
import ept.edu.sn.alumni_backend.enums.TypeFormation;
import ept.edu.sn.alumni_backend.parcours.dto.ExperienceRequest;
import ept.edu.sn.alumni_backend.parcours.dto.FormationRequest;
import ept.edu.sn.alumni_backend.parcours.service.ExperienceService;
import ept.edu.sn.alumni_backend.parcours.service.FormationService;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurProfilService;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import ept.edu.sn.alumni_backend.utilisateur.dto.ProfilRequest;
import lombok.RequiredArgsConstructor;

/**
 * Écrit dans le profil ce qui a été lu dans le CV ; le membre corrige ensuite depuis sa page profil.
 * Rien de ce qu'il a déjà saisi n'est écrasé : les champs remplis sont gardés, une formation ou une
 * expérience déjà présente n'est pas recréée, les compétences et langues s'ajoutent aux siennes.
 * Un champ obligatoire absent du CV reçoit une valeur par défaut modifiable (CDI, niveau intermédiaire…).
 */
@Component
@RequiredArgsConstructor
class ApplicationProfilExtrait {
    private static final int COMPETENCES_MAX = 30;
    private static final int LANGUES_MAX = 15;

    private final UtilisateurRepository utilisateurs;
    private final UtilisateurProfilService profils;
    private final FormationService formations;
    private final ExperienceService experiences;
    private final CompetencesLanguesService competencesLangues;

    @Transactional
    void appliquer(Utilisateur utilisateur, ProfilExtrait profil) {
        Utilisateur membre = utilisateurs.findById(utilisateur.getId())
            .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));
        identite(membre, profil.identite(), posteEnCours(profil.experiences()));
        formations(membre, profil.formations());
        experiences(membre, profil.experiences());
        competencesEtLangues(membre, profil.competences(), profil.langues());
    }

    private void identite(Utilisateur membre, Identite i, String posteEnCours) {
        if (i == null) return;
        profils.mettreAJour(membre, new ProfilRequest(
            siVide(membre.getNom(), i.nom()),
            siVide(membre.getPrenom(), i.prenom()),
            siVide(membre.getBio(), i.bio()),
            siVide(membre.getVilleResidence(), i.villeResidence()),
            siVide(membre.getPosteActuel(), i.posteActuel() != null ? i.posteActuel() : posteEnCours),
            siVide(membre.getLienLinkedin(), i.lienLinkedin()),
            siVide(membre.getLienPortfolio(), i.lienPortfolio()),
            siVide(membre.getTelephone(), i.telephone()),
            null,
            null,
            null,
            siVide(membre.getPaysResidence(), i.paysResidence())));
    }

    private void formations(Utilisateur membre, List<FormationExtraite> extraites) {
        // Une formation est déjà là si son intitulé et son établissement correspondent, ou si elle couvre
        // les mêmes années : l'IA ne nomme pas toujours un diplôme de la même façon d'une lecture à l'autre.
        Set<String> existantes = new HashSet<>();
        formations.listerPour(membre).forEach(f -> {
            existantes.add(cle(f.libelle(), f.nomOrganisme()));
            existantes.add(periode(f.dateDebut(), f.dateFin(), true));
        });
        for (FormationExtraite f : liste(extraites)) {
            LocalDate debut = debut(f.dateDebut(), f.dateFin());
            // Sans établissement ni date, la formation ne peut pas être enregistrée : le membre l'ajoutera
            if (f.etablissement() == null || debut == null) continue;
            LocalDate finLue = Boolean.TRUE.equals(f.enCours()) ? null : fin(f.dateFin(), debut);
            if (existantes.contains(cle(f.libelle(), f.etablissement())) || existantes.contains(periode(debut, finLue, true))) {
                continue;
            }
            existantes.add(cle(f.libelle(), f.etablissement()));
            existantes.add(periode(debut, finLue, true));
            formations.creer(membre, new FormationRequest(
                f.libelle(),
                f.description(),
                f.typeFormation() == null ? TypeFormation.AUTRE : TypeFormation.valueOf(f.typeFormation()),
                debut,
                finLue,
                false,
                null,
                f.etablissement()));
        }
    }

    private void experiences(Utilisateur membre, List<ExperienceExtraite> extraites) {
        // Même règle que les formations, au mois près : deux postes commencés et finis le même mois sont le même poste.
        Set<String> existantes = new HashSet<>();
        experiences.listerPour(membre).forEach(e -> {
            existantes.add(cle(e.poste(), e.nomOrganisme()));
            existantes.add(periode(e.dateDebut(), e.dateFin(), false));
        });
        for (ExperienceExtraite e : liste(extraites)) {
            LocalDate debut = debut(e.dateDebut(), e.dateFin());
            if (e.organisme() == null || debut == null) continue;
            LocalDate finLue = Boolean.TRUE.equals(e.enCours()) ? null : fin(e.dateFin(), debut);
            if (existantes.contains(cle(e.poste(), e.organisme())) || existantes.contains(periode(debut, finLue, false))) {
                continue;
            }
            existantes.add(cle(e.poste(), e.organisme()));
            existantes.add(periode(debut, finLue, false));
            boolean stage = Boolean.TRUE.equals(e.estStage());
            experiences.creer(membre, new ExperienceRequest(
                e.poste(),
                e.description(),
                typeContrat(e.typeContrat(), stage),
                debut,
                finLue,
                stage,
                null,
                e.organisme()));
        }
    }

    private void competencesEtLangues(Utilisateur membre, List<String> competences, List<LangueExtraite> langues) {
        if (liste(competences).isEmpty() && liste(langues).isEmpty()) return;
        CompetencesLanguesResponse actuelles = competencesLangues.lire(membre);

        Map<String, String> parCle = new LinkedHashMap<>();
        for (String libelle : actuelles.competences()) parCle.putIfAbsent(CompetencesLanguesService.cle(libelle), libelle);
        for (String libelle : liste(competences)) parCle.putIfAbsent(CompetencesLanguesService.cle(libelle), libelle);

        Map<String, LangueRequest> parCode = new LinkedHashMap<>();
        actuelles.langues().forEach(l -> parCode.put(l.code(), new LangueRequest(l.code(), NiveauLangue.valueOf(l.niveau()))));
        for (LangueExtraite l : liste(langues)) {
            NiveauLangue niveau = l.niveau() == null ? NiveauLangue.INTERMEDIAIRE : NiveauLangue.valueOf(l.niveau());
            parCode.putIfAbsent(l.code(), new LangueRequest(l.code(), niveau));
        }

        competencesLangues.remplacer(membre, new CompetencesLanguesRequest(
            parCle.values().stream().limit(COMPETENCES_MAX).toList(),
            new ArrayList<>(parCode.values()).stream().limit(LANGUES_MAX).toList()));
    }

    /** Contrat absent du CV : stage s'il s'agit d'un stage, CDI sinon (le cas le plus courant). */
    static TypeContrat typeContrat(String type, boolean stage) {
        if (type != null) return TypeContrat.valueOf(type);
        return stage ? TypeContrat.STAGE : TypeContrat.CDI;
    }

    /** « 2019-03 » → 1er mars 2019, « 2019 » → 1er janvier 2019 ; sans début, la fin sert de repère. */
    static LocalDate debut(String debut, String fin) {
        LocalDate date = date(debut);
        return date != null ? date : date(fin);
    }

    private static LocalDate fin(String fin, LocalDate debut) {
        LocalDate date = date(fin);
        return date == null || date.isBefore(debut) ? null : date;
    }

    private static LocalDate date(String texte) {
        if (texte == null) return null;
        String[] parties = texte.split("-");
        int annee = Integer.parseInt(parties[0]);
        int mois = parties.length > 1 ? Integer.parseInt(parties[1]) : 1;
        return LocalDate.of(annee, mois, 1);
    }

    private static String posteEnCours(List<ExperienceExtraite> experiences) {
        return liste(experiences).stream()
            .filter(e -> Boolean.TRUE.equals(e.enCours()))
            .map(ExperienceExtraite::poste)
            .findFirst()
            .orElse(null);
    }

    private static String siVide(String actuelle, String lue) {
        return actuelle == null || actuelle.isBlank() ? lue : null;
    }

    /** Période d'un élément du parcours : à l'année pour une formation, au mois pour une expérience. */
    static String periode(LocalDate debut, LocalDate fin, boolean alAnnee) {
        return "periode|" + (alAnnee ? String.valueOf(debut.getYear()) : debut.toString().substring(0, 7)) + "|"
            + (fin == null ? "en-cours" : alAnnee ? String.valueOf(fin.getYear()) : fin.toString().substring(0, 7));
    }

    private static String cle(String intitule, String organisme) {
        return (CompetencesLanguesService.cle(intitule == null ? "" : intitule) + "|"
            + CompetencesLanguesService.cle(organisme == null ? "" : organisme)).toLowerCase(Locale.ROOT);
    }

    private static <T> List<T> liste(List<T> liste) {
        return liste == null ? List.of() : liste;
    }
}
