package ept.edu.sn.alumni_backend.stage.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;

import ept.edu.sn.alumni_backend.common.stockage.DepotFichiers;
import ept.edu.sn.alumni_backend.common.stockage.StockageDocuments;
import lombok.Getter;

/** Scans des conventions signées, dans le dépôt de fichiers, sous « documents/conventions ». */
@Component
@Getter
public class StockageFichiersConvention {
    private final StockageDocuments scans;

    public StockageFichiersConvention(
            DepotFichiers depot,
            @Value("${app.storage.photos.max-size:5MB}") DataSize tailleMaximale) {
        this.scans = new StockageDocuments(depot, "documents/conventions", tailleMaximale.toBytes());
    }
}
