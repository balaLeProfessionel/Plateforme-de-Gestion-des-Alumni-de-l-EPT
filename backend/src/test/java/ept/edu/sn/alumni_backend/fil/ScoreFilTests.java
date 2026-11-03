package ept.edu.sn.alumni_backend.fil;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.evenement.AudienceEvenement;
import ept.edu.sn.alumni_backend.evenement.ReponseParticipation;
import ept.edu.sn.alumni_backend.evenement.StatutEvenement;
import ept.edu.sn.alumni_backend.evenement.dto.EvenementResponse;
import ept.edu.sn.alumni_backend.publication.AudiencePublication;
import ept.edu.sn.alumni_backend.publication.TypePublication;
import ept.edu.sn.alumni_backend.publication.dto.PublicationResponse;

class ScoreFilTests {
    private static final Instant MAINTENANT = Instant.parse("2026-11-03T12:00:00Z");
    private static final UUID MOI = UUID.randomUUID();
    private static final UUID CAMARADE = UUID.randomUUID();
    private static final UUID INCONNU = UUID.randomUUID();
    private static final UUID COLLEGUE = UUID.randomUUID();
    private static final UUID ORGANISME = UUID.randomUUID();

    private final ProfilAffinite moi = new ProfilAffinite(MOI, 2020, "Génie informatique", "Dakar", Set.of(ORGANISME), Set.of("telecoms"));
    private final Map<UUID, ProfilAffinite> auteurs = Map.of(
        CAMARADE, new ProfilAffinite(CAMARADE, 2020, "genie informatique", "Thiès", Set.of(), Set.of()),
        INCONNU, new ProfilAffinite(INCONNU, 2012, "Génie civil", "Thiès", Set.of(), Set.of()),
        COLLEGUE, new ProfilAffinite(COLLEGUE, 2015, "Génie civil", null, Set.of(ORGANISME), Set.of()));
    private final ScoreFil score = new ScoreFil(moi, auteurs, Map.of(), MAINTENANT);

    @Test
    void uneCamaradeDePromotionPasseDevantUnInconnuEtLaRaisonLeDit() {
        var camarade = score.publication(publication(CAMARADE, Duration.ofHours(5), 0, 0));
        var inconnu = score.publication(publication(INCONNU, Duration.ofHours(5), 0, 0));
        assertThat(camarade.score()).isGreaterThan(inconnu.score());
        // Promotion (3 points) l'emporte sur la filière (2) pour la raison affichée ; la filière ignore accents et casse.
        assertThat(camarade.raison()).isEqualTo("De votre promotion 2020");
        assertThat(inconnu.raison()).isNull();
        assertThat(score.publication(publication(COLLEGUE, Duration.ofHours(5), 0, 0)).raison())
            .isEqualTo("Passé par le même organisme que vous");
    }

    @Test
    void uneVieillePublicationCedeLaPlaceMemeTresProche() {
        var ancienne = score.publication(publication(CAMARADE, Duration.ofDays(10), 3, 1));
        var recente = score.publication(publication(INCONNU, Duration.ofHours(1), 0, 0));
        assertThat(recente.score()).isGreaterThan(ancienne.score());
    }

    @Test
    void lesReactionsComptentMaisPeu() {
        var populaire = score.publication(publication(INCONNU, Duration.ofHours(5), 20, 5));
        var calme = score.publication(publication(INCONNU, Duration.ofHours(5), 0, 0));
        var camarade = score.publication(publication(CAMARADE, Duration.ofHours(5), 0, 0));
        assertThat(populaire.score()).isGreaterThan(calme.score()).isLessThan(camarade.score());
    }

    @Test
    void sesPropresPublicationsNOntPasDAffinite() {
        assertThat(score.publication(publication(MOI, Duration.ofHours(1), 0, 0)).raison()).isNull();
    }

    @Test
    void lesInteractionsRecentesRapprochentDeLAuteur() {
        var suivi = new ScoreFil(moi, auteurs, Map.of(INCONNU, 9L), MAINTENANT);
        var resultat = suivi.publication(publication(INCONNU, Duration.ofHours(5), 0, 0));
        assertThat(resultat.score()).isGreaterThan(score.publication(publication(INCONNU, Duration.ofHours(5), 0, 0)).score());
        assertThat(resultat.raison()).isEqualTo("Vous réagissez souvent à ses publications");
    }

    @Test
    void unEvenementDansSaVilleEtProcheRemonteEtUneReponseLeFaitDescendre() {
        var dakar = score.evenement(evenement("Campus de Dakar", Duration.ofDays(2), null));
        var thies = score.evenement(evenement("Thiès", Duration.ofDays(2), null));
        var lointain = score.evenement(evenement("Thiès", Duration.ofDays(40), null));
        var repondu = score.evenement(evenement("Thiès", Duration.ofDays(2), ReponseParticipation.PARTICIPERA));
        assertThat(dakar.score()).isGreaterThan(thies.score());
        assertThat(dakar.raison()).isEqualTo("Près de chez vous, à Dakar");
        assertThat(thies.score()).isGreaterThan(lointain.score()).isGreaterThan(repondu.score());
    }

    private static PublicationResponse publication(UUID auteur, Duration age, long jaimes, long commentaires) {
        return new PublicationResponse(UUID.randomUUID(), TypePublication.PUBLICATION, null, "Texte", AudiencePublication.TOUS,
            null, null, null, MAINTENANT.minus(age), null, auteur, "Nom", "Prénom", TypeRole.ALUMNI, null,
            jaimes, false, commentaires, null);
    }

    private static EvenementResponse evenement(String lieu, Duration dans, ReponseParticipation reponse) {
        return new EvenementResponse(UUID.randomUUID(), "Rencontre", "Description", lieu, null, MAINTENANT.plus(dans),
            null, AudienceEvenement.TOUS, null, false, StatutEvenement.PUBLIE, INCONNU, "Nom", "Prénom", 0, reponse);
    }
}
