import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.informme.app',
  appName: 'InformMe',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
