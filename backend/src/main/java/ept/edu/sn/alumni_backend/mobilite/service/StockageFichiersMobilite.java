package ept.edu.sn.alumni_backend.mobilite.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;

import ept.edu.sn.alumni_backend.common.stockage.DepotFichiers;
import ept.edu.sn.alumni_backend.common.stockage.StockageDocuments;
import lombok.Getter;

/** PDF des mobilités, dans le dépôt de fichiers : documents des offres et pièces des dossiers de candidature. */
@Component
@Getter
public class StockageFichiersMobilite {
    private final StockageDocuments documentsOffres;
    private final StockageDocuments piecesCandidatures;

    public StockageFichiersMobilite(DepotFichiers depot, @Value("${app.storage.photos.max-size:5MB}") DataSize tailleMaximale) {
        this.documentsOffres = new StockageDocuments(depot, "documents/mobilites/offres", tailleMaximale.toBytes());
        this.piecesCandidatures = new StockageDocuments(depot, "documents/mobilites/candidatures", tailleMaximale.toBytes());
    }
}
