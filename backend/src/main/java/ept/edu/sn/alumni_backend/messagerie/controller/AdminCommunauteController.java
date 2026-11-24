package ept.edu.sn.alumni_backend.messagerie.controller;

import java.net.URI;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute;
import ept.edu.sn.alumni_backend.messagerie.dto.CommunauteAdminResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.CommunauteRequest;
import ept.edu.sn.alumni_backend.messagerie.dto.ModificationCommunauteRequest;
import ept.edu.sn.alumni_backend.messagerie.dto.ResumeCommunautesResponse;
import ept.edu.sn.alumni_backend.messagerie.service.AdministrationCommunautesService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/** Communautés dans l'administration ; la permission GERER_COMMUNAUTES est exigée par SecurityConfig. */
@RestController
@RequestMapping("/api/admin/communautes")
@RequiredArgsConstructor
@Validated
public class AdminCommunauteController {
    private final AdministrationCommunautesService administration;

    @GetMapping
    public PageResponse<CommunauteAdminResponse> lister(
            @RequestParam(required = false) CategorieCommunaute categorie,
            @RequestParam(required = false) @Size(max = 100) String recherche,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(48) int taille) {
        return administration.lister(categorie, recherche, page, taille);
    }

    @GetMapping("/resume")
    public ResumeCommunautesResponse resume() {
        return administration.resumer();
    }

    @PostMapping
    public ResponseEntity<CommunauteAdminResponse> creer(@Valid @RequestBody CommunauteRequest requete) {
        CommunauteAdminResponse communaute = administration.creer(requete);
        return ResponseEntity.created(URI.create("/api/admin/communautes/" + communaute.id())).body(communaute);
    }

    @PatchMapping("/{id}")
    public CommunauteAdminResponse modifier(@PathVariable UUID id, @Valid @RequestBody ModificationCommunauteRequest requete) {
        return administration.modifier(id, requete);
    }
}
