"""Sri Lanka's 25 districts and the main cities and towns in each, in English, Sinhala and Tamil.

The one list the whole site uses: the home page's district cards, the listing form's district
and town choices, and the district stored on each listing (worked out from its city when the
owner didn't pick one). Served by GET /api/locations/ together with listing counts.
Each town is (English, Sinhala, Tamil). The order is roughly by size, biggest first.
Colombo city is split into its 15 postal zones (COLOMBO_ZONES), listed first and in order.
"""

# Colombo 1-15: (number, area in English, Sinhala, Tamil, centre). Stored on listings as the
# city "Colombo 3" etc.; the area is shown under the name on the home page and in the form.
COLOMBO_ZONES = [
    (1, 'Fort', 'කොටුව', 'கோட்டை', (6.9344, 79.8428)),
    (2, 'Slave Island', 'කොම්පඤ්ඤවීදිය', 'கொம்பனித்தெரு', (6.9214, 79.8494)),
    (3, 'Kollupitiya', 'කොල්ලුපිටිය', 'கொள்ளுப்பிட்டி', (6.9106, 79.8507)),
    (4, 'Bambalapitiya', 'බම්බලපිටිය', 'பம்பலப்பிட்டி', (6.8897, 79.8559)),
    (5, 'Havelock Town', 'හැව්ලොක් නගරය', 'ஹெவ்லொக் நகரம்', (6.8818, 79.8687)),
    (6, 'Wellawatte', 'වැල්ලවත්ත', 'வெள்ளவத்தை', (6.8742, 79.8605)),
    (7, 'Cinnamon Gardens', 'කුරුඳු වත්ත', 'கறுவாத்தோட்டம்', (6.9094, 79.8636)),
    (8, 'Borella', 'බොරැල්ල', 'பொரளை', (6.9147, 79.8778)),
    (9, 'Dematagoda', 'දෙමටගොඩ', 'தெமட்டகொடை', (6.9333, 79.8778)),
    (10, 'Maradana', 'මරදාන', 'மருதானை', (6.9286, 79.8653)),
    (11, 'Pettah', 'පිටකොටුව', 'புறக்கோட்டை', (6.9372, 79.8506)),
    (12, 'Hulftsdorp', 'අලුත්කඩේ', 'புதுக்கடை', (6.9431, 79.8592)),
    (13, 'Kotahena', 'කොටහේන', 'கொட்டாஞ்சேனை', (6.9497, 79.8611)),
    (14, 'Grandpass', 'ග්‍රෑන්ඩ්පාස්', 'கிராண்ட்பாஸ்', (6.9536, 79.8714)),
    (15, 'Mattakkuliya', 'මට්ටක්කුලිය', 'மட்டக்குளி', (6.9667, 79.875)),
]
COLOMBO_ZONE_TOWNS = [(f'Colombo {n}', f'කොළඹ {n}', f'கொழும்பு {n}') for n, *_ in COLOMBO_ZONES]

# Shown on the home page only while some listing still uses the name (older listings that
# just say "Colombo"); new listings pick a zone.
HIDE_WHEN_EMPTY = {'colombo'}

