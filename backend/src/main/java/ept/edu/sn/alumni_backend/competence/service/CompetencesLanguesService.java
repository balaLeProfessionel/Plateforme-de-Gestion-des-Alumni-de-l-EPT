package ept.edu.sn.alumni_backend.competence.service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.competence.dto.CompetenceSuggestion;
import ept.edu.sn.alumni_backend.competence.dto.CompetencesLanguesRequest;
import ept.edu.sn.alumni_backend.competence.dto.CompetencesLanguesResponse;
import ept.edu.sn.alumni_backend.competence.dto.LangueRequest;
import ept.edu.sn.alumni_backend.competence.dto.LangueResponse;
import ept.edu.sn.alumni_backend.competence.entity.Competence;
import ept.edu.sn.alumni_backend.competence.entity.UtilisateurCompetence;
import ept.edu.sn.alumni_backend.competence.entity.UtilisateurLangue;
import ept.edu.sn.alumni_backend.competence.repository.CompetenceRepository;
import ept.edu.sn.alumni_backend.competence.repository.UtilisateurCompetenceRepository;
import ept.edu.sn.alumni_backend.competence.repository.UtilisateurLangueRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/** Compétences et langues d'un membre, saisies à la main ou reprises d'un CV. */
@Service
@RequiredArgsConstructor
public class CompetencesLanguesService {
    /** Langues locales sans code ISO 639-1 : sérère, diola, soninké, mandingue. */
    private static final Set<String> CODES_LANGUES_SUPPLEMENTAIRES = Set.of("srr", "dyo", "snk", "mnk");
    private static final Set<String> CODES_LANGUES = Stream.concat(
            Arrays.stream(Locale.getISOLanguages()), CODES_LANGUES_SUPPLEMENTAIRES.stream())
        .collect(Collectors.toUnmodifiableSet());
    private static final int SUGGESTIONS_MAX = 10;

    private final CompetenceRepository competences;
    private final UtilisateurCompetenceRepository competencesMembres;
    private final UtilisateurLangueRepository languesMembres;
    private final UtilisateurRepository utilisateurs;

    public static boolean codeLangueConnu(String code) {
        return code != null && CODES_LANGUES.contains(code);
    }

    /** « Spring-Boot », « spring boot » et « Spring Boot » partagent la clé « spring boot ». */
    public static String cle(String libelle) {
        String sansAccents = Normalizer.normalize(libelle, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return sansAccents.toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9+#.]+", " ")
            .trim()
            .replaceAll("\\s+", " ");
    }

    @Transactional(readOnly = true)
    public CompetencesLanguesResponse lire(Utilisateur utilisateur) {
        List<String> libelles = competencesMembres.findByUtilisateurIdOrderByOrdreAsc(utilisateur.getId()).stream()
            .map(uc -> uc.getCompetence().getLibelle())
            .toList();
        List<LangueResponse> langues = languesMembres.findByUtilisateurId(utilisateur.getId()).stream()
            .sorted((a, b) -> a.getNiveau().compareTo(b.getNiveau()) != 0
                ? b.getNiveau().compareTo(a.getNiveau())
                : a.getId().codeLangue().compareTo(b.getId().codeLangue()))
            .map(ul -> new LangueResponse(ul.getId().codeLangue(), ul.getNiveau().name()))
            .toList();
        return new CompetencesLanguesResponse(libelles, langues);
    }

    @Transactional
    public CompetencesLanguesResponse remplacer(Utilisateur utilisateur, CompetencesLanguesRequest request) {
        Utilisateur gere = utilisateurs.findById(utilisateur.getId())
            .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));

        Map<String, LangueRequest> langues = new LinkedHashMap<>();
        for (LangueRequest langue : request.langues()) {
            if (!codeLangueConnu(langue.code())) {
                throw new IllegalArgumentException("Langue inconnue : " + langue.code());
            }
            langues.putIfAbsent(langue.code(), langue);
        }

        // Une même compétence écrite deux fois (casse, tirets) n'est gardée qu'une fois, à sa première place
        Map<String, String> libellesParCle = new LinkedHashMap<>();
        for (String brut : request.competences()) {
            String libelle = brut.trim().replaceAll("\\s+", " ");
            String cle = cle(libelle);
            if (cle.isEmpty()) {
                throw new IllegalArgumentException("Compétence invalide : " + brut);
            }
            libellesParCle.putIfAbsent(cle, libelle);
        }

        competencesMembres.supprimerPour(gere.getId());
        languesMembres.supprimerPour(gere.getId());
        gere = utilisateurs.getReferenceById(gere.getId());

        Map<String, Competence> referentiel = new HashMap<>();
        competences.findByCleIn(libellesParCle.keySet()).forEach(c -> referentiel.put(c.getCle(), c));
        List<UtilisateurCompetence> liens = new ArrayList<>();
        short ordre = 0;
        for (Map.Entry<String, String> entree : libellesParCle.entrySet()) {
            Competence competence = referentiel.computeIfAbsent(entree.getKey(), cle -> {
                Competence nouvelle = new Competence();
                nouvelle.setCle(cle);
                nouvelle.setLibelle(entree.getValue());
                return competences.save(nouvelle);
            });
            UtilisateurCompetence lien = new UtilisateurCompetence();
            lien.setId(new UtilisateurCompetence.Id(gere.getId(), competence.getId()));
            lien.setUtilisateur(gere);
            lien.setCompetence(competence);
            lien.setOrdre(ordre++);
            liens.add(lien);
        }
        competencesMembres.saveAll(liens);

        List<UtilisateurLangue> lignes = new ArrayList<>();
        for (LangueRequest langue : langues.values()) {
            UtilisateurLangue ligne = new UtilisateurLangue();
            ligne.setId(new UtilisateurLangue.Id(gere.getId(), langue.code()));
            ligne.setUtilisateur(gere);
            ligne.setNiveau(langue.niveau());
            lignes.add(ligne);
        }
        languesMembres.saveAll(lignes);

        return lire(gere);
    }

    @Transactional(readOnly = true)
    public List<CompetenceSuggestion> suggerer(String texte) {
        String fragment = texte == null ? "" : cle(texte);
        if (fragment.length() < 2) {
            return List.of();
        }
        return competences.findByCleContainingOrderByLibelleAsc(fragment, Limit.of(SUGGESTIONS_MAX)).stream()
            .map(c -> new CompetenceSuggestion(c.getLibelle()))
            .toList();
    }
}
