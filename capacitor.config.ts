import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuracion Capacitor — App Competiciones CD Kolbe
 *
 * Estrategia: app shell local (HTML/CSS/JS en /www) que actua como hub
 * del club. Para mostrar las competiciones, abrimos la web de Clupik
 * (competiciones.clubdeportivokolbe.com) a traves del plugin Browser,
 * que la presenta como un navegador embebido nativo con barra de cierre.
 *
 * Asi cumplimos con los requisitos de Apple (la app tiene contenido y
 * funcionalidad propia, no es un puro wrapper) y mantenemos la URL
 * remota como fuente de verdad de los datos de competicion.
 */
const config: CapacitorConfig = {
  appId: 'com.clubdeportivokolbe.competiciones',
  appName: 'CD Kolbe',
  webDir: 'www',
  backgroundColor: '#0BAB00',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0BAB00',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0BAB00',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0BAB00',
  },
  android: {
    backgroundColor: '#0BAB00',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
