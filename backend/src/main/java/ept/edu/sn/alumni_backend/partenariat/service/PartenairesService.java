package ept.edu.sn.alumni_backend.partenariat.service;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.enums.TypeOrganisme;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.exception.OrganismeIntrouvableException;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.partenariat.ActionConvention;
import ept.edu.sn.alumni_backend.partenariat.StatutConvention;
import ept.edu.sn.alumni_backend.partenariat.TypeAccord;
import ept.edu.sn.alumni_backend.partenariat.dto.PartenaireResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.PartenariatPublicResponse;
import ept.edu.sn.alumni_backend.partenariat.entity.ConventionPartenariat;
import ept.edu.sn.alumni_backend.partenariat.repository.AccordCollaborationRepository;
import ept.edu.sn.alumni_backend.partenariat.repository.ConventionPartenariatRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;

/**
 * Les organismes partenaires vus par les membres (étudiants, alumni, personnel) : ceux qui ont une convention-cadre
 * active et que les Relations extérieures n'ont pas masqués. Rien de privé n'en sort (échéances, motifs, documents).
 */
@Service
@RequiredArgsConstructor
public class PartenairesService {
    private final ConventionPartenariatRepository conventionRepository;
    private final AccordCollaborationRepository accordRepository;
    private final OrganismeRepository organismeRepository;
    private final ConventionsPartenariatService conventionsService;

    @Transactional(readOnly = true)
    public PageResponse<PartenaireResponse> lister(String recherche, TypeOrganisme type, String secteur, int page, int taille) {
        Specification<Organisme> filtre = (r, q, cb) -> {
            Subquery<Integer> active = q.subquery(Integer.class);
            Root<ConventionPartenariat> c = active.from(ConventionPartenariat.class);
            active.select(cb.literal(1)).where(cb.equal(c.get("organisme"), r), cb.equal(c.get("statut"), StatutConvention.ACTIVE));
            return cb.and(cb.isFalse(r.get("partenaireMasque")), cb.exists(active));
        };
        if (recherche != null && !recherche.isBlank()) {
            String motif = "%" + recherche.strip().toLowerCase(Locale.ROOT) + "%";
            filtre = filtre.and((r, q, cb) -> cb.like(cb.lower(r.get("nom")), motif));
        }
        if (type != null) filtre = filtre.and((r, q, cb) -> cb.equal(r.get("typeOrganisme"), type));
        if (secteur != null && !secteur.isBlank()) {
            String exact = secteur.strip().toLowerCase(Locale.ROOT);
            filtre = filtre.and((r, q, cb) -> cb.equal(cb.lower(r.get("secteurActivite")), exact));
        }
        Page<Organisme> organismes = organismeRepository.findAll(filtre, PageRequest.of(page, taille, Sort.by("nom")));
        Set<UUID> ids = organismes.getContent().stream().map(Organisme::getId).collect(Collectors.toSet());
        Map<UUID, java.time.LocalDate> debuts = ids.isEmpty() ? Map.of() : conventionRepository.debutsPartenariat(ids).stream()
            .collect(Collectors.toMap(ConventionPartenariatRepository.DebutPartenariat::getOrganismeId,
                ConventionPartenariatRepository.DebutPartenariat::getDepuis));
        Map<UUID, Set<TypeAccord>> types = new HashMap<>();
        if (!ids.isEmpty()) {
            accordRepository.typesEnVigueur(ids).forEach(t -> types.computeIfAbsent(t.getOrganismeId(), k -> new java.util.HashSet<>()).add(t.getType()));
        }
        return PageResponse.depuis(organismes.map(o -> {
            Set<TypeAccord> enVigueur = types.getOrDefault(o.getId(), Set.of());
            return new PartenaireResponse(o.getId(), o.getNom(), o.getLogoUrl(), o.getTypeOrganisme() == null ? null : o.getTypeOrganisme().name(),
                o.getSecteurActivite(), o.getPays(), o.getSiteWeb(), debuts.get(o.getId()),
                enVigueur.contains(TypeAccord.STAGE), enVigueur.contains(TypeAccord.MOBILITE));
        }));
    }

    @Transactional(readOnly = true)
    public List<String> secteurs() {
        return conventionRepository.secteursDesPartenaires();
    }

    /** Le partenariat d'un organisme visible ; vide s'il n'est pas partenaire ou s'il est masqué. */
    @Transactional(readOnly = true)
    public Optional<PartenariatPublicResponse> partenariat(UUID organismeId) {
        Organisme organisme = organismeRepository.findById(organismeId).orElseThrow(OrganismeIntrouvableException::new);
        if (organisme.isPartenaireMasque()) return Optional.empty();
        List<ConventionPartenariat> actives = conventionRepository.findByOrganisme_IdAndStatutOrderByDateFinAsc(organismeId, StatutConvention.ACTIVE);
        if (actives.isEmpty()) return Optional.empty();
        java.time.LocalDate depuis = actives.stream().map(ConventionPartenariat::getDateDebut).filter(Objects::nonNull)
            .min(java.time.LocalDate::compareTo).orElse(null);
        List<String> domaines = actives.stream().map(ConventionPartenariat::getDomaines).filter(Objects::nonNull)
            .flatMap(d -> java.util.Arrays.stream(d.split("[,;]"))).map(String::strip).filter(d -> !d.isEmpty()).distinct().toList();
        Set<TypeAccord> enVigueur = accordRepository.typesEnVigueur(Set.of(organismeId)).stream()
            .map(AccordCollaborationRepository.TypeEnVigueur::getType).collect(Collectors.toSet());
        return Optional.of(new PartenariatPublicResponse(depuis, domaines, enVigueur.contains(TypeAccord.STAGE), enVigueur.contains(TypeAccord.MOBILITE)));
    }

    /**
     * Les Relations extérieures montrent ou masquent un organisme dans la liste des partenaires. Le changement est consigné
     * dans l'historique de ses conventions actives.
     */
    @Transactional
    public boolean changerVisibilite(UUID organismeId, boolean visible, UtilisateurPrincipal principal) {
        Organisme organisme = organismeRepository.findByIdForUpdate(organismeId).orElseThrow(OrganismeIntrouvableException::new);
        if (organisme.isPartenaireMasque() == !visible) return visible;
        organisme.setPartenaireMasque(!visible);
        conventionRepository.findByOrganisme_IdAndStatutOrderByDateFinAsc(organismeId, StatutConvention.ACTIVE).forEach(c ->
            conventionsService.consigner(c, ActionConvention.VISIBILITE, visible ? "visible des membres" : "masqué des membres", null, principal.getUtilisateur()));
        return visible;
    }
}
