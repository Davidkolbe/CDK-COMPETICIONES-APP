# Guia de instalacion — CD Kolbe Competiciones

## Para probar la app sin instalar nada en tu ordenador

### Android (recomendado para empezar)

1. Ve al repo en GitHub: <https://github.com/Davidkolbe/CDK-COMPETICIONES-APP/actions>
2. Entra en la ultima ejecucion verde de **Build Android Debug APK**.
3. Baja hasta la seccion **Artifacts** y descarga `CDK-Competiciones-debug-apk` (ZIP).
4. Descomprime el ZIP en tu ordenador. Dentro hay un fichero `app-debug.apk`.
5. Transfierelo a tu Android (correo, AirDroid, Google Drive, cable USB...).
6. Abre el `.apk` desde el explorador de archivos del movil. Te pedira autorizar **instalar apps de origenes desconocidos** para el explorador de archivos. Acepta solo esta vez.
7. La app aparecera con el icono verde **CD Kolbe**.

> **Nota:** este es un APK **debug**, sin firmar comercialmente. Sirve para probarla en tu movil o el de personas de confianza. Para publicarlo en Google Play hace falta firmarlo, eso lo haremos en la fase de publicacion.

### iPhone (requiere Mac)

Apple no permite instalar apps fuera del App Store sin Xcode. Si quieres probarla en tu iPhone:

1. Necesitas un Mac con Xcode instalado (gratis en la App Store).
2. Clona el repo: `git clone https://github.com/Davidkolbe/CDK-COMPETICIONES-APP.git`
3. Dentro: `npm install && npm run sync && npx cap open ios`
4. En Xcode: selecciona tu iPhone conectado por USB y pulsa el boton "Play".
5. La firma gratuita caduca cada 7 dias (Apple ID basico). Para mas, necesitamos el Apple Developer Program (99 USD/ano).

---

## Para desarrollar en local

### Requisitos previos

- Node.js 22 o superior
- Para Android: Android Studio + Android SDK
- Para iOS: Mac con Xcode 15+

### Instalacion

```bash
git clone https://github.com/Davidkolbe/CDK-COMPETICIONES-APP.git
cd CDK-COMPETICIONES-APP
npm install
```

### Desarrollo

```bash
# Sincronizar cambios de /src a /www y propagar a Android e iOS
npm run sync

# Abrir el proyecto Android en Android Studio
npm run android

# Abrir el proyecto iOS en Xcode (solo Mac)
npm run ios
```

### Cambios en la app shell

Los archivos editables son:

- `src/index.html` — estructura
- `src/styles.css` — estilos y colores
- `src/app.js` — logica, lista de equipos, URLs

Cada vez que toques algo en `src/`, ejecuta:

```bash
npm run sync
```

para que el cambio se propague a las apps nativas.

### Cambiar iconos o splash

1. Edita `icon.svg` o `splash.svg`.
2. Regenera los PNGs:

```bash
# Master de icono
convert -background none -density 300 icon.svg -resize 1024x1024 assets/icon-1024.png
convert -background none -density 300 splash.svg -resize 2732x2732 assets/splash-2732.png

# Regenerar para Android (script manual o ejecutar de nuevo el bloque de generacion)
```

3. Copia los PNGs a las ubicaciones de Android e iOS (ver `scripts/regenerate-assets.sh` cuando exista).

---

## Probar en tu navegador (sin compilar nada)

La app shell se puede abrir directamente en el navegador para iterar el diseno:

```bash
cd src
python3 -m http.server 8080
```

Y abre <http://localhost:8080>. Veras la pantalla de inicio sin los plugins nativos (los enlaces abriran en una pestana nueva en lugar del browser embebido, las preferencias se guardan en localStorage en lugar de Capacitor Preferences, etc.).

---

## Resolucion de problemas

**"Mi APK no se instala en el movil"**
Asegurate de haber autorizado "instalar apps de origenes desconocidos" para la app desde la que abres el APK (Files, Chrome, Drive...).

**"La app abre pero la web no carga"**
Comprueba conexion. La app muestra un banner rojo "Sin conexion" si pierde red. Si tienes red y aun asi falla, abre <https://competiciones.clubdeportivokolbe.com/> en el navegador de tu movil — si tampoco carga, el problema es del portal y no de la app.

**"No me llegan notificaciones push"**
Es correcto: en esta fase la infraestructura esta preparada pero aun no hay servidor enviando push. Ver `ROADMAP_PUBLICACION.md` para los pasos de activacion.
