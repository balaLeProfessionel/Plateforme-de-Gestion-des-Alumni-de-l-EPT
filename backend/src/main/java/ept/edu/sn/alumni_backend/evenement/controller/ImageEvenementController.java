package ept.edu.sn.alumni_backend.evenement.controller;

import java.util.concurrent.TimeUnit;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.evenement.service.StockageImageEvenement;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/evenement-images")
@RequiredArgsConstructor
public class ImageEvenementController {
    private final StockageImageEvenement stockage;

    @GetMapping("/{nom}")
    public ResponseEntity<Resource> lire(@PathVariable String nom) {
        MediaType type = nom.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
        return ResponseEntity.ok()
            .contentType(type)
            .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
            .header("X-Robots-Tag", "noindex, nofollow, noarchive")
            .body(stockage.lire(nom));
    }
}
