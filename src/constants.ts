export const APP_CONFIG = {
  name: 'India Informer',
  domain: 'informme.co.in',
  url: 'https://informme.co.in',
  developer: 'Aryan gadewar',
  year: '2024'
};

export const LAYOUT_CONFIG = {
  bottomNavHeight: 80, // in pixels
  bottomNavOffset: 24, // in pixels
  chatInputBottom: 132, // 132px (increased further for generous clearance above BottomNav to prevent overlap)
};

export const ADMIN_EMAILS = [
  'gadewarkalpna@gmail.com',
  'gadewararyan@gmail.com',
  'aryangadewar@gmail.com',
  'aryangadewar2@gmail.com',
  'aryan.gadewar@gmail.com'
];
export const ADMIN_EMAIL = 'gadewarkalpna@gmail.com';

export interface StateData {
  code: string;
  nameEn: string;
  nameMr: string;
  nameHi: string;
  targetPopulation: number;
  featureTitleEn: string;
  featureTitleMr: string;
  featureDescEn: string;
  featureDescMr: string;
}

export const INDIAN_STATES: StateData[] = [
  {
    code: 'MH',
    nameEn: 'Maharashtra',
    nameMr: 'महाराष्ट्र',
    nameHi: 'महाराष्ट्र',
    targetPopulation: 10,
    featureTitleEn: 'MahaSwaraj Lok-Forum',
    featureTitleMr: 'महाराष्ट्र लोक-मंच',
    featureDescEn: 'Exclusive access to direct local business syndicates and hyper-local crop/commodity trading alerts across Maharashtra!',
    featureDescMr: 'महाराष्ट्रातील लोकांसाठी विशेष स्थानिक व्यवसाय सिंडिकेट्स, शेतमाल/बाजारभाव आणि थेट शासकीय योजनांचे अपडेट्स असणारा लोक-मंच!'
  },
  {
    code: 'GA',
    nameEn: 'Goa',
    nameMr: 'गोवा',
    nameHi: 'गोवा',
    targetPopulation: 4,
    featureTitleEn: 'Goa Sussegad Pulse',
    featureTitleMr: 'गोवा सुशेगाद पल्स',
    featureDescEn: 'Unlock real-time coastal alerts, local shacks deals, and premium tourism community network in Goa!',
    featureDescMr: 'गोव्यातील समुद्रकिनारी घडामोडी, स्थानिक हॉटेल्स/व्यवसाय सुवर्णसंधी आणि पर्यटन क्षेत्राशी निगडित विशेष कम्युनिटी नेटवर्क!'
  },
  {
    code: 'GJ',
    nameEn: 'Gujarat',
    nameMr: 'गुजरात',
    nameHi: 'गुजरात',
    targetPopulation: 8,
    featureTitleEn: 'Gujju Vyapaar Network',
    featureTitleMr: 'गुज्जू व्यापार नेटवर्क',
    featureDescEn: 'Direct access to Surat fabric and Ahmedabad wholesale trade marketplace with verified merchants!',
    featureDescMr: 'सुरत आणि अहमदाबादमधील घाऊक कापड आणि हिरे बाजारातील थेट व्यापार्‍यांचे मोबाईल नंबर्स व डील रुम्स मोफत उघडा!'
  },
  {
    code: 'DL',
    nameEn: 'Delhi',
    nameMr: 'दिल्ली',
    nameHi: 'दिल्ली',
    targetPopulation: 7,
    featureTitleEn: 'Delhi Metro-Hustle Forum',
    featureTitleMr: 'दिल्ली मेट्रो आणि स्थानिक बाजार मंच',
    featureDescEn: 'Real-time Metro transit crowd pulse, instant cheap-chidiya market sales, and local student guidance hub!',
    featureDescMr: 'दिल्ली मेट्रोमधील गर्दीचे विश्लेषण, सर्वोत्कृष्ट स्वस्त बाजारपेठांच्या आणि विद्यार्थ्यांसाठी थेट नोकरीच्या संधींचे अपडेट्स!'
  },
  {
    code: 'KA',
    nameEn: 'Karnataka',
    nameMr: 'कर्नाटक',
    nameHi: 'कर्नाटक',
    targetPopulation: 9,
    featureTitleEn: 'Namma Tech Hub',
    featureTitleMr: 'नम्मा टेक हब',
    featureDescEn: 'Direct seed-stage investment updates, local PG ratings, and developer networking zones in Bengaluru!',
    featureDescMr: 'बंगळुरूमधील पीजी हॉस्टेलचे रेटिंग्ज, छोटे व मध्यम आयटी जॉब्स आणि नवउद्योजकांसाठी विशेष मार्गदर्शन मंच!'
  },
  {
    code: 'UP',
    nameEn: 'Uttar Pradesh',
    nameMr: 'उत्तर प्रदेश',
    nameHi: 'उत्तर प्रदेश',
    targetPopulation: 12,
    featureTitleEn: 'UP Purvanchal Panchayat',
    featureTitleMr: 'यूपी पूर्वांचल पंचायत',
    featureDescEn: 'Live feedback room on local development, mandiyal pricing, and public service exams special alerts!',
    featureDescMr: 'सरकारी स्पर्धा परीक्षांमधील निवडक मार्गदर्शन, उत्तर प्रदेशातील भाजीपाला व धान्य बाजारभाव आणि पंचायत चर्चा!'
  },
  {
    code: 'MP',
    nameEn: 'Madhya Pradesh',
    nameMr: 'मध्य प्रदेश',
    nameHi: 'मध्य प्रदेश',
    targetPopulation: 9,
    featureTitleEn: 'MP Heart-Land Exchange',
    featureTitleMr: 'एमपी हार्ट-लँड एक्सचेंज',
    featureDescEn: 'Sanchi milk network rates and exclusive central forest tourism/safari bookings tips!',
    featureDescMr: 'मध्य प्रदेश वन पर्यटन, जंगल सफारी आणि सांची डेअरी संबंधित स्थानिक व्यवसाय वाढीचे फोरम!'
  },
  {
    code: 'AP',
    nameEn: 'Andhra Pradesh',
    nameMr: 'आंध्र प्रदेश',
    nameHi: 'आंध्र प्रदेश',
    targetPopulation: 10,
    featureTitleEn: 'Andhra Agri-Aqua Connect',
    featureTitleMr: 'आंध्र कृषी-मत्स्य कनेक्ट',
    featureDescEn: 'Direct trading lines for coastal aquaculture, mango harvests, and Tirupati transit updates.',
    featureDescMr: 'किनाऱ्यावरील मत्स्यपालन, आंबा पीक आणि तिरुपती देवस्थानच्या गर्दीचे थेट अपडेट्स!'
  },
  {
    code: 'AR',
    nameEn: 'Arunachal Pradesh',
    nameMr: 'अरुणाचल प्रदेश',
    nameHi: 'अरुणाचल प्रदेश',
    targetPopulation: 4,
    featureTitleEn: 'Dawn-Lit Heritage Route',
    featureTitleMr: 'अरुणाचल निसर्ग व वारसा मंच',
    featureDescEn: 'Connecting local handicraft weavers and eco-tourism homestays across the hills.',
    featureDescMr: 'पहाडी भागातील स्थानिक हस्तकला विणकर आणि पर्यावरणपूरक पर्यटनाचे थेट नेटवर्क!'
  },
  {
    code: 'AS',
    nameEn: 'Assam',
    nameMr: 'आसाम',
    nameHi: 'असम',
    targetPopulation: 6,
    featureTitleEn: 'Assam Tea & Oil Syndicate',
    featureTitleMr: 'आसाम चहा आणि तेल मंच',
    featureDescEn: 'Direct trade updates for organic tea gardens, silk weavers, and Brahmaputra transit.',
    featureDescMr: 'सेंद्रिय चहाचे मळे, आसामी रेशीम विणकर आणि ब्रह्मपुत्रा नदी वाहतूक विशेष माहिती मंच!'
  },
  {
    code: 'BR',
    nameEn: 'Bihar',
    nameMr: 'बिहार',
    nameHi: 'बिहार',
    targetPopulation: 12,
    featureTitleEn: 'Bihar Vidya Mandi Forum',
    featureTitleMr: 'बिहार विद्या आणि कृषी मंच',
    featureDescEn: 'Dedicated to competitive exam materials, local agricultural mandi pricing, and village cottage industry.',
    featureDescMr: 'स्पर्धा परीक्षा साहित्य, लिची व इतर पिकांचे कृषी दर आणि गृहउद्योग सहकार चर्चा!'
  },
  {
    code: 'CG',
    nameEn: 'Chhattisgarh',
    nameMr: 'छत्तीसगड',
    nameHi: 'छत्तीसगढ़',
    targetPopulation: 6,
    featureTitleEn: 'Chhattisgarh Forest Hub',
    featureTitleMr: 'छत्तीसगड वन आणि खनिज मंच',
    featureDescEn: 'Coordinating herbal forest produce collectives, paddy mill rates, and tribal art networks.',
    featureDescMr: 'वनौषधी, बांबू उत्पादने, धानाची गिरणी मजुरी दर आणि आदिवासी कलाकुसर व्यापार केंद्र!'
  },
  {
    code: 'HR',
    nameEn: 'Haryana',
    nameMr: 'हरियाणा',
    nameHi: 'हरियाणा',
    targetPopulation: 6,
    featureTitleEn: 'Haryana Sports & Dairy Exchange',
    featureTitleMr: 'हरियाणा क्रीडा आणि दुग्ध व्यवसाय',
    featureDescEn: 'Direct connection to local wrestling akharas, elite cattle trades, and basmati mandi alerts.',
    featureDescMr: 'स्थानिक कुस्ती आखाडे, उच्च दर्जाचे पशुधन खरेदी-विक्री आणि बासमती तांदूळ ताजे दर!'
  },
  {
    code: 'HP',
    nameEn: 'Himachal Pradesh',
    nameMr: 'हिमाचल प्रदेश',
    nameHi: 'हिमाचल प्रदेश',
    targetPopulation: 5,
    featureTitleEn: 'Himachal Apple & Tourism Room',
    featureTitleMr: 'हिमाचल सफरचंद व पर्यटन कक्ष',
    featureDescEn: 'Real-time apple market dispatch registers and local high-altitude tour guide lists.',
    featureDescMr: 'सफरचंद बागायतदार माल वाहतूक नोंदी आणि पर्वतीय ट्रेकगाईड्सचे प्रमाणित संपर्क!'
  },
  {
    code: 'JH',
    nameEn: 'Jharkhand',
    nameMr: 'झारखंड',
    nameHi: 'झारखंड',
    targetPopulation: 7,
    featureTitleEn: 'Jharkhand Mining & Tribal Craft',
    featureTitleMr: 'झारखंड खनिज आणि बांबू हस्तकला',
    featureDescEn: 'Direct marketplace for local brass artisans, stone chip queries, and steel city services.',
    featureDescMr: 'स्थानिक पितळ कारागीर, दगड खडी आणि लोह-पोलाद उद्योगांचे रोजगार अपडेट्स!'
  },
  {
    code: 'KL',
    nameEn: 'Kerala',
    nameMr: 'केरळ',
    nameHi: 'केरल',
    targetPopulation: 8,
    featureTitleEn: 'Kerala Spice & Backwater Gate',
    featureTitleMr: 'केरळ मसाल्यांचे बाजार व पर्यटन',
    featureDescEn: 'Cardamom and pepper auction intelligence, houseboats bookings registry, and healthcare diaspora.',
    featureDescMr: 'वेलची व मिरी लिलाव अंदाज, हाऊस बोट पर्यटन आणि स्थानिक आयुर्वेद केंद्र बुलेटिन!'
  },
  {
    code: 'MN',
    nameEn: 'Manipur',
    nameMr: 'मणिपूर',
    nameHi: 'मणिपुर',
    targetPopulation: 4,
    featureTitleEn: 'Manipur Handloom Collective',
    featureTitleMr: 'मणिपूर हातमाग संघ',
    featureDescEn: 'Connecting traditional weavers with global wholesalers of fine ethnic garments.',
    featureDescMr: 'स्थानिक हातमाग कारागीर आणि उत्कृष्ट मणिपुरी वस्त्रांच्या घाऊक खरेदीदारांचे दालन!'
  },
  {
    code: 'ML',
    nameEn: 'Meghalaya',
    nameMr: 'मेघालय',
    nameHi: 'मेघालय',
    targetPopulation: 4,
    featureTitleEn: 'Meghalaya Organic Spice Chamber',
    featureTitleMr: 'मेघालय सेंद्रिय हळद व मसाला संघ',
    featureDescEn: 'Exclusive Lakadong turmeric trade networks and pristine tourist stay bookings.',
    featureDescMr: 'उत्कृष्ट लाकाडाँग सेंद्रिय हळद व्यापार आणि सुंदर चेरापुंजी पर्यटन होमस्टे नोंदणी!'
  },
  {
    code: 'MZ',
    nameEn: 'Mizoram',
    nameMr: 'मिझोरम',
    nameHi: 'मिजोरम',
    targetPopulation: 4,
    featureTitleEn: 'Mizoram Bamboo & Hills Path',
    featureTitleMr: 'मिझोरम बांबू आणि टेकडी निसर्ग',
    featureDescEn: 'Trading platform for exquisite bamboo handicrafts and traditional high-altitude crops.',
    featureDescMr: 'बांबू डिझाईन्स वस्तू विक्री आणि मिझो टेकड्यांवरील विशेष स्थानिक पिकांचे बाजार!'
  },
  {
    code: 'NL',
    nameEn: 'Nagaland',
    nameMr: 'नागालँड',
    nameHi: 'नागालैंड',
    targetPopulation: 4,
    featureTitleEn: 'Nagaland Hornbill Hub',
    featureTitleMr: 'नागालँड हॉर्नबिल कला आणि कृषी',
    featureDescEn: 'Highlighting traditional organic agriculture and ethnic Naga shawl artisan deals.',
    featureDescMr: 'सेंद्रिय नागा शेती व पारंपरिक नागा शाल विणकरांचे खरेदी दालन!'
  },
  {
    code: 'OD',
    nameEn: 'Odisha',
    nameMr: 'ओडिशा',
    nameHi: 'ओडिशा',
    targetPopulation: 7,
    featureTitleEn: 'Odisha Sambalpuri & Mines Room',
    featureTitleMr: 'ओडिशा संबलपुरी आणि सागरी संपत्ती',
    featureDescEn: 'Direct contact with Sambalpuri weavers and sea-fish cold storage trade leads.',
    featureDescMr: 'संबलपुरी साड्यांचे विणकर आणि सागरी मासेमारी शीतगृह घाऊक दर माहिती मंच!'
  },
  {
    code: 'PB',
    nameEn: 'Punjab',
    nameMr: 'पंजाब',
    nameHi: 'पंजाब',
    targetPopulation: 6,
    featureTitleEn: 'Punjab Anaj Mandi Portal',
    featureTitleMr: 'पंजाब धान्य मंडी आणि ट्रॅक्टर क्लब',
    featureDescEn: 'Live wheat auction trackers, second-hand farm machinery rentals, and sports goods trade.',
    featureDescMr: 'थेट गहू खरेदी दर, सेकंड-हँड ट्रॅक्टर व कृषी यंत्रसामग्री आणि जालंधर क्रीडा साहित्य व्यापार!'
  },
  {
    code: 'RJ',
    nameEn: 'Rajasthan',
    nameMr: 'राजस्थान',
    nameHi: 'राजस्थान',
    targetPopulation: 9,
    featureTitleEn: 'Rajasthan Marwar Vyapaar Hub',
    featureTitleMr: 'राजस्थान मारवाड व्यापार मंच',
    featureDescEn: 'Direct marble supply chain contacts, heritage tourism events, and folk art coordinators.',
    featureDescMr: 'मकराणा संगमरवरी दगड पुरवठादार, वाळवंत पर्यटन सफारी आणि जोधपूर लोककला मंच!'
  },
  {
    code: 'SK',
    nameEn: 'Sikkim',
    nameMr: 'सिक्कीम',
    nameHi: 'सिक्किम',
    targetPopulation: 4,
    featureTitleEn: 'Sikkim Organic Valley Desk',
    featureTitleMr: 'सिक्कीम सेंद्रिय व्हॅली आणि इलायची',
    featureDescEn: 'Connecting certified 100% organic cardamom growers with global spice export syndicates.',
    featureDescMr: 'मोठी विलायची (काळी मिरी/वेलची) उत्पादक आणि सेंद्रिय शेती माल निर्यातक मंच!'
  },
  {
    code: 'TN',
    nameEn: 'Tamil Nadu',
    nameMr: 'तमिळनाडू',
    nameHi: 'तमिलनाडु',
    targetPopulation: 10,
    featureTitleEn: 'Tamil Nadu Handloom & Auto Ring',
    featureTitleMr: 'तमिळनाडू हातमाग व ऑटो हब',
    featureDescEn: 'Direct contact with Kanchipuram silk weavers and industrial ancillaries parts exchange.',
    featureDescMr: 'कांचीपुरम सिल्क साडी विणकर आणि चेन्नई औद्योगिक सुटे भाग व्यापार मंच!'
  },
  {
    code: 'TG',
    nameEn: 'Telangana',
    nameMr: 'तेलंगणा',
    nameHi: 'तेलंगाना',
    targetPopulation: 9,
    featureTitleEn: 'Telangana Rythu Deccan Ring',
    featureTitleMr: 'तेलंगणा रिथू दख्खन रिंग',
    featureDescEn: 'Cotton mandi updates, Pochampally handlooms, and Hyderabad tech startup events.',
    featureDescMr: 'कापूस बाजारभाव, पोचमपल्ली पारंपरिक विणकर आणि हैदराबाद स्टार्ट-अप मार्गदर्शन कक्ष!'
  },
  {
    code: 'TR',
    nameEn: 'Tripura',
    nameMr: 'त्रिपुरा',
    nameHi: 'त्रिपुरा',
    targetPopulation: 4,
    featureTitleEn: 'Tripura Queen Pineapple & Bamboo',
    featureTitleMr: 'त्रिपुरा अननस आणि बांबू एक्सचेंज',
    featureDescEn: 'Direct trade for Queen Pineapples and eco-friendly bamboo furniture clusters.',
    featureDescMr: 'त्रिपुराचे प्रसिद्ध क्वीन अननस बागायतदार आणि बांबू फर्निचर निर्मात्यांचे थेट संपर्क!'
  },
  {
    code: 'UA',
    nameEn: 'Uttarakhand',
    nameMr: 'उत्तराखंड',
    nameHi: 'उत्तराखंड',
    targetPopulation: 5,
    featureTitleEn: 'Devbhoomi Char-Dham Companion',
    featureTitleMr: 'देवभूमी चार-धाम आणि जडीबुटी मंच',
    featureDescEn: 'Live updates on shrine weather/crowd queues, local homestay ratings, and mountain honey trade.',
    featureDescMr: 'चार-धाम यात्रा गर्दी/हवामान अंदाज, डोंगरी शुद्ध मध आणि आयुर्वेदिक वनस्पती मार्गदर्शन!'
  },
  {
    code: 'WB',
    nameEn: 'West Bengal',
    nameMr: 'पश्चिम बंगाल',
    nameHi: 'पश्चिम बंगाल',
    targetPopulation: 10,
    featureTitleEn: 'Bengal Tant-Sari & Hilsa Exchange',
    featureTitleMr: 'बंगाल तांत-साडी व मत्स्य मंच',
    featureDescEn: 'Direct trade for Tant weavers, Darjeeling tea estates primary batches, and coastal fisheries.',
    featureDescMr: 'पारंपारिक तांत साडी विणकर, दार्जिलिंग चहा उत्पादक आणि हुगळी नदी मत्स्य पुरवठा मंच!'
  },
  {
    code: 'AN',
    nameEn: 'Andaman and Nicobar',
    nameMr: 'अंदमान आणि निकोबार',
    nameHi: 'अंडमान और निकोबार',
    targetPopulation: 4,
    featureTitleEn: 'Andaman Marine & Coconut Ring',
    featureTitleMr: 'अंदमान सागरी आणि नारळ कक्ष',
    featureDescEn: 'Deep-sea fishing co-ops and organic coconut processing business leads.',
    featureDescMr: 'सागरी मासेमारी सहकार संस्था आणि सेंद्रिय नारळ व कोपरा घाऊक व्यापार्‍यांचे संपर्क!'
  },
  {
    code: 'CH',
    nameEn: 'Chandigarh',
    nameMr: 'चंदीगड',
    nameHi: 'चंडीगढ़',
    targetPopulation: 4,
    featureTitleEn: 'Chandigarh City Beat',
    featureTitleMr: 'चंदीगड सिटी बीट',
    featureDescEn: 'Local student hosteller registers, startup meet directories, and transport schedules.',
    featureDescMr: 'विद्यार्थी वसतिगृह माहिती, स्थानिक ट्रान्सपोर्ट वेळापत्रक आणि व्यवसाय संधी!'
  },
  {
    code: 'DN',
    nameEn: 'Dadra and Nagar Haveli and Daman and Diu',
    nameMr: 'दादरा नगर हवेली आणि दमण दीव',
    nameHi: 'दादरा नगर हवेली और दमन दीव',
    targetPopulation: 4,
    featureTitleEn: 'Daman & Diu Coastal Vyapaar',
    featureTitleMr: 'दमण दीव समुद्रकिनारा व्यापार',
    featureDescEn: 'Real-time fisheries auctions and local industrial estate hiring boards.',
    featureDescMr: 'दमण व दीव मधील औद्योगिक कंपन्यांमधील नोकऱ्या आणि सागरी मासेमारी संपर्क!'
  },
  {
    code: 'JK',
    nameEn: 'Jammu and Kashmir',
    nameMr: 'जम्मू आणि काश्मीर',
    nameHi: 'जम्मू और कश्मीर',
    targetPopulation: 5,
    featureTitleEn: 'Kashmir Saffron & Apple Emporium',
    featureTitleMr: 'काश्मीर केशर आणि सफरचंद केंद्र',
    featureDescEn: 'Pampore saffron growers directly trading with buyers, tourist houseboats contacts.',
    featureDescMr: 'केशर उत्पादक थेट खरेदी-विक्री दालन आणि श्रीनगर हाऊस बोट बुकिंग संपर्क!'
  },
  {
    code: 'LA',
    nameEn: 'Ladakh',
    nameMr: 'लडाख',
    nameHi: 'लद्दाख',
    targetPopulation: 4,
    featureTitleEn: 'Ladakh Apricot & Yak-Wool Path',
    featureTitleMr: 'लडाख जर्दाळू आणि याक-लोकर मंच',
    featureDescEn: 'Exquisite organic dried apricots trade and direct nomadic wool weavers register.',
    featureDescMr: 'अत्यंत सकस सेंद्रिय जर्दाळू खरेदी-विक्री आणि याक-लोकर विणकरांचे पारंपरिक दालन!'
  },
  {
    code: 'LD',
    nameEn: 'Lakshadweep',
    nameMr: 'लक्षद्वीप',
    nameHi: 'लक्षद्वीप',
    targetPopulation: 4,
    featureTitleEn: 'Lakshadweep Tuna & Coral Hub',
    featureTitleMr: 'लक्षद्वीप टूना मासे आणि पर्यटन',
    featureDescEn: 'Tuna fishing associations bulletins and pristine lagoon water sport advisors.',
    featureDescMr: 'टूना मासेमारी घाऊक वाटप आणि निसर्गरम्य बेट समुद्रपर्यटन गाईड माहिती!'
  },
  {
    code: 'PY',
    nameEn: 'Puducherry',
    nameMr: 'पुद्दुचेरी',
    nameHi: 'पुडुचेरी',
    targetPopulation: 4,
    featureTitleEn: 'Pondy Heritage & French Quarter',
    featureTitleMr: 'पाँडी वारसा आणि फ्रेंच क्वार्टर पर्यटन',
    featureDescEn: 'Bilingual tourist guides directories, handmade paper units, and Auroville organics.',
    featureDescMr: 'फ्रांसीसी संस्कृती पर्यटन मार्गदर्शक, हस्तनिर्मित कागद उद्योग आणि सेंद्रिय औषधे केंद्र!'
  }
].map(state => ({ ...state, targetPopulation: 2000000 }));

