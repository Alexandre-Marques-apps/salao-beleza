import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.morganefaoli.nailstyle',
  appName: 'Morgane Nails',
  webDir: 'public',
  server: {
    url: 'https://salao-beleza-zeta.vercel.app',
    androidScheme: 'https',
    cleartext: false
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
