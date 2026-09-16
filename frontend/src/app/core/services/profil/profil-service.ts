import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import {
  Experience,
  ExperienceRequest,
  Formation,
  FormationRequest,
  Profil,
  ProfilPublic,
  ProfilRequest
} from '../models/profil.model';

// Seul point de contact avec les endpoints de profil du backend.
// Volontairement sans etat : il expose des Observable, ce sont les pages
// qui detiennent les signals. Il reste ainsi utilisable a l'identique par
// la page de completion post-inscription et par la future page parametres.
@Service()
export class ProfilService {
  private readonly http = inject(HttpClient);

  // ===== Infos personnelles =====

  obtenirProfil() {
    return this.http.get<Profil>('/api/profil/me');
  }

  obtenirProfilPublic(id: string) {
    return this.http.get<ProfilPublic>(`/api/profil/${id}`);
  }

  majProfil(donnees: ProfilRequest) {
    return this.http.patch<Profil>('/api/profil/me', donnees);
  }

  modifierPhoto(photo: File) {
    const donnees = new FormData();
    donnees.append('photo', photo);
    return this.http.post<Profil>('/api/profil/me/photo', donnees);
  }

  supprimerPhoto() {
    return this.http.delete<Profil>('/api/profil/me/photo');
  }

  // ===== Experiences professionnelles =====

  listerExperiences() {
    return this.http.get<Experience[]>('/api/experiences/me');
  }

  creerExperience(donnees: ExperienceRequest) {
    return this.http.post<Experience>('/api/experiences', donnees);
  }

  modifierExperience(id: string, donnees: ExperienceRequest) {
    return this.http.put<Experience>(`/api/experiences/${id}`, donnees);
  }

  supprimerExperience(id: string) {
    return this.http.delete<void>(`/api/experiences/${id}`);
  }

  // ===== Formations =====

  listerFormations() {
    return this.http.get<Formation[]>('/api/formations/me');
  }

  creerFormation(donnees: FormationRequest) {
    return this.http.post<Formation>('/api/formations', donnees);
  }

  modifierFormation(id: string, donnees: FormationRequest) {
    return this.http.put<Formation>(`/api/formations/${id}`, donnees);
  }

  supprimerFormation(id: string) {
    return this.http.delete<void>(`/api/formations/${id}`);
  }
}
