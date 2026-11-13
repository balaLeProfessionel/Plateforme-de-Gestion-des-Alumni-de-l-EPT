package ept.edu.sn.alumni_backend.publication.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import ept.edu.sn.alumni_backend.publication.StatutSignalement;
import ept.edu.sn.alumni_backend.publication.entity.SignalementPublication;

public interface SignalementPublicationRepository extends JpaRepository<SignalementPublication, UUID> {
    boolean existsByPublication_IdAndAuteur_Id(UUID publicationId, UUID auteurId);

    long countByStatut(StatutSignalement statut);

    @EntityGraph(attributePaths = {"publication", "publication.auteur", "auteur", "traitePar"})
    Page<SignalementPublication> findByStatutIn(Collection<StatutSignalement> statuts, Pageable pageable);

    List<SignalementPublication> findByPublication_IdAndStatut(UUID publicationId, StatutSignalement statut);
}
