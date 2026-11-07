package ept.edu.sn.alumni_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import ept.edu.sn.alumni_backend.article.ArticleProperties;
import ept.edu.sn.alumni_backend.evenement.EvenementProperties;
import ept.edu.sn.alumni_backend.publication.PublicationProperties;

@SpringBootApplication
@EnableConfigurationProperties({EvenementProperties.class, PublicationProperties.class, ArticleProperties.class})
public class AlumniBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(AlumniBackendApplication.class, args);
	}

}
