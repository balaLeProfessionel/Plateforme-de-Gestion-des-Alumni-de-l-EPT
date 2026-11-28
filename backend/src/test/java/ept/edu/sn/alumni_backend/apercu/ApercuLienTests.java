package ept.edu.sn.alumni_backend.apercu;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.apache.hc.client5.http.classic.methods.HttpGet;
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
    void lImagePassePartoutDeLinkedInEstIgnoreeMaisPasLesVraiesImages() {
        String generique = "<meta property=\"og:image\" content=\"https://static.licdn.com/aero-v1/sc/h/c45fy346jw096z9pbphyyhdz7\">";
        assertThat(LecteurMeta.lire(generique, PAGE).image()).isNull();
        String vraie = "<meta property=\"og:image\" content=\"https://media.licdn.com/dms/image/v2/photo.jpg\">";
        assertThat(LecteurMeta.lire(vraie, PAGE).image()).isEqualTo("https://media.licdn.com/dms/image/v2/photo.jpg");
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
                "0.0.0.0", "255.255.255.255", "fd00::1", "fe80::1", "::ffff:127.0.0.1",
                // IPv6 qui mène à une adresse IPv4 interne : NAT64, IPv4-compatible, 6to4, Teredo ; et la documentation.
                "64:ff9b::a9fe:a9fe", "::7f00:1", "2002:7f00:1::1", "2002:a9fe:a9fe::1", "2001:0:4136:e378::1", "2001:db8::1")) {
            assertThat(GardeAdresse.interdite(InetAddress.getByName(interne))).as(interne).isTrue();
        }
        assertThat(GardeAdresse.interdite(InetAddress.getByName("196.1.95.1"))).isFalse();
        assertThat(GardeAdresse.interdite(InetAddress.getByName("2a00:1450:4007::1"))).isFalse();
        assertThat(GardeAdresse.interdite(InetAddress.getByName("2002:c401:5f01::1"))).as("6to4 vers une IPv4 publique").isFalse();
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

    @Test
    void leResolveurDuClientRefuseUnNomQuiMeneAUneAdresseInterne() throws Exception {
        TelechargeurHttp.ResolveurPublic resolveur = new TelechargeurHttp.ResolveurPublic();
        // Même si la vérification préalable a vu une adresse publique, la connexion ne part pas vers une adresse interne.
        assertThatThrownBy(() -> resolveur.resolve("127.0.0.1")).isInstanceOf(UnknownHostException.class);
        assertThatThrownBy(() -> resolveur.resolve("localhost", 443)).isInstanceOf(UnknownHostException.class);
        assertThat(resolveur.resolve("196.1.95.1", 443)).extracting(a -> a.getAddress().getHostAddress()).containsExactly("196.1.95.1");
    }

    @Test
    void unSiteQuiEnvoieSaPageGoutteAGoutteEstAbandonneALEcheance() {
        InputStream goutteAGoutte = new InputStream() {
            @Override public int read() {
                try {
                    Thread.sleep(40);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return 'a';
            }

            @Override public int read(byte[] b, int off, int len) {
                b[off] = (byte) read();
                return 1;
            }
        };
        long echeance = System.nanoTime() + Duration.ofMillis(200).toNanos();
        assertThatThrownBy(() -> TelechargeurHttp.lireBorne(goutteAGoutte, 1024 * 1024, true, echeance, new HttpGet("https://exemple.sn/")))
            .isInstanceOf(IOException.class);
    }

    @Test
    void unCorpsTropLourdEstTronqueOuRefuse() throws Exception {
        long loin = System.nanoTime() + Duration.ofSeconds(5).toNanos();
        byte[] dixOctets = "0123456789".getBytes(StandardCharsets.UTF_8);
        HttpGet requete = new HttpGet("https://exemple.sn/");
        assertThat(TelechargeurHttp.lireBorne(new ByteArrayInputStream(dixOctets), 4, true, loin, requete)).containsExactly('0', '1', '2', '3');
        assertThat(TelechargeurHttp.lireBorne(new ByteArrayInputStream(dixOctets), 4, false, loin, requete)).isNull();
        assertThat(TelechargeurHttp.lireBorne(new ByteArrayInputStream(dixOctets), 10, false, loin, requete)).hasSize(10);
    }
}
