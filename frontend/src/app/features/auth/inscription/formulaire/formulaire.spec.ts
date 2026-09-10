import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { Formulaire } from './formulaire';

describe('Formulaire', () => {
  let component: Formulaire;
  let fixture: ComponentFixture<Formulaire>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Formulaire],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Formulaire);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
