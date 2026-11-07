import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ChoixRole } from './choix-role';

describe('ChoixRole', () => {
  let component: ChoixRole;
  let fixture: ComponentFixture<ChoixRole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChoixRole],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ChoixRole);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('explique le cas des etudiants et ne promet pas d offres d emploi', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.note-etudiant')?.textContent).toContain('créé par l’administration');
    expect(element.textContent).not.toContain('Publiez des offres');
  });
});
