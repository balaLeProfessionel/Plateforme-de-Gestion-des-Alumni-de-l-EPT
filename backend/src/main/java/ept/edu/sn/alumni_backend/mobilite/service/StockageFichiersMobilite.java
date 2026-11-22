package ept.edu.sn.alumni_backend.mobilite.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;

import ept.edu.sn.alumni_backend.common.stockage.DepotFichiers;
import ept.edu.sn.alumni_backend.common.stockage.StockageDocuments;
import lombok.Getter;

/** Documents PDF des offres de mobilité, dans le dépôt de fichiers, sous « documents/mobilites/offres ». */
@Component
@Getter
public class StockageFichiersMobilite {
    private final StockageDocuments documentsOffres;

    public StockageFichiersMobilite(DepotFichiers depot, @Value("${app.storage.photos.max-size:5MB}") DataSize tailleMaximale) {
        this.documentsOffres = new StockageDocuments(depot, "documents/mobilites/offres", tailleMaximale.toBytes());
    }
}
