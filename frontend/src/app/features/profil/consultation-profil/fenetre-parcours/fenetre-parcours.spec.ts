import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Experience } from '../../../../core/services/models/profil.model';
import { ProfilService } from '../../../../core/services/profil/profil-service';
import { FenetreParcours, ParcoursOuvert } from './fenetre-parcours';

describe('FenetreParcours', () => {
  let fixture: ComponentFixture<FenetreParcours>;
  let racine: HTMLElement;
  const service = { supprimerExperience: vi.fn(), supprimerFormation: vi.fn() };

  beforeEach(() => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
    service.supprimerExperience.mockReset();
    TestBed.configureTestingModule({
      imports: [FenetreParcours],
      providers: [provideRouter([]), { provide: ProfilService, useValue: service }],
    });
    fixture = TestBed.createComponent(FenetreParcours);
    racine = fixture.nativeElement;
  });

  const dialogue = () => racine.querySelector('dialog') as HTMLDialogElement;
  const bouton = (texte: string) => [...racine.querySelectorAll('button')].find((b) => b.textContent?.includes(texte)) as HTMLButtonElement | undefined;

  function ouvrir(parcours: ParcoursOuvert | null, proprietaire = false): void {
    fixture.componentRef.setInput('parcours', parcours);
    fixture.componentRef.setInput('proprietaire', proprietaire);
    fixture.componentRef.setInput('aSuivant', true);
    fixture.detectChanges();
  }

  it('présente toutes les informations d’une expérience, sans actions pour un visiteur du profil', () => {
    ouvrir({ type: 'experience', item: experience() });
    expect(dialogue().open).toBe(true);
    expect(racine.querySelector('h2')?.textContent).toContain('Assistant de recherche');
    expect(racine.querySelector('.organisme')?.textContent).toContain('École Polytechnique de Thiès');
    expect(racine.querySelector('.marque-ept')?.textContent).toContain('Parcours à l’EPT');
    const valeurs = [...racine.querySelectorAll('.informations dd')].map((dd) => dd.textContent?.trim());
    expect(valeurs[0]).toBe('CDD');
    expect(valeurs[1]).toMatch(/^Depuis (janvier|January) 2024$/);
    expect(valeurs.slice(2)).toEqual(['En cours', 'Non']);
    expect(racine.querySelector('.description p')?.textContent).toContain('Analyse de données');
    expect(bouton('Supprimer')).toBeUndefined();
    expect(bouton('Plus récent')?.disabled).toBe(true);
    expect(bouton('Plus ancien')?.disabled).toBe(false);
  });

  it('se ferme quand l’étape est retirée et signale la fermeture par la croix', () => {
    const fermetures: number[] = [];
    fixture.componentInstance.fermee.subscribe(() => fermetures.push(1));
    ouvrir({ type: 'experience', item: experience() });
    (racine.querySelector('.fermer') as HTMLButtonElement).click();
    expect(fermetures).toHaveLength(1);
    ouvrir(null);
    expect(dialogue().open).toBe(false);
  });

  it('laisse le propriétaire modifier, ou supprimer après confirmation', async () => {
    service.supprimerExperience.mockReturnValue(of(undefined));
    const supprimes: string[] = [];
    fixture.componentInstance.supprime.subscribe((parcours) => supprimes.push(parcours.item.id));
    ouvrir({ type: 'experience', item: experience() }, true);
    const modifier = [...racine.querySelectorAll('a')].find((a) => a.textContent?.includes('Modifier'));
    expect(modifier?.getAttribute('href')).toBe('/completer-profil/experiences?modifier=exp-1');

    bouton('Supprimer')?.click();
    fixture.detectChanges();
    expect(racine.textContent).toContain('Supprimer définitivement cet élément du parcours ?');
    bouton('Confirmer la suppression')?.click();
    await fixture.whenStable();
    expect(service.supprimerExperience).toHaveBeenCalledWith('exp-1');
    expect(supprimes).toEqual(['exp-1']);
  });

  it('affiche l’échec d’une suppression', async () => {
    service.supprimerExperience.mockReturnValue(throwError(() => new Error('refus')));
    ouvrir({ type: 'experience', item: experience() }, true);
    bouton('Supprimer')?.click();
    fixture.detectChanges();
    bouton('Confirmer la suppression')?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('La suppression a échoué.');
  });
});

function experience(): Experience {
  return {
    id: 'exp-1', poste: 'Assistant de recherche', description: 'Analyse de données', typeContrat: 'CDD',
    dateDebut: '2024-01-01', dateFin: null, estStage: false, enCours: true,
    organismeId: 'ept', nomOrganisme: 'École Polytechnique de Thiès (EPT)', etablissementEpt: true,
  };
}
