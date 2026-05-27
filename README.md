# CD Kolbe Competiciones — App movil

App movil (Android e iOS) del **Club Deportivo Kolbe**, construida con Capacitor sobre el portal de competiciones `competiciones.clubdeportivokolbe.com`.

[![Build Android Debug APK](https://github.com/Davidkolbe/CDK-COMPETICIONES-APP/actions/workflows/android-debug-apk.yml/badge.svg)](https://github.com/Davidkolbe/CDK-COMPETICIONES-APP/actions/workflows/android-debug-apk.yml)

## Que es

Una app nativa con la identidad visual del CDK (verde Kolbe `#0BAB00`) que sirve de **hub del club**: punto unico de entrada a competiciones, calendario, clasificaciones, noticias, Campus y redes sociales. Las pantallas de datos en vivo se sirven desde el portal Clupik del CDK, dentro de un navegador embebido nativo con la barra de cierre del sistema.

## Arquitectura

- **App shell local** (`src/index.html`, `src/styles.css`, `src/app.js`): pantalla de inicio nativa con accesos directos, "Mi equipo" persistido en local, y banner de offline.
- **Portal Clupik del CDK**: fuente de verdad de competiciones, partidos, clasificaciones y noticias. Se abre con el plugin `@capacitor/browser` para experiencia in-app nativa.
- **Notificaciones push**: infraestructura preparada (`@capacitor/push-notifications`), permisos configurados en Android e iOS. Falta conectar Firebase Cloud Messaging para enviarlas (ver `ROADMAP_PUBLICACION.md`).
- **Deeplinks**: `cdk-competiciones://` configurado para abrir la app desde enlaces externos.

## Estructura del repo

```
src/                Codigo fuente del app shell (HTML/CSS/JS)
www/                Build copiado a la app (lo genera npm run build)
assets/             Iconos y splash maestros (PNG)
android/            Proyecto nativo Android (generado por Capacitor)
ios/                Proyecto nativo iOS (generado por Capacitor)
.github/workflows/  CI: build automatico de APK debug
icon.svg            Master del icono
splash.svg          Master del splash
```

## Como ejecutarla

Ver `GUIA_INSTALACION.md` para los pasos completos.

**Resumen rapido:**

- **Android (sin instalar nada):** ve a [Actions](https://github.com/Davidkolbe/CDK-COMPETICIONES-APP/actions), descarga el ultimo `CDK-Competiciones-debug-apk`, transfierelo a tu Android e instalalo.
- **Android (con Android Studio):** `npm install && npm run android`.
- **iOS:** requiere Mac con Xcode. `npm install && npm run ios`.

## Roadmap

Ver `ROADMAP_PUBLICACION.md` para los pasos hasta llegar a App Store y Google Play.

## Tecnologias

- [Capacitor 8](https://capacitorjs.com/) — runtime nativo
- HTML + CSS + JS vanilla (sin framework, peso minimo)
- Clupik / Leverade — backend del portal de competiciones

## Licencia

MIT — ver `LICENSE`.
