package ept.edu.sn.alumni_backend.article.repository;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.article.StatutArticle;
import ept.edu.sn.alumni_backend.article.entity.Article;
import jakarta.persistence.LockModeType;

public interface ArticleRepository extends JpaRepository<Article, UUID> {
    long countByAuteur_IdAndStatut(UUID auteurId, StatutArticle statut);

    Page<Article> findByAuteur_IdAndStatutIn(UUID auteurId, Collection<StatutArticle> statuts, Pageable page);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Article a where a.id = :id")
    Optional<Article> findByIdForUpdate(@Param("id") UUID id);
}
