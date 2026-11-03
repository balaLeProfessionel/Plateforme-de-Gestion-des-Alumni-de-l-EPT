package ept.edu.sn.alumni_backend.fil;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import ept.edu.sn.alumni_backend.evenement.dto.EvenementResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.ProgrammeResponse;
import ept.edu.sn.alumni_backend.publication.TypePublication;
import ept.edu.sn.alumni_backend.publication.dto.PublicationResponse;

/**
 * Score d'une carte du fil pour un lecteur : (1 + affinité + pertinence + engagement) × fraîcheur.
 * Calcul pur, sans accès aux données : tout ce qu'il faut est donné au constructeur.
 * La raison retenue est le signal personnel qui a pesé le plus ; elle est montrée sous la carte.
 */
public final class ScoreFil {
    static final double POINTS_PROMOTION = 3;
    static final double POINTS_FILIERE = 2;
    static final double POINTS_ORGANISME = 2;
    static final double POINTS_SECTEUR = 1;
    static final double POINTS_INTERACTION = 1;
    static final long PLAFOND_INTERACTIONS = 4;
    static final double POINTS_OFFICIEL = 2;
    static final double POINTS_VILLE = 3;
    static final double FRAICHEUR_PROGRAMME = 0.35;

    private final ProfilAffinite lecteur;
    private final Map<UUID, ProfilAffinite> auteurs;
    private final Map<UUID, Long> interactionsParAuteur;
    private final Instant maintenant;

    public ScoreFil(ProfilAffinite lecteur, Map<UUID, ProfilAffinite> auteurs,
            Map<UUID, Long> interactionsParAuteur, Instant maintenant) {
        this.lecteur = lecteur;
        this.auteurs = auteurs;
        this.interactionsParAuteur = interactionsParAuteur;
        this.maintenant = maintenant;
    }

    public record Resultat(double score, String raison) {}

    public Resultat publication(PublicationResponse p) {
        Affinite affinite = affinite(p.auteurId());
        double points = 1 + affinite.points()
            + (p.type() == TypePublication.PUBLICATION ? 0 : POINTS_OFFICIEL)
            + 0.5 * Math.log1p(p.nombreJaime() + 2.0 * p.nombreCommentaires());
        double ageJours = Math.max(0, Duration.between(p.publieLe(), maintenant).toMinutes() / 1440.0);
        return new Resultat(points * Math.pow(1 + ageJours, -1.2), affinite.raison());
    }

    public Resultat evenement(EvenementResponse e) {
        Affinite affinite = affinite(e.organisateurId());
        boolean pres = lecteur.ville() != null && e.lieu() != null
            && normaliser(e.lieu()).contains(normaliser(lecteur.ville()));
        double points = 1 + affinite.points() + (e.officielEpt() ? POINTS_OFFICIEL : 0) + (pres ? POINTS_VILLE : 0);
        double joursAvant = Math.max(0, Duration.between(maintenant, e.dateDebut()).toHours() / 24.0);
        double fraicheur = 1 / (1 + joursAvant / 7);
        // Déjà répondu : l'événement reste visible, mais cède la place à ce qui est nouveau.
        if (e.maReponse() != null) fraicheur *= 0.4;
        String raison = pres ? "Près de chez vous, à " + lecteur.ville() : affinite.raison();
        return new Resultat(points * fraicheur, raison);
    }

    public Resultat programme(ProgrammeResponse p) {
        Affinite affinite = affinite(p.responsable() == null ? null : p.responsable().id());
        LocalDate aujourdhui = LocalDate.ofInstant(maintenant, ZoneOffset.UTC);
        boolean bientotFini = p.dateFin() != null && !p.dateFin().isAfter(aujourdhui.plusDays(14));
        double points = 1 + affinite.points() + (bientotFini ? 1 : 0);
        double fraicheur = FRAICHEUR_PROGRAMME * (p.jeParticipe() ? 0.3 : 1);
        return new Resultat(points * fraicheur, affinite.raison());
    }

    private record Affinite(double points, String raison) {}

    /** Points d'affinité avec un auteur ; ses propres contenus n'en ont pas. */
    private Affinite affinite(UUID auteurId) {
        if (auteurId == null || auteurId.equals(lecteur.id())) return new Affinite(0, null);
        ProfilAffinite auteur = auteurs.getOrDefault(auteurId, ProfilAffinite.inconnu(auteurId));
        double points = 0;
        double meilleur = 0;
        String raison = null;

        if (lecteur.promotion() != null && Objects.equals(lecteur.promotion(), auteur.promotion())) {
            points += POINTS_PROMOTION;
            meilleur = POINTS_PROMOTION;
            raison = "De votre promotion " + lecteur.promotion();
        }
        if (lecteur.filiere() != null && auteur.filiere() != null
                && normaliser(lecteur.filiere()).equals(normaliser(auteur.filiere()))) {
            points += POINTS_FILIERE;
            if (POINTS_FILIERE > meilleur) { meilleur = POINTS_FILIERE; raison = "De votre filière " + lecteur.filiere(); }
        }
        if (auteur.organismes().stream().anyMatch(lecteur.organismes()::contains)) {
            points += POINTS_ORGANISME;
            if (POINTS_ORGANISME > meilleur) { meilleur = POINTS_ORGANISME; raison = "Passé par le même organisme que vous"; }
        } else if (auteur.secteurs().stream().anyMatch(lecteur.secteurs()::contains)) {
            points += POINTS_SECTEUR;
            if (POINTS_SECTEUR > meilleur) { meilleur = POINTS_SECTEUR; raison = "De votre secteur d'activité"; }
        }
        long interactions = Math.min(PLAFOND_INTERACTIONS, interactionsParAuteur.getOrDefault(auteurId, 0L));
        if (interactions > 0) {
            double pointsInteractions = interactions * POINTS_INTERACTION;
            points += pointsInteractions;
            if (interactions >= 2 && pointsInteractions > meilleur) raison = "Vous réagissez souvent à ses publications";
        }
        return new Affinite(points, raison);
    }

    static String normaliser(String texte) {
        return java.text.Normalizer.normalize(texte.trim(), java.text.Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
    }
}
