package ept.edu.sn.alumni_backend.utilisateur.photo;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/photos")
public class PhotoController {
    private final StockagePhotoProfil stockage;

    public PhotoController(StockagePhotoProfil stockage) {
        this.stockage = stockage;
    }

    @GetMapping("/{nom}")
    public ResponseEntity<Resource> lire(@PathVariable String nom) {
        MediaType type = nom.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
        return ResponseEntity.ok()
            .contentType(type)
            .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
            .body(stockage.lire(nom));
    }
}
