package ept.edu.sn.alumni_backend;

import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository;

/** Filière d'un compte de test : celle de même nom si elle existe (les cinq de départ sont créées au démarrage). */
public final class FilieresDeTest {
    private FilieresDeTest() {
    }

    public static Filiere filiere(FiliereRepository repository, String nom) {
        return repository.findByCle(Filiere.cle(nom)).orElseGet(() -> repository.saveAndFlush(new Filiere(nom, null)));
    }
}
