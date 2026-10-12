// Info condivise tra sito e app Android (android/): l'app aggiunge "BiteRanksApp/<versione>" allo user agent

// punta sempre all'APK dell'ultima GitHub Release, creata dalla Action .github/workflows/android-release.yml
export const ANDROID_APK_URL = 'https://github.com/danielegalasso/BiteRanks/releases/latest/download/BiteRanks.apk';

// dominio pubblico del sito: nell'app la pagina è servita da un indirizzo interno, non condivisibile
export const PUBLIC_SITE_URL = 'https://biteranks.com';

const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

export const isAndroidApp = userAgent.includes('BiteRanksApp');

// l'APK non si installa su iPhone/iPad (gli iPad recenti si presentano come Mac con touch)
const isIOS = /iPad|iPhone|iPod/.test(userAgent)
  || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const showAppDownload = !isAndroidApp && !isIOS;
