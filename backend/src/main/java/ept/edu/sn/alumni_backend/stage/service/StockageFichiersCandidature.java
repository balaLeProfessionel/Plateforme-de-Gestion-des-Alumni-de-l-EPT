package ept.edu.sn.alumni_backend.stage.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;

import ept.edu.sn.alumni_backend.common.stockage.DepotFichiers;
import ept.edu.sn.alumni_backend.common.stockage.StockageDocuments;
import lombok.Getter;

/** CV des candidatures, dans le dépôt de fichiers, sous « documents/cv ». */
@Component
@Getter
public class StockageFichiersCandidature {
    private final StockageDocuments cv;

    public StockageFichiersCandidature(
            DepotFichiers depot,
            @Value("${app.storage.photos.max-size:5MB}") DataSize tailleMaximale) {
        this.cv = new StockageDocuments(depot, "documents/cv", tailleMaximale.toBytes());
    }
}
