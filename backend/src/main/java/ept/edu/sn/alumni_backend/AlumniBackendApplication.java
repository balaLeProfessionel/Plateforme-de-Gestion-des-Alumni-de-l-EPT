package ept.edu.sn.alumni_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import ept.edu.sn.alumni_backend.evenement.EvenementProperties;

@SpringBootApplication
@EnableConfigurationProperties(EvenementProperties.class)
public class AlumniBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(AlumniBackendApplication.class, args);
	}

}
