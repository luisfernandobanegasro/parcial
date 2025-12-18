plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.smartcondominium.condominio_app"

    // Usa el compileSdk que define Flutter (debería ser 34).
    compileSdk = flutter.compileSdkVersion

    defaultConfig {
        applicationId = "com.smartcondominium.condominio_app"
        minSdk = flutter.minSdkVersion       // asegúrate que sea 21+ (ideal 23)
        targetSdk = flutter.targetSdkVersion // 34 normalmente
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    // Habilita desugaring y define el nivel de Java/Kotlin
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11  // o VERSION_17 si prefieres
        targetCompatibility = JavaVersion.VERSION_11
        isCoreLibraryDesugaringEnabled = true
    }
    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString() // o "17" si subes arriba
    }

    buildTypes {
        getByName("release") {
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    // deja SOLO esta línea como pediste
    ndkVersion = "27.0.12077973"
}

flutter {
    source = "../.."
}

dependencies {
    // Necesario para core library desugaring (requerido por flutter_local_notifications)
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
}
