import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ImagePublication } from './image-publication';

describe('ImagePublication', () => {
  it('charge une image protégée par HTTP et libère son URL locale', async () => {
    const creation = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:image');
    const liberation = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    TestBed.configureTestingModule({ imports: [ImagePublication], providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ImagePublication);
    fixture.componentRef.setInput('url', '/api/publications/00000000-0000-4000-8000-000000000001/image');
    fixture.detectChanges();
    const requete = http.expectOne('/api/publications/00000000-0000-4000-8000-000000000001/image');
    expect(requete.request.responseType).toBe('blob');
    requete.flush(new Blob(['image'], { type: 'image/png' }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('blob:image');
    fixture.destroy();
    expect(liberation).toHaveBeenCalledWith('blob:image');
    http.verify();
    creation.mockRestore();
    liberation.mockRestore();
  });
});
