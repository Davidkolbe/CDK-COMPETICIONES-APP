# Roadmap de publicacion — CD Kolbe Competiciones

Este documento recoge **todo lo que falta** para llegar de "app funcionando en mi movil" a "app publicada en App Store y Google Play". Lo dividimos en fases para que puedas decidir hasta donde quieres llegar.

---

## Fase actual: alfa privada

**Estado:** completado.

- App shell con identidad CDK (verde Kolbe `#0BAB00`)
- Hub funcional con accesos a competiciones, calendario, clasificaciones, noticias, Campus, info
- "Mi equipo" persistente
- Pantalla offline
- Boton refresh
- Compartir nativo
- Browser embebido para la web del CDK
- Iconos y splash en todas las densidades Android e iOS
- CI que genera APK debug automaticamente

**Como probarlo:** ver `GUIA_INSTALACION.md`.

---

## Fase 1: validacion con familias (sin coste)

**Objetivo:** confirmar que las familias del CDK descargarian y usarian la app antes de invertir en cuentas de desarrollador.

### Que hay que hacer

1. **David prueba la app durante 1-2 semanas** en su Android. Validamos UX, identifica bugs.
2. **Compartir el APK con 5-10 padres de confianza** (junta directiva, entrenadores) via WhatsApp o Drive. Recoger feedback.
3. **Decision punto de validacion:**
   - Si la gente la usa y aporta valor: pasar a Fase 2.
   - Si no: ajustar funcionalidad o descartar y quedarnos con PWA.

### Coste

- Cero.

### Tiempo

- 2-3 semanas (depende de cuanto tarden los padres en probarla).

---

## Fase 2: notificaciones push reales

**Objetivo:** activar el envio de notificaciones push para resultados, cambios de horario, etc. Esto es lo que justifica que sea una app y no solo PWA.

### Que hay que hacer

1. **Crear proyecto en Firebase Console** (gratis): <https://console.firebase.google.com>
   - Habilitar Firebase Cloud Messaging (FCM)
   - Descargar `google-services.json` y ponerlo en `android/app/`
2. **Anadir Firebase al build Android:**
   - `android/build.gradle`: anadir `classpath 'com.google.gms:google-services:4.4.2'`
   - `android/app/build.gradle`: anadir `apply plugin: 'com.google.gms.google-services'`
3. **Para iOS:** crear `GoogleService-Info.plist` y anadirlo al proyecto Xcode. Configurar APNs (Apple Push Notification Service) — requiere cuenta Apple Developer.
4. **Backend para enviar push:** dos opciones:
   - **Opcion A — Manual desde la consola Firebase:** David escribe el mensaje en la web de Firebase y se envia a todos los dispositivos. Gratis, muy simple, pero no automatizado.
   - **Opcion B — Webhook automatico:** un pequeno servicio (cloudflare workers o vercel function) que escuche resultados nuevos del Clupik y dispare push. Requiere desarrollo, ~1 sesion.
5. **Topics por equipo:** si un usuario elige "CD KOLBE BLANCO" como su equipo, suscribirlo solo a las push de ese equipo. Codigo ya preparado para extenderlo en `app.js`.

### Coste

- Firebase: gratis hasta volumenes enormes.
- Posible coste muy pequeno (~5 USD/mes) si optamos por backend automatico tipo Cloudflare Workers.

### Tiempo

- 1-2 sesiones nuestras + decision tuya sobre manual vs automatico.

---

## Fase 3: publicacion en Google Play

**Objetivo:** que los padres puedan descargar la app buscando "CD Kolbe" en Google Play.

### Pre-requisitos

1. **Cuenta Google Play Console** (25 USD, pago unico).
   - Crear en: <https://play.google.com/console/signup>
   - Recomiendo asociarla al Club o a la Fundacion, no a David personal.
2. **Politica de privacidad publicada** en una URL del club. Ejemplo: <https://www.clubdeportivokolbe.com/privacidad-app>
   - Plantilla preparada en `legal/privacy-policy-template.md`.

### Que hay que hacer

1. **Generar APK firmado (release):**
   - Crear un keystore (`.jks`): `keytool -genkey -v -keystore cdk-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias cdk`
   - Configurar `android/keystore.properties` (NO subir al repo)
   - Build: `cd android && ./gradlew assembleRelease` o `bundleRelease` (para AAB, formato preferido por Google)
