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

public interface StageRepository extends JpaRepository<Stage, UUID> {
    Optional<Stage> findByOffre_IdAndEtudiant_Id(UUID offreId, UUID etudiantId);

    @EntityGraph(attributePaths = {"etudiant", "etudiant.filiere", "candidature"})
    List<Stage> findByOffre_IdOrderByCreeLeAsc(UUID offreId);

    @EntityGraph(attributePaths = {"etudiant", "etudiant.filiere"})
    List<Stage> findByOffre_IdAndStatutOrderByCreeLeAsc(UUID offreId, StatutStage statut);

    @EntityGraph(attributePaths = {"offre", "organisme"})
    List<Stage> findByEtudiant_IdAndStatutOrderByDateDebutDesc(UUID etudiantId, StatutStage statut);

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
