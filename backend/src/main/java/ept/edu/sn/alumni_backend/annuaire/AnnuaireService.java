package ept.edu.sn.alumni_backend.annuaire;

import java.util.Locale;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.annuaire.dto.AnnuaireMembreResponse;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.utilisateur.MembreVisibilite;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnnuaireService {
    private final UtilisateurRepository utilisateurRepository;
    private final AnnuaireMapper annuaireMapper;

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
        if (role != null && !MembreVisibilite.ROLES_VISIBLES.contains(role)) {
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
                cb.like(
                    cb.lower(cb.concat(cb.concat(racine.get("prenom"), " "), racine.get("nom"))),
                    motif
                )
            ));
        }

        Sort sort = tri == AnnuaireTri.PROMOTION_DESC
            ? Sort.by(Sort.Order.desc("anneeSortie").nullsLast(), Sort.Order.asc("nom"))
            : Sort.by(Sort.Order.asc("nom"), Sort.Order.asc("prenom"));
        PageRequest pagination = PageRequest.of(page, taille, sort);

        return PageResponse.depuis(
            utilisateurRepository.findAll(specification, pagination).map(annuaireMapper::versResponse)
        );
    }

    private boolean aDuTexte(String valeur) {
        return valeur != null && !valeur.isBlank();
    }

    private String normaliser(String valeur) {
        return valeur.trim().toLowerCase(Locale.ROOT);
    }
}
