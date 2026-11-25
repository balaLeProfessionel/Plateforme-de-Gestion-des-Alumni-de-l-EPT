import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

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

  it('demande de choisir un profil avant de continuer', () => {
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component['continuer']();
    fixture.detectChanges();
    expect(navigation).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).querySelector('#erreur-role')).toBeTruthy();

    const radio = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[value="ALUMNI"]')!;
    radio.click();
    component['continuer']();
    expect(navigation).toHaveBeenCalledWith(['/inscription/formulaire', 'ALUMNI']);
  });
});
