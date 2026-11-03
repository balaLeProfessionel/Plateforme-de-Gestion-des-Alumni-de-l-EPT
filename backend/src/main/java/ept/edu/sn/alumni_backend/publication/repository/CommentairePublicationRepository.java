package ept.edu.sn.alumni_backend.publication.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import ept.edu.sn.alumni_backend.publication.entity.CommentairePublication;

public interface CommentairePublicationRepository extends JpaRepository<CommentairePublication, UUID> {
    @EntityGraph(attributePaths = {"auteur", "parent"})
    Page<CommentairePublication> findByPublication_IdOrderByCreeLeAscIdAsc(UUID publicationId, Pageable pageable);
}
