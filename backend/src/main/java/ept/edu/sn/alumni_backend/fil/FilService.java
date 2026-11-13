package ept.edu.sn.alumni_backend.fil;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Predicate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.evenement.PeriodeEvenement;
import ept.edu.sn.alumni_backend.evenement.dto.EvenementResponse;
import ept.edu.sn.alumni_backend.evenement.dto.FiltresEvenements;
import ept.edu.sn.alumni_backend.evenement.service.EvenementService;
import ept.edu.sn.alumni_backend.fil.CarteFilResponse.TypeCarteFil;
import ept.edu.sn.alumni_backend.mentorat.dto.ProgrammeResponse;
import ept.edu.sn.alumni_backend.mentorat.service.ProgrammeMentoratService;
import ept.edu.sn.alumni_backend.parcours.repository.ExperienceRepository;
import ept.edu.sn.alumni_backend.parcours.repository.OrganismeDuMembre;
import ept.edu.sn.alumni_backend.publication.dto.PublicationResponse;
import ept.edu.sn.alumni_backend.publication.repository.CommentairePublicationRepository;
import ept.edu.sn.alumni_backend.publication.repository.CompteParAuteur;
import ept.edu.sn.alumni_backend.publication.repository.JaimePublicationRepository;
import ept.edu.sn.alumni_backend.publication.service.PublicationService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Fil d'actualité personnalisé. Les candidats (publications récentes, événements à venir, programmes ouverts)
 * sont tous chargés en quelques requêtes groupées, notés par {@link ScoreFil}, puis ordonnés avec une règle
 * de diversité. Aucune donnée n'est stockée : le classement est recalculé à chaque appel.
 */
@Service
@RequiredArgsConstructor
public class FilService {
    static final Duration FENETRE_PUBLICATIONS = Duration.ofDays(30);
    static final Duration FENETRE_INTERACTIONS = Duration.ofDays(90);
    static final int MAX_PUBLICATIONS = 150;
    static final int MAX_EVENEMENTS = 30;
    /** Au-delà de trois publications d'affilée, la carte suivante est un événement ou un programme s'il en reste. */
    static final int PUBLICATIONS_DE_SUITE_MAX = 3;

    private final PublicationService publications;
    private final EvenementService evenements;
    private final ProgrammeMentoratService programmes;
    private final UtilisateurRepository utilisateurs;
    private final ExperienceRepository experiences;
    private final JaimePublicationRepository jaimes;
    private final CommentairePublicationRepository commentaires;

    private record Candidat(CarteFilResponse carte, UUID auteurId, double score) {
        boolean estPublication() { return carte.type() == TypeCarteFil.PUBLICATION; }
    }

    @Transactional(readOnly = true)
    public PageFilResponse lister(UtilisateurPrincipal principal, Instant reference, int page, int taille) {
        Instant maintenant = reference == null ? Instant.now() : reference;
        Utilisateur lecteur = principal.getUtilisateur();

        List<PublicationResponse> recentes = publications.listerRecentes(
            principal, maintenant.minus(FENETRE_PUBLICATIONS), maintenant, MAX_PUBLICATIONS);
        List<EvenementResponse> aVenir = evenements.lister(
            principal, PeriodeEvenement.AVENIR, new FiltresEvenements(null, null, null), 0, MAX_EVENEMENTS).contenu();
        List<ProgrammeResponse> ouverts = programmes.listerOuverts(principal);

        Set<UUID> auteurs = new HashSet<>();
        auteurs.add(lecteur.getId());
        recentes.forEach(p -> auteurs.add(p.auteurId()));
        aVenir.forEach(e -> auteurs.add(e.organisateurId()));
        ouverts.stream().filter(p -> p.responsable() != null).forEach(p -> auteurs.add(p.responsable().id()));
        auteurs.remove(null);

        Map<UUID, ProfilAffinite> profils = profils(auteurs);
        ScoreFil score = new ScoreFil(profils.get(lecteur.getId()), profils,
            interactions(lecteur.getId(), maintenant.minus(FENETRE_INTERACTIONS)), maintenant);

        List<Candidat> candidats = new ArrayList<>();
        for (var p : recentes) {
            var r = score.publication(p);
            candidats.add(new Candidat(new CarteFilResponse(TypeCarteFil.PUBLICATION, p, null, null, r.raison()), p.auteurId(), r.score()));
        }
        for (var e : aVenir) {
            var r = score.evenement(e);
            candidats.add(new Candidat(new CarteFilResponse(TypeCarteFil.EVENEMENT, null, e, null, r.raison()), e.organisateurId(), r.score()));
        }
        for (var p : ouverts) {
            var r = score.programme(p);
            UUID responsable = p.responsable() == null ? null : p.responsable().id();
            candidats.add(new Candidat(new CarteFilResponse(TypeCarteFil.PROGRAMME, null, null, p, r.raison()), responsable, r.score()));
        }

        List<Candidat> ordre = diversifier(candidats);
        int debut = Math.min(page * taille, ordre.size());
        int fin = Math.min(debut + taille, ordre.size());
        List<CarteFilResponse> contenu = ordre.subList(debut, fin).stream().map(Candidat::carte).toList();
        return new PageFilResponse(contenu, page, taille, fin >= ordre.size(), maintenant);
    }

