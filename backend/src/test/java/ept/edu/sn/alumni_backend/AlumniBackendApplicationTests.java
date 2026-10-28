package ept.edu.sn.alumni_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.beans.factory.annotation.Autowired;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AlumniBackendApplicationTests {
	@Autowired
	private MockMvc mockMvc;

	@Test
	void contextLoads() {
	}

	@Test
	@WithMockUser(roles = "VISITEUR")
	void autoriseUnVisiteurAEnvoyerUneFormation() throws Exception {
		mockMvc.perform(post("/api/formations")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estStage\":false}"))
			.andExpect(status().isBadRequest());
	}

	@Test
	@WithMockUser(roles = "VISITEUR")
	void autoriseUnVisiteurAEnvoyerUneExperience() throws Exception {
		mockMvc.perform(post("/api/experiences")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estStage\":false}"))
			.andExpect(status().isBadRequest());
	}

}
