package ept.edu.sn.alumni_backend.cv.repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ept.edu.sn.alumni_backend.cv.StatutImportCv;
import ept.edu.sn.alumni_backend.cv.entity.ImportCv;

public interface ImportCvRepository extends JpaRepository<ImportCv, UUID> {
    Optional<ImportCv> findByIdAndUtilisateurId(UUID id, UUID utilisateurId);

    boolean existsByUtilisateurIdAndStatut(UUID utilisateurId, StatutImportCv statut);

    long countByUtilisateurIdAndCreeLeAfter(UUID utilisateurId, Instant depuis);

    /** Brouillons encore ouverts du membre (un nouvel import les remplace). */
    List<ImportCv> findByUtilisateurIdAndStatutIn(UUID utilisateurId, Collection<StatutImportCv> statuts);

    Optional<ImportCv> findFirstByUtilisateurIdAndStatutOrderByCreeLeDesc(UUID utilisateurId, StatutImportCv statut);

    List<ImportCv> findByStatutAndExpireLeBefore(StatutImportCv statut, Instant maintenant);

    List<ImportCv> findByStatutAndCreeLeBefore(StatutImportCv statut, Instant limite);
}
