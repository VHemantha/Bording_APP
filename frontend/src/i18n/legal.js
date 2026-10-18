// Text of the About us and Privacy policy pages, per language. Each section has a heading and
// either `paragraphs` or bullet `items`. English is the fallback for a missing language.
// The privacy policy describes what this site actually does; update it when that changes.

export const LEGAL = {
  en: {
    about: {
      title: 'About us',
      intro:
        'Place helps people across Sri Lanka find a place to rent, and helps owners find good tenants. Our tagline says it best: හිතට, හරියන නිවසක් — a home that feels just right.',
      sections: [
        {
          heading: 'For people looking for a place',
          items: [
            'Search houses, annexes, apartments, upper floor houses, shops, land and commercial property in 54 cities and towns.',
            'Filter by rent, key money, bedrooms, bathrooms, furnishing, parking and more.',
            'See every listing on a map, together with nearby schools, supermarkets, hospitals and other places.',
            'Call or WhatsApp the owner directly — no middleman.',
          ],
        },
        {
          heading: 'For owners',
          items: [
            'Post a listing with photos, the exact map location and your own description.',
            'Set the monthly rent, key money in months, and whether the place is furnished.',
            'Edit or remove your listings at any time from My listings.',
          ],
        },
        {
          heading: 'In your language',
          paragraphs: ['The whole site works in English, Sinhala and Tamil. Choose your language at the top of any page.'],
        },
      ],
      contactHeading: 'Get in touch',
      contactOwners: 'Questions about a property? Contact its owner with the Call or WhatsApp buttons on the listing.',
      contactUs: 'To reach the Place team:',
    },
    privacy: {
      title: 'Privacy policy',
      updated: 'Last updated: 16 October 2026',
      intro:
        'Place is a website for finding and listing properties for rent in Sri Lanka. This policy explains what information we collect when you use the site, how we use it, and the choices you have.',
      sections: [
        {
          heading: 'Information we collect',
          items: [
            'Account details: the email address or phone number you sign up with, and your password. Passwords are stored only in a scrambled (hashed) form that nobody can read.',
            'Listings you post: the address, map location, photos, description, rent, key money and other property details, and the contact name and phone number you give.',
            'Saved homes: the listings you save to your account.',
            'Technical information: like most websites, our server records basic request details such as your IP address. We use them to keep the site working and to stop abuse.',
          ],
        },
        {
          heading: 'What is public',
          paragraphs: [
            'Listings are public. Everything in a listing, including the contact name and phone number, can be seen by anyone who visits the site. Please don’t put anything in a listing that you don’t want to share publicly.',
          ],
        },
        {
          heading: 'Photos',
          paragraphs: [
            'When you upload a photo, we re-save it on our server. This removes hidden information that phones add to photos, including the GPS location where the photo was taken.',
          ],
        },
        {
          heading: 'Stored on your device',
          paragraphs: [
            'We keep a few things in your browser’s storage: the sign-in token that keeps you signed in, your language choice and the searches you save. We don’t use advertising or tracking cookies.',
          ],
        },
        {
          heading: 'Services we rely on',
          items: [
            'Maps: maps are provided by Google Maps (or OpenStreetMap). When a map loads, your browser connects to that provider, which may receive your IP address under its own privacy policy.',
            'Nearby places: schools, shops and other places on the map come from OpenStreetMap. Our server looks them up for the area you are viewing; no personal information is sent.',
            'AI assistant and AI search: if you use them, the text you type is sent to our AI provider (Anthropic) to produce an answer. Please don’t type personal or sensitive information into them.',
            'Hosting: the site and its data are stored on servers run by our hosting provider.',
          ],
        },
        {
          heading: 'How we use your information',
          paragraphs: [
            'To run your account, show your listings, let people contact owners, keep the site secure and improve it. We do not sell your personal information and we do not share it with advertisers.',
          ],
        },
        {
          heading: 'How long we keep it',
          paragraphs: [
            'We keep your account and listings while they are active. When you delete a listing, its photos are deleted from our server. You can ask us to delete your account at any time.',
          ],
        },
        {
          heading: 'Your rights',
          paragraphs: [
            'Under Sri Lanka’s Personal Data Protection Act, No. 9 of 2022, you can ask to see, correct or delete the personal information we hold about you. Contact us using the details on our About us page.',
          ],
        },
        {
          heading: 'Children',
          paragraphs: ['Place is meant for adults. If you are under 18, please don’t create an account.'],
        },
        {
          heading: 'Changes to this policy',
          paragraphs: ['We may update this policy from time to time. The date at the top shows when it last changed.'],
        },
      ],
    },
  },

  si: {
    about: {
      title: 'අප ගැන',
      intro:
        'Place ශ්‍රී ලංකාව පුරා කුලියට නිවසක් සොයන අයට එය සොයා ගැනීමටත්, අයිතිකරුවන්ට හොඳ කුලී නිවැසියන් සොයා ගැනීමටත් උදව් කරයි. අපගේ පාඨය එය හොඳින්ම කියයි: හිතට, හරියන නිවසක්!',
      sections: [
        {
          heading: 'නිවසක් සොයන අය සඳහා',
          items: [
            'නගර සහ නගර 54ක නිවාස, ඇනෙක්සි, මහල් නිවාස, උඩුමහල් නිවාස, වෙළඳසැල්, ඉඩම් සහ වාණිජ දේපළ සොයන්න.',
            'කුලිය, අත්තිකාරම්, නිදන කාමර, නාන කාමර, ගෘහ භාණ්ඩ, වාහන නැවතුම් සහ තවත් දේ අනුව පෙරන්න.',
            'සෑම දැන්වීමක්ම ආසන්න පාසල්, සුපිරි වෙළඳසැල්, රෝහල් සහ වෙනත් ස්ථාන සමඟ සිතියමේ බලන්න.',
            'අතරමැදියෙකු නොමැතිව අයිතිකරුට සෘජුවම ඇමතීම හෝ WhatsApp කරන්න.',
          ],
        },
        {
          heading: 'අයිතිකරුවන් සඳහා',
          items: [
            'ඡායාරූප, නිවැරදි සිතියම් ස්ථානය සහ ඔබේම විස්තරයක් සමඟ දැන්වීමක් පළ කරන්න.',
            'මාසික කුලිය, අත්තිකාරම් මාස ගණන සහ ගෘහ භාණ්ඩ සහිතද යන්න සඳහන් කරන්න.',
            'මගේ දැන්වීම් වෙතින් ඕනෑම වේලාවක ඔබේ දැන්වීම් සංස්කරණය කරන්න හෝ ඉවත් කරන්න.',
          ],
        },
        {
          heading: 'ඔබේ භාෂාවෙන්',
          paragraphs: ['මුළු වෙබ් අඩවියම ඉංග්‍රීසි, සිංහල සහ දෙමළ භාෂාවලින් ක්‍රියා කරයි. ඕනෑම පිටුවක ඉහළින් ඔබේ භාෂාව තෝරන්න.'],
        },
      ],
      contactHeading: 'අප අමතන්න',
      contactOwners: 'දේපළක් ගැන ප්‍රශ්නයක් තිබේද? දැන්වීමේ ඇති ඇමතුම් හෝ WhatsApp බොත්තම් මගින් එහි අයිතිකරු අමතන්න.',
      contactUs: 'Place කණ්ඩායම ඇමතීමට:',
    },
    privacy: {
      title: 'පෞද්ගලිකත්ව ප්‍රතිපත්තිය',
      updated: 'අවසන් වරට යාවත්කාලීන කළේ: 2026 ඔක්තෝබර් 16',
      intro:
        'Place යනු ශ්‍රී ලංකාවේ කුලියට ඇති දේපළ සොයා ගැනීමට සහ දැන්වීම් පළ කිරීමට ඇති වෙබ් අඩවියකි. ඔබ වෙබ් අඩවිය භාවිත කරන විට අප එකතු කරන තොරතුරු, අප ඒවා භාවිත කරන ආකාරය සහ ඔබට ඇති තේරීම් මෙම ප්‍රතිපත්තියෙන් පැහැදිලි කරයි.',
      sections: [
        {
          heading: 'අප එකතු කරන තොරතුරු',
          items: [
            'ගිණුම් විස්තර: ඔබ ලියාපදිංචි වන ඊමේල් ලිපිනය හෝ දුරකථන අංකය සහ ඔබේ මුරපදය. මුරපද ගබඩා කරන්නේ කිසිවෙකුට කියවිය නොහැකි සංකේතිත (hashed) ආකාරයෙන් පමණි.',
            'ඔබ පළ කරන දැන්වීම්: ලිපිනය, සිතියම් ස්ථානය, ඡායාරූප, විස්තරය, කුලිය, අත්තිකාරම් සහ වෙනත් දේපළ විස්තර, සහ ඔබ දෙන සම්බන්ධතා නම සහ දුරකථන අංකය.',
            'සුරැකි නිවාස: ඔබේ ගිණුමට ඔබ සුරකින දැන්වීම්.',
            'තාක්ෂණික තොරතුරු: බොහෝ වෙබ් අඩවි මෙන්, අපගේ සේවාදායකය ඔබේ IP ලිපිනය වැනි මූලික ඉල්ලීම් විස්තර සටහන් කරයි. වෙබ් අඩවිය ක්‍රියාත්මකව තබා ගැනීමට සහ අපයෝජනය වැළැක්වීමට අපි ඒවා භාවිත කරමු.',
          ],
        },
        {
          heading: 'පොදු වන දේ',
          paragraphs: [
            'දැන්වීම් පොදු වේ. සම්බන්ධතා නම සහ දුරකථන අංකය ඇතුළුව දැන්වීමක ඇති සියල්ල වෙබ් අඩවියට පැමිණෙන ඕනෑම අයෙකුට දැකිය හැක. ප්‍රසිද්ධියේ බෙදා ගැනීමට අකමැති කිසිවක් දැන්වීමක ඇතුළත් නොකරන්න.',
          ],
        },
        {
          heading: 'ඡායාරූප',
          paragraphs: [
            'ඔබ ඡායාරූපයක් උඩුගත කළ විට, අපි එය අපගේ සේවාදායකයේ නැවත සුරකිමු. ඡායාරූපය ගත් GPS ස්ථානය ඇතුළුව දුරකථන ඡායාරූපවලට එක් කරන සැඟවුණු තොරතුරු මෙමගින් ඉවත් වේ.',
          ],
        },
        {
          heading: 'ඔබේ උපාංගයේ ගබඩා වන දේ',
          paragraphs: [
            'අපි ඔබේ බ්‍රවුසරයේ ගබඩාවේ දේවල් කිහිපයක් තබා ගනිමු: ඔබව පිවිසී සිටීමට තබන පිවිසුම් ටෝකනය, ඔබේ භාෂා තේරීම සහ ඔබ සුරකින සෙවුම්. අපි දැන්වීම් හෝ ලුහුබැඳීමේ කුකීස් භාවිත නොකරමු.',
          ],
        },
        {
          heading: 'අප භාවිත කරන සේවා',
          items: [
            'සිතියම්: සිතියම් සපයන්නේ Google Maps (හෝ OpenStreetMap) මගිනි. සිතියමක් පූරණය වන විට ඔබේ බ්‍රවුසරය එම සේවාවට සම්බන්ධ වන අතර, එයට එහිම පෞද්ගලිකත්ව ප්‍රතිපත්තිය යටතේ ඔබේ IP ලිපිනය ලැබිය හැක.',
            'අවට ස්ථාන: සිතියමේ පාසල්, වෙළඳසැල් සහ වෙනත් ස්ථාන OpenStreetMap වෙතින් ලැබේ. ඔබ බලන ප්‍රදේශය සඳහා අපගේ සේවාදායකය ඒවා සොයයි; පෞද්ගලික තොරතුරු කිසිවක් යවනු නොලැබේ.',
            'AI සහායකයා සහ AI සෙවුම: ඔබ ඒවා භාවිත කරන්නේ නම්, ඔබ ටයිප් කරන පෙළ පිළිතුරක් සැකසීමට අපගේ AI සේවා සපයන්නා (Anthropic) වෙත යවනු ලැබේ. පෞද්ගලික හෝ සංවේදී තොරතුරු ඒවාට ටයිප් නොකරන්න.',
            'සත්කාරකත්වය: වෙබ් අඩවිය සහ එහි දත්ත අපගේ සත්කාරක සේවා සපයන්නාගේ සේවාදායකවල ගබඩා කර ඇත.',
          ],
        },
        {
          heading: 'අප ඔබේ තොරතුරු භාවිත කරන ආකාරය',
          paragraphs: [
            'ඔබේ ගිණුම පවත්වා ගැනීමට, ඔබේ දැන්වීම් පෙන්වීමට, අයිතිකරුවන් ඇමතීමට ඉඩ දීමට, වෙබ් අඩවිය ආරක්ෂිතව තබා ගැනීමට සහ එය වැඩිදියුණු කිරීමට. අපි ඔබේ පෞද්ගලික තොරතුරු විකුණන්නේ හෝ දැන්වීම්කරුවන් සමඟ බෙදා ගන්නේ නැත.',
          ],
        },
        {
          heading: 'අප ඒවා තබා ගන්නා කාලය',
          paragraphs: [
            'ඔබේ ගිණුම සහ දැන්වීම් සක්‍රීයව පවතින තාක් අපි ඒවා තබා ගනිමු. ඔබ දැන්වීමක් මකා දැමූ විට, එහි ඡායාරූප අපගේ සේවාදායකයෙන් මකා දැමේ. ඕනෑම වේලාවක ඔබේ ගිණුම මකා දැමීමට ඔබට ඉල්ලීමක් කළ හැක.',
          ],
        },
        {
          heading: 'ඔබේ අයිතිවාසිකම්',
          paragraphs: [
            '2022 අංක 9 දරන ශ්‍රී ලංකා පුද්ගලික දත්ත ආරක්ෂණ පනත යටතේ, අප සතු ඔබ පිළිබඳ පෞද්ගලික තොරතුරු බැලීමට, නිවැරදි කිරීමට හෝ මකා දැමීමට ඔබට ඉල්ලිය හැක. අප ගැන පිටුවේ ඇති විස්තර භාවිත කර අප අමතන්න.',
          ],
        },
        {
          heading: 'ළමයින්',
          paragraphs: ['Place වැඩිහිටියන් සඳහා වේ. ඔබ වයස අවුරුදු 18ට අඩු නම්, කරුණාකර ගිණුමක් සාදන්න එපා.'],
        },
        {
          heading: 'මෙම ප්‍රතිපත්තියේ වෙනස්කම්',
          paragraphs: ['අපි කලින් කලට මෙම ප්‍රතිපත්තිය යාවත්කාලීන කළ හැක. එය අවසන් වරට වෙනස් වූ දිනය ඉහළින් පෙන්වයි.'],
        },
      ],
    },
  },

  ta: {
    about: {
      title: 'எங்களைப் பற்றி',
      intro:
        'Place இலங்கை முழுவதும் வாடகைக்கு வீடு தேடுபவர்களுக்கு அதைக் கண்டறியவும், உரிமையாளர்களுக்கு நல்ல குடியிருப்பாளர்களைக் கண்டறியவும் உதவுகிறது. எங்கள் வாசகம் அதைச் சிறப்பாகச் சொல்கிறது: மனதுக்கு ஏற்ற ஒரு வீடு.',
      sections: [
        {
          heading: 'வீடு தேடுபவர்களுக்கு',
          items: [
            '54 நகரங்களில் வீடுகள், இணைப்பு வீடுகள், அடுக்குமாடி வீடுகள், மேல்மாடி வீடுகள், கடைகள், நிலம் மற்றும் வணிகச் சொத்துகளைத் தேடுங்கள்.',
            'வாடகை, முன்பணம், படுக்கையறைகள், குளியலறைகள், தளபாடங்கள், வாகன நிறுத்தம் போன்றவற்றின்படி வடிகட்டுங்கள்.',
            'ஒவ்வொரு விளம்பரத்தையும் அருகிலுள்ள பள்ளிகள், பல்பொருள் அங்காடிகள், மருத்துவமனைகள் மற்றும் பிற இடங்களுடன் வரைபடத்தில் பாருங்கள்.',
            'இடைத்தரகர் இல்லாமல் உரிமையாளரை நேரடியாக அழைக்கவும் அல்லது WhatsApp செய்யவும்.',
          ],
        },
        {
          heading: 'உரிமையாளர்களுக்கு',
          items: [
            'புகைப்படங்கள், சரியான வரைபட இருப்பிடம் மற்றும் உங்கள் சொந்த விளக்கத்துடன் விளம்பரம் இடுங்கள்.',
            'மாத வாடகை, முன்பண மாதங்கள் மற்றும் தளபாடங்கள் உள்ளதா என்பதைக் குறிப்பிடுங்கள்.',
            'எனது விளம்பரங்கள் பகுதியிலிருந்து எப்போது வேண்டுமானாலும் உங்கள் விளம்பரங்களைத் திருத்தலாம் அல்லது நீக்கலாம்.',
          ],
        },
        {
          heading: 'உங்கள் மொழியில்',
          paragraphs: ['முழு இணையதளமும் ஆங்கிலம், சிங்களம் மற்றும் தமிழில் இயங்குகிறது. எந்தப் பக்கத்தின் மேலும் உங்கள் மொழியைத் தேர்ந்தெடுங்கள்.'],
        },
      ],
      contactHeading: 'தொடர்பு கொள்ள',
      contactOwners: 'ஒரு சொத்து பற்றிக் கேள்விகள் உள்ளதா? விளம்பரத்தில் உள்ள அழைப்பு அல்லது WhatsApp பொத்தான்கள் மூலம் அதன் உரிமையாளரைத் தொடர்பு கொள்ளுங்கள்.',
      contactUs: 'Place குழுவைத் தொடர்பு கொள்ள:',
    },
    privacy: {
      title: 'தனியுரிமைக் கொள்கை',
      updated: 'கடைசியாகப் புதுப்பிக்கப்பட்டது: 16 அக்டோபர் 2026',
      intro:
        'Place என்பது இலங்கையில் வாடகைக்கு உள்ள சொத்துகளைக் கண்டறியவும் விளம்பரப்படுத்தவும் உதவும் இணையதளம். நீங்கள் இணையதளத்தைப் பயன்படுத்தும்போது நாங்கள் சேகரிக்கும் தகவல்கள், அவற்றை நாங்கள் பயன்படுத்தும் விதம் மற்றும் உங்களுக்கு உள்ள தேர்வுகளை இந்தக் கொள்கை விளக்குகிறது.',
      sections: [
        {
          heading: 'நாங்கள் சேகரிக்கும் தகவல்கள்',
          items: [
            'கணக்கு விவரங்கள்: நீங்கள் பதிவு செய்யும் மின்னஞ்சல் முகவரி அல்லது தொலைபேசி எண், மற்றும் உங்கள் கடவுச்சொல். கடவுச்சொற்கள் யாராலும் படிக்க முடியாத குறியாக்க (hashed) வடிவில் மட்டுமே சேமிக்கப்படுகின்றன.',
            'நீங்கள் இடும் விளம்பரங்கள்: முகவரி, வரைபட இருப்பிடம், புகைப்படங்கள், விளக்கம், வாடகை, முன்பணம் மற்றும் பிற சொத்து விவரங்கள், மற்றும் நீங்கள் தரும் தொடர்புப் பெயர் மற்றும் தொலைபேசி எண்.',
            'சேமித்த வீடுகள்: உங்கள் கணக்கில் நீங்கள் சேமிக்கும் விளம்பரங்கள்.',
            'தொழில்நுட்பத் தகவல்கள்: பெரும்பாலான இணையதளங்களைப் போலவே, எங்கள் சேவையகம் உங்கள் IP முகவரி போன்ற அடிப்படைக் கோரிக்கை விவரங்களைப் பதிவு செய்கிறது. இணையதளத்தை இயங்க வைக்கவும் தவறான பயன்பாட்டைத் தடுக்கவும் இவற்றைப் பயன்படுத்துகிறோம்.',
          ],
        },
        {
          heading: 'பொதுவில் தெரிபவை',
          paragraphs: [
            'விளம்பரங்கள் பொதுவானவை. தொடர்புப் பெயர் மற்றும் தொலைபேசி எண் உட்பட விளம்பரத்தில் உள்ள அனைத்தையும் இணையதளத்துக்கு வரும் எவரும் பார்க்கலாம். பொதுவில் பகிர விரும்பாத எதையும் விளம்பரத்தில் சேர்க்க வேண்டாம்.',
          ],
        },
        {
          heading: 'புகைப்படங்கள்',
          paragraphs: [
            'நீங்கள் புகைப்படத்தைப் பதிவேற்றும்போது, அதை எங்கள் சேவையகத்தில் மீண்டும் சேமிக்கிறோம். இதனால், புகைப்படம் எடுக்கப்பட்ட GPS இருப்பிடம் உட்பட தொலைபேசிகள் புகைப்படங்களில் சேர்க்கும் மறைந்த தகவல்கள் நீக்கப்படுகின்றன.',
          ],
        },
        {
          heading: 'உங்கள் சாதனத்தில் சேமிக்கப்படுபவை',
          paragraphs: [
            'உங்கள் உலாவியின் சேமிப்பகத்தில் சில விஷயங்களை வைத்திருக்கிறோம்: உங்களை உள்நுழைந்த நிலையில் வைத்திருக்கும் உள்நுழைவு டோக்கன், உங்கள் மொழித் தேர்வு மற்றும் நீங்கள் சேமிக்கும் தேடல்கள். நாங்கள் விளம்பர அல்லது கண்காணிப்பு குக்கீகளைப் பயன்படுத்துவதில்லை.',
          ],
        },
        {
          heading: 'நாங்கள் பயன்படுத்தும் சேவைகள்',
          items: [
            'வரைபடங்கள்: வரைபடங்களை Google Maps (அல்லது OpenStreetMap) வழங்குகிறது. வரைபடம் ஏற்றப்படும்போது உங்கள் உலாவி அந்த வழங்குநருடன் இணைகிறது; அது தனது சொந்தத் தனியுரிமைக் கொள்கையின்படி உங்கள் IP முகவரியைப் பெறலாம்.',
            'அருகிலுள்ள இடங்கள்: வரைபடத்தில் உள்ள பள்ளிகள், கடைகள் மற்றும் பிற இடங்கள் OpenStreetMap இலிருந்து வருகின்றன. நீங்கள் பார்க்கும் பகுதிக்காக எங்கள் சேவையகம் அவற்றைத் தேடுகிறது; தனிப்பட்ட தகவல் எதுவும் அனுப்பப்படுவதில்லை.',
            'AI உதவியாளர் மற்றும் AI தேடல்: நீங்கள் அவற்றைப் பயன்படுத்தினால், நீங்கள் தட்டச்சு செய்யும் உரை பதிலை உருவாக்க எங்கள் AI வழங்குநருக்கு (Anthropic) அனுப்பப்படும். தனிப்பட்ட அல்லது உணர்திறன் வாய்ந்த தகவல்களை அவற்றில் தட்டச்சு செய்ய வேண்டாம்.',
            'வழங்கல் (Hosting): இணையதளமும் அதன் தரவும் எங்கள் வழங்குநரின் சேவையகங்களில் சேமிக்கப்படுகின்றன.',
          ],
        },
        {
          heading: 'உங்கள் தகவல்களை நாங்கள் பயன்படுத்தும் விதம்',
          paragraphs: [
            'உங்கள் கணக்கை இயக்க, உங்கள் விளம்பரங்களைக் காட்ட, உரிமையாளர்களைத் தொடர்பு கொள்ள உதவ, இணையதளத்தைப் பாதுகாப்பாக வைத்திருக்க மற்றும் மேம்படுத்த. உங்கள் தனிப்பட்ட தகவல்களை நாங்கள் விற்பதில்லை, விளம்பரதாரர்களுடன் பகிர்வதுமில்லை.',
          ],
        },
        {
          heading: 'எவ்வளவு காலம் வைத்திருக்கிறோம்',
          paragraphs: [
            'உங்கள் கணக்கும் விளம்பரங்களும் செயலில் இருக்கும் வரை அவற்றை வைத்திருக்கிறோம். நீங்கள் ஒரு விளம்பரத்தை நீக்கும்போது, அதன் புகைப்படங்கள் எங்கள் சேவையகத்திலிருந்து நீக்கப்படும். எப்போது வேண்டுமானாலும் உங்கள் கணக்கை நீக்கக் கோரலாம்.',
          ],
        },
        {
          heading: 'உங்கள் உரிமைகள்',
          paragraphs: [
            '2022 ஆம் ஆண்டின் 9 ஆம் இலக்க இலங்கை தனிப்பட்ட தரவுப் பாதுகாப்புச் சட்டத்தின் கீழ், நாங்கள் வைத்திருக்கும் உங்களைப் பற்றிய தனிப்பட்ட தகவல்களைப் பார்க்க, திருத்த அல்லது நீக்கக் கோரலாம். எங்களைப் பற்றி பக்கத்தில் உள்ள விவரங்கள் மூலம் தொடர்பு கொள்ளுங்கள்.',
          ],
        },
        {
          heading: 'சிறுவர்கள்',
          paragraphs: ['Place பெரியவர்களுக்கானது. நீங்கள் 18 வயதுக்குக் குறைவானவராக இருந்தால், கணக்கை உருவாக்க வேண்டாம்.'],
        },
        {
          heading: 'இந்தக் கொள்கையில் மாற்றங்கள்',
          paragraphs: ['இந்தக் கொள்கையை அவ்வப்போது புதுப்பிக்கலாம். கடைசியாக மாற்றப்பட்ட தேதி மேலே காட்டப்படும்.'],
        },
      ],
    },
  },
}
