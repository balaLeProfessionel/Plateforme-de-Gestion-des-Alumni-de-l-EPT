package ept.edu.sn.alumni_backend.stage.service;

import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;

import ept.edu.sn.alumni_backend.common.image.FormatImage;
import ept.edu.sn.alumni_backend.common.stockage.StockageDocuments;
import ept.edu.sn.alumni_backend.common.stockage.StockageImages;
import lombok.Getter;

/**
 * Fichiers des offres de stage, rangés dans le volume des photos (persisté par Docker) : les images sous « offres »,
 * les pièces jointes PDF sous « documents/offres ».
 */
@Component
@Getter
public class StockageFichiersOffre {
    public static final String PREFIXE_IMAGES = "/api/offre-images/";

    private final StockageImages images;
    private final StockageDocuments documents;

    public StockageFichiersOffre(
            @Value("${app.storage.photos.dir:./data/photos}") String repertoire,
            @Value("${app.storage.photos.max-size:5MB}") DataSize tailleMaximale) {
        Path racine = Path.of(repertoire);
        this.images = new StockageImages(racine.resolve("offres"), PREFIXE_IMAGES, FormatImage.OFFRE_STAGE, tailleMaximale.toBytes());
        this.documents = new StockageDocuments(racine.resolve("documents").resolve("offres"), tailleMaximale.toBytes());
    }
}
