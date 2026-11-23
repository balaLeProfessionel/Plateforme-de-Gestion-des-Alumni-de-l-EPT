package ept.edu.sn.alumni_backend.filiere.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import jakarta.persistence.LockModeType;

public interface FiliereRepository extends JpaRepository<Filiere, UUID> {
    Optional<Filiere> findByCle(String cle);

    List<Filiere> findByActiveTrue();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from Filiere f where f.id = :id")
    Optional<Filiere> findByIdForUpdate(@Param("id") UUID id);

    /** Nombre de comptes par filière, en une requête. */
    @Query("select u.filiere.id as filiereId, count(u) as nombre from Utilisateur u where u.filiere is not null group by u.filiere.id")
    List<NombreComptesProjection> compterComptes();

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Utilisateur u set u.filiere = :cible where u.filiere = :source")
    int deplacerComptes(@Param("source") Filiere source, @Param("cible") Filiere cible);

    interface NombreComptesProjection {
        UUID getFiliereId();
        long getNombre();
    }
}
