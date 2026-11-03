package ept.edu.sn.alumni_backend.publication.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ept.edu.sn.alumni_backend.publication.entity.JaimePublication;

public interface JaimePublicationRepository extends JpaRepository<JaimePublication, UUID> {
    boolean existsByPublication_IdAndUtilisateur_Id(UUID publicationId, UUID utilisateurId);

    long countByPublication_Id(UUID publicationId);

    @Modifying
    @Query("delete from JaimePublication j where j.publication.id = :publication and j.utilisateur.id = :utilisateur")
    int retirer(@Param("publication") UUID publicationId, @Param("utilisateur") UUID utilisateurId);

    /** Nombre de « J'aime » de chaque publication d'une page, en une requête. */
    @Query("""
        select j.publication.id as publicationId, count(j) as nombre from JaimePublication j
        where j.publication.id in :publications group by j.publication.id""")
    List<CompteParPublication> compter(@Param("publications") Collection<UUID> publications);

    /** Publications de la page que le lecteur aime déjà. */
    @Query("select j.publication.id from JaimePublication j where j.utilisateur.id = :utilisateur and j.publication.id in :publications")
    List<UUID> aimeesPar(@Param("utilisateur") UUID utilisateurId, @Param("publications") Collection<UUID> publications);
}
