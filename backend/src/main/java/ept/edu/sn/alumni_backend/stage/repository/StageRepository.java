package ept.edu.sn.alumni_backend.stage.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.entity.Stage;

public interface StageRepository extends JpaRepository<Stage, UUID>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Stage> {
    Optional<Stage> findByOffre_IdAndEtudiant_Id(UUID offreId, UUID etudiantId);

    @EntityGraph(attributePaths = {"etudiant", "etudiant.filiere", "candidature"})
    List<Stage> findByOffre_IdOrderByCreeLeAsc(UUID offreId);

    @EntityGraph(attributePaths = {"etudiant", "etudiant.filiere"})
    List<Stage> findByOffre_IdAndStatutOrderByCreeLeAsc(UUID offreId, StatutStage statut);

    @EntityGraph(attributePaths = {"offre", "organisme"})
    List<Stage> findByEtudiant_IdAndStatutInOrderByDateDebutDesc(UUID etudiantId, java.util.Collection<StatutStage> statuts);

    /** Déclarations (STA-10) d'un statut, les plus anciennes d'abord : la file se traite dans l'ordre d'arrivée. */
    @EntityGraph(attributePaths = {"etudiant", "etudiant.filiere", "organisme"})
    org.springframework.data.domain.Page<Stage> findByOffreIsNullAndStatut(StatutStage statut, org.springframework.data.domain.Pageable page);

    long countByOffreIsNullAndStatut(StatutStage statut);

    @EntityGraph(attributePaths = {"etudiant", "etudiant.filiere", "organisme", "encadrantInterne"})
    List<Stage> findByEncadrantInterne_IdAndStatutOrderByDateDebutDesc(UUID encadrantId, StatutStage statut);

    @EntityGraph(attributePaths = {"etudiant", "etudiant.filiere", "organisme", "encadrantInterne"})
    List<Stage> findByOrganisme_IdAndStatutOrderByDateDebutDesc(UUID organismeId, StatutStage statut);

    /** Stages confirmés des étudiants des filières que ce compte dirige (chef de département). */
    @EntityGraph(attributePaths = {"etudiant", "etudiant.filiere", "organisme", "encadrantInterne"})
    @Query("""
        select s from Stage s
        where s.statut = ept.edu.sn.alumni_backend.stage.StatutStage.CONFIRME
          and s.etudiant.filiere.id in (select c.filiereId from ChefDepartement c where c.chef.id = :chef)
        order by s.dateDebut desc
        """)
    List<Stage> duDepartementDe(@Param("chef") UUID chefId);

    @Override
    @EntityGraph(attributePaths = {"etudiant", "etudiant.filiere", "organisme", "encadrantInterne"})
    org.springframework.data.domain.Page<Stage> findAll(org.springframework.data.jpa.domain.Specification<Stage> specification,
        org.springframework.data.domain.Pageable page);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Stage s left join fetch s.organisme join fetch s.etudiant where s.id = :id")
    Optional<Stage> findByIdForUpdate(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"offre", "etudiant", "organisme"})
    Optional<Stage> findWithOffreById(UUID id);

    /** Offres où l'étudiant a un stage confirmé : « retenue » dans le suivi de ses candidatures. */
    @Query("select s.offre.id from Stage s where s.etudiant.id = :etudiant and s.statut = ept.edu.sn.alumni_backend.stage.StatutStage.CONFIRME and s.offre is not null")
    List<UUID> offresConfirmees(@Param("etudiant") UUID etudiantId);

    /** Un autre stage confirmé de l'étudiant dont les dates touchent [debut, fin] (bornes comprises). */
    @Query("""
        select s from Stage s join fetch s.organisme
        where s.etudiant.id = :etudiant and s.id <> :exclu
          and s.statut = ept.edu.sn.alumni_backend.stage.StatutStage.CONFIRME
          and s.dateDebut <= :fin and s.dateFin >= :debut
        """)
    List<Stage> chevauchements(@Param("etudiant") UUID etudiantId, @Param("exclu") UUID exclu,
        @Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

    /** Lignes en brouillon d'offres retirées : elles ne seront jamais publiées. */
    @Modifying
    @Query("delete from Stage s where s.offre.id = :offre and s.statut = :statut")
    void supprimerParOffreEtStatut(@Param("offre") UUID offreId, @Param("statut") StatutStage statut);
}
