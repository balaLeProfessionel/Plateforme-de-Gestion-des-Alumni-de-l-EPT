package ept.edu.sn.alumni_backend.stage.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;

import ept.edu.sn.alumni_backend.common.stockage.DepotFichiers;
import ept.edu.sn.alumni_backend.common.stockage.StockageDocuments;
import lombok.Getter;

/** Rapports de stage, dans le dépôt de fichiers, sous « documents/rapports ». */
@Component
@Getter
public class StockageFichiersRapport {
    private final StockageDocuments rapports;

    public StockageFichiersRapport(DepotFichiers depot, @Value("${app.storage.photos.max-size:5MB}") DataSize tailleMaximale) {
        this.rapports = new StockageDocuments(depot, "documents/rapports", tailleMaximale.toBytes());
    }
}