    /**
     * Du meilleur score au plus faible, en évitant deux cartes du même auteur ou deux cartes hors publication
     * à la suite, et en glissant un événement ou un programme après trois publications. O(n²) sur quelques
     * centaines de candidats au plus.
     */
    static List<Candidat> diversifier(Collection<Candidat> candidats) {
        LinkedList<Candidat> reste = new LinkedList<>(candidats);
        reste.sort(Comparator.comparingDouble(Candidat::score).reversed());
        List<Candidat> ordre = new ArrayList<>(reste.size());
        while (!reste.isEmpty()) {
            Candidat precedent = ordre.isEmpty() ? null : ordre.getLast();
            Candidat choisi = null;
            if (publicationsEnFin(ordre) >= PUBLICATIONS_DE_SUITE_MAX) choisi = retirerPremier(reste, c -> !c.estPublication());
            if (choisi == null) choisi = retirerPremier(reste, c -> compatible(precedent, c));
            if (choisi == null) choisi = reste.removeFirst();
            ordre.add(choisi);
        }
        return ordre;
    }

    private static boolean compatible(Candidat precedent, Candidat suivant) {
        if (precedent == null) return true;
        if (!precedent.estPublication() && !suivant.estPublication()) return false;
        return precedent.auteurId() == null || !Objects.equals(precedent.auteurId(), suivant.auteurId());
    }

    private static int publicationsEnFin(List<Candidat> ordre) {
        int n = 0;
        for (int i = ordre.size() - 1; i >= 0 && ordre.get(i).estPublication(); i--) n++;
        return n;
    }

    private static Candidat retirerPremier(LinkedList<Candidat> reste, Predicate<Candidat> critere) {
        for (Iterator<Candidat> it = reste.iterator(); it.hasNext(); ) {
            Candidat c = it.next();
            if (critere.test(c)) { it.remove(); return c; }
        }
        return null;
    }

    /** Profils d'affinité de plusieurs membres en deux requêtes : les comptes, puis les organismes de leur parcours. */
    private Map<UUID, ProfilAffinite> profils(Set<UUID> ids) {
        Map<UUID, Set<UUID>> organismes = new HashMap<>();
        Map<UUID, Set<String>> secteurs = new HashMap<>();
        for (OrganismeDuMembre ligne : experiences.organismesDe(ids)) {
            organismes.computeIfAbsent(ligne.getUtilisateurId(), k -> new HashSet<>()).add(ligne.getOrganismeId());
            if (ligne.getSecteur() != null && !ligne.getSecteur().isBlank()) {
                secteurs.computeIfAbsent(ligne.getUtilisateurId(), k -> new HashSet<>()).add(ScoreFil.normaliser(ligne.getSecteur()));
            }
        }
        Map<UUID, ProfilAffinite> resultat = new HashMap<>();
        for (Utilisateur u : utilisateurs.findAllById(ids)) {
            resultat.put(u.getId(), new ProfilAffinite(u.getId(), u.getAnneeSortie(), vide(u.getFiliere()), vide(u.getVilleResidence()),
                organismes.getOrDefault(u.getId(), Set.of()), secteurs.getOrDefault(u.getId(), Set.of())));
        }
        for (UUID id : ids) resultat.putIfAbsent(id, ProfilAffinite.inconnu(id));
        return resultat;
    }

    /** « J'aime » et commentaires récents du lecteur, additionnés par auteur des publications concernées. */
    private Map<UUID, Long> interactions(UUID lecteurId, Instant depuis) {
        Map<UUID, Long> resultat = new HashMap<>();
        for (CompteParAuteur c : jaimes.parAuteurAimesPar(lecteurId, depuis)) resultat.merge(c.getAuteurId(), c.getNombre(), Long::sum);
        for (CompteParAuteur c : commentaires.parAuteurCommentesPar(lecteurId, depuis)) resultat.merge(c.getAuteurId(), c.getNombre(), Long::sum);
        return resultat;
    }

    private static String vide(String texte) {
        return texte == null || texte.isBlank() ? null : texte.trim();
    }
}
