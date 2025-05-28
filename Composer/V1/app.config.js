// app.config.js
import 'dotenv/config';

export default {
  expo: {
    name: "TaskMaster",
    slug: "TaskMaster",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
        permissions: [
          "android.permission.NFC"
        ]
      },
      package: "com.mycorp.myapp"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-secure-store",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/crashlytics",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            googleServicesFile: "./GoogleService-Info.plist",
            bundleIdentifier: "com.mycorp.myapp"
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      eas: {
        projectId: "517310c4-1d4b-4555-8792-f4f7fca2634d"
      },
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      githubClientId: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID,
      githubRedirectUri: process.env.EXPO_PUBLIC_GITHUB_REDIRECT_URI,
      uaOauthUrl: process.env.EXPO_PUBLIC_UA_OAUTH_URL,
      uaClientId: process.env.EXPO_PUBLIC_UA_CLIENT_ID,
      uaRedirectUri: process.env.EXPO_PUBLIC_UA_REDIRECT_URI
    }
  }
};
