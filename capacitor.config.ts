import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tofu.pos',
  appName: 'Tofu POS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'localhost',
  },
  plugins: {
    CapacitorSQLite: {
      iosIsEncryption: false,
      androidIsEncryption: false,
    },
  },
}

export default config
