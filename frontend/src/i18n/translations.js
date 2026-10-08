// UI strings for the language switcher. `en` is the source of truth: a key missing from
// `si` / `ta` falls back to English (see LanguageContext), so new strings can be added to
// `en` first. "{name}"-style placeholders are filled in by t(key, { name }).

import { detailTranslations } from './detail'
import { pageTranslations } from './pages'
import { placesTranslations } from './places'
import { postingTranslations } from './posting'

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'si', label: 'සිංහල', short: 'SI' },
  { code: 'ta', label: 'தமிழ்', short: 'TA' },
]

// `name` is what the search API is queried with, so it stays in English in every language.
// lat/lng is the city centre, used to centre the map when someone posts a listing there.
export const CITIES = [
  { name: 'Colombo', lat: 6.9271, lng: 79.8612, si: 'කොළඹ', ta: 'கொழும்பு' },
  { name: 'Kesbewa', lat: 6.7957, lng: 79.9408, si: 'කැස්බෑව', ta: 'கெஸ்பேவ' },
  { name: 'Mount Lavinia', lat: 6.8317, lng: 79.8628, si: 'ගල්කිස්ස', ta: 'கல்கிசை' },
  { name: 'Maharagama', lat: 6.8473, lng: 79.9266, si: 'මහරගම', ta: 'மகரகம' },
  { name: 'Gampaha', lat: 7.0917, lng: 79.9999, si: 'ගම්පහ', ta: 'கம்பஹா' },
  { name: 'Moratuwa', lat: 6.7747, lng: 79.8826, si: 'මොරටුව', ta: 'மொறட்டுவை' },
  { name: 'Ratnapura', lat: 6.6828, lng: 80.3992, si: 'රත්නපුර', ta: 'இரத்தினபுரி' },
  { name: 'Negombo', lat: 7.2094, lng: 79.8331, si: 'මීගමුව', ta: 'நீர்கொழும்பு' },
  { name: 'Kandy', lat: 7.2931, lng: 80.635, si: 'මහනුවර', ta: 'கண்டி' },
  { name: 'Sri Jayewardenepura Kotte', lat: 6.8883, lng: 79.9187, si: 'ශ්‍රී ජයවර්ධනපුර කෝට්ටේ', ta: 'ஸ்ரீ ஜயவர்தனபுர கோட்டை' },
  { name: 'Mawanella', lat: 7.2523, lng: 80.446, si: 'මාවනැල්ල', ta: 'மாவனெல்லை' },
  { name: 'Kotmale', lat: 7.0608, lng: 80.5969, si: 'කොත්මලේ', ta: 'கொத்மலை' },
  { name: 'Kilinochchi', lat: 9.384, lng: 80.4087, si: 'කිලිනොච්චිය', ta: 'கிளிநொச்சி' },
  { name: 'Hikkaduwa', lat: 6.1408, lng: 80.1028, si: 'හික්කඩුව', ta: 'ஹிக்கடுவை' },
  { name: 'Trincomalee', lat: 8.5764, lng: 81.2345, si: 'ත්‍රිකුණාමලය', ta: 'திருகோணமலை' },
  { name: 'Batticaloa', lat: 7.731, lng: 81.6747, si: 'මඩකලපුව', ta: 'மட்டக்களப்பு' },
  { name: 'Galle', lat: 6.0328, lng: 80.215, si: 'ගාල්ල', ta: 'காலி' },
  { name: 'Kalmunai', lat: 7.4132, lng: 81.8269, si: 'කල්මුණේ', ta: 'கல்முனை' },
  { name: 'Jaffna', lat: 9.6651, lng: 80.0093, si: 'යාපනය', ta: 'யாழ்ப்பாணம்' },
  { name: 'Vavuniya', lat: 8.7594, lng: 80.5001, si: 'වවුනියාව', ta: 'வவுனியா' },
  { name: 'Weligama', lat: 5.9751, lng: 80.4291, si: 'වැලිගම', ta: 'வெலிகம' },
  { name: 'Tangalla', lat: 6.0243, lng: 80.7941, si: 'තංගල්ල', ta: 'தங்காலை' },
  { name: 'Matara', lat: 5.9478, lng: 80.5483, si: 'මාතර', ta: 'மாத்தறை' },
  { name: 'Kalpitiya', lat: 8.2368, lng: 79.7662, si: 'කල්පිටිය', ta: 'கற்பிட்டி' },
  { name: 'Kolonnawa', lat: 6.9326, lng: 79.8903, si: 'කොලොන්නාව', ta: 'கொலன்னாவை' },
  { name: 'Akurana', lat: 7.3603, lng: 80.6006, si: 'අකුරණ', ta: 'அக்குறணை' },
  { name: 'Anuradhapura', lat: 8.335, lng: 80.4106, si: 'අනුරාධපුරය', ta: 'அனுராதபுரம்' },
  { name: 'Puttalam', lat: 8.0362, lng: 79.8283, si: 'පුත්තලම', ta: 'புத்தளம்' },
  { name: 'Badulla', lat: 6.99, lng: 81.057, si: 'බදුල්ල', ta: 'பதுளை' },
  { name: 'Mullaittivu', lat: 9.2671, lng: 80.8142, si: 'මුලතිව්', ta: 'முல்லைத்தீவு' },
  { name: 'Kalutara', lat: 6.5854, lng: 79.9607, si: 'කළුතර', ta: 'களுத்துறை' },
  { name: 'Bentota', lat: 6.4215, lng: 79.9979, si: 'බෙන්තොට', ta: 'பெந்தோட்டை' },
  { name: 'Matale', lat: 7.4675, lng: 80.6234, si: 'මාතලේ', ta: 'மாத்தளை' },
  { name: 'Mannar', lat: 8.9813, lng: 79.9044, si: 'මන්නාරම', ta: 'மன்னார்' },
  { name: 'Bandarawela', lat: 6.8305, lng: 80.9888, si: 'බණ්ඩාරවෙල', ta: 'பண்டாரவளை' },
  { name: 'Point Pedro', lat: 9.8241, lng: 80.2362, si: 'පේදුරුතුඩුව', ta: 'பருத்தித்துறை' },
  { name: 'Kurunegala', lat: 7.487, lng: 80.3649, si: 'කුරුණෑගල', ta: 'குருநாகல்' },
  { name: 'Mabole', lat: 7.0049, lng: 79.8969, si: 'මාබෝල', ta: 'மாபோல' },
  { name: 'Gampola', lat: 7.1636, lng: 80.5703, si: 'ගම්පොළ', ta: 'கம்பளை' },
  { name: 'Nuwara Eliya', lat: 6.9497, lng: 80.7891, si: 'නුවරඑළිය', ta: 'நுவரெலியா' },
  { name: 'Galhinna', lat: 7.4184, lng: 80.5633, si: 'ගල්හින්න', ta: 'கல்ஹின்ன' },
  { name: 'Kegalle', lat: 7.2513, lng: 80.3464, si: 'කෑගල්ල', ta: 'கேகாலை' },
  { name: 'Hatton', lat: 6.8916, lng: 80.5985, si: 'හැටන්', ta: 'ஹட்டன்' },
  { name: 'Gandara West', lat: 5.9377, lng: 80.6134, si: 'ගන්දර බටහිර', ta: 'கந்தர மேற்கு' },
  { name: 'Hambantota', lat: 6.1249, lng: 81.1243, si: 'හම්බන්තොට', ta: 'அம்பாந்தோட்டை' },
  { name: 'Abasingammedda', lat: 7.317, lng: 80.667, si: 'අබසිංගම්මැද්ද', ta: 'அபசிங்கம்மெத்த' },
  { name: 'Monaragala', lat: 6.8727, lng: 81.3506, si: 'මොණරාගල', ta: 'மொனராகலை' },
  { name: 'Polikandi', lat: 9.8162, lng: 80.1859, si: 'පොලිකණ්ඩි', ta: 'பொலிகண்டி' },
  { name: 'Athurugiriya', lat: 6.878, lng: 79.99, si: 'අතුරුගිරිය', ta: 'அத்துருகிரிய' },
  { name: 'Mirissa South', lat: 5.9494, lng: 80.4558, si: 'මිරිස්ස දකුණ', ta: 'மிரிஸ்ஸ தெற்கு' },
  { name: 'Oruwala', lat: 6.8919, lng: 79.9955, si: 'ඔරුවල', ta: 'ஒருவல' },
  { name: 'Yakkala', lat: 7.0859, lng: 80.0336, si: 'යක්කල', ta: 'யக்கல' },
  { name: 'Nittambuwa', lat: 7.1441, lng: 80.0965, si: 'නිට්ටඹුව', ta: 'நிட்டம்புவ' },
  { name: 'Wathupitiwala', lat: 7.1256, lng: 80.111, si: 'වතුපිටිවල', ta: 'வத்துப்பிட்டிவல' },
]

