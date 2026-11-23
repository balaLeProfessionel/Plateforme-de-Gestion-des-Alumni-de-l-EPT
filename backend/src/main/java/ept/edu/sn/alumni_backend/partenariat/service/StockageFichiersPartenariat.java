package ept.edu.sn.alumni_backend.partenariat.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;

import ept.edu.sn.alumni_backend.common.stockage.DepotFichiers;
import ept.edu.sn.alumni_backend.common.stockage.StockageDocuments;
import lombok.Getter;

/** PDF des conventions de partenariat, dans le dépôt de fichiers. */
@Component
@Getter
public class StockageFichiersPartenariat {
    private final StockageDocuments documents;

    public StockageFichiersPartenariat(DepotFichiers depot, @Value("${app.storage.photos.max-size:5MB}") DataSize tailleMaximale) {
        this.documents = new StockageDocuments(depot, "documents/partenariats/conventions", tailleMaximale.toBytes());
    }
}
