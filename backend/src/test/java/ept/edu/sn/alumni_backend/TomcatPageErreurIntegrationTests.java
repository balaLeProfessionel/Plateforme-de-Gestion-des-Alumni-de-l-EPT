package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

/** Les erreurs traitées par Tomcat lui-même ne doivent révéler ni le serveur ni sa version. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class TomcatPageErreurIntegrationTests {

    @LocalServerPort
    private int port;

    @Test
    void uneBarreObliqueEncodeeEstRefuseeSansReveleLaVersionDuServeur() throws Exception {
        HttpResponse<String> reponse = HttpClient.newHttpClient().send(
            HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/admin%2Fcommunautes")).GET().build(),
            HttpResponse.BodyHandlers.ofString());

        assertThat(reponse.statusCode()).isEqualTo(400);
        assertThat(reponse.body()).doesNotContainIgnoringCase("tomcat").doesNotContain("Exception");
    }
}
