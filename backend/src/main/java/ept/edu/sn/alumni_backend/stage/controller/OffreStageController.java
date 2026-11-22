package ept.edu.sn.alumni_backend.stage.controller;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.TypeStage;
import ept.edu.sn.alumni_backend.stage.dto.OffreStageRequest;
import ept.edu.sn.alumni_backend.stage.dto.OffreStageResponse;
import ept.edu.sn.alumni_backend.stage.dto.OrganismeOffresResponse;
import ept.edu.sn.alumni_backend.stage.service.FichiersOffreService;
import ept.edu.sn.alumni_backend.stage.service.OffresStageService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/** Offres de stage pour les membres connectés (STA-02) et pour l'organisme qui les publie (STA-01). */
@RestController
@RequestMapping("/api/stages")
@RequiredArgsConstructor
@Validated
public class OffreStageController {
    private final OffresStageService offresService;
    private final FichiersOffreService fichiersService;

    @GetMapping("/offres")
    public ResponseEntity<PageResponse<OffreStageResponse>> lister(
            @RequestParam(required = false) TypeStage type,
            @RequestParam(required = false) UUID organisme,
            @RequestParam(required = false) @Size(max = 100) String lieu,
            @RequestParam(defaultValue = "true") boolean ouvertes,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(48) int taille) {
        return ResponseEntity.ok(offresService.listerPubliees(type, organisme, lieu, ouvertes, page, taille));
    }

    @GetMapping("/offres/organismes")
    public ResponseEntity<List<OrganismeOffresResponse>> organismes() {
        return ResponseEntity.ok(offresService.organismesAvecOffres());
    }

    @GetMapping("/offres/{id}")
    public ResponseEntity<OffreStageResponse> detail(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(offresService.detail(id, principal));
    }

    /** Image 16:9 de l'offre : son organisme ou l'administrateur Stages. */
    @PostMapping(value = "/offres/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OffreStageResponse> joindreImage(@PathVariable UUID id, @RequestPart("image") MultipartFile image,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(fichiersService.joindreImage(id, image, principal));
    }

    @DeleteMapping("/offres/{id}/image")
    public ResponseEntity<OffreStageResponse> supprimerImage(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(fichiersService.supprimerImage(id, principal));
    }

    @PostMapping(value = "/offres/{id}/pieces-jointes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OffreStageResponse> ajouterPiece(@PathVariable UUID id, @RequestPart("fichier") MultipartFile fichier,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(fichiersService.ajouterPiece(id, fichier, principal));
    }

    @DeleteMapping("/offres/{id}/pieces-jointes/{pieceId}")
    public ResponseEntity<OffreStageResponse> supprimerPiece(@PathVariable UUID id, @PathVariable UUID pieceId,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(fichiersService.supprimerPiece(id, pieceId, principal));
    }

    /** Téléchargement d'une pièce jointe, avec les mêmes droits que la lecture de l'offre. */
    @GetMapping("/offres/{id}/pieces-jointes/{pieceId}")
    public ResponseEntity<Resource> telecharger(@PathVariable UUID id, @PathVariable UUID pieceId,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        FichiersOffreService.Telechargement piece = fichiersService.telecharger(id, pieceId, principal);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(piece.nomFichier(), StandardCharsets.UTF_8).build().toString())
            .header("X-Content-Type-Options", "nosniff")
            .cacheControl(CacheControl.noStore())
            .body(piece.contenu());
    }

    /** Offres de l'organisme connecté, tous statuts confondus (rôle ORGANISME exigé par SecurityConfig). */
    @GetMapping("/mes-offres")
    public ResponseEntity<List<OffreStageResponse>> mesOffres(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(offresService.mesOffres(principal));
    }

    @PostMapping("/mes-offres")
    public ResponseEntity<OffreStageResponse> publier(@Valid @RequestBody OffreStageRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        OffreStageResponse offre = offresService.publierParOrganisme(request, principal);
        return ResponseEntity.created(URI.create("/api/stages/offres/" + offre.id())).body(offre);
    }

    @PatchMapping("/mes-offres/{id}/retirer")
    public ResponseEntity<OffreStageResponse> retirer(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(offresService.retirerParOrganisme(id, principal));
    }
}
