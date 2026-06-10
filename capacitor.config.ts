import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tofu.pos',
  appName: 'Tofu POS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