2. **Subir a Google Play Console:**
   - Crear ficha de aplicacion
   - Capturas de pantalla (minimo 2): se generan facil con el emulador o tu Android
   - Icono 512x512 (ya generado en `assets/icon-1024.png` redimensionado)
   - Descripcion breve y completa
   - Categoria: Deportes
   - Politica de privacidad: URL del club
3. **Revision:** Google tarda unas horas hasta 1-2 dias.

### Coste

- 25 USD (unico).

### Tiempo

- 1 sesion nuestra para preparar el release + 1-2 dias de revision Google.

---

## Fase 4: publicacion en App Store

**Objetivo:** que los padres con iPhone puedan descargar la app buscando "CD Kolbe" en la App Store.

### Pre-requisitos

1. **Mac con Xcode 15+** (la build final solo se puede hacer desde Mac).
2. **Apple Developer Program** (99 USD/ano, recurrente). 
   - Crear en: <https://developer.apple.com/programs/enroll/>
   - Recomiendo asociarla al Club o Fundacion (cuenta de organizacion).
3. **Politica de privacidad publicada** (misma que Google Play).
4. **Capacidad de "Push Notifications" activa** en el provisioning profile (configurada desde Apple Developer Portal).

### Que hay que hacer

1. **Build en Xcode:**
   - `npm run sync` y `npx cap open ios`
   - En Xcode: cambiar el bundle ID si hace falta, asignar el equipo Apple Developer, generar archive (Product → Archive)
2. **Subir a App Store Connect** (incluido con Developer Program):
   - Crear app en <https://appstoreconnect.apple.com>
   - Subir el archive desde Xcode
   - Capturas para iPhone 6.7" y 5.5" (minimo)
   - Descripcion, categoria (Deportes), edad recomendada
   - Politica de privacidad: URL del club
   - **Cuestionario de cumplimiento de exportacion** (si o si: la app no usa cifrado custom)
3. **Revision:** Apple tarda 1-3 dias. **Riesgo:** rechazo por regla 4.2 ("solo un envoltorio de la web"). Mitigaciones que ya tenemos:
   - App shell con UI propia, no solo webview
   - "Mi equipo" persistido localmente
   - Notificaciones push reales (Fase 2 obligatoria)
   - Compartir nativo
   - Browser embebido en lugar de webview pleno

### Coste

- 99 USD/ano (mientras quieras mantener la app publicada).

### Tiempo

- 1-2 sesiones + 1-3 dias revision Apple.

---

## Total de inversion para publicacion completa

| Concepto | Coste | Recurrente |
|---|---|---|
| Google Play Console | 25 USD | No (pago unico) |
| Apple Developer Program | 99 USD | Si (anual) |
| Firebase Cloud Messaging | 0 | No |
| Politica de privacidad | 0 (la redactamos) | No |
| **TOTAL primer ano** | **124 USD** | |
| **TOTAL anos siguientes** | **99 USD/ano** | |

---

## Riesgos a vigilar

1. **Rechazo de Apple por wrapper:** mitigado con la Fase 2 (push) y app shell con valor propio. Si rechazan, ajustamos y volvemos a enviar.
2. **Mantenimiento:** cada cambio importante en la web del CDK puede requerir actualizar la app y republicar. Calcular ~2-3 actualizaciones al ano.
3. **Si dejamos de pagar el Apple Developer:** la app desaparece de App Store automaticamente. Google Play no, esa se queda publicada.
4. **GDPR y datos personales:** la app no recoge nada salvo localStorage del equipo elegido. Si se anade login en el futuro, hay que actualizar politica de privacidad.

---

## Decisiones pendientes

Estas son las que hacen falta antes de pasar de Fase 1 a 2:

- [ ] Validar interes real con familias (Fase 1)
- [ ] Decidir titular de las cuentas Apple/Google (David personal vs Fundacion vs Club)
- [ ] Decidir alcance push: solo "todos los usuarios" (mas simple) vs por equipo (mas trabajo, mas valor)
- [ ] Decidir si el envio de push es manual desde Firebase o automatico via webhook
