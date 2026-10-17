package ept.edu.sn.alumni_backend;

import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.unauthenticated;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest(properties = "app.cors.allowed-origins=http://localhost:4200,https://validation-alumni-123-4200.app.github.dev")
@AutoConfigureMockMvc
class CorsIntegrationTests {
    private static final String CODESPACE_ORIGIN = "https://validation-alumni-123-4200.app.github.dev";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void accepteLeDomaineExactDuCodespace() throws Exception {
        mockMvc.perform(preflight(CODESPACE_ORIGIN))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, CODESPACE_ORIGIN));
    }

    @Test
    void conserveLeDeveloppementLocal() throws Exception {
        mockMvc.perform(preflight("http://localhost:4200"))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:4200"));
    }

    @Test
    void refuseUnAutreCodespace() throws Exception {
        mockMvc.perform(preflight("https://autre-codespace-4200.app.github.dev"))
            .andExpect(status().isForbidden())
            .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    void refuseUnDomaineExterne() throws Exception {
        mockMvc.perform(preflight("https://exemple.invalid"))
            .andExpect(status().isForbidden())
            .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    void neDonnePasAccesAuxDonneesSansAuthentification() throws Exception {
        mockMvc.perform(get("/api/annuaire").header(HttpHeaders.ORIGIN, CODESPACE_ORIGIN))
            .andExpect(status().is4xxClientError())
            .andExpect(unauthenticated());
    }

    private MockHttpServletRequestBuilder preflight(String origin) {
        return options("/api/auth/login")
            .header(HttpHeaders.ORIGIN, origin)
            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "content-type");
    }
}