const landingTranslations = {
  en: {
    'nav.rent': 'Rent',
    'nav.browse': 'Browse all',
    'nav.saved': 'Saved',
    'nav.savedHomes': 'Saved homes',
    'nav.admin': 'Admin',
    'nav.adminDashboard': 'Admin dashboard',
    'nav.signIn': 'Sign in',
    'nav.logOut': 'Log out',
    'nav.hi': 'Hi, {name}',
    'nav.language': 'Language',
    'nav.menu': 'Menu',

    'hero.title': 'Find a home that fits your life',
    'hero.subtitle':
      "Search houses, annexes, apartments and shops for rent across Sri Lanka — or just tell our assistant what you're picturing.",
    'hero.placeholder': 'Enter Cities',
    'hero.search': 'Search',

    'cities.title': 'Explore by city',
    'cities.subtitle': "Homes across Sri Lanka's main cities.",
    'cities.showAll': 'Show all {count} cities',
    'cities.showLess': 'Show fewer cities',




    'footer.explore': 'Explore',
    'footer.company': 'Company',
    'footer.support': 'Support',
    'footer.about': 'About',
    'footer.careers': 'Careers',
    'footer.press': 'Press',
    'footer.help': 'Help center',
    'footer.contact': 'Contact',
    'footer.privacy': 'Privacy',
    'footer.copyright': 'Listings shown are sample data for demonstration.',
  },

  si: {
    'nav.rent': 'කුලියට',
    'nav.browse': 'සියල්ල බලන්න',
    'nav.saved': 'සුරැකි',
    'nav.savedHomes': 'සුරැකි නිවාස',
    'nav.admin': 'පරිපාලක',
    'nav.adminDashboard': 'පරිපාලක පුවරුව',
    'nav.signIn': 'පිවිසෙන්න',
    'nav.logOut': 'ඉවත් වන්න',
    'nav.hi': 'ආයුබෝවන්, {name}',
    'nav.language': 'භාෂාව',
    'nav.menu': 'මෙනුව',

    'hero.title': 'ඔබේ ජීවිතයට ගැළපෙන නිවසක් සොයාගන්න',
    'hero.subtitle':
      'ශ්‍රී ලංකාව පුරා කුලියට ඇති නිවාස, ඇනෙක්සි, මහල් නිවාස සහ වෙළඳසැල් සොයන්න — නැතහොත් ඔබ සිතන දේ අපගේ සහායකයාට කියන්න.',
    'hero.placeholder': 'නගර ඇතුළත් කරන්න',
    'hero.search': 'සොයන්න',

    'cities.title': 'නගරය අනුව සොයන්න',
    'cities.subtitle': 'ශ්‍රී ලංකාවේ ප්‍රධාන නගරවල නිවාස.',
    'cities.showAll': 'නගර {count} ම පෙන්වන්න',
    'cities.showLess': 'නගර අඩුවෙන් පෙන්වන්න',




    'footer.explore': 'ගවේෂණය',
    'footer.company': 'සමාගම',
    'footer.support': 'සහාය',
    'footer.about': 'අප ගැන',
    'footer.careers': 'රැකියා',
    'footer.press': 'මාධ්‍ය',
    'footer.help': 'උදව් මධ්‍යස්ථානය',
    'footer.contact': 'අමතන්න',
    'footer.privacy': 'පෞද්ගලිකත්වය',
    'footer.copyright': 'පෙන්වා ඇති ලැයිස්තු ආදර්ශනය සඳහා වන නියැදි දත්ත වේ.',
  },

  ta: {
    'nav.rent': 'வாடகை',
    'nav.browse': 'அனைத்தையும் பார்க்க',
    'nav.saved': 'சேமித்தவை',
    'nav.savedHomes': 'சேமித்த வீடுகள்',
    'nav.admin': 'நிர்வாகம்',
    'nav.adminDashboard': 'நிர்வாகப் பலகை',
    'nav.signIn': 'உள்நுழைக',
    'nav.logOut': 'வெளியேறு',
    'nav.hi': 'வணக்கம், {name}',
    'nav.language': 'மொழி',
    'nav.menu': 'பட்டி',

    'hero.title': 'உங்கள் வாழ்க்கைக்கு ஏற்ற வீட்டைக் கண்டறியுங்கள்',
    'hero.subtitle':
      'இலங்கை முழுவதும் வாடகைக்கு உள்ள வீடுகள், இணைப்பு வீடுகள், அடுக்குமாடி வீடுகள் மற்றும் கடைகளைத் தேடுங்கள் — அல்லது நீங்கள் நினைப்பதை எங்கள் உதவியாளரிடம் சொல்லுங்கள்.',
    'hero.placeholder': 'நகரங்களை உள்ளிடவும்',
    'hero.search': 'தேடு',

    'cities.title': 'நகரம் வாரியாகத் தேடுங்கள்',
    'cities.subtitle': 'இலங்கையின் முக்கிய நகரங்களில் உள்ள வீடுகள்.',
    'cities.showAll': 'அனைத்து {count} நகரங்களையும் காட்டு',
    'cities.showLess': 'குறைவான நகரங்களைக் காட்டு',




    'footer.explore': 'ஆராயுங்கள்',
    'footer.company': 'நிறுவனம்',
    'footer.support': 'உதவி',
    'footer.about': 'எங்களைப் பற்றி',
    'footer.careers': 'வேலைவாய்ப்புகள்',
    'footer.press': 'ஊடகம்',
    'footer.help': 'உதவி மையம்',
    'footer.contact': 'தொடர்பு',
    'footer.privacy': 'தனியுரிமை',
    'footer.copyright': 'காட்டப்படும் பட்டியல்கள் செயல்விளக்கத்திற்கான மாதிரித் தரவு.',
  },
}

export const translations = {
  en: { ...landingTranslations.en, ...pageTranslations.en, ...postingTranslations.en, ...placesTranslations.en, ...detailTranslations.en },
  si: { ...landingTranslations.si, ...pageTranslations.si, ...postingTranslations.si, ...placesTranslations.si, ...detailTranslations.si },
  ta: { ...landingTranslations.ta, ...pageTranslations.ta, ...postingTranslations.ta, ...placesTranslations.ta, ...detailTranslations.ta },
}

/** A city's name in the given language; unknown places (typed searches) are returned as-is. */
export function cityName(name, lang) {
  const city = CITIES.find((c) => c.name.toLowerCase() === name.toLowerCase())
  return city?.[lang] || name
}
