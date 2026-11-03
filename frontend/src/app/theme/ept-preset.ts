import Aura from '@primeuix/themes/aura';
import { definePreset } from "@primeuix/themes";

export const EptPreset = definePreset(Aura, {
  // Mêmes rayons que la plateforme (--ept-radius-sm / --ept-radius / --ept-radius-lg) :
  // champs et boutons PrimeNG à 10px, panneaux à 14px, fenêtres à 18px.
  primitive: {
    borderRadius: { none: '0', xs: '4px', sm: '8px', md: '10px', lg: '14px', xl: '18px' },
  },
  semantic: {
    primary: {
      50:  '#E3EEF3',
      100: '#C0D9E3',
      200: '#94BFCF',
      300: '#5F9DB4',
      400: '#2E7896',
      500: '#014365',
      600: '#013A58',
      700: '#012E45',
      800: '#012233',
      900: '#001622',
      950: '#000C13'
    }
  }
});