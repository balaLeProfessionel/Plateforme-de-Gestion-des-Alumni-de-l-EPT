package ept.edu.sn.alumni_backend.partenariat.service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.partenariat.OrigineConvention;
import ept.edu.sn.alumni_backend.partenariat.StatutAccord;
import ept.edu.sn.alumni_backend.partenariat.StatutConvention;
import ept.edu.sn.alumni_backend.partenariat.TypeAccord;
import ept.edu.sn.alumni_backend.partenariat.dto.MonPartenariatResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.TableauPartenariatsResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.TableauPartenariatsResponse.Annee;
import ept.edu.sn.alumni_backend.partenariat.dto.TableauPartenariatsResponse.Chiffres;
import ept.edu.sn.alumni_backend.partenariat.dto.TableauPartenariatsResponse.ElementATraiter;
import ept.edu.sn.alumni_backend.partenariat.dto.TableauPartenariatsResponse.Repartition;
import ept.edu.sn.alumni_backend.partenariat.repository.AccordCollaborationRepository;
import ept.edu.sn.alumni_backend.partenariat.repository.ConventionPartenariatRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

/**
 * Indicateurs des partenariats : le tableau de bord des Relations extérieures et le résumé d'un organisme. Les années
 * sont civiles (signature d'une convention, acceptation d'un accord) ; les cinq dernières, l'année en cours comprise.
 */
@Service
@RequiredArgsConstructor
public class TableauPartenariatsService {
    static final int ANNEES = 5;
    private static final EnumSet<StatutAccord> EN_VIGUEUR = EnumSet.of(StatutAccord.A_VENIR, StatutAccord.ACTIF);

    private final ConventionPartenariatRepository conventionRepository;
    private final AccordCollaborationRepository accordRepository;

    @Transactional(readOnly = true)
    public TableauPartenariatsResponse tableau() {
        LocalDate jour = ConventionsPartenariatService.aujourdhui();
        LocalDate limite = jour.plusDays(ConventionsPartenariatService.JOURS_ALERTE);
        Map<String, Long> parStatut = conventionRepository.compterParStatut().stream()
            .collect(Collectors.toMap(ConventionPartenariatRepository.Comptage::getCle, ConventionPartenariatRepository.Comptage::getNombre));
        long demandes = StatutConvention.EN_COURS.stream().mapToLong(s -> parStatut.getOrDefault(s.name(), 0L)).sum();
        long resiliations = conventionRepository.countByStatutAndDateEffetResiliationIsNotNull(StatutConvention.ACTIVE)
            + accordRepository.countByStatutInAndDateEffetResiliationIsNotNull(EN_VIGUEUR);
        Chiffres chiffres = new Chiffres(
            conventionRepository.compterPartenaires(),
            parStatut.getOrDefault(StatutConvention.ACTIVE.name(), 0L),
            demandes,
            parStatut.getOrDefault(StatutConvention.EXPIREE.name(), 0L),
            parStatut.getOrDefault(StatutConvention.RESILIEE.name(), 0L),
            accordRepository.countByTypeAndStatut(TypeAccord.STAGE, StatutAccord.ACTIF),
            accordRepository.countByTypeAndStatut(TypeAccord.MOBILITE, StatutAccord.ACTIF),
            accordRepository.countByStatut(StatutAccord.A_VENIR),
            accordRepository.countByStatutAndProposePar(StatutAccord.PROPOSE, OrigineConvention.ORGANISME),
            conventionRepository.countByStatutAndDateFinLessThanEqualAndDateEffetResiliationIsNull(StatutConvention.ACTIVE, limite),
            resiliations);
        List<Repartition> parType = conventionRepository.partenairesParType().stream()
            .map(c -> new Repartition(c.getCle(), c.getNombre()))
            .sorted(Comparator.comparingLong(Repartition::nombre).reversed()).toList();
        return new TableauPartenariatsResponse(chiffres, aTraiter(limite), parType, parAnnee(jour.getYear()));
    }

