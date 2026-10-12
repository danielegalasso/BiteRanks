# App Android

L'app è una WebView che mostra il sito compilato (`vite-project/dist`), incluso dentro l'APK.

## Come si aggiorna

1. Fai push su `main` di modifiche in `vite-project/` o `android/`.
2. La GitHub Action `.github/workflows/android-release.yml` compila il sito e l'APK, poi pubblica una
   GitHub Release (`app-v1.0.<numero build>`) con `BiteRanks.apk` e `version.json`.
3. A ogni apertura (anche quando torna in primo piano, al massimo una volta al minuto) l'app legge
   `version.json` dell'ultima release: se la versione è più nuova chiede
   "Aggiornamento disponibile", scarica l'APK e apre l'installer di Android.

Fuori dal Play Store Android non permette aggiornamenti silenziosi: l'utente conferma sempre l'installazione
(la prima volta deve anche consentire a BiteRanks di "installare app sconosciute").

Il bottone "App" sul sito scarica sempre l'ultimo APK:
https://github.com/danielegalasso/BiteRanks/releases/latest/download/BiteRanks.apk

## Chiave di firma (da fare una volta)

Tutti gli APK devono essere firmati con la stessa chiave, altrimenti Android rifiuta l'aggiornamento.
La chiave è in `android/biteranks-release.jks` e la password in `android/keystore.properties`:
entrambi sono ignorati da git. **Fanne un backup**: se la perdi, chi ha l'app deve disinstallarla e reinstallarla.

Su GitHub: Settings → Secrets and variables → Actions → New repository secret

| Secret | Valore |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | output di `base64 -w0 android/biteranks-release.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | il valore di `storePassword` in `android/keystore.properties` |

Poi: Actions → App Android → Run workflow (oppure un push) per la prima release.

## Build in locale

Serve un JDK 17+ e l'Android SDK (`ANDROID_HOME`).

> cd vite-project && npm run build
> cd ../android && ./gradlew assembleRelease

L'APK è in `android/app/build/outputs/apk/release/app-release.apk`. Le build locali hanno versione 1,
quindi l'app propone subito di aggiornarsi all'ultima release.
