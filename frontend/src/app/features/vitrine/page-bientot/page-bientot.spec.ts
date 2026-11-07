import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { PageBientot } from './page-bientot';

describe('PageBientot', () => {
  async function page(rubrique: string): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [PageBientot],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { rubrique } } } }
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PageBientot);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('annonce que les stages ne sont pas encore disponibles', async () => {
    const element = await page('stages');
    expect(element.querySelector('h1')?.textContent).toContain('Stages');
    expect(element.textContent).toContain('pas encore disponible');
  });

  it('annonce que les offres d emploi ne sont pas encore disponibles', async () => {
    const element = await page('offres-emploi');
    expect(element.querySelector('h1')?.textContent).toContain('Offres d’emploi');
    expect(element.textContent).toContain('pas encore disponible');
  });
});
