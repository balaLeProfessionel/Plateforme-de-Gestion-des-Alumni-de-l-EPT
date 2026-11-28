import { etapesConvention } from './partenariat.model';

describe('etapesConvention', () => {
  const avancements = (statut: Parameters<typeof etapesConvention>[0]['statut'], origine: 'ORGANISME' | 'ECOLE' = 'ORGANISME') =>
    etapesConvention({ statut, origine }).map((e) => `${e.titre}:${e.avancement}`);

  it('suit la demande de l’organisme jusqu’à la signature', () => {
    expect(avancements('DEMANDEE')).toEqual(['Demande:en-cours', 'Examen:a-venir', 'Négociation:a-venir', 'Signature:a-venir']);
    expect(avancements('EN_NEGOCIATION')).toEqual(['Demande:fait', 'Examen:fait', 'Négociation:en-cours', 'Signature:a-venir']);
    expect(avancements('ACTIVE')).toEqual(['Demande:fait', 'Examen:fait', 'Négociation:fait', 'Signature:fait']);
  });

  it('montre la fin d’une convention et la clôture d’une demande', () => {
    expect(avancements('EXPIREE').at(-1)).toBe('Fin:refuse');
    expect(avancements('REFUSEE')).toEqual(['Demande:refuse']);
    expect(avancements('ANNULEE')).toEqual(['Demande:refuse']);
  });

  it('commence à la négociation pour une convention enregistrée par l’école', () => {
    expect(avancements('ACTIVE', 'ECOLE')).toEqual(['Négociation:fait', 'Signature:fait']);
  });
});
