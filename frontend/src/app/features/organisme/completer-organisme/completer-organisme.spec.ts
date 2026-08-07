import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompleterOrganisme } from './completer-organisme';

describe('CompleterOrganisme', () => {
  let component: CompleterOrganisme;
  let fixture: ComponentFixture<CompleterOrganisme>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompleterOrganisme],
    }).compileComponents();

    fixture = TestBed.createComponent(CompleterOrganisme);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
