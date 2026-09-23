package ept.edu.sn.alumni_backend.annuaire;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.annuaire.dto.AnnuaireMembreResponse;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/annuaire")
@RequiredArgsConstructor
@Validated
public class AnnuaireController {
    private final AnnuaireService annuaireService;

    @GetMapping
    public ResponseEntity<PageResponse<AnnuaireMembreResponse>> rechercher(
            @RequestParam(required = false) @Size(max = 100) String recherche,
            @RequestParam(required = false) TypeRole role,
            @RequestParam(required = false) @Size(max = 100) String filiere,
            @RequestParam(required = false) @Min(1900) @Max(2200) Integer promotion,
            @RequestParam(required = false) @Size(max = 100) String ville,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(48) int taille,
            @RequestParam(defaultValue = "ALPHABETIQUE") AnnuaireTri tri) {
        return ResponseEntity.ok(annuaireService.rechercher(
            recherche, role, filiere, promotion, ville, page, taille, tri
        ));
    }
}
