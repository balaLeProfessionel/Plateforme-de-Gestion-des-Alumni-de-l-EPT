package ept.edu.sn.alumni_backend.annuaire;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.annuaire.dto.DiplomePublicResponse;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/** Recherche accessible sans compte (voir `SecurityConfig`) ; l'annuaire complet reste réservé aux membres. */
@RestController
@RequestMapping("/api/public/annuaire")
@RequiredArgsConstructor
@Validated
public class AnnuairePublicController {
    private final AnnuaireService annuaireService;

    @GetMapping
    public ResponseEntity<List<DiplomePublicResponse>> rechercher(
            @RequestParam @Size(max = 100) String recherche) {
        return ResponseEntity.ok(annuaireService.rechercherPublic(recherche));
    }
}
