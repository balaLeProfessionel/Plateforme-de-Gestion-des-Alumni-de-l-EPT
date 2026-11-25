import { definePreset } from '@primeuix/themes';
import base from '@primeuix/themes/aura/base';
import badge from '@primeuix/themes/aura/badge';
import button from '@primeuix/themes/aura/button';
import inputtext from '@primeuix/themes/aura/inputtext';
import menu from '@primeuix/themes/aura/menu';
import message from '@primeuix/themes/aura/message';
import ripple from '@primeuix/themes/aura/ripple';
import sidebar from '@primeuix/themes/aura/sidebar';
import skeleton from '@primeuix/themes/aura/skeleton';
import tag from '@primeuix/themes/aura/tag';
import tooltip from '@primeuix/themes/aura/tooltip';

/**
 * Aura limité aux composants PrimeNG de l'application (et à badge et ripple, qu'ils chargent) :
 * le preset complet importe les jetons de plus de 90 composants et pèse 114 kB dans le bundle initial.
 * Un nouveau composant PrimeNG doit être ajouté ici, sinon il s'affiche sans style.
 */
const AuraUtilise = {
  ...base,
  components: { badge, button, inputtext, menu, message, ripple, sidebar, skeleton, tag, tooltip }
};

export const EptPreset = definePreset(AuraUtilise, {
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
  },
  // Contraste WCAG AA (4,5:1) : les teintes 500/600 d'Aura sont trop claires pour du texte sur fond blanc
  // ou pâle ; on prend la teinte 700 (l'application n'a pas de mode sombre).
  components: {
    button: {
      root: {
        danger: {
          background: '{red.700}', hoverBackground: '{red.800}', activeBackground: '{red.900}',
          borderColor: '{red.700}', hoverBorderColor: '{red.800}', activeBorderColor: '{red.900}',
          focusRing: { color: '{red.700}', shadow: 'none' }
        }
      },
      outlined: { danger: { color: '{red.700}', borderColor: '{red.300}' } },
      text: { danger: { color: '{red.700}' }, secondary: { color: '{surface.600}' } }
    },
    message: {
      info: { color: '{blue.700}' },
      success: { color: '{green.700}' },
      warn: { color: '{yellow.800}' },
      error: { color: '{red.700}' }
    }
  }
});
