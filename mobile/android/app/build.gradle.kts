import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}

// ======================
// LOAD KEYSTORE
// ======================
val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")

if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    namespace = "com.laceup.sport"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    // ======================
    // JAVA / KOTLIN CONFIG
    // ======================
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    // ======================
    // DEFAULT CONFIG
    // ======================
    defaultConfig {
        applicationId = "com.laceup.sport"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    // ======================
    // SIGNING CONFIG (PLAY STORE)
    // ======================
    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storePassword = keystoreProperties["storePassword"] as String

            storeFile = keystoreProperties["storeFile"]?.let {
                file(it as String)
            }
        }
    }

    // ======================
    // BUILD TYPES
    // ======================
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")

            isMinifyEnabled = false
            isShrinkResources = false
        }
    }
}

flutter {
    source = "../.."
}