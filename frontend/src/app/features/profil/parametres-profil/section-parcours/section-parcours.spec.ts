import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Experience } from '../../../../core/services/models/profil.model';
import { OrganismeService } from '../../../../core/services/organisme/organisme-service';
import { ProfilService } from '../../../../core/services/profil/profil-service';
import { SectionParcours } from './section-parcours';

describe('SectionParcours', () => {
  let fixture: ComponentFixture<SectionParcours>;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  async function afficher(type: 'experience' | 'formation', requete: Record<string, string> = {}): Promise<void> {
    service = {
      listerExperiences: vi.fn().mockReturnValue(of([experience()])),
      listerFormations: vi.fn().mockReturnValue(of([])),
      creerExperience: vi.fn().mockReturnValue(of(experience({ id: 'exp-2', poste: 'Data engineer' }))),
      modifierExperience: vi.fn().mockReturnValue(of(experience({ poste: 'Ingénieure senior' }))),
      supprimerExperience: vi.fn().mockReturnValue(of(undefined)),
    };
    TestBed.configureTestingModule({
      imports: [SectionParcours],
      providers: [
        provideRouter([]),
        { provide: ProfilService, useValue: service },
        { provide: OrganismeService, useValue: { rechercherOrganismes: vi.fn().mockReturnValue(of([])) } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(requete) } } },
      ],
    });
    fixture = TestBed.createComponent(SectionParcours);
    fixture.componentRef.setInput('type', type);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const composant = () => fixture.componentInstance as unknown as {
    enregistrer(demande: { id: string | null; cle: string; donnees: unknown }): void;
    supprimer(id: string): void;
    ajouterBrouillon(): void;
    elements(): Experience[];
    brouillons(): string[];
    etat(): { messages: Record<string, { type: string; texte: string }> };
  };

  it('charge les expériences et n’interroge pas les formations', async () => {
    await afficher('experience');
    expect(service['listerExperiences']).toHaveBeenCalledOnce();
    expect(service['listerFormations']).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Expériences professionnelles');
  });

  it('enregistre une nouvelle carte seule et remplace son brouillon', async () => {
    await afficher('experience');
    composant().ajouterBrouillon();
    const cle = composant().brouillons()[0];
    composant().enregistrer({ id: null, cle, donnees: { poste: 'Data engineer' } });
    expect(service['creerExperience']).toHaveBeenCalled();
    expect(composant().elements().map((e) => e.id)).toEqual(['exp-1', 'exp-2']);
    expect(composant().brouillons()).toEqual([]);
    expect(composant().etat().messages['exp-2']).toEqual({ type: 'succes', texte: 'Enregistré.' });
  });

  it('modifie une carte existante sans toucher aux autres', async () => {
    await afficher('experience');
    composant().enregistrer({ id: 'exp-1', cle: 'exp-1', donnees: { poste: 'Ingénieure senior' } });
    expect(service['modifierExperience']).toHaveBeenCalledWith('exp-1', { poste: 'Ingénieure senior' });
    expect(composant().elements()[0].poste).toBe('Ingénieure senior');
  });

  it('signale l’échec d’un enregistrement sur la carte concernée', async () => {
    await afficher('experience');
    service['modifierExperience'].mockReturnValue(throwError(() => ({ error: { message: 'Date invalide.' } })));
    composant().enregistrer({ id: 'exp-1', cle: 'exp-1', donnees: {} });
    expect(composant().etat().messages['exp-1']).toEqual({ type: 'erreur', texte: 'Date invalide.' });
  });

  it('supprime une carte', async () => {
    await afficher('experience');
    composant().supprimer('exp-1');
    expect(service['supprimerExperience']).toHaveBeenCalledWith('exp-1');
    expect(composant().elements()).toEqual([]);
  });

  it('charge les formations pour la section formations', async () => {
    await afficher('formation');
    expect(service['listerFormations']).toHaveBeenCalledOnce();
    expect(service['listerExperiences']).not.toHaveBeenCalled();
  });
});

function experience(valeurs: Partial<Experience> = {}): Experience {
  return {
    id: 'exp-1', poste: 'Ingénieure hydraulique', description: null, typeContrat: 'CDI', dateDebut: '2022-09-01', dateFin: null,
    estStage: false, enCours: true, organismeId: 'o1', nomOrganisme: 'Eau Vive Sahel', etablissementEpt: false, ...valeurs,
  };
}
