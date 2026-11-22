package ept.edu.sn.alumni_backend.stage.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.StatutCandidature;
import ept.edu.sn.alumni_backend.stage.StatutOffre;
import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.dto.IndicateursOrganismeResponse;
import ept.edu.sn.alumni_backend.stage.dto.IndicateursOrganismeResponse.ParAnnee;
import ept.edu.sn.alumni_backend.stage.dto.IndicateursOrganismeResponse.Repartition;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
import lombok.RequiredArgsConstructor;

/**
 * Indicateurs d'un organisme avec l'école (STA-13), réservés aux comptes organisme rattachés. Sans table propre :
 * quelques requêtes groupées sur les offres publiées (publiées, liste publiée ou retirées après publication), les
 * candidatures envoyées (pas les retirées) et les stages confirmés.
 */
@Service
@RequiredArgsConstructor
public class IndicateursOrganismeService {
    private static final List<StatutOffre> OFFRES_PUBLIEES = List.of(StatutOffre.PUBLIEE, StatutOffre.LISTE_PUBLIEE, StatutOffre.RETIREE);

    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public IndicateursOrganismeResponse pour(UtilisateurPrincipal principal) {
        var moi = principal.getUtilisateur();
        if (moi.getRole() != TypeRole.ORGANISME || moi.getOrganisme() == null) {
            throw new SecurityException("Ces indicateurs sont réservés aux organismes d'accueil.");
        }
        UUID organisme = moi.getOrganisme().getId();

        Map<Integer, long[]> annees = new TreeMap<>(Comparator.reverseOrder());
        tuples("""
            select extract(year from o.publieeLe), count(o) from OffreStage o
            where o.organisme.id = :organisme and o.statut in :statuts and o.publieeLe is not null
            group by extract(year from o.publieeLe)
            """, organisme).forEach(t -> annees.computeIfAbsent(annee(t), a -> new long[2])[0] = nombre(t));
        tuples("""
            select extract(year from c.offre.publieeLe), count(c) from Candidature c
            where c.offre.organisme.id = :organisme and c.offre.statut in :statuts and c.offre.publieeLe is not null
              and c.statut = :envoyee
            group by extract(year from c.offre.publieeLe)
            """, organisme).forEach(t -> annees.computeIfAbsent(annee(t), a -> new long[2])[1] = nombre(t));
        List<ParAnnee> parAnnee = new ArrayList<>();
        annees.forEach((annee, n) -> parAnnee.add(new ParAnnee(annee, n[0], n[1])));

        List<Repartition> parType = tuples("""
            select s.typeStage, count(s) from Stage s where s.organisme.id = :organisme and s.statut = :confirme
            group by s.typeStage
            """, organisme).stream().map(t -> new Repartition(t.get(0).toString(), nombre(t)))
            .sorted(Comparator.comparingLong(Repartition::nombre).reversed()).toList();
        List<Repartition> parFiliere = tuples("""
            select f.nom, count(s) from Stage s left join s.etudiant.filiere f
            where s.organisme.id = :organisme and s.statut = :confirme
            group by f.nom
            """, organisme).stream().map(t -> new Repartition(t.get(0) == null ? "Filière non renseignée" : (String) t.get(0), nombre(t)))
            .sorted(Comparator.comparingLong(Repartition::nombre).reversed()).toList();

        return new IndicateursOrganismeResponse(
            parAnnee.stream().mapToLong(ParAnnee::offres).sum(),
            parAnnee.stream().mapToLong(ParAnnee::candidatures).sum(),
            parType.stream().mapToLong(Repartition::nombre).sum(),
            parAnnee, parType, parFiliere);
    }

    private List<Tuple> tuples(String jpql, UUID organisme) {
        var requete = entityManager.createQuery(jpql, Tuple.class).setParameter("organisme", organisme);
        if (jpql.contains(":statuts")) requete.setParameter("statuts", OFFRES_PUBLIEES);
        if (jpql.contains(":envoyee")) requete.setParameter("envoyee", StatutCandidature.ENVOYEE);
        if (jpql.contains(":confirme")) requete.setParameter("confirme", StatutStage.CONFIRME);
        return requete.getResultList();
    }

    private static int annee(Tuple t) {
        return ((Number) t.get(0)).intValue();
    }

    private static long nombre(Tuple t) {
        return ((Number) t.get(1)).longValue();
    }
}