    /** Résumé de l'organisme connecté (rôle ORGANISME exigé par SecurityConfig). */
    @Transactional(readOnly = true)
    public MonPartenariatResponse monPartenariat(UtilisateurPrincipal principal) {
        Utilisateur utilisateur = principal.getUtilisateur();
        if (utilisateur.getRole() != TypeRole.ORGANISME || utilisateur.getOrganisme() == null) {
            throw new SecurityException("Seul un organisme suit son partenariat avec l'EPT.");
        }
        Organisme organisme = utilisateur.getOrganisme();
        LocalDate jour = ConventionsPartenariatService.aujourdhui();
        List<MonPartenariatResponse.ConventionActive> actives = conventionRepository
            .findByOrganisme_IdAndStatutOrderByDateFinAsc(organisme.getId(), StatutConvention.ACTIVE).stream()
            .map(c -> new MonPartenariatResponse.ConventionActive(c.getId(), c.getObjet(), c.getDateFin(),
                ChronoUnit.DAYS.between(jour, c.getDateFin()), c.getDateEffetResiliation()))
            .toList();
        return new MonPartenariatResponse(!actives.isEmpty(), actives,
            accordRepository.countByOrganisme_IdAndTypeAndStatut(organisme.getId(), TypeAccord.STAGE, StatutAccord.ACTIF),
            accordRepository.countByOrganisme_IdAndTypeAndStatut(organisme.getId(), TypeAccord.MOBILITE, StatutAccord.ACTIF),
            accordRepository.countByOrganisme_IdAndStatut(organisme.getId(), StatutAccord.A_VENIR),
            accordRepository.countByOrganisme_IdAndStatutAndProposePar(organisme.getId(), StatutAccord.PROPOSE, OrigineConvention.ECOLE));
    }

    /** Six au plus par motif, les plus anciens ou les plus proches de leur échéance d'abord. */
    private List<ElementATraiter> aTraiter(LocalDate limite) {
        List<ElementATraiter> elements = new ArrayList<>();
        conventionRepository.findTop6ByStatutInOrderByCreeeLeAsc(StatutConvention.EN_COURS).forEach(c -> elements.add(new ElementATraiter(
            "CONVENTION", c.getId(), c.getOrganisme().getNom(), c.getObjet(), "DEMANDE_" + c.getStatut().name(),
            c.getCreeeLe().atZone(ConventionsPartenariatService.THIES).toLocalDate(), "/admin/partenariats/conventions/" + c.getId())));
        accordRepository.findTop6ByStatutAndProposeParOrderByCreeLeAsc(StatutAccord.PROPOSE, OrigineConvention.ORGANISME).forEach(a -> elements.add(
            new ElementATraiter("ACCORD", a.getId(), a.getOrganisme().getNom(), a.getObjet(), "PROPOSITION",
                a.getCreeLe().atZone(ConventionsPartenariatService.THIES).toLocalDate(), "/admin/partenariats/accords/" + a.getId())));
        conventionRepository.findTop6ByStatutAndDateFinLessThanEqualAndDateEffetResiliationIsNullOrderByDateFinAsc(StatutConvention.ACTIVE, limite)
            .forEach(c -> elements.add(new ElementATraiter("CONVENTION", c.getId(), c.getOrganisme().getNom(), c.getObjet(), "EXPIRATION",
                c.getDateFin(), "/admin/partenariats/conventions/" + c.getId())));
        conventionRepository.findTop6ByStatutAndDateEffetResiliationIsNotNullOrderByDateEffetResiliationAsc(StatutConvention.ACTIVE)
            .forEach(c -> elements.add(new ElementATraiter("CONVENTION", c.getId(), c.getOrganisme().getNom(), c.getObjet(), "RESILIATION",
                c.getDateEffetResiliation(), "/admin/partenariats/conventions/" + c.getId())));
        accordRepository.findTop6ByStatutInAndDateEffetResiliationIsNotNullOrderByDateEffetResiliationAsc(EN_VIGUEUR)
            .forEach(a -> elements.add(new ElementATraiter("ACCORD", a.getId(), a.getOrganisme().getNom(), a.getObjet(), "RESILIATION",
                a.getDateEffetResiliation(), "/admin/partenariats/accords/" + a.getId())));
        return elements;
    }

    /** Les cinq dernières années civiles, de la plus ancienne à l'année en cours, à zéro quand rien ne s'est passé. */
    private List<Annee> parAnnee(int anneeCourante) {
        int premiere = anneeCourante - ANNEES + 1;
        LocalDate debut = LocalDate.of(premiere, 1, 1);
        Map<Integer, Long> signees = conventionRepository.signeesParAnnee(debut).stream()
            .collect(Collectors.toMap(ConventionPartenariatRepository.ComptageAnnee::getAnnee, ConventionPartenariatRepository.ComptageAnnee::getNombre));
        Map<String, Long> acceptes = new HashMap<>();
        accordRepository.acceptesParAnnee(debut.atStartOfDay(ZoneOffset.UTC).toInstant())
            .forEach(c -> acceptes.put(c.getAnnee() + ":" + c.getType(), c.getNombre()));
        return IntStream.rangeClosed(premiere, anneeCourante).mapToObj(a -> new Annee(a, signees.getOrDefault(a, 0L),
            acceptes.getOrDefault(a + ":" + TypeAccord.STAGE, 0L), acceptes.getOrDefault(a + ":" + TypeAccord.MOBILITE, 0L))).toList();
    }
}
