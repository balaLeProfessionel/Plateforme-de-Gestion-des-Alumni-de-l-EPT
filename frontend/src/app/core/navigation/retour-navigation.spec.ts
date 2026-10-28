import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { RetourNavigation } from './retour-navigation';

describe('RetourNavigation', () => {
  let service: RetourNavigation;
  let location: Location;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    service = TestBed.inject(RetourNavigation);
    location = TestBed.inject(Location);
    router = TestBed.inject(Router);
  });

  it('revient à la page précédente de l’application pour en retrouver la position', () => {
    vi.spyOn(location, 'getState').mockReturnValue({ navigationId: 4 });
    const retour = vi.spyOn(location, 'back').mockImplementation(() => undefined);
    const navigation = vi.spyOn(router, 'navigateByUrl');

    service.retourner('/annuaire');

    expect(retour).toHaveBeenCalledOnce();
    expect(navigation).not.toHaveBeenCalled();
  });

  it('ouvre la page de secours quand on est arrivé directement sur la page', () => {
    vi.spyOn(location, 'getState').mockReturnValue({ navigationId: 1 });
    const retour = vi.spyOn(location, 'back');
    const navigation = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    service.retourner('/annuaire');

    expect(retour).not.toHaveBeenCalled();
    expect(navigation).toHaveBeenCalledWith('/annuaire');
  });
});
