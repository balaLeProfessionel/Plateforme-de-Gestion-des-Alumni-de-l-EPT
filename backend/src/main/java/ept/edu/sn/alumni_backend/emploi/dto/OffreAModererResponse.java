package ept.edu.sn.alumni_backend.emploi.dto;

import ept.edu.sn.alumni_backend.emploi.MotifSignalementOffre;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Offre vue par l'administration des offres (#224), avec les signalements qui attendent une décision. */
public record OffreAModererResponse(OffreEmploiResponse offre, List<Signalement> signalements) {

    /** Signalement d'un membre ; son nom aide à juger un signalement abusif. */
    public record Signalement(UUID id, MotifSignalementOffre motif, String commentaire, Instant creeLe, String auteur) {
    }
}
