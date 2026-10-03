// UI strings for the language switcher. `en` is the source of truth: a key missing from
// `si` / `ta` falls back to English (see LanguageContext), so new strings can be added to
// `en` first. "{name}"-style placeholders are filled in by t(key, { name }).

import { pageTranslations } from './pages'
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
    'nav.buy': 'Buy',
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
      "Search thousands of homes for sale and rent — or just tell our assistant what you're picturing.",
    'hero.placeholder': 'Enter Cities',
    'hero.search': 'Search',

    'cities.title': 'Explore by city',
    'cities.subtitle': "Homes across Sri Lanka's main cities.",

    'how.title': 'How Nestwell works',
    'how.step1.title': 'Describe it',
    'how.step1.body': 'Tell our AI what you want in plain words — beds, budget, city, vibe.',
    'how.step2.title': 'See real matches',
    'how.step2.body': 'We translate that into a precise search across every live listing.',
    'how.step3.title': 'Save & tour',
    'how.step3.body': 'Keep your favorites in one place and reach out when you find the one.',

    'testimonials.title': 'Loved by movers',
    'testimonials.1.quote':
      'I typed one sentence and got exactly the three condos I ended up touring. Wild.',
    'testimonials.1.role': 'First-time buyer',
    'testimonials.2.quote':
      'The assistant answered every "how does this work" question at 11pm. Felt human.',
    'testimonials.2.role': 'Renter, Kandy',
    'testimonials.3.quote': 'Listing our units through the AI importer cut our admin time in half.',
    'testimonials.3.role': 'Property manager',

    'cta.badge': 'For agents & managers',
    'cta.title': 'List your properties in minutes',
    'cta.body':
      'Paste your listing notes and let our AI agent structure everything — or use the classic form. Admin accounts get a dedicated dashboard.',
    'cta.button': 'Get started',
    'cta.previewLabel': 'AI import preview',
    'cta.previewText': '"3BR / 2BA house, 1,540 sqft, $529,000, Colombo 05, updated kitchen…"',
    'cta.chip.beds': '3 beds',
    'cta.chip.baths': '2 baths',
    'cta.chip.city': 'Colombo',
    'cta.chip.type': 'House',

    'footer.tagline':
      "A calmer way to find your next home — with an AI assistant that actually understands what you're looking for.",
    'footer.emailPlaceholder': 'Get new listings by email',
    'footer.subscribe': 'Subscribe',
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
    'nav.buy': 'මිලදී ගන්න',
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
      'විකිණීමට සහ කුලියට ඇති නිවාස දහස් ගණනක් සොයන්න — නැතහොත් ඔබ සිතන දේ අපගේ සහායකයාට කියන්න.',
    'hero.placeholder': 'නගර ඇතුළත් කරන්න',
    'hero.search': 'සොයන්න',

    'cities.title': 'නගරය අනුව සොයන්න',
    'cities.subtitle': 'ශ්‍රී ලංකාවේ ප්‍රධාන නගරවල නිවාස.',

    'how.title': 'Nestwell ක්‍රියා කරන ආකාරය',
    'how.step1.title': 'විස්තර කරන්න',
    'how.step1.body': 'ඔබට අවශ්‍ය දේ සරල වචනවලින් අපගේ AI වෙත කියන්න — කාමර, අයවැය, නගරය.',
    'how.step2.title': 'සැබෑ ගැළපීම් බලන්න',
    'how.step2.body': 'අපි එය සියලු සජීවී ලැයිස්තු හරහා නිවැරදි සෙවුමක් බවට පත් කරමු.',
    'how.step3.title': 'සුරකින්න සහ නරඹන්න',
    'how.step3.body': 'ඔබේ ප්‍රියතම නිවාස එක තැනක තබාගෙන, සුදුසු නිවස හමු වූ විට අප අමතන්න.',

    'testimonials.title': 'අපගේ පාරිභෝගිකයින්ගේ අදහස්',
    'testimonials.1.quote':
      'මම එක වාක්‍යයක් ටයිප් කළා, අවසානයේ මා බැලීමට ගිය මහල් නිවාස තුනම ලැබුණා. පුදුමයි.',
    'testimonials.1.role': 'පළමු වරට නිවසක් මිලදී ගන්නා',
    'testimonials.2.quote':
      'රාත්‍රී 11ට මා ඇසූ සෑම ප්‍රශ්නයකටම සහායකයා පිළිතුරු දුන්නා. මිනිසෙකු සමඟ කතා කළා වගේ.',
    'testimonials.2.role': 'කුලී නිවැසියා, මහනුවර',
    'testimonials.3.quote':
      'AI ආයාතකය හරහා අපගේ නිවාස ලැයිස්තුගත කිරීමෙන් පරිපාලන කාලය අඩකින් අඩු වුණා.',
    'testimonials.3.role': 'දේපළ කළමනාකරු',

    'cta.badge': 'නියෝජිතයින් සහ කළමනාකරුවන් සඳහා',
    'cta.title': 'මිනිත්තු කිහිපයකින් ඔබේ දේපළ ලැයිස්තුගත කරන්න',
    'cta.body':
      'ඔබේ ලැයිස්තු සටහන් අලවන්න, අපගේ AI එය සකස් කරයි — නැතහොත් සාමාන්‍ය පෝරමය භාවිත කරන්න. පරිපාලක ගිණුම්වලට වෙනම පුවරුවක් ලැබේ.',
    'cta.button': 'ආරම්භ කරන්න',
    'cta.previewLabel': 'AI ආයාත පෙරදසුන',
    'cta.chip.beds': 'නිදන කාමර 3',
    'cta.chip.baths': 'නාන කාමර 2',
    'cta.chip.city': 'කොළඹ',
    'cta.chip.type': 'නිවස',

    'footer.tagline':
      'ඔබේ ඊළඟ නිවස සොයා ගැනීමට සන්සුන් මඟක් — ඔබ සොයන දේ සැබවින්ම තේරුම් ගන්නා AI සහායකයෙකු සමඟ.',
    'footer.emailPlaceholder': 'නව ලැයිස්තු ඊමේල් මගින් ලබාගන්න',
    'footer.subscribe': 'දායක වන්න',
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
    'nav.buy': 'வாங்க',
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
      'விற்பனைக்கும் வாடகைக்கும் உள்ள ஆயிரக்கணக்கான வீடுகளைத் தேடுங்கள் — அல்லது நீங்கள் நினைப்பதை எங்கள் உதவியாளரிடம் சொல்லுங்கள்.',
    'hero.placeholder': 'நகரங்களை உள்ளிடவும்',
    'hero.search': 'தேடு',

    'cities.title': 'நகரம் வாரியாகத் தேடுங்கள்',
    'cities.subtitle': 'இலங்கையின் முக்கிய நகரங்களில் உள்ள வீடுகள்.',

    'how.title': 'Nestwell எவ்வாறு செயல்படுகிறது',
    'how.step1.title': 'விவரியுங்கள்',
    'how.step1.body':
      'உங்களுக்கு என்ன வேண்டும் என்பதை எளிய சொற்களில் எங்கள் AI-யிடம் சொல்லுங்கள் — அறைகள், பட்ஜெட், நகரம்.',
    'how.step2.title': 'உண்மையான பொருத்தங்களைப் பாருங்கள்',
    'how.step2.body': 'அதை அனைத்து நேரடிப் பட்டியல்களிலும் துல்லியமான தேடலாக மாற்றுகிறோம்.',
    'how.step3.title': 'சேமித்து பார்வையிடுங்கள்',
    'how.step3.body':
      'உங்களுக்குப் பிடித்தவற்றை ஒரே இடத்தில் வைத்திருங்கள்; சரியான வீடு கிடைத்ததும் தொடர்பு கொள்ளுங்கள்.',

    'testimonials.title': 'எங்கள் வாடிக்கையாளர்களின் கருத்துகள்',
    'testimonials.1.quote':
      'ஒரே ஒரு வாக்கியம் தட்டச்சு செய்தேன்; இறுதியில் நான் பார்வையிட்ட மூன்று குடியிருப்புகளும் அப்படியே கிடைத்தன. வியப்பு.',
    'testimonials.1.role': 'முதல் முறை வீடு வாங்குபவர்',
    'testimonials.2.quote':
      'இரவு 11 மணிக்கு நான் கேட்ட ஒவ்வொரு கேள்விக்கும் உதவியாளர் பதிலளித்தார். மனிதருடன் பேசுவது போல் இருந்தது.',
    'testimonials.2.role': 'வாடகைதாரர், கண்டி',
    'testimonials.3.quote':
      'AI இறக்குமதி மூலம் எங்கள் வீடுகளைப் பட்டியலிட்டதால் நிர்வாக நேரம் பாதியாகக் குறைந்தது.',
    'testimonials.3.role': 'சொத்து மேலாளர்',

    'cta.badge': 'முகவர்கள் மற்றும் மேலாளர்களுக்கு',
    'cta.title': 'சில நிமிடங்களில் உங்கள் சொத்துகளைப் பட்டியலிடுங்கள்',
    'cta.body':
      'உங்கள் பட்டியல் குறிப்புகளை ஒட்டுங்கள்; எங்கள் AI அனைத்தையும் ஒழுங்குபடுத்தும் — அல்லது வழக்கமான படிவத்தைப் பயன்படுத்துங்கள். நிர்வாகக் கணக்குகளுக்குத் தனிப் பலகை உண்டு.',
    'cta.button': 'தொடங்குங்கள்',
    'cta.previewLabel': 'AI இறக்குமதி முன்னோட்டம்',
    'cta.chip.beds': '3 படுக்கையறைகள்',
    'cta.chip.baths': '2 குளியலறைகள்',
    'cta.chip.city': 'கொழும்பு',
    'cta.chip.type': 'வீடு',

    'footer.tagline':
      'உங்கள் அடுத்த வீட்டைக் கண்டறிய ஓர் அமைதியான வழி — நீங்கள் தேடுவதை உண்மையாகப் புரிந்துகொள்ளும் AI உதவியாளருடன்.',
    'footer.emailPlaceholder': 'புதிய பட்டியல்களை மின்னஞ்சலில் பெறுங்கள்',
    'footer.subscribe': 'பதிவு செய்க',
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
  en: { ...landingTranslations.en, ...pageTranslations.en, ...postingTranslations.en },
  si: { ...landingTranslations.si, ...pageTranslations.si, ...postingTranslations.si },
  ta: { ...landingTranslations.ta, ...pageTranslations.ta, ...postingTranslations.ta },
}

/** A city's name in the given language; unknown places (typed searches) are returned as-is. */
export function cityName(name, lang) {
  const city = CITIES.find((c) => c.name.toLowerCase() === name.toLowerCase())
  return city?.[lang] || name
}
