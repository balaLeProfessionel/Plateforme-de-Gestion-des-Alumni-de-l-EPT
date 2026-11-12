package ept.edu.sn.alumni_backend.publication.repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import ept.edu.sn.alumni_backend.publication.entity.CommentairePublication;

public interface CommentairePublicationRepository extends JpaRepository<CommentairePublication, UUID> {
    @EntityGraph(attributePaths = {"auteur", "parent"})
    Page<CommentairePublication> findByPublication_IdOrderByCreeLeAscIdAsc(UUID publicationId, Pageable pageable);

    /** Nombre de commentaires de chaque publication d'une page, en une requête. */
    @Query("""
        select c.publication.id as publicationId, count(c) as nombre from CommentairePublication c
        where c.publication.id in :publications group by c.publication.id""")
    List<CompteParPublication> compter(@Param("publications") Collection<UUID> publications);

    /** Dernier commentaire (hors réponses) de chaque publication d'une page, montré en aperçu dans le fil. */
    @Query("""
        select c from CommentairePublication c join fetch c.auteur join fetch c.publication
        where c.publication.id in :publications and c.parent is null and c.creeLe = (
            select max(d.creeLe) from CommentairePublication d where d.publication = c.publication and d.parent is null)""")
    List<CommentairePublication> derniers(@Param("publications") Collection<UUID> publications);

    /** Commentaires écrits par le lecteur depuis une date, regroupés par auteur des publications commentées. */
    @Query("""
        select c.publication.auteur.id as auteurId, count(c) as nombre from CommentairePublication c
        where c.auteur.id = :lecteur and c.creeLe >= :depuis and c.publication.auteur.id <> :lecteur
        group by c.publication.auteur.id""")
    List<CompteParAuteur> parAuteurCommentesPar(@Param("lecteur") UUID lecteurId, @Param("depuis") Instant depuis);
}