# key, English, Sinhala, Tamil, province code (as in Property.state), centre (lat, lng), towns
DISTRICTS = [
    ('colombo', 'Colombo', 'කොළඹ', 'கொழும்பு', 'WP', (6.9271, 79.8612), [
        *COLOMBO_ZONE_TOWNS,
        ('Colombo', 'කොළඹ', 'கொழும்பு'),
        ('Dehiwala', 'දෙහිවල', 'தெஹிவளை'),
        ('Mount Lavinia', 'ගල්කිස්ස', 'கல்கிசை'),
        ('Sri Jayewardenepura Kotte', 'ශ්‍රී ජයවර්ධනපුර කෝට්ටේ', 'ஸ்ரீ ஜயவர்தனபுர கோட்டை'),
        ('Nugegoda', 'නුගේගොඩ', 'நுகேகொடை'),
        ('Maharagama', 'මහරගම', 'மகரகம'),
        ('Moratuwa', 'මොරටුව', 'மொறட்டுவை'),
        ('Kesbewa', 'කැස්බෑව', 'கெஸ்பேவ'),
        ('Piliyandala', 'පිළියන්දල', 'பிலியந்தலை'),
        ('Battaramulla', 'බත්තරමුල්ල', 'பத்தரமுல்லை'),
        ('Rajagiriya', 'රාජගිරිය', 'ராஜகிரிய'),
        ('Malabe', 'මාලබේ', 'மாலபே'),
        ('Athurugiriya', 'අතුරුගිරිය', 'அத்துருகிரிய'),
        ('Kaduwela', 'කඩුවෙල', 'கடுவெல'),
        ('Kolonnawa', 'කොලොන්නාව', 'கொலன்னாவை'),
        ('Wellampitiya', 'වැල්ලම්පිටිය', 'வெல்லம்பிட்டி'),
        ('Boralesgamuwa', 'බොරලැස්ගමුව', 'பொரலஸ்கமுவ'),
        ('Kottawa', 'කොට්ටාව', 'கொட்டாவை'),
        ('Homagama', 'හෝමාගම', 'ஹோமாகம'),
        ('Padukka', 'පාදුක්ක', 'பாதுக்கை'),
        ('Hanwella', 'හංවැල්ල', 'ஹன்வெல்ல'),
        ('Avissawella', 'අවිස්සාවේල්ල', 'அவிசாவளை'),
        ('Oruwala', 'ඔරුවල', 'ஒருவல'),
    ]),
    ('gampaha', 'Gampaha', 'ගම්පහ', 'கம்பஹா', 'WP', (7.0917, 79.9999), [
        ('Gampaha', 'ගම්පහ', 'கம்பஹா'),
        ('Negombo', 'මීගමුව', 'நீர்கொழும்பு'),
        ('Wattala', 'වත්තල', 'வத்தளை'),
        ('Ja-Ela', 'ජා-ඇල', 'ஜா-எல'),
        ('Kelaniya', 'කැලණිය', 'களனி'),
        ('Kadawatha', 'කඩවත', 'கடவத்தை'),
        ('Ragama', 'රාගම', 'ராகமை'),
        ('Kiribathgoda', 'කිරිබත්ගොඩ', 'கிரிபத்கொடை'),
        ('Kandana', 'කඳාන', 'கந்தானை'),
        ('Katunayake', 'කටුනායක', 'கட்டுநாயக்க'),
        ('Minuwangoda', 'මිනුවන්ගොඩ', 'மினுவாங்கொடை'),
        ('Divulapitiya', 'දිවුලපිටිය', 'திவுலப்பிட்டி'),
        ('Veyangoda', 'වේයන්ගොඩ', 'வெயாங்கொடை'),
        ('Nittambuwa', 'නිට්ටඹුව', 'நிட்டம்புவ'),
        ('Yakkala', 'යක්කල', 'யக்கல'),
        ('Wathupitiwala', 'වතුපිටිවල', 'வத்துப்பிட்டிவல'),
        ('Mirigama', 'මීරිගම', 'மீரிகம'),
        ('Delgoda', 'දෙල්ගොඩ', 'தெல்கொட'),
        ('Ganemulla', 'ගණේමුල්ල', 'கணேமுல்ல'),
        ('Kirindiwela', 'කිරිඳිවැල', 'கிரிந்திவெல'),
        ('Mabole', 'මාබෝල', 'மாபோல'),
    ]),
    ('kalutara', 'Kalutara', 'කළුතර', 'களுத்துறை', 'WP', (6.5854, 79.9607), [
        ('Kalutara', 'කළුතර', 'களுத்துறை'),
        ('Panadura', 'පානදුර', 'பாணந்துறை'),
        ('Horana', 'හොරණ', 'ஹொரணை'),
        ('Beruwala', 'බේරුවල', 'பேருவளை'),
        ('Aluthgama', 'අළුත්ගම', 'அளுத்கம'),
        ('Matugama', 'මතුගම', 'மத்துகம'),
        ('Bandaragama', 'බණ්ඩාරගම', 'பண்டாரகம'),
        ('Wadduwa', 'වාද්දුව', 'வாதுவை'),
        ('Ingiriya', 'ඉංගිරිය', 'இங்கிரிய'),
        ('Agalawatta', 'අගලවත්ත', 'அகலவத்தை'),
    ]),
    ('kandy', 'Kandy', 'මහනුවර', 'கண்டி', 'CP', (7.2931, 80.635), [
        ('Kandy', 'මහනුවර', 'கண்டி'),
        ('Peradeniya', 'පේරාදෙණිය', 'பேராதனை'),
        ('Katugastota', 'කටුගස්තොට', 'கட்டுகஸ்தோட்டை'),
        ('Gampola', 'ගම්පොළ', 'கம்பளை'),
        ('Nawalapitiya', 'නාවලපිටිය', 'நாவலப்பிட்டி'),
        ('Akurana', 'අකුරණ', 'அக்குறணை'),
        ('Kundasale', 'කුණ්ඩසාලේ', 'குண்டசாலை'),
        ('Digana', 'දිගන', 'திகன'),
        ('Pilimathalawa', 'පිළිමතලාව', 'பிலிமத்தலாவ'),
        ('Kadugannawa', 'කඩුගන්නාව', 'கடுகண்ணாவை'),
        ('Galagedara', 'ගලගෙදර', 'கலகெதர'),
        ('Gelioya', 'ගෙලිඔය', 'கெலிஓயா'),
        ('Galhinna', 'ගල්හින්න', 'கல்ஹின்ன'),
        ('Abasingammedda', 'අබසිංගම්මැද්ද', 'அபசிங்கம்மெத்த'),
    ]),
    ('galle', 'Galle', 'ගාල්ල', 'காலி', 'SP', (6.0328, 80.215), [
        ('Galle', 'ගාල්ල', 'காலி'),
        ('Hikkaduwa', 'හික්කඩුව', 'ஹிக்கடுவை'),
        ('Ambalangoda', 'අම්බලන්ගොඩ', 'அம்பலாங்கொடை'),
        ('Bentota', 'බෙන්තොට', 'பெந்தோட்டை'),
        ('Karapitiya', 'කරාපිටිය', 'கராப்பிட்டி'),
        ('Baddegama', 'බද්දේගම', 'பத்தேகம'),
        ('Elpitiya', 'ඇල්පිටිය', 'எல்பிட்டிய'),
        ('Unawatuna', 'උණවටුන', 'உனவட்டுன'),
        ('Koggala', 'කොග්ගල', 'கொக்கலை'),
        ('Ahangama', 'අහංගම', 'அகங்கம'),
    ]),
    ('kurunegala', 'Kurunegala', 'කුරුණෑගල', 'குருநாகல்', 'NW', (7.487, 80.3649), [
        ('Kurunegala', 'කුරුණෑගල', 'குருநாகல்'),
        ('Kuliyapitiya', 'කුලියාපිටිය', 'குளியாப்பிட்டி'),
        ('Pannala', 'පන්නල', 'பன்னல'),
        ('Narammala', 'නාරම්මල', 'நாரம்மல'),
        ('Wariyapola', 'වාරියපොළ', 'வாரியப்பொல'),
        ('Polgahawela', 'පොල්ගහවෙල', 'பொல்கஹவெல'),
        ('Alawwa', 'අලව්ව', 'அலவ்வ'),
        ('Mawathagama', 'මාවතගම', 'மாவத்தகம'),
        ('Nikaweratiya', 'නිකවැරටිය', 'நிகவெரட்டிய'),
        ('Ibbagamuwa', 'ඉබ්බාගමුව', 'இப்பாகமுவ'),
    ]),
    ('matara', 'Matara', 'මාතර', 'மாத்தறை', 'SP', (5.9478, 80.5483), [
        ('Matara', 'මාතර', 'மாத்தறை'),
        ('Weligama', 'වැලිගම', 'வெலிகம'),
        ('Mirissa South', 'මිරිස්ස දකුණ', 'மிரிஸ்ஸ தெற்கு'),
        ('Gandara West', 'ගන්දර බටහිර', 'கந்தர மேற்கு'),
        ('Akuressa', 'අකුරැස්ස', 'அக்குரஸ்ஸ'),
        ('Dikwella', 'දික්වැල්ල', 'திக்வெல்ல'),
        ('Kamburupitiya', 'කඹුරුපිටිය', 'கம்புருப்பிட்டி'),
        ('Hakmana', 'හක්මන', 'ஹக்மன'),
        ('Deniyaya', 'දෙනියාය', 'தெனியாய'),
    ]),
    ('ratnapura', 'Ratnapura', 'රත්නපුර', 'இரத்தினபுரி', 'SG', (6.6828, 80.3992), [
        ('Ratnapura', 'රත්නපුර', 'இரத்தினபுரி'),
        ('Balangoda', 'බලංගොඩ', 'பலாங்கொடை'),
        ('Embilipitiya', 'ඇඹිලිපිටිය', 'எம்பிலிப்பிட்டி'),
        ('Pelmadulla', 'පැල්මඩුල්ල', 'பெல்மடுல்ல'),
        ('Eheliyagoda', 'ඇහැළියගොඩ', 'எஹெலியகொட'),
        ('Kuruwita', 'කුරුවිට', 'குருவிட்ட'),
        ('Kahawatta', 'කහවත්ත', 'கஹவத்தை'),
    ]),
    ('kegalle', 'Kegalle', 'කෑගල්ල', 'கேகாலை', 'SG', (7.2513, 80.3464), [
        ('Kegalle', 'කෑගල්ල', 'கேகாலை'),
        ('Mawanella', 'මාවනැල්ල', 'மாவனெல்லை'),
        ('Warakapola', 'වරකාපොළ', 'வரக்காப்பொல'),
        ('Rambukkana', 'රඹුක්කන', 'ரம்புக்கனை'),
        ('Ruwanwella', 'රුවන්වැල්ල', 'ருவன்வெல்ல'),
        ('Yatiyantota', 'යටියන්තොට', 'யட்டியாந்தோட்டை'),
        ('Dehiowita', 'දෙහිඕවිට', 'தெஹியோவிட்ட'),
        ('Deraniyagala', 'දැරණියගල', 'தெரணியகல'),
    ]),
    ('puttalam', 'Puttalam', 'පුත්තලම', 'புத்தளம்', 'NW', (8.0362, 79.8283), [
        ('Puttalam', 'පුත්තලම', 'புத்தளம்'),
        ('Chilaw', 'හලාවත', 'சிலாபம்'),
        ('Wennappuwa', 'වෙන්නප්පුව', 'வென்னப்புவ'),
        ('Marawila', 'මාරවිල', 'மாரவில'),
        ('Kalpitiya', 'කල්පිටිය', 'கற்பிட்டி'),
        ('Nattandiya', 'නාත්තණ්ඩිය', 'நாத்தாண்டிய'),
        ('Dankotuwa', 'දංකොටුව', 'தங்கொட்டுவ'),
        ('Anamaduwa', 'ආනමඩුව', 'ஆனமடுவ'),
    ]),
    ('anuradhapura', 'Anuradhapura', 'අනුරාධපුරය', 'அனுராதபுரம்', 'NC', (8.335, 80.4106), [
        ('Anuradhapura', 'අනුරාධපුරය', 'அனுராதபுரம்'),
        ('Kekirawa', 'කැකිරාව', 'கெக்கிராவ'),
        ('Medawachchiya', 'මැදවච්චිය', 'மதவாச்சி'),
        ('Thambuttegama', 'තඹුත්තේගම', 'தம்புத்தேகம'),
        ('Eppawala', 'එප්පාවල', 'எப்பாவல'),
        ('Mihintale', 'මිහින්තලේ', 'மிஹிந்தலை'),
        ('Habarana', 'හබරණ', 'ஹபரணை'),
    ]),
    ('badulla', 'Badulla', 'බදුල්ල', 'பதுளை', 'UP', (6.99, 81.057), [
        ('Badulla', 'බදුල්ල', 'பதுளை'),
        ('Bandarawela', 'බණ්ඩාරවෙල', 'பண்டாரவளை'),
        ('Ella', 'ඇල්ල', 'எல்ல'),
        ('Haputale', 'හපුතලේ', 'ஹப்புத்தளை'),
        ('Welimada', 'වැලිමඩ', 'வெலிமடை'),
        ('Mahiyanganaya', 'මහියංගනය', 'மஹியங்கனை'),
        ('Passara', 'පස්සර', 'பசறை'),
        ('Hali-Ela', 'හාලිඇල', 'ஹாலி-எல'),
    ]),
    ('nuwara_eliya', 'Nuwara Eliya', 'නුවරඑළිය', 'நுவரெலியா', 'CP', (6.9497, 80.7891), [
        ('Nuwara Eliya', 'නුවරඑළිය', 'நுவரெலியா'),
        ('Hatton', 'හැටන්', 'ஹட்டன்'),
        ('Kotmale', 'කොත්මලේ', 'கொத்மலை'),
        ('Talawakele', 'තලවකැලේ', 'தலவாக்கலை'),
        ('Nanu Oya', 'නානුඔය', 'நானுஓயா'),
        ('Maskeliya', 'මස්කෙළිය', 'மஸ்கெலியா'),
        ('Ragala', 'රාගල', 'ராகலை'),
        ('Walapane', 'වලපනේ', 'வலப்பனை'),
    ]),
    ('matale', 'Matale', 'මාතලේ', 'மாத்தளை', 'CP', (7.4675, 80.6234), [
        ('Matale', 'මාතලේ', 'மாத்தளை'),
        ('Dambulla', 'දඹුල්ල', 'தம்புள்ளை'),
        ('Sigiriya', 'සීගිරිය', 'சீகிரியா'),
        ('Galewela', 'ගලේවෙල', 'கலேவெல'),
        ('Rattota', 'රත්තොට', 'ரத்தோட்டை'),
        ('Naula', 'නාඋල', 'நாவுல'),
        ('Ukuwela', 'උකුවෙල', 'உக்குவெல'),
    ]),
    ('hambantota', 'Hambantota', 'හම්බන්තොට', 'அம்பாந்தோட்டை', 'SP', (6.1249, 81.1243), [
        ('Hambantota', 'හම්බන්තොට', 'அம்பாந்தோட்டை'),
        ('Tangalla', 'තංගල්ල', 'தங்காலை'),
        ('Tissamaharama', 'තිස්සමහාරාමය', 'திஸ்ஸமஹாராமை'),
        ('Ambalantota', 'අම්බලන්තොට', 'அம்பலாந்தோட்டை'),
        ('Beliatta', 'බෙලිඅත්ත', 'பெலியத்த'),
        ('Weeraketiya', 'වීරකැටිය', 'வீரகெட்டிய'),
        ('Sooriyawewa', 'සූරියවැව', 'சூரியவெவ'),
    ]),
    ('jaffna', 'Jaffna', 'යාපනය', 'யாழ்ப்பாணம்', 'NP', (9.6651, 80.0093), [
        ('Jaffna', 'යාපනය', 'யாழ்ப்பாணம்'),
        ('Nallur', 'නල්ලූර්', 'நல்லூர்'),
        ('Chavakachcheri', 'චාවකච්චේරිය', 'சாவகச்சேரி'),
        ('Point Pedro', 'පේදුරුතුඩුව', 'பருத்தித்துறை'),
        ('Valvettithurai', 'වල්වෙට්ටිතුරේ', 'வல்வெட்டித்துறை'),
        ('Kankesanthurai', 'කන්කසන්තුරේ', 'காங்கேசன்துறை'),
        ('Karainagar', 'කාරෙයිනගර්', 'காரைநகர்'),
        ('Polikandi', 'පොලිකණ්ඩි', 'பொலிகண்டி'),
    ]),
    ('trincomalee', 'Trincomalee', 'ත්‍රිකුණාමලය', 'திருகோணமலை', 'EP', (8.5764, 81.2345), [
        ('Trincomalee', 'ත්‍රිකුණාමලය', 'திருகோணமலை'),
        ('Kinniya', 'කින්නියා', 'கிண்ணியா'),
        ('Kantale', 'කන්තලේ', 'கந்தளாய்'),
        ('Mutur', 'මූදූර්', 'மூதூர்'),
        ('Nilaveli', 'නිලාවේලි', 'நிலாவெளி'),
    ]),
    ('batticaloa', 'Batticaloa', 'මඩකලපුව', 'மட்டக்களப்பு', 'EP', (7.731, 81.6747), [
        ('Batticaloa', 'මඩකලපුව', 'மட்டக்களப்பு'),
        ('Kattankudy', 'කාත්තාන්කුඩි', 'காத்தான்குடி'),
        ('Eravur', 'ඒරාවූර්', 'ஏறாவூர்'),
        ('Valaichchenai', 'වාලච්චේන', 'வாழைச்சேனை'),
        ('Chenkalady', 'චෙංකලඩි', 'செங்கலடி'),
        ('Kaluwanchikudy', 'කළුවන්චිකුඩි', 'களுவாஞ்சிகுடி'),
    ]),
    ('ampara', 'Ampara', 'අම්පාර', 'அம்பாறை', 'EP', (7.2975, 81.682), [
        ('Ampara', 'අම්පාර', 'அம்பாறை'),
        ('Kalmunai', 'කල්මුණේ', 'கல்முனை'),
        ('Akkaraipattu', 'අක්කරෙයිපත්තුව', 'அக்கரைப்பற்று'),
        ('Sammanthurai', 'සම්මාන්තුරේ', 'சம்மாந்துறை'),
        ('Pottuvil', 'පොතුවිල්', 'பொத்துவில்'),
        ('Dehiattakandiya', 'දෙහිඅත්තකණ්ඩිය', 'தெஹியத்தகண்டிய'),
        ('Uhana', 'උහන', 'உஹன'),
    ]),
    ('polonnaruwa', 'Polonnaruwa', 'පොළොන්නරුව', 'பொலன்னறுவை', 'NC', (7.9403, 81.0188), [
        ('Polonnaruwa', 'පොළොන්නරුව', 'பொலன்னறுவை'),
        ('Kaduruwela', 'කඩුරුවෙල', 'கடுருவெல'),
        ('Hingurakgoda', 'හිඟුරක්ගොඩ', 'ஹிங்குராக்கொட'),
        ('Medirigiriya', 'මැදිරිගිරිය', 'மெதிரிகிரிய'),
        ('Minneriya', 'මින්නේරිය', 'மின்னேரியா'),
    ]),
    ('monaragala', 'Monaragala', 'මොණරාගල', 'மொனராகலை', 'UP', (6.8727, 81.3506), [
        ('Monaragala', 'මොණරාගල', 'மொனராகலை'),
        ('Wellawaya', 'වැල්ලවාය', 'வெல்லவாய'),
        ('Bibile', 'බිබිල', 'பிபிலை'),
        ('Buttala', 'බුත්තල', 'புத்தள'),
        ('Kataragama', 'කතරගම', 'கதிர்காமம்'),
        ('Siyambalanduwa', 'සියඹලාණ්ඩුව', 'சியம்பலாண்டுவ'),
    ]),
    ('vavuniya', 'Vavuniya', 'වවුනියාව', 'வவுனியா', 'NP', (8.7594, 80.5001), [
        ('Vavuniya', 'වවුනියාව', 'வவுனியா'),
        ('Cheddikulam', 'චෙට්ටිකුලම', 'செட்டிகுளம்'),
        ('Nedunkeni', 'නෙඩුන්කේනි', 'நெடுங்கேணி'),
        ('Omanthai', 'ඕමන්තේ', 'ஓமந்தை'),
    ]),
    ('mannar', 'Mannar', 'මන්නාරම', 'மன்னார்', 'NP', (8.9813, 79.9044), [
        ('Mannar', 'මන්නාරම', 'மன்னார்'),
        ('Talaimannar', 'තලෙයිමන්නාරම', 'தலைமன்னார்'),
        ('Pesalai', 'පේසාලේ', 'பேசாலை'),
        ('Madhu', 'මඩු', 'மடு'),
        ('Murunkan', 'මුරුන්කන්', 'முருங்கன்'),
    ]),
    ('kilinochchi', 'Kilinochchi', 'කිලිනොච්චිය', 'கிளிநொச்சி', 'NP', (9.384, 80.4087), [
        ('Kilinochchi', 'කිලිනොච්චිය', 'கிளிநொச்சி'),
        ('Paranthan', 'පරන්තන්', 'பரந்தன்'),
        ('Poonakary', 'පූනකරි', 'பூநகரி'),
    ]),
    ('mullaitivu', 'Mullaitivu', 'මුලතිව්', 'முல்லைத்தீவு', 'NP', (9.2671, 80.8142), [
        ('Mullaittivu', 'මුලතිව්', 'முல்லைத்தீவு'),
        ('Puthukkudiyiruppu', 'පුදුකුඩියිරුප්පු', 'புதுக்குடியிருப்பு'),
        ('Oddusuddan', 'ඔට්ටුසුට්ටාන්', 'ஒட்டுசுட்டான்'),
        ('Mankulam', 'මාන්කුලම', 'மாங்குளம்'),
    ]),
]

DISTRICT_KEYS = tuple(d[0] for d in DISTRICTS)
DISTRICT_CHOICES = [(d[0], d[1]) for d in DISTRICTS]

# lower-case town name -> district key ("Mullaitivu" spelt both ways)
_TOWN_DISTRICT = {town[0].lower(): d[0] for d in DISTRICTS for town in d[6]}
_TOWN_DISTRICT['mullaitivu'] = 'mullaitivu'
# Areas of Colombo city people may type instead of the zone ("Kollupitiya", "Wellawatte").
_TOWN_DISTRICT.update({area.lower(): 'colombo' for _, area, *_ in COLOMBO_ZONES})

# Town name -> (area {en, si, ta}, lat, lng) for the Colombo zones.
ZONE_INFO = {
    f'Colombo {n}': ({'en': area, 'si': si, 'ta': ta}, lat, lng)
    for n, area, si, ta, (lat, lng) in COLOMBO_ZONES
}


def district_for_city(city):
    """The district key for a city or town name we know, else ''."""
    return _TOWN_DISTRICT.get((city or '').strip().lower(), '')
