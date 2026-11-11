package ept.edu.sn.alumni_backend;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;

import ept.edu.sn.alumni_backend.common.stockage.DepotFichiersDisque;

class DepotFichiersDisqueTests {
    @TempDir
    Path racine;

    @Test
    void ecritLitPuisSupprimeUnFichierDansUnSousDossier() throws Exception {
        DepotFichiersDisque depot = new DepotFichiersDisque(racine.toString());
        String cle = "documents/cv/0f8fad5b-d9cb-469f-a165-70867728950e.pdf";
        byte[] contenu = "%PDF-1.7 contenu".getBytes();

        depot.ecrire(cle, contenu);

        Resource lu = depot.lire(cle).orElseThrow();
        try (InputStream entree = lu.getInputStream()) {
            assertArrayEquals(contenu, entree.readAllBytes());
        }
        assertTrue(Files.exists(racine.resolve("documents/cv/0f8fad5b-d9cb-469f-a165-70867728950e.pdf")));
        try (var fichiers = Files.list(racine.resolve("documents/cv"))) {
            assertTrue(fichiers.noneMatch(f -> f.toString().endsWith(".tmp")), "aucun fichier temporaire ne doit rester");
        }

        depot.supprimer(cle);
        assertTrue(depot.lire(cle).isEmpty());
    }

    @Test
    void renvoieVidePourUnFichierAbsent() {
        assertTrue(new DepotFichiersDisque(racine.toString()).lire("absent.jpg").isEmpty());
    }

    @Test
    void refuseLesClesQuiSortentDuRepertoire() throws Exception {
        DepotFichiersDisque depot = new DepotFichiersDisque(racine.resolve("depot").toString());
        Files.writeString(racine.resolve("secret.txt"), "secret");

        for (String cle : new String[] {"../secret.txt", "/etc/passwd", "documents/../../secret.txt", "a\\b.pdf", ""}) {
            assertThrows(IOException.class, () -> depot.ecrire(cle, new byte[] {1}), cle);
            assertTrue(depot.lire(cle).isEmpty(), cle);
            assertThrows(IOException.class, () -> depot.supprimer(cle), cle);
        }
        assertFalse(Files.notExists(racine.resolve("secret.txt")));
    }
}
