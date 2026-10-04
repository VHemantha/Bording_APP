// UI strings for the language switcher. `en` is the source of truth: a key missing from
// `si` / `ta` falls back to English (see LanguageContext), so new strings can be added to
// `en` first. "{name}"-style placeholders are filled in by t(key, { name }).

import { detailTranslations } from './detail'
import { pageTranslations } from './pages'
import { placesTranslations } from './places'
import { postingTranslations } from './posting'

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
]

// `name` is what the search API is queried with, so it stays in English in every language.
// lat/lng is the city centre, used to centre the map when someone posts a listing there.
export const CITIES = [
  { name: 'Colombo', lat: 6.9271, lng: 79.8612, si: 'කොළඹ', ta: 'கொழும்பு' },
  { name: 'Kandy', lat: 7.2906, lng: 80.6337, si: 'මහනුවර', ta: 'கண்டி' },
  { name: 'Galle', lat: 6.0535, lng: 80.221, si: 'ගාල්ල', ta: 'காலி' },
  { name: 'Jaffna', lat: 9.6615, lng: 80.0255, si: 'යාපනය', ta: 'யாழ்ப்பாணம்' },
  { name: 'Negombo', lat: 7.2083, lng: 79.8358, si: 'මීගමුව', ta: 'நீர்கொழும்பு' },
  { name: 'Anuradhapura', lat: 8.3114, lng: 80.4037, si: 'අනුරාධපුරය', ta: 'அனுராதபுரம்' },
  { name: 'Trincomalee', lat: 8.5874, lng: 81.2152, si: 'ත්‍රිකුණාමලය', ta: 'திருகோணமலை' },
  { name: 'Batticaloa', lat: 7.731, lng: 81.6747, si: 'මඩකලපුව', ta: 'மட்டக்களப்பு' },
  { name: 'Matara', lat: 5.9549, lng: 80.555, si: 'මාතර', ta: 'மாத்தறை' },
  { name: 'Kurunegala', lat: 7.4863, lng: 80.3647, si: 'කුරුණෑගල', ta: 'குருநாகல்' },
  { name: 'Ratnapura', lat: 6.6828, lng: 80.3992, si: 'රත්නපුර', ta: 'இரத்தினபுரி' },
  { name: 'Badulla', lat: 6.9934, lng: 81.055, si: 'බදුල්ල', ta: 'பதுளை' },
  { name: 'Nuwara Eliya', lat: 6.9497, lng: 80.7891, si: 'නුවරඑළිය', ta: 'நுவரெலியா' },
  { name: 'Gampaha', lat: 7.084, lng: 79.9939, si: 'ගම්පහ', ta: 'கம்பஹா' },
  { name: 'Kalutara', lat: 6.5854, lng: 79.9607, si: 'කළුතර', ta: 'களுத்துறை' },
  { name: 'Moratuwa', lat: 6.773, lng: 79.8816, si: 'මොරටුව', ta: 'மொறட்டுவை' },
  { name: 'Dehiwala-Mount Lavinia', lat: 6.8409, lng: 79.865, si: 'දෙහිවල-ගල්කිස්ස', ta: 'தெஹிவளை-கல்கிசை' },
  { name: 'Sri Jayawardenepura Kotte', lat: 6.8868, lng: 79.9187, si: 'ශ්‍රී ජයවර්ධනපුර කෝට්ටේ', ta: 'ஸ்ரீ ஜயவர்தனபுர கோட்டை' },
  { name: 'Vavuniya', lat: 8.7514, lng: 80.4971, si: 'වවුනියාව', ta: 'வவுனியா' },
  { name: 'Hambantota', lat: 6.1241, lng: 81.1185, si: 'හම්බන්තොට', ta: 'அம்பாந்தோட்டை' },
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
