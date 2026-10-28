import Aura from '@primeuix/themes/aura';
import { definePreset } from "@primeuix/themes";

export const EptPreset = definePreset(Aura, {
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