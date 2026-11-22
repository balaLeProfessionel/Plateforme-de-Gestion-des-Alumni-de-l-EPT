package ept.edu.sn.alumni_backend.stage.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.stage.StatutCandidature;
import ept.edu.sn.alumni_backend.stage.entity.Candidature;
import jakarta.persistence.LockModeType;

public interface CandidatureRepository extends JpaRepository<Candidature, UUID> {
    Optional<Candidature> findByOffre_IdAndEtudiant_Id(UUID offreId, UUID etudiantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Candidature c join fetch c.offre o join fetch o.organisme where c.id = :id")
    Optional<Candidature> findByIdForUpdate(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"offre", "offre.organisme"})
    Optional<Candidature> findWithOffreById(UUID id);

    @EntityGraph(attributePaths = {"offre", "offre.organisme"})
    List<Candidature> findByEtudiant_IdOrderByEnvoyeeLeDesc(UUID etudiantId);

    @EntityGraph(attributePaths = {"etudiant", "etudiant.filiere"})
    List<Candidature> findByOffre_IdOrderByEnvoyeeLeAsc(UUID offreId);

    @EntityGraph(attributePaths = {"etudiant", "etudiant.filiere"})
    List<Candidature> findByOffre_IdAndStatutOrderByEnvoyeeLeAsc(UUID offreId, StatutCandidature statut);

    /** Candidatures envoyées par offre, en une requête, pour les listes de l'organisme et de l'école. */
    @Query("""
        select c.offre.id as offreId, count(c) as nombre from Candidature c
        where c.offre.id in :offres and c.statut = ept.edu.sn.alumni_backend.stage.StatutCandidature.ENVOYEE
        group by c.offre.id
        """)
    List<NombreParOffre> compterEnvoyees(@Param("offres") Collection<UUID> offres);

    interface NombreParOffre {
        UUID getOffreId();
        long getNombre();
    }
}
