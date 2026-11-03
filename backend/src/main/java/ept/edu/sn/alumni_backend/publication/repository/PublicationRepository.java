package ept.edu.sn.alumni_backend.publication.repository;

import java.util.UUID;
import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import ept.edu.sn.alumni_backend.publication.entity.Publication;

public interface PublicationRepository extends JpaRepository<Publication, UUID>, JpaSpecificationExecutor<Publication> {
    long countByAuteur_IdAndPublieLeGreaterThanEqual(UUID auteurId, Instant publieLe);

    @Override
    @EntityGraph(attributePaths = "auteur")
    Page<Publication> findAll(Specification<Publication> specification, Pageable pageable);
}
