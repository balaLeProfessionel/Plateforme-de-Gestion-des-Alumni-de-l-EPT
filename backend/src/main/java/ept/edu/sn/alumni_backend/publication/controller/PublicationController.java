package ept.edu.sn.alumni_backend.publication.controller;

import java.net.URI;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.core.io.Resource;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.publication.TypePublication;
import ept.edu.sn.alumni_backend.publication.dto.PagePublicationsResponse;
import ept.edu.sn.alumni_backend.publication.dto.JaimeResponse;
import ept.edu.sn.alumni_backend.publication.dto.SignalementRequest;
import ept.edu.sn.alumni_backend.publication.dto.PublicationRequest;
import ept.edu.sn.alumni_backend.publication.dto.PublicationResponse;
import ept.edu.sn.alumni_backend.publication.dto.CommentairePublicationRequest;
import ept.edu.sn.alumni_backend.publication.dto.CommentairePublicationResponse;
import ept.edu.sn.alumni_backend.publication.dto.PageCommentairesPublicationResponse;
import ept.edu.sn.alumni_backend.publication.service.CommentairePublicationService;
import ept.edu.sn.alumni_backend.publication.service.PublicationService;
import ept.edu.sn.alumni_backend.publication.service.JaimePublicationService;
import ept.edu.sn.alumni_backend.publication.service.SignalementPublicationService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/publications")
@Validated
@RequiredArgsConstructor
public class PublicationController {
    private final PublicationService service;
    private final CommentairePublicationService commentaires;
    private final JaimePublicationService jaimes;
    private final SignalementPublicationService signalements;

    @GetMapping("/{id}/commentaires")
    public PageCommentairesPublicationResponse commentaires(@PathVariable UUID id,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int taille,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return commentaires.lister(id, page, taille, principal);
    }

    @PostMapping("/{id}/commentaires")
    public ResponseEntity<CommentairePublicationResponse> commenter(@PathVariable UUID id,
            @Valid @RequestBody CommentairePublicationRequest demande,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.status(201).body(commentaires.creer(id, demande, principal));
    }

    /** Aimer est idempotent : un second appel ne compte pas double. */
    @PutMapping("/{id}/jaime")
    public JaimeResponse aimer(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return jaimes.aimer(id, principal);
    }

    @DeleteMapping("/{id}/jaime")
    public JaimeResponse retirerJaime(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return jaimes.retirer(id, principal);
    }

    @PostMapping("/{id}/signalements")
    public ResponseEntity<Void> signaler(@PathVariable UUID id, @Valid @RequestBody SignalementRequest demande,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        signalements.signaler(id, demande, principal);
        return ResponseEntity.status(201).build();
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PublicationResponse> creer(@Valid @RequestBody PublicationRequest demande,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        PublicationResponse publication = service.creer(demande, principal);
        return ResponseEntity.created(URI.create("/api/publications/" + publication.id())).body(publication);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PublicationResponse> creerAvecImage(@Valid @RequestPart("publication") PublicationRequest demande,
            @RequestPart("image") MultipartFile image, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        PublicationResponse publication = service.creerAvecImage(demande, image, principal);
        return ResponseEntity.created(URI.create("/api/publications/" + publication.id())).body(publication);
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<Resource> image(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).cacheControl(CacheControl.noStore())
            .header("X-Content-Type-Options", "nosniff").header("X-Robots-Tag", "noindex, nofollow, noarchive")
            .body(service.image(id, principal));
    }

    @GetMapping
    public PagePublicationsResponse lister(@AuthenticationPrincipal UtilisateurPrincipal principal,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(48) int taille,
            @RequestParam(required = false) Set<TypePublication> type) {
        return service.lister(principal, type, page, taille);
    }

    @GetMapping("/{id}")
    public PublicationResponse obtenir(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return service.obtenir(id, principal);
    }
}
