package ept.edu.sn.alumni_backend.annuaire;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Root;

import ept.edu.sn.alumni_backend.mentorat.ParticipationMentorat;
import ept.edu.sn.alumni_backend.annuaire.dto.AnnuaireMembreResponse;
import ept.edu.sn.alumni_backend.annuaire.dto.DiplomePublicResponse;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.mentorat.StatutMentor;
import ept.edu.sn.alumni_backend.mentorat.service.ProfilMentorService;
import ept.edu.sn.alumni_backend.utilisateur.MembreVisibilite;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnnuaireService {
    private static final int LETTRES_MIN_RECHERCHE_PUBLIQUE = 3;
    private static final int RESULTATS_MAX_RECHERCHE_PUBLIQUE = 10;
    private static final char ECHAPPEMENT = '\\';

    private final UtilisateurRepository utilisateurRepository;
    private final AnnuaireMapper annuaireMapper;
    private final ProfilMentorService profilMentorService;

    @Transactional(readOnly = true)
    public PageResponse<AnnuaireMembreResponse> rechercher(
            String recherche,
            TypeRole role,
            String filiere,
            Integer promotion,
            String ville,
            int page,
            int taille,
            AnnuaireTri tri) {
        if (role != null && !MembreVisibilite.ROLES_ANNUAIRE.contains(role)) {
            throw new IllegalArgumentException("Ce rôle n'est pas disponible dans l'annuaire");
        }

        Specification<Utilisateur> specification = MembreVisibilite.visibleDansAnnuaire();
        if (role != null) {
            specification = specification.and((racine, requete, cb) -> cb.equal(racine.get("role"), role));
        }
        if (promotion != null) {
            specification = specification.and(
                (racine, requete, cb) -> cb.equal(racine.get("anneeSortie"), promotion)
            );
        }
        if (aDuTexte(filiere)) {
            String valeur = normaliser(filiere);
            specification = specification.and((racine, requete, cb) ->
                cb.equal(cb.lower(racine.get("filiere")), valeur)
            );
        }
        if (aDuTexte(ville)) {
            String motif = "%" + normaliser(ville) + "%";
            specification = specification.and((racine, requete, cb) ->
                cb.like(cb.lower(racine.get("villeResidence")), motif)
            );
        }
        if (aDuTexte(recherche)) {
            String motif = "%" + normaliser(recherche) + "%";
            specification = specification.and((racine, requete, cb) -> cb.or(
                cb.like(cb.lower(racine.get("nom")), motif),
                cb.like(cb.lower(racine.get("prenom")), motif),
                cb.like(cb.lower(racine.join("organisme", jakarta.persistence.criteria.JoinType.LEFT).get("nom")), motif),
                cb.like(
                    cb.lower(cb.concat(cb.concat(racine.get("prenom"), " "), racine.get("nom"))),
                    motif
                )
            ));
        }

        Sort sort = switch (tri) {
            case PROMOTION_DESC -> Sort.by(Sort.Order.desc("anneeSortie").nullsLast(), Sort.Order.asc("nom"));
            case ALPHABETIQUE -> Sort.by(Sort.Order.asc("nom"), Sort.Order.asc("prenom"));
            // Tri par expression : posé dans la requête elle-même (Sort ne sait trier que sur des attributs).
            case PROFILS_COMPLETS -> Sort.unsorted();
        };
        if (tri == AnnuaireTri.PROFILS_COMPLETS) {
            specification = specification.and((racine, requete, cb) -> {
                // Pas d'ORDER BY dans la requête de comptage de la pagination.
                if (requete.getResultType() != Long.class && requete.getResultType() != long.class) {
                    requete.orderBy(cb.desc(scoreCompletude(racine, cb)), cb.asc(racine.get("nom")), cb.asc(racine.get("prenom")));
                }
                return null;
            });
        }
        PageRequest pagination = PageRequest.of(page, taille, sort);

        Page<Utilisateur> membres = utilisateurRepository.findAll(specification, pagination);
        Map<UUID, StatutMentor> mentors = profilMentorService.statutsMentors(
            membres.stream().filter(m -> ParticipationMentorat.autorise(m.getRole())).map(Utilisateur::getId).toList());
        return PageResponse.depuis(
            membres.map(membre -> annuaireMapper.versResponse(membre, mentors.get(membre.getId())))
        );
    }

    /** Un point par information utile dans l'annuaire : photo, poste, ville, filière et présentation. */
    private static Expression<Integer> scoreCompletude(Root<Utilisateur> racine, CriteriaBuilder cb) {
        Expression<Integer> score = cb.literal(0);
        for (String champ : List.of("urlPhoto", "posteActuel", "villeResidence", "filiere", "bio")) {
            Expression<String> valeur = racine.get(champ);
            score = cb.sum(score, cb.<Integer>selectCase()
                .when(cb.greaterThan(cb.length(cb.trim(cb.coalesce(valeur, ""))), 0), 1)
                .otherwise(0));
        }
        return score;
    }

    /** Sans compte : au moins 3 lettres et peu de résultats, pour qu'on ne puisse pas lister l'annuaire. */
    @Transactional(readOnly = true)
    public List<DiplomePublicResponse> rechercherPublic(String recherche) {
        String valeur = normaliser(recherche);
        if (valeur.codePoints().filter(Character::isLetter).count() < LETTRES_MIN_RECHERCHE_PUBLIQUE) {
            throw new IllegalArgumentException("Saisissez au moins " + LETTRES_MIN_RECHERCHE_PUBLIQUE + " lettres");
        }

        String motif = "%" + echapperMotif(valeur) + "%";
        Specification<Utilisateur> specification = MembreVisibilite.trouvableSansCompte()
            .and((racine, requete, cb) -> cb.or(
                cb.like(cb.lower(racine.get("nom")), motif, ECHAPPEMENT),
                cb.like(cb.lower(racine.get("prenom")), motif, ECHAPPEMENT),
                cb.like(cb.lower(cb.concat(cb.concat(racine.get("prenom"), " "), racine.get("nom"))), motif, ECHAPPEMENT)
            ));
        PageRequest pagination = PageRequest.of(
            0, RESULTATS_MAX_RECHERCHE_PUBLIQUE, Sort.by(Sort.Order.asc("nom"), Sort.Order.asc("prenom")));

        return utilisateurRepository.findAll(specification, pagination).stream()
            .map(membre -> new DiplomePublicResponse(
                membre.getPrenom(), membre.getNom(), membre.getAnneeSortie(), membre.getFiliere()))
            .toList();
    }

    /** Sans cela, « %%% » passerait la limite de longueur et renverrait n'importe quel diplômé. */
    private String echapperMotif(String valeur) {
        return valeur.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private boolean aDuTexte(String valeur) {
        return valeur != null && !valeur.isBlank();
    }

    private String normaliser(String valeur) {
        return valeur.trim().toLowerCase(Locale.ROOT);
    }
}
