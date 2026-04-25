import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.fbiz",
  appName: "FBiz Academy",
  webDir: "dist",
  server: {
    url: "https://fbiz-academy.lovable.app",
    cleartext: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#D4AF37",
    },
  },
};

export default config;
