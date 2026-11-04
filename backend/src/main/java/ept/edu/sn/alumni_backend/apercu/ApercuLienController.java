package ept.edu.sn.alumni_backend.apercu;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Réservé aux membres connectés (règle par défaut de la configuration de sécurité). */
@RestController
@RequestMapping("/api/apercus-lien")
@RequiredArgsConstructor
public class ApercuLienController {
    private final ApercuLienService service;

    @PostMapping
    public ApercuLienResponse apercu(@Valid @RequestBody ApercuLienRequest demande) {
        return service.apercu(demande.url());
    }

    @GetMapping("/image")
    public ResponseEntity<byte[]> image(@RequestParam String url) {
        return service.image(url)
            .map(image -> ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.type().toLowerCase().startsWith("image/png")
                    ? MediaType.IMAGE_PNG_VALUE : MediaType.IMAGE_JPEG_VALUE))
                .cacheControl(CacheControl.noStore())
                .header("X-Content-Type-Options", "nosniff")
                .body(image.contenu()))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
