package ept.edu.sn.alumni_backend.article.dto;

import java.util.List;

import org.springframework.data.domain.Page;

public record PageArticlesResponse(List<ArticleResumeResponse> contenu, int page, int taille,
    long totalElements, int totalPages) {
    public static PageArticlesResponse depuis(Page<ArticleResumeResponse> page) {
        return new PageArticlesResponse(page.getContent(), page.getNumber(), page.getSize(),
            page.getTotalElements(), page.getTotalPages());
    }
}