export interface MilestoneLevel {
  level: number;
  pct: number;
  name: string;
}

export const STATE_MILESTONE_LEVELS: MilestoneLevel[] = [
  { level: 1, pct: 10, name: 'Level 1 (10%)' },
  { level: 2, pct: 20, name: 'Level 2 (20%)' },
  { level: 3, pct: 30, name: 'Level 3 (30%)' },
  { level: 4, pct: 40, name: 'Level 4 (40%)' },
  { level: 5, pct: 50, name: 'Level 5 (50%)' },
  { level: 6, pct: 60, name: 'Level 6 (60%)' },
  { level: 7, pct: 70, name: 'Level 7 (70%)' },
  { level: 8, pct: 80, name: 'Level 8 (80%)' },
  { level: 9, pct: 90, name: 'Level 9 (90%)' },
  { level: 10, pct: 100, name: 'Level 10 (100%)' },
];

export interface FeatureTemplate {
  id: string;
  titleEn: string;
  titleMr: string;
  descEn: string;
  descMr: string;
  placeholderEn: string;
  placeholderMr: string;
  icon: string;
}

export const STATE_FEATURE_TEMPLATES: FeatureTemplate[] = [
  {
    id: 'audio_bulletin',
    titleEn: 'Local Audio Bulletin',
    titleMr: 'स्थानिक ऑडिओ बुलेटिन व बातम्या',
    descEn: 'Daily spoken news podcasts and voice updates from the state layout.',
    descMr: 'राज्यातील ताज्या चालू घडामोडी आणि विशेष बातम्यांचे रोजचे ऑडिओ बुलेटिन!',
    placeholderEn: 'Post an audio summary or voice update note link...',
    placeholderMr: 'ताज्या ऑडिओ बुलेटिन किंवा व्हॉईस रेकॉर्डिंगची लिंक येथे टाका...',
    icon: 'volume'
  },
  {
    id: 'grain_mandi',
    titleEn: 'Wholesale Grain Mandi',
    titleMr: 'घाऊक धान्य व भाजीपाला कृषी बाजार',
    descEn: 'Live commodity pricing and bulk ordering matchmaker.',
    descMr: 'थेट शेतमाल बाजारभाव, भाजीपाला दर आणि घाऊक व्यापार्‍यांचे संपर्क मंच!',
    placeholderEn: 'Add today\'s mandi rates or contact request...',
    placeholderMr: 'आजचे ताजे कृषी उत्पन्न बाजारभाव किंवा खरेदीदाराची मागणी येथे लिहा...',
    icon: 'mandi'
  },
  {
    id: 'blood_syndicate',
    titleEn: 'Emergency Blood Syndicate',
    titleMr: 'तात्काळ रक्तपेढी व मदत सिंडिकेट',
    descEn: 'Interactive state donor coordination desk for emergency situations.',
    descMr: 'कोणत्याही आपत्कालीन परिस्थितीत तात्काळ ब्लड डोनर आणि रुग्ण संपर्क क्षेत्र!',
    placeholderEn: 'State Blood group required, area & contact phone...',
    placeholderMr: 'रक्ताचा गट, रुग्णालय, क्षेत्र आणि संपर्क क्रमांक येथे टाका...',
    icon: 'blood'
  },
  {
    id: 'exam_prep',
    titleEn: 'Student Exam Prep Hub',
    titleMr: 'विद्यार्थी स्पर्धा परीक्षा मार्गदर्शन केंद्र',
    descEn: 'Free chat study notes & direct guidance for local state exams (MPSC/UPPSC etc.)',
    descMr: 'राज्यातील सरकारी नोकऱ्यांच्या परीक्षांच्या तयारीसाठी मोफत नोट्स व मार्गदर्शन!',
    placeholderEn: 'Share study tips, exam dates, or practice questions...',
    placeholderMr: 'अभ्यास टिप्स, परीक्षेचे वेळापत्रक किंवा सराव प्रश्न येथे शेअर करा...',
    icon: 'book'
  },
  {
    id: 'job_board',
    titleEn: 'State Job Board Corner',
    titleMr: 'राज्यस्तरीय स्थानिक नोकऱ्या व रोजगार संधी',
    descEn: 'Connect directly with wholesale merchants and shop owners hiring helper staff.',
    descMr: 'स्थानिक दुकाने, मॉल्स आणि व्यवसायांमधील रोजगाराच्या थेट संधी!',
    placeholderEn: 'Post direct hiring context (Job title, salary, phone)...',
    placeholderMr: 'थेट नोकरी भर्ती माहिती (कामाचे स्वरूप, पगार, संपर्क क्रमांक) लिहा...',
    icon: 'jobs'
  },
  {
    id: 'bachat_gat',
    titleEn: 'Bachat Gat Marketplace',
    titleMr: 'महिला बचत गट व गृहउद्योग बाजारपेठ',
    descEn: 'Discover organic creations & local handcrafted goods built by women clusters.',
    descMr: 'महिला बचत गटांनी तयार केलेल्या घरगुती व गृहउद्योग उत्पादनांची जाहिरात!',
    placeholderEn: 'Post product description, pricing & order phone...',
    placeholderMr: 'बचत गटाच्या उत्पादनांची नावे, किंमत आणि ऑर्डरसाठी संपर्क लिहा...',
    icon: 'gift'
  },
  {
    id: 'agri_rental',
    titleEn: 'Farmer Agri Tool Rental',
    titleMr: 'शेतकरी कृषी अवजारे भाडे मंच',
    descEn: 'Rent or barter unused tractors, drone sprayers & harvest apparatus.',
    descMr: 'ट्रॅक्टर, रोटाव्हेटर, फवारणी यंत्रे भाड्याने देण्यासाठी किंवा मिळवण्यासाठी मंच!',
    placeholderEn: 'Rent machine option, rate per hour/day and locality details...',
    placeholderMr: 'भाड्याने उपलब्ध अवजार, प्रति तास दर आणि तालुक्याचे नाव लिहा...',
    icon: 'tractor'
  },
  {
    id: 'artisan_handicrafts',
    titleEn: 'Artisan & Handicraft Room',
    titleMr: 'हस्तकला, कलाकुसर व मूर्तीकला दालन',
    descEn: 'Connect directly with verified native weavers and traditional clay potters.',
    descMr: 'पारंपारिक हातमाग विणकर, कुंभार आणि मूर्तिकारांशी थेट खरेदी संवाद!',
    placeholderEn: 'Showcase masterpiece art, location and order query...',
    placeholderMr: 'तुमच्या हस्तकलेचा नमुना, ठिकाण आणि विक्री संपर्क प्रविष्ट करा...',
    icon: 'art'
  },
  {
    id: 'transit_bus',
    titleEn: 'Direct Bus & Transit Live',
    titleMr: 'थेट बस गाडी व ट्रॅव्हल्स वेळापत्रक',
    descEn: 'Crowd-sourced state transit timetables and regular ridesharing options.',
    descMr: 'स्थानिक एसटी बस, खाजगी ट्रॅव्हल्स आणि कारपूलिंगचे वेळापत्रक व संपर्क!',
    placeholderEn: 'Add travel routes, departures or rides options...',
    placeholderMr: 'ट्रॅव्हल मार्ग, सुटण्याची वेळ आणि प्रवाशांसाठी संपर्क माहिती प्रविष्ट करा...',
    icon: 'bus'
  },
  {
    id: 'tourist_safari',
    titleEn: 'State Tourist Safari Advisor',
    titleMr: 'प्रादेशिक पर्यटन, गड-किल्ले व सफारी बुकिंग',
    descEn: 'Register expert tour-guides, temple updates, and forest homestays.',
    descMr: 'पर्यावरण पर्यटन, धबधबे, गड-किल्ले आणि सफारी गाईड्सचे अधिकृत संपर्क!',
    placeholderEn: 'Post recommendations, hotel/homestay offers, and guide detail...',
    placeholderMr: 'पर्यटनस्थळांचे अपडेट्स, होमस्टे पर्याय किंवा गाईडची माहिती लिहा...',
    icon: 'compass'
  },
  {
    id: 'ration_alert',
    titleEn: 'Ration & Govt Benefits Tracker',
    titleMr: 'रेशन व सरकारी योजना लाभ सतर्कता',
    descEn: 'Real-time alert tracker for food rations and newly rolled-out scheme applications.',
    descMr: 'रेशन मालाचे वाटप, नवीन सरकारी अनुदाने व योजनांच्या अर्जांची माहिती!',
    placeholderEn: 'Share news about active scheme distributions or form links...',
    placeholderMr: 'सध्या सुरू असलेल्या सरकारी योजनेचा फॉर्म किंवा रेशन वाटप अपडेट लिहा...',
    icon: 'bell'
  },
  {
    id: 'rentals_pg',
    titleEn: 'Rentals & PG Accommodations',
    titleMr: 'पीजी रूम्स आणि भाड्याने घरे शोधकेंद्र',
    descEn: 'Verified room postings for relocating students and working workers.',
    descMr: 'विद्यार्थी आणि वेगवेगळ्या नोकरदारांसाठी भाड्याने घरे, खोल्या आणि पीजी रूम्स!',
    placeholderEn: 'Describe rooms, monthly charge, location, restriction...',
    placeholderMr: 'खोलीची माहिती, महिन्याचे भाडे, पत्ता आणि संपर्क नंबर लिहा...',
    icon: 'home'
  },
  {
    id: 'old_is_gold',
    titleEn: 'Old-is-Gold Local Bazaar',
    titleMr: 'जुने खरेदी-विक्री गुज्जरी बाजार',
    descEn: 'Hyper-local bartering and direct second-hand product trades between neighbors.',
    descMr: 'एकमेकांमध्ये जुन्या वस्तू (उदा. सायकल, मोबाईल, कपाट) खरेदी-विक्री किंवा देवाणघेवाण!',
    placeholderEn: 'Describe used items details, conditions and expected price...',
    placeholderMr: 'वापरलेली वस्तू, तिची सद्यस्थिती आणि अपेक्षित किंमत याबद्दल लिहा...',
    icon: 'swap'
  },
  {
    id: 'doctor_qa',
    titleEn: 'Direct Doctor Q&A Desk',
    titleMr: 'थेट डॉक्टर आरोग्य आणि वैद्यकीय सल्ला केंद्र',
    descEn: 'Post symptoms anonymously to receive response from volunteering general physicians.',
    descMr: 'आरोग्यविषयक प्रश्न किंवा लक्षणे लिहून स्थानिक डॉक्टरांकडून सल्ला मिळवा!',
    placeholderEn: 'Ask general symptoms, request doctor contact context...',
    placeholderMr: 'आरोग्याविषयीची समस्या लिहा, किंवा मोफत तपासणी शिबिराबाबत कळवा...',
    icon: 'health'
  },
  {
    id: 'property_marketplace',
    titleEn: 'Property & Land Marketplace',
    titleMr: 'थेट जमीन व शेती मालमत्ता खरेदी-विक्री',
    descEn: 'No-broker direct field, farm, or shop leasing board.',
    descMr: 'मध्यस्थाशिवाय थेट शेतजमीन, मोकळे प्लॉट किंवा दुकाने खरेदी व भाडेतत्वावर देणे!',
    placeholderEn: 'Post property dimension, location detail, price per acre...',
    placeholderMr: 'जमिनीचे क्षेत्रफळ, गाव/पत्ता, प्रति एकर किंमत आणि संपर्क प्रविष्ट करा...',
    icon: 'map'
  },
  {
    id: 'weather_pest',
    titleEn: 'Live Weather & Pest Warnings',
    titleMr: 'थेट हवामान अंदाज आणि पीक कीड चेतावणी',
    descEn: 'Agriculture threat alerts, heavy downpours, and pest prevention hacks.',
    descMr: 'शेतकर्‍यांसाठी अतिवृष्टी अंदाज, पिकांवरील रोगांचे निवारण व कृषी सल्ले!',
    placeholderEn: 'Post warning details, area name, crop recommendation...',
    placeholderMr: 'हवामान इशारा, बाधित क्षेत्र आणि रोग नियंत्रणाचे उपाय सांगा...',
    icon: 'shield'
  },
  {
    id: 'cattle_trade',
    titleEn: 'Cattle & Domestic Animal Trade',
    titleMr: 'पशुधन (गाय, म्हैस, शेळी) खरेदी-विक्री',
    descEn: 'Direct trading engine for milk cows, buffaloes, and superior cattle feeds.',
    descMr: 'दुभत्या गाई, म्हशी, बैल किंवा शेळ्यांची मध्यस्थाशिवाय थेट खरेदी-विक्री!',
    placeholderEn: 'Post animal age, milk capacity, pricing expectation and phone...',
    placeholderMr: 'प्राण्याचे वय, दररोजचे दूध उत्पादन, अपेक्षित किंमत आणि मोबाईल नंबर टाका...',
    icon: 'cattle'
  },
  {
    id: 'traditional_medicine',
    titleEn: 'Traditional Medicine & Ayurveda',
    titleMr: 'पारंपारिक आयुर्वेदिक जडीबुटी व निसर्गोपचार',
    descEn: 'Exchange native grandma secrets, herbal immunity blends, and roots recipes.',
    descMr: 'घरगुती नैसर्गिक औषधोपचार, रोगप्रतिकारक शक्ती वाढवणारे काढे व वनौषधी माहिती!',
    placeholderEn: 'Write natural remedies recipe, benefits and precautions...',
    placeholderMr: 'घरगुती निसर्गोपचार पद्धती, वापरण्याची पद्धत आणि त्याचे फायदे लिहा...',
    icon: 'leaf'
  },
  {
    id: 'water_syndicate',
    titleEn: 'Water Tanker & Well Syndicate',
    titleMr: 'पानी टँकर आणि कूपनलिका जल सेवा',
    descEn: 'Instant access directory to local borehole drillers and drinkable tankers.',
    descMr: 'उन्हाळ्यात किंवा पाणीटंचाईच्या काळात टँकरद्वारे पाणीपुरवठा करणाऱ्यांचे थेट संपर्क!',
    placeholderEn: 'Tanker capacity (litres), price per delivery and booking line...',
    placeholderMr: 'टँकरची क्षमता (लिटर), एका ट्रीपची किंमत आणि बुकिंगसाठी मोबाईल नंबर द्या...',
    icon: 'drop'
  },
  {
    id: 'festival_shouts',
    titleEn: 'Local Festival Shouts',
    titleMr: 'स्थानिक जत्रा, उरूस आणि उत्सव निमंत्रण',
    descEn: 'Publish dates and open invitations for village jataras or cultural events.',
    descMr: 'गावातील जत्रा, कुस्तीचे फड, उरूस आणि विविध सामाजिक सांस्कृतिक कार्यक्रमांचे निमंत्रण!',
    placeholderEn: 'Post festive location schedules, highlight stars or matches info...',
    placeholderMr: 'उत्सवाचे नाव, तारीख, स्थळ आणि मुख्य आकर्षणांबाबत माहिती शेअर करा...',
    icon: 'sparkles'
  },
  {
    id: 'legal_aid',
    titleEn: 'Legal Aid & Sahayata Seva',
    titleMr: 'मोफत कायदेशीर सल्ला व साहाय्य मंच',
    descEn: 'Direct response from state-backed panel advocates for pro-bono aid.',
    descMr: 'सरकारी योजनांचे फायदे मिळवणे किंवा कायदेशीर बाबींवर तज्ञांचा मोफत सल्ला!',
    placeholderEn: 'Submit legal queries or helpline office coordinates...',
    placeholderMr: 'तक्रार निवारण हेल्पलाईन क्रमांक किंवा कायदेशीर सल्ला देणाऱ्यांचे संपर्क द्या...',
    icon: 'scale'
  },
  {
    id: 'lost_found',
    titleEn: 'Lost & Found Community Hub',
    titleMr: 'हरविले-सापडले प्रादेशिक मंच',
    descEn: 'Help native citizens search lost documents, ID cards, keys or pets.',
    descMr: 'हरविलेले दस्तऐवज, आधार कार्ड, पाळीव प्राणी किंवा चाव्या शोधण्यासाठी मदत!',
    placeholderEn: 'Describe item lost/found, photo refer or delivery spots...',
    placeholderMr: 'वस्तू कोठे गहाळ झाली किंवा सापडली, तिचे वर्णन आणि संपर्क माहिती लिहा...',
    icon: 'search'
  },
  {
    id: 'youth_sports',
    titleEn: 'Youth Sports & Talents Desk',
    titleMr: 'क्रीडा जगात व युवा सन्मान मंच',
    descEn: 'Post village cricket lists, match victories points and youth highlight notes.',
    descMr: 'क्रीडा सामन्यांचे आयोजन, स्थानिक खेळाडूंचे सत्कार आणि क्रीडा स्पर्धांच्या बातम्या!',
    placeholderEn: 'Add upcoming matches, tournament entries fees or award rules...',
    placeholderMr: 'स्पर्धेचे नाव, प्रवेश फी, विजेत्यांना बक्षीस आणि आयोजकांचे संपर्क लिहा...',
    icon: 'award'
  },
  {
    id: 'gram_polls',
    titleEn: 'Gram-Vikash Development Polls',
    titleMr: 'ग्रामविकास लोकमत व समस्या सर्वेक्षण',
    descEn: 'Voice priorities concerning rural schools, streetlights, and sanitation grids.',
    descMr: 'गावातील रस्ते, शाळा, वीज आणि स्वच्छता या समस्यांवर थेट मतदान आणि जनमत!',
    placeholderEn: 'Enter poll topics context (e.g., Road repair vs Quality Drinking Water)...',
    placeholderMr: 'मतदानाचा विषय लिहा (उदा. मुख्य रस्ता दुरुस्ती आवश्यक आहे का? होय/नाही)...',
    icon: 'check'
  }
];


