package ept.edu.sn.alumni_backend.apercu;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.InetAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

class ApercuLienTests {
    private static final URI PAGE = URI.create("https://www.linkedin.com/posts/exemple-123");

    @Test
    void lesBalisesOpenGraphPrimentEtLesEntitesSontDecodees() {
        String html = """
            <html><head><title>Titre de repli</title>
            <meta property="og:title" content="Fatou Diop sur LinkedIn : Ravie d&#39;annoncer mon stage">
            <meta content='Premier paragraphe &amp; suite.&#10;&#10;&#10;&#10;Second paragraphe' property='og:description'>
            <meta property="og:image" content="/images/apercu.jpg">
            <meta name="description" content="Ignorée, l'Open Graph est prioritaire">
            </head><body>…</body></html>""";

        ApercuLienResponse apercu = LecteurMeta.lire(html, PAGE);

        assertThat(apercu.titre()).isEqualTo("Fatou Diop sur LinkedIn : Ravie d'annoncer mon stage");
        assertThat(apercu.description()).isEqualTo("Premier paragraphe & suite.\n\nSecond paragraphe");
        assertThat(apercu.image()).isEqualTo("https://www.linkedin.com/images/apercu.jpg");
        assertThat(apercu.site()).isEqualTo("linkedin.com");
        assertThat(apercu.lisible()).isTrue();
    }

    @Test
    void sansOpenGraphOnSeRabatSurLeTitreEtLaDescriptionDeLaPage() {
        String html = "<head><TITLE>\n  Un  article\n</TITLE><meta name=description content=Résumé></head>";
        ApercuLienResponse apercu = LecteurMeta.lire(html, URI.create("https://blog.exemple.sn/article"));
        assertThat(apercu.titre()).isEqualTo("Un article");
        assertThat(apercu.description()).isEqualTo("Résumé");
        assertThat(apercu.image()).isNull();
        assertThat(apercu.site()).isEqualTo("blog.exemple.sn");
    }

    @Test
    void uneImageQuiNEstPasEnHttpEstIgnoree() {
        String html = "<meta property=\"og:image\" content=\"javascript:alert(1)\"><meta property=\"og:title\" content=\"T\">";
        assertThat(LecteurMeta.lire(html, PAGE).image()).isNull();
    }

    @Test
    void lesAdressesSontNormaliseesEtLesAdressesInternesRefusees() {
        assertThat(GardeAdresse.normaliser(" linkedin.com/posts/abc#commentaires ").toString())
            .isEqualTo("https://linkedin.com/posts/abc");
        assertThatThrownBy(() -> GardeAdresse.normaliser("ftp://exemple.sn/fichier")).isInstanceOf(LienRefuseException.class);
        assertThatThrownBy(() -> GardeAdresse.normaliser("javascript:alert(1)")).isInstanceOf(LienRefuseException.class);
        assertThatThrownBy(() -> GardeAdresse.normaliser("http://localhost:8080/api")).isInstanceOf(LienRefuseException.class);
        assertThatThrownBy(() -> GardeAdresse.normaliser("http://api/")).isInstanceOf(LienRefuseException.class);
        assertThatThrownBy(() -> GardeAdresse.normaliser("https://moi:secret@exemple.sn/")).isInstanceOf(LienRefuseException.class);
        assertThatThrownBy(() -> GardeAdresse.verifierPublique(URI.create("http://127.0.0.1/")))
            .isInstanceOf(LienRefuseException.class);
        assertThatThrownBy(() -> GardeAdresse.verifierPublique(URI.create("http://[::1]/")))
            .isInstanceOf(LienRefuseException.class);
    }

    @Test
    void lesPlagesInternesSontInterdites() throws Exception {
        for (String interne : List.of("10.0.0.1", "172.16.5.4", "192.168.1.1", "169.254.169.254", "100.64.0.1",
                "0.0.0.0", "255.255.255.255", "fd00::1", "fe80::1", "::ffff:127.0.0.1")) {
            assertThat(GardeAdresse.interdite(InetAddress.getByName(interne))).as(interne).isTrue();
        }
        assertThat(GardeAdresse.interdite(InetAddress.getByName("196.1.95.1"))).isFalse();
        assertThat(GardeAdresse.interdite(InetAddress.getByName("2a00:1450:4007::1"))).isFalse();
    }

    @Test
    void lApercuEstGardeEtSeuleSonImagePeutEtreRelayee() {
        List<URI> lues = new ArrayList<>();
        Telechargeur faux = (adresse, poidsMax, typeAccepte, tronquer) -> {
            lues.add(adresse);
            if (adresse.getPath().endsWith(".jpg")) {
                return typeAccepte.test("image/jpeg") ? new Telechargeur.Ressource(adresse, "image/jpeg", new byte[] {1, 2}) : null;
            }
            String html = "<meta property=\"og:title\" content=\"Titre\"><meta property=\"og:image\" content=\"https://media.exemple.sn/a.jpg\">";
            return new Telechargeur.Ressource(adresse, "text/html; charset=utf-8", html.getBytes(StandardCharsets.UTF_8));
        };
        ApercuLienService service = new ApercuLienService(faux);

        ApercuLienResponse apercu = service.apercu("https://exemple.sn/billet");
        service.apercu("https://exemple.sn/billet");

        assertThat(apercu.titre()).isEqualTo("Titre");
        assertThat(lues).hasSize(1);
        assertThat(service.enCache("https://exemple.sn/billet")).contains(apercu);
        assertThat(service.image("https://media.exemple.sn/a.jpg")).isPresent();
        assertThat(service.image("https://ailleurs.exemple.sn/b.jpg")).isEmpty();
    }

    @Test
    void unePageMuetteDonneUnApercuMinimal() {
        ApercuLienService service = new ApercuLienService((adresse, poidsMax, typeAccepte, tronquer) -> null);
        ApercuLienResponse apercu = service.apercu("https://www.linkedin.com/posts/fatou-diop_stage");
        assertThat(apercu.lisible()).isFalse();
        assertThat(apercu.site()).isEqualTo("linkedin.com");
        assertThat(apercu.url()).isEqualTo("https://www.linkedin.com/posts/fatou-diop_stage");
    }
}
