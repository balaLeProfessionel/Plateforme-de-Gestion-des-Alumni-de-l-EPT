import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { MentoratDeProgramme, ParticipantMentorat, TableauProgramme } from '../../../../core/services/models/mentorat.model';
import { unProgramme } from '../../testing/donnees-mentorat';
import { TableauProgrammePage } from './tableau-programme';

describe('TableauProgrammePage', () => {
  let fixture: ComponentFixture<TableauProgrammePage>;
  let http: HttpTestingController;
  let racine: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TableauProgrammePage],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: new BehaviorSubject(convertToParamMap({ id: 'p1' })) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TableauProgrammePage);
    racine = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  async function repondre(tableau: TableauProgramme): Promise<void> {
    http.expectOne('/api/mentorat/programmes/p1').flush(unProgramme({ statut: 'OUVERT' }));
    http.expectOne('/api/mentorat/programmes/p1/tableau').flush(tableau);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const texte = (selecteur: string) => [...racine.querySelectorAll(selecteur)].map((e) => e.textContent?.replace(/\s+/g, ' ').trim());

  it('présente les chiffres, l’avancement par étape et les mentors volontaires', async () => {
    await repondre(unTableau());
    expect(racine.querySelector('h1')?.textContent).toContain('Orientation lycée 2026');
    expect(texte('.chiffres dd')).toEqual(['2', '1', '1', '1', '75 %']);
    expect(texte('.etapes .compte')).toEqual(['2 / 2 mentorats l’ont franchie', '1 / 2 mentorats l’ont franchie']);
    expect((racine.querySelectorAll('.etapes .barre > span')[1] as HTMLElement).style.width).toBe('50%');
    expect(texte('.mentors .details')[0]).toContain('1 mentoré en cours · disponible');
    expect(racine.querySelector('.mentors a')?.getAttribute('href')).toBe('/profil/a');
    expect(racine.querySelector('.liens a')?.getAttribute('href')).toBe('/mentorat/gestion-programmes/p1');
  });

  it('filtre les mentorats par statut sans montrer leur contenu', async () => {
    await repondre(unTableau());
    expect(racine.querySelectorAll('.mentorats li')).toHaveLength(4);
    expect(texte('.filtres button')).toEqual(['Tous 4', 'En attente 1', 'En cours 1', 'Terminés 1', 'Sans suite 1']);

    const bouton = [...racine.querySelectorAll<HTMLButtonElement>('.filtres button')].find((b) => b.textContent?.includes('Terminés'));
    bouton?.click();
    fixture.detectChanges();
    expect(bouton?.getAttribute('aria-pressed')).toBe('true');
    const lignes = racine.querySelectorAll('.mentorats li');
    expect(lignes).toHaveLength(1);
    expect(lignes[0].textContent).toContain('2 / 2 étapes');
    expect(racine.textContent).not.toContain('Préparer');

    [...racine.querySelectorAll<HTMLButtonElement>('.filtres button')].find((b) => b.textContent?.includes('Sans suite'))?.click();
    fixture.detectChanges();
    expect(texte('.mentorats .statut-mentorat')).toEqual(['Refusée']);
  });

  it('explique un programme encore sans mentorat', async () => {
    await repondre({ ...unTableau(), enAttente: 0, enCours: 0, terminees: 0, sansSuite: 0, progressionMoyenne: 0,
      etapes: unTableau().etapes.map((etape) => ({ ...etape, franchies: 0, suivis: 0 })), mentorats: [], mentors: [] });
    expect(racine.textContent).toContain('aucun mentorat n’est encore en cours');
    expect(racine.textContent).toContain('Aucune demande n’a encore été faite dans ce programme.');
    expect(racine.textContent).toContain('Aucun mentor volontaire pour l’instant.');
  });

  it('signale un programme introuvable ou réservé', async () => {
    const programme = http.expectOne('/api/mentorat/programmes/p1');
    http.expectOne('/api/mentorat/programmes/p1/tableau').flush({ message: 'introuvable' }, { status: 404, statusText: 'Not Found' });
    // La première erreur suffit : l’autre requête est abandonnée.
    expect(programme.cancelled).toBe(true);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Ce programme est introuvable.');
  });
});

function personne(id: string, prenom: string, role = 'ALUMNI'): ParticipantMentorat {
  return { id, prenom, nom: 'Diop', urlPhoto: null, posteActuel: null, filiere: null, anneeSortie: null, role };
}

function mentorat(id: string, statut: MentoratDeProgramme['statut'], etapesFranchies: number): MentoratDeProgramme {
  return { id, statut, mentor: personne('a', 'Awa'), mentore: personne(`e-${id}`, 'Moussa', 'ETUDIANT'), etapesFranchies, creeLe: '2026-10-20T10:00:00Z' };
}

function unTableau(): TableauProgramme {
  return {
    enAttente: 1, enCours: 1, terminees: 1, sansSuite: 1, progressionMoyenne: 75,
    etapes: [
      { id: 'e1', ordre: 1, titre: 'Premier échange', franchies: 2, suivis: 2 },
      { id: 'e2', ordre: 2, titre: 'Visite de l’EPT', franchies: 1, suivis: 2 },
    ],
    mentorats: [mentorat('m1', 'EN_ATTENTE', 0), mentorat('m2', 'ACCEPTEE', 1), mentorat('m3', 'TERMINEE', 2), mentorat('m4', 'REFUSEE', 0)],
    mentors: [
      { mentor: personne('a', 'Awa'), mentoresEnCours: 1, disponible: true },
      { mentor: personne('b', 'Bineta', 'ETUDIANT'), mentoresEnCours: 0, disponible: false },
    ],
  };
}
