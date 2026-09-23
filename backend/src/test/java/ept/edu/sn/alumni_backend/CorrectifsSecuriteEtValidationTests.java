package ept.edu.sn.alumni_backend;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import ept.edu.sn.alumni_backend.enums.TypeContrat;
import ept.edu.sn.alumni_backend.enums.TypeFormation;
import ept.edu.sn.alumni_backend.organisme.service.OrganismeService;
import ept.edu.sn.alumni_backend.parcours.dto.ExperienceRequest;
import ept.edu.sn.alumni_backend.parcours.dto.FormationRequest;
import ept.edu.sn.alumni_backend.parcours.mapper.ExperienceMapper;
import ept.edu.sn.alumni_backend.parcours.mapper.FormationMapper;
import ept.edu.sn.alumni_backend.parcours.repository.ExperienceRepository;
import ept.edu.sn.alumni_backend.parcours.repository.FormationRepository;
import ept.edu.sn.alumni_backend.parcours.service.ExperienceService;
import ept.edu.sn.alumni_backend.parcours.service.FormationService;
import ept.edu.sn.alumni_backend.security.RefreshToken;
import ept.edu.sn.alumni_backend.security.RefreshTokenRepository;
import ept.edu.sn.alumni_backend.security.RefreshTokenService;

class CorrectifsSecuriteEtValidationTests {

    @Test
    void neSupprimePasUnRefreshTokenAvecUnSecretIncorrect() {
        RefreshTokenRepository repository = mock(RefreshTokenRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        RefreshTokenService service = new RefreshTokenService(repository, passwordEncoder);
        UUID id = UUID.randomUUID();
        RefreshToken token = new RefreshToken("hash", LocalDateTime.now().plusHours(1), null);

        when(repository.findById(id)).thenReturn(Optional.of(token));
        when(passwordEncoder.matches("mauvais-secret", "hash")).thenReturn(false);

        service.supprimerRefreshToken(id + ".mauvais-secret");

        verify(repository, never()).delete(token);
    }

    @Test
    void supprimeUnRefreshTokenAvecLeBonSecret() {
        RefreshTokenRepository repository = mock(RefreshTokenRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        RefreshTokenService service = new RefreshTokenService(repository, passwordEncoder);
        UUID id = UUID.randomUUID();
        RefreshToken token = new RefreshToken("hash", LocalDateTime.now().plusHours(1), null);

        when(repository.findById(id)).thenReturn(Optional.of(token));
        when(passwordEncoder.matches("bon-secret", "hash")).thenReturn(true);

        service.supprimerRefreshToken(id + ".bon-secret");

        verify(repository).delete(token);
    }

    @Test
    void refuseUneFormationDontLesDatesSontInversees() {
        FormationRepository repository = mock(FormationRepository.class);
        OrganismeService organismeService = mock(OrganismeService.class);
        FormationService service = new FormationService(repository, organismeService, mock(FormationMapper.class));
        FormationRequest request = new FormationRequest(
            "Diplôme", null, TypeFormation.DIPLOMANTE,
            LocalDate.of(2026, 2, 1), LocalDate.of(2026, 1, 1), false, null, "EPT");

        assertThrows(IllegalArgumentException.class, () -> service.creer(null, request));
        verifyNoInteractions(repository, organismeService);
    }

    @Test
    void refuseUneExperienceDontLesDatesSontInversees() {
        ExperienceRepository repository = mock(ExperienceRepository.class);
        OrganismeService organismeService = mock(OrganismeService.class);
        ExperienceService service = new ExperienceService(repository, organismeService, mock(ExperienceMapper.class));
        ExperienceRequest request = new ExperienceRequest(
            "Ingénieur", null, TypeContrat.CDI,
            LocalDate.of(2026, 2, 1), LocalDate.of(2026, 1, 1), false, null, "EPT");

        assertThrows(IllegalArgumentException.class, () -> service.creer(null, request));
        verifyNoInteractions(repository, organismeService);
    }
}
