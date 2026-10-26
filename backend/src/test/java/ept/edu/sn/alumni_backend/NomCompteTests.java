package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import ept.edu.sn.alumni_backend.admin.NomCompte;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

class NomCompteTests {
    @Test
    void unContactDOrganismeSansPrenomNAffichePasNull() {
        Utilisateur contact = new Utilisateur();
        contact.setNom("Agence des infrastructures");
        contact.setEmail("contact@agence.invalid");

        assertThat(NomCompte.complet(contact)).isEqualTo("Agence des infrastructures");
        assertThat(NomCompte.salutation(contact)).isEqualTo("Agence des infrastructures");

        contact.setNom(null);
        assertThat(NomCompte.complet(contact)).isEqualTo("contact@agence.invalid");

        contact.setPrenom(" Awa ");
        contact.setNom("Diop");
        assertThat(NomCompte.complet(contact)).isEqualTo("Awa Diop");
        assertThat(NomCompte.salutation(contact)).isEqualTo("Awa");
    }
}
