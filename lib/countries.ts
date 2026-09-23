// Countries for nationality, location, and phone-code pickers.
// Flags are the matching SVG files in /public/flags.
export type Country = {
  code: string;
  name: string;
  dial: string;
  aliases?: readonly string[];
};

export const COUNTRIES: readonly Country[] = [
  { code: "AF", name: "Afghanistan", dial: "+93", aliases: ["Afġānistān"] },
  { code: "AX", name: "Åland Islands", dial: "+358", aliases: ["Aaland","Ahvenanmaa","Aland"] },
  { code: "AL", name: "Albania", dial: "+355", aliases: ["Shqipëri","Shqipëria","Shqipnia"] },
  { code: "DZ", name: "Algeria", dial: "+213", aliases: ["Algérie","Dzayer"] },
  { code: "AS", name: "American Samoa", dial: "+1", aliases: ["Amelika Sāmoa","Amerika Sāmoa","Sāmoa Amelika"] },
  { code: "AD", name: "Andorra", dial: "+376", aliases: ["Principality of Andorra","Principat d'Andorra"] },
  { code: "AO", name: "Angola", dial: "+244", aliases: ["República de Angola","ʁɛpublika de an'ɡɔla"] },
  { code: "AI", name: "Anguilla", dial: "+1" },
  { code: "AG", name: "Antigua and Barbuda", dial: "+1" },
  { code: "AR", name: "Argentina", dial: "+54", aliases: ["Argentine Republic","República Argentina"] },
  { code: "AM", name: "Armenia", dial: "+374", aliases: ["Hayastan","Republic of Armenia"] },
  { code: "AW", name: "Aruba", dial: "+297" },
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "AT", name: "Austria", dial: "+43", aliases: ["Oesterreich","Osterreich"] },
  { code: "AZ", name: "Azerbaijan", dial: "+994", aliases: ["Azərbaycan Respublikası","Republic of Azerbaijan"] },
  { code: "BS", name: "Bahamas", dial: "+1", aliases: ["Commonwealth of the Bahamas"] },
  { code: "BH", name: "Bahrain", dial: "+973", aliases: ["Kingdom of Bahrain","Mamlakat al-Baḥrayn"] },
  { code: "BD", name: "Bangladesh", dial: "+880", aliases: ["Gônôprôjatôntri Bangladesh","People's Republic of Bangladesh"] },
  { code: "BB", name: "Barbados", dial: "+1" },
  { code: "BY", name: "Belarus", dial: "+375", aliases: ["Bielaruś","Republic of Belarus"] },
  { code: "BE", name: "Belgium", dial: "+32", aliases: ["Belgie","België","Belgien","Belgique","Kingdom of Belgium","Königreich Belgien","Koninkrijk België","Royaume de Belgique"] },
  { code: "BZ", name: "Belize", dial: "+501" },
  { code: "BJ", name: "Benin", dial: "+229", aliases: ["Republic of Benin","République du Bénin"] },
  { code: "BM", name: "Bermuda", dial: "+1", aliases: ["Somers Isles","The Bermudas","The Islands of Bermuda"] },
  { code: "BT", name: "Bhutan", dial: "+975", aliases: ["Kingdom of Bhutan"] },
  { code: "BO", name: "Bolivia", dial: "+591", aliases: ["Bolivia, Plurinational State of","Buliwya","Buliwya Mamallaqta","Estado Plurinacional de Bolivia","Plurinational State of Bolivia","Tetã Volívia","Wuliwya","Wuliwya Suyu"] },
  { code: "BA", name: "Bosnia and Herzegovina", dial: "+387", aliases: ["Bosnia-Herzegovina"] },
  { code: "BW", name: "Botswana", dial: "+267", aliases: ["Lefatshe la Botswana","Republic of Botswana"] },
  { code: "BR", name: "Brazil", dial: "+55", aliases: ["Brasil","Federative Republic of Brazil","República Federativa do Brasil"] },
  { code: "IO", name: "British Indian Ocean Territory", dial: "+246" },
  { code: "VG", name: "British Virgin Islands", dial: "+1", aliases: ["Virgin Islands, British"] },
  { code: "BN", name: "Brunei", dial: "+673", aliases: ["Brunei Darussalam","Nation of Brunei","the Abode of Peace"] },
  { code: "BG", name: "Bulgaria", dial: "+359", aliases: ["Republic of Bulgaria"] },
  { code: "BF", name: "Burkina Faso", dial: "+226" },
  { code: "BI", name: "Burundi", dial: "+257", aliases: ["Republic of Burundi","Republika y'Uburundi","République du Burundi"] },
  { code: "KH", name: "Cambodia", dial: "+855", aliases: ["Kingdom of Cambodia"] },
  { code: "CM", name: "Cameroon", dial: "+237", aliases: ["Republic of Cameroon","République du Cameroun"] },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "CV", name: "Cape Verde", dial: "+238", aliases: ["Republic of Cabo Verde","República de Cabo Verde"] },
  { code: "BQ", name: "Caribbean Netherlands", dial: "+599", aliases: ["BES islands","Bonaire Sint Eustatius and Saba"] },
  { code: "KY", name: "Cayman Islands", dial: "+1" },
  { code: "CF", name: "Central African Republic", dial: "+236", aliases: ["République centrafricaine"] },
  { code: "TD", name: "Chad", dial: "+235", aliases: ["Republic of Chad","République du Tchad","Tchad"] },
  { code: "CL", name: "Chile", dial: "+56", aliases: ["Republic of Chile","República de Chile"] },
  { code: "CN", name: "China", dial: "+86", aliases: ["People's Republic of China","Zhongguo","Zhōngguó","Zhonghua","Zhōnghuá Rénmín Gònghéguó"] },
  { code: "CX", name: "Christmas Island", dial: "+61", aliases: ["Territory of Christmas Island"] },
  { code: "CC", name: "Cocos (Keeling) Islands", dial: "+61", aliases: ["Cocos Islands","Keeling Islands"] },
  { code: "CO", name: "Colombia", dial: "+57", aliases: ["Republic of Colombia","República de Colombia"] },
  { code: "KM", name: "Comoros", dial: "+269", aliases: ["al-Ittiḥād al-Qumurī","Udzima wa Komori","Union des Comores","Union of the Comoros"] },
  { code: "CK", name: "Cook Islands", dial: "+682", aliases: ["Kūki 'Āirani"] },
  { code: "CR", name: "Costa Rica", dial: "+506", aliases: ["Republic of Costa Rica","República de Costa Rica"] },
  { code: "HR", name: "Croatia", dial: "+385", aliases: ["Hrvatska","Republic of Croatia","Republika Hrvatska"] },
  { code: "CU", name: "Cuba", dial: "+53", aliases: ["Republic of Cuba","República de Cuba"] },
  { code: "CW", name: "Curaçao", dial: "+599", aliases: ["Country of Curaçao","Curacao","Kòrsou","Land Curaçao","Pais Kòrsou"] },
  { code: "CY", name: "Cyprus", dial: "+357", aliases: ["Kıbrıs","Kıbrıs Cumhuriyeti","Kýpros","Republic of Cyprus"] },
  { code: "CZ", name: "Czechia", dial: "+420", aliases: ["Česká republika","Česko","Czech Republic"] },
  { code: "DK", name: "Denmark", dial: "+45", aliases: ["Danmark","Kingdom of Denmark","Kongeriget Danmark"] },
  { code: "DJ", name: "Djibouti", dial: "+253", aliases: ["Gabuuti","Gabuutih Ummuuno","Jabuuti","Jamhuuriyadda Jabuuti","Republic of Djibouti","République de Djibouti"] },
  { code: "DM", name: "Dominica", dial: "+1", aliases: ["Commonwealth of Dominica","Dominique","Wai‘tu kubuli"] },
  { code: "DO", name: "Dominican Republic", dial: "+1" },
  { code: "CD", name: "DR Congo", dial: "+243", aliases: ["Congo-Kinshasa","Congo, the Democratic Republic of the","Democratic Republic of Congo","DRC"] },
  { code: "EC", name: "Ecuador", dial: "+593", aliases: ["Republic of Ecuador","República del Ecuador"] },
  { code: "EG", name: "Egypt", dial: "+20", aliases: ["Arab Republic of Egypt"] },
  { code: "SV", name: "El Salvador", dial: "+503", aliases: ["Republic of El Salvador","República de El Salvador"] },
  { code: "GQ", name: "Equatorial Guinea", dial: "+240", aliases: ["Republic of Equatorial Guinea","República da Guiné Equatorial","República de Guinea Ecuatorial","République de Guinée équatoriale"] },
  { code: "ER", name: "Eritrea", dial: "+291", aliases: ["Dawlat Iritriyá","Iritriyā","State of Eritrea","ʾErtrā"] },
  { code: "EE", name: "Estonia", dial: "+372", aliases: ["Eesti","Eesti Vabariik","Republic of Estonia"] },
  { code: "SZ", name: "Eswatini", dial: "+268", aliases: ["Kingdom of Eswatini","Ngwane","Swatini","Swaziland","Umbuso weSwatini","weSwatini"] },
  { code: "ET", name: "Ethiopia", dial: "+251", aliases: ["Federal Democratic Republic of Ethiopia","ʾĪtyōṗṗyā"] },
  { code: "FK", name: "Falkland Islands", dial: "+500", aliases: ["Falkland Islands (Malvinas)","Islas Malvinas"] },
  { code: "FO", name: "Faroe Islands", dial: "+298", aliases: ["Faeroe Islands","Færøerne","Føroyar"] },
  { code: "FJ", name: "Fiji", dial: "+679", aliases: ["Fijī Gaṇarājya","Matanitu ko Viti","Republic of Fiji","Viti"] },
  { code: "FI", name: "Finland", dial: "+358", aliases: ["Republic of Finland","Republiken Finland","Suomen tasavalta","Suomi"] },
  { code: "FR", name: "France", dial: "+33", aliases: ["French Republic","République française"] },
  { code: "GF", name: "French Guiana", dial: "+594", aliases: ["Guiana","Guyane"] },
  { code: "PF", name: "French Polynesia", dial: "+689", aliases: ["Polynésie française","Pōrīnetia Farāni"] },
  { code: "GA", name: "Gabon", dial: "+241", aliases: ["Gabonese Republic","République Gabonaise"] },
  { code: "GM", name: "Gambia", dial: "+220", aliases: ["Republic of the Gambia"] },
  { code: "GE", name: "Georgia", dial: "+995", aliases: ["Sakartvelo"] },
  { code: "DE", name: "Germany", dial: "+49", aliases: ["Bundesrepublik Deutschland","Federal Republic of Germany"] },
  { code: "GH", name: "Ghana", dial: "+233" },
  { code: "GI", name: "Gibraltar", dial: "+350" },
  { code: "GR", name: "Greece", dial: "+30", aliases: ["Elláda","Hellenic Republic"] },
  { code: "GL", name: "Greenland", dial: "+299", aliases: ["Grønland"] },
  { code: "GD", name: "Grenada", dial: "+1" },
  { code: "GP", name: "Guadeloupe", dial: "+590", aliases: ["Gwadloup"] },
  { code: "GU", name: "Guam", dial: "+1", aliases: ["Guåhån"] },
  { code: "GT", name: "Guatemala", dial: "+502" },
  { code: "GG", name: "Guernsey", dial: "+44", aliases: ["Bailiwick of Guernsey","Bailliage de Guernesey"] },
  { code: "GN", name: "Guinea", dial: "+224", aliases: ["Republic of Guinea","République de Guinée"] },
  { code: "GW", name: "Guinea-Bissau", dial: "+245", aliases: ["Republic of Guinea-Bissau","República da Guiné-Bissau"] },
  { code: "GY", name: "Guyana", dial: "+592", aliases: ["Co-operative Republic of Guyana"] },
  { code: "HT", name: "Haiti", dial: "+509", aliases: ["Repiblik Ayiti","Republic of Haiti","République d'Haïti"] },
  { code: "HN", name: "Honduras", dial: "+504", aliases: ["Republic of Honduras","República de Honduras"] },
  { code: "HK", name: "Hong Kong", dial: "+852" },
  { code: "HU", name: "Hungary", dial: "+36" },
  { code: "IS", name: "Iceland", dial: "+354", aliases: ["Island","Lýðveldið Ísland","Republic of Iceland"] },
  { code: "IN", name: "India", dial: "+91", aliases: ["Bhārat","Bharat Ganrajya","Republic of India"] },
  { code: "ID", name: "Indonesia", dial: "+62", aliases: ["Republic of Indonesia","Republik Indonesia"] },
  { code: "IR", name: "Iran", dial: "+98", aliases: ["Iran, Islamic Republic of","Islamic Republic of Iran","Jomhuri-ye Eslāmi-ye Irān"] },
  { code: "IQ", name: "Iraq", dial: "+964", aliases: ["Jumhūriyyat al-‘Irāq","Republic of Iraq"] },
  { code: "IE", name: "Ireland", dial: "+353", aliases: ["Éire","Poblacht na hÉireann","Republic of Ireland"] },
  { code: "IM", name: "Isle of Man", dial: "+44", aliases: ["Ellan Vannin","Mann","Mannin"] },
  { code: "IL", name: "Israel", dial: "+972", aliases: ["Medīnat Yisrā'el","State of Israel"] },
  { code: "IT", name: "Italy", dial: "+39", aliases: ["Italian Republic","Repubblica italiana"] },
  { code: "CI", name: "Ivory Coast", dial: "+225", aliases: ["Cote d'Ivoire","Côte d'Ivoire","Republic of Côte d'Ivoire","République de Côte d'Ivoire"] },
  { code: "JM", name: "Jamaica", dial: "+1" },
  { code: "JP", name: "Japan", dial: "+81", aliases: ["Nihon","Nippon"] },
  { code: "JE", name: "Jersey", dial: "+44", aliases: ["Bailiwick of Jersey","Bailliage dé Jèrri","Bailliage de Jersey"] },
  { code: "JO", name: "Jordan", dial: "+962", aliases: ["al-Mamlakah al-Urdunīyah al-Hāshimīyah","Hashemite Kingdom of Jordan"] },
  { code: "KZ", name: "Kazakhstan", dial: "+7", aliases: ["Qazaqstan","Qazaqstan Respublïkası","Republic of Kazakhstan","Respublika Kazakhstan"] },
  { code: "KE", name: "Kenya", dial: "+254", aliases: ["Jamhuri ya Kenya","Republic of Kenya"] },
  { code: "KI", name: "Kiribati", dial: "+686", aliases: ["Republic of Kiribati","Ribaberiki Kiribati"] },
  { code: "XK", name: "Kosovo", dial: "+383" },
  { code: "KW", name: "Kuwait", dial: "+965", aliases: ["Dawlat al-Kuwait","State of Kuwait"] },
  { code: "KG", name: "Kyrgyzstan", dial: "+996", aliases: ["Kyrgyz Republic","Kyrgyz Respublikasy"] },
  { code: "LA", name: "Laos", dial: "+856", aliases: ["Lao","Lao People's Democratic Republic","Sathalanalat Paxathipatai Paxaxon Lao"] },
  { code: "LV", name: "Latvia", dial: "+371", aliases: ["Latvijas Republika","Republic of Latvia"] },
  { code: "LB", name: "Lebanon", dial: "+961", aliases: ["Al-Jumhūrīyah Al-Libnānīyah","Lebanese Republic"] },
  { code: "LS", name: "Lesotho", dial: "+266", aliases: ["Kingdom of Lesotho","Muso oa Lesotho"] },
  { code: "LR", name: "Liberia", dial: "+231", aliases: ["Republic of Liberia"] },
  { code: "LY", name: "Libya", dial: "+218", aliases: ["Dawlat Libya","State of Libya"] },
  { code: "LI", name: "Liechtenstein", dial: "+423", aliases: ["Fürstentum Liechtenstein","Principality of Liechtenstein"] },
  { code: "LT", name: "Lithuania", dial: "+370", aliases: ["Lietuvos Respublika","Republic of Lithuania"] },
  { code: "LU", name: "Luxembourg", dial: "+352", aliases: ["Grand Duchy of Luxembourg","Grand-Duché de Luxembourg","Großherzogtum Luxemburg","Groussherzogtum Lëtzebuerg"] },
  { code: "MO", name: "Macau", dial: "+853", aliases: ["Macao"] },
  { code: "MG", name: "Madagascar", dial: "+261", aliases: ["Repoblikan'i Madagasikara","Republic of Madagascar","République de Madagascar"] },
  { code: "MW", name: "Malawi", dial: "+265", aliases: ["Republic of Malawi"] },
  { code: "MY", name: "Malaysia", dial: "+60" },
  { code: "MV", name: "Maldives", dial: "+960", aliases: ["Dhivehi Raajjeyge Jumhooriyya","Maldive Islands","Republic of the Maldives"] },
  { code: "ML", name: "Mali", dial: "+223", aliases: ["Republic of Mali","République du Mali"] },
  { code: "MT", name: "Malta", dial: "+356", aliases: ["Repubblika ta' Malta","Republic of Malta"] },
  { code: "MH", name: "Marshall Islands", dial: "+692", aliases: ["Aolepān Aorōkin M̧ajeļ","Republic of the Marshall Islands"] },
  { code: "MQ", name: "Martinique", dial: "+596" },
  { code: "MR", name: "Mauritania", dial: "+222", aliases: ["al-Jumhūriyyah al-ʾIslāmiyyah al-Mūrītāniyyah","Islamic Republic of Mauritania"] },
  { code: "MU", name: "Mauritius", dial: "+230", aliases: ["Republic of Mauritius","République de Maurice"] },
  { code: "YT", name: "Mayotte", dial: "+262", aliases: ["Département de Mayotte","Department of Mayotte"] },
  { code: "MX", name: "Mexico", dial: "+52", aliases: ["Estados Unidos Mexicanos","Mexicanos","United Mexican States"] },
  { code: "FM", name: "Micronesia", dial: "+691", aliases: ["Federated States of Micronesia","Micronesia, Federated States of"] },
  { code: "MD", name: "Moldova", dial: "+373", aliases: ["Moldova, Republic of","Republic of Moldova","Republica Moldova"] },
  { code: "MC", name: "Monaco", dial: "+377", aliases: ["Principality of Monaco","Principauté de Monaco"] },
  { code: "MN", name: "Mongolia", dial: "+976" },
  { code: "ME", name: "Montenegro", dial: "+382", aliases: ["Crna Gora"] },
  { code: "MS", name: "Montserrat", dial: "+1" },
  { code: "MA", name: "Morocco", dial: "+212", aliases: ["Al-Mamlakah al-Maġribiyah","Kingdom of Morocco"] },
  { code: "MZ", name: "Mozambique", dial: "+258", aliases: ["Republic of Mozambique","República de Moçambique"] },
  { code: "MM", name: "Myanmar", dial: "+95", aliases: ["Burma","Pyidaunzu Thanmăda Myăma Nainngandaw","Republic of the Union of Myanmar"] },
  { code: "NA", name: "Namibia", dial: "+264", aliases: ["Namibië","Republic of Namibia"] },
  { code: "NR", name: "Nauru", dial: "+674", aliases: ["Naoero","Pleasant Island","Republic of Nauru","Ripublik Naoero"] },
  { code: "NP", name: "Nepal", dial: "+977", aliases: ["Federal Democratic Republic of Nepal","Loktāntrik Ganatantra Nepāl"] },
  { code: "NL", name: "Netherlands", dial: "+31", aliases: ["Holland","Nederland","The Netherlands"] },
  { code: "NC", name: "New Caledonia", dial: "+687" },
  { code: "NZ", name: "New Zealand", dial: "+64", aliases: ["Aotearoa"] },
  { code: "NI", name: "Nicaragua", dial: "+505", aliases: ["Republic of Nicaragua","República de Nicaragua"] },
  { code: "NE", name: "Niger", dial: "+227", aliases: ["Nijar"] },
  { code: "NG", name: "Nigeria", dial: "+234", aliases: ["Federal Republic of Nigeria","Naíjíríà","Nijeriya"] },
  { code: "NU", name: "Niue", dial: "+683" },
  { code: "NF", name: "Norfolk Island", dial: "+672", aliases: ["Teratri of Norf'k Ailen","Territory of Norfolk Island"] },
  { code: "KP", name: "North Korea", dial: "+850", aliases: ["Chosŏn Minjujuŭi Inmin Konghwaguk","Democratic People's Republic of Korea","DPRK","Korea, Democratic People's Republic of"] },
  { code: "MK", name: "North Macedonia", dial: "+389", aliases: ["Macedonia","Macedonia, The Former Yugoslav Republic of","Republic of North Macedonia","The former Yugoslav Republic of Macedonia"] },
  { code: "MP", name: "Northern Mariana Islands", dial: "+1", aliases: ["Commonwealth of the Northern Mariana Islands","Sankattan Siha Na Islas Mariånas"] },
  { code: "NO", name: "Norway", dial: "+47", aliases: ["Kingdom of Norway","Kongeriket Noreg","Kongeriket Norge","Noreg","Norge"] },
  { code: "OM", name: "Oman", dial: "+968", aliases: ["Salṭanat ʻUmān","Sultanate of Oman"] },
  { code: "PK", name: "Pakistan", dial: "+92", aliases: ["Islāmī Jumhūriya'eh Pākistān","Islamic Republic of Pakistan","Pākistān"] },
  { code: "PW", name: "Palau", dial: "+680", aliases: ["Beluu er a Belau","Republic of Palau"] },
  { code: "PS", name: "Palestine", dial: "+970", aliases: ["Dawlat Filasṭin","Palestine, State of","State of Palestine"] },
  { code: "PA", name: "Panama", dial: "+507", aliases: ["Republic of Panama","República de Panamá"] },
  { code: "PG", name: "Papua New Guinea", dial: "+675", aliases: ["Independen Stet bilong Papua Niugini","Independent State of Papua New Guinea"] },
  { code: "PY", name: "Paraguay", dial: "+595", aliases: ["Republic of Paraguay","República del Paraguay","Tetã Paraguái"] },
  { code: "PE", name: "Peru", dial: "+51", aliases: ["Republic of Peru","República del Perú"] },
  { code: "PH", name: "Philippines", dial: "+63", aliases: ["Republic of the Philippines","Repúblika ng Pilipinas"] },
  { code: "PN", name: "Pitcairn Islands", dial: "+64", aliases: ["Pitcairn","Pitcairn Henderson Ducie and Oeno Islands"] },
  { code: "PL", name: "Poland", dial: "+48", aliases: ["Republic of Poland","Rzeczpospolita Polska"] },
  { code: "PT", name: "Portugal", dial: "+351", aliases: ["Portuguesa","Portuguese Republic","República Portuguesa"] },
  { code: "PR", name: "Puerto Rico", dial: "+1", aliases: ["Commonwealth of Puerto Rico","Estado Libre Asociado de Puerto Rico"] },
  { code: "QA", name: "Qatar", dial: "+974", aliases: ["Dawlat Qaṭar","State of Qatar"] },
  { code: "CG", name: "Republic of the Congo", dial: "+242", aliases: ["Congo","Congo-Brazzaville"] },
  { code: "RE", name: "Réunion", dial: "+262", aliases: ["Reunion"] },
  { code: "RO", name: "Romania", dial: "+40", aliases: ["România","Roumania","Rumania"] },
  { code: "RU", name: "Russia", dial: "+7", aliases: ["Russian Federation"] },
  { code: "RW", name: "Rwanda", dial: "+250", aliases: ["Republic of Rwanda","République du Rwanda","Repubulika y'u Rwanda"] },
  { code: "BL", name: "Saint Barthélemy", dial: "+590", aliases: ["Collectivité de Saint-Barthélemy","Collectivity of Saint Barthélemy","St. Barthelemy"] },
  { code: "SH", name: "Saint Helena, Ascension and Tristan da Cunha", dial: "+290", aliases: ["Saint Helena","St. Helena, Ascension and Tristan da Cunha"] },
  { code: "KN", name: "Saint Kitts and Nevis", dial: "+1", aliases: ["Federation of Saint Christopher and Nevis"] },
  { code: "LC", name: "Saint Lucia", dial: "+1" },
  { code: "MF", name: "Saint Martin", dial: "+590", aliases: ["Collectivité de Saint-Martin","Collectivity of Saint Martin","Saint Martin (French part)"] },
  { code: "PM", name: "Saint Pierre and Miquelon", dial: "+508", aliases: ["Collectivité territoriale de Saint-Pierre-et-Miquelon"] },
  { code: "VC", name: "Saint Vincent and the Grenadines", dial: "+1" },
  { code: "WS", name: "Samoa", dial: "+685", aliases: ["Independent State of Samoa","Malo Saʻoloto Tutoʻatasi o Sāmoa"] },
  { code: "SM", name: "San Marino", dial: "+378", aliases: ["Repubblica di San Marino","Republic of San Marino"] },
  { code: "ST", name: "São Tomé and Príncipe", dial: "+239", aliases: ["Democratic Republic of São Tomé and Príncipe","República Democrática de São Tomé e Príncipe","Sao Tome and Principe"] },
  { code: "SA", name: "Saudi Arabia", dial: "+966", aliases: ["Al-Mamlakah al-‘Arabiyyah as-Su‘ūdiyyah","Kingdom of Saudi Arabia","Saudi"] },
  { code: "SN", name: "Senegal", dial: "+221", aliases: ["Republic of Senegal","République du Sénégal"] },
  { code: "RS", name: "Serbia", dial: "+381", aliases: ["Republic of Serbia","Republika Srbija","Srbija"] },
  { code: "SC", name: "Seychelles", dial: "+248", aliases: ["Repiblik Sesel","Republic of Seychelles","République des Seychelles"] },
  { code: "SL", name: "Sierra Leone", dial: "+232", aliases: ["Republic of Sierra Leone"] },
  { code: "SG", name: "Singapore", dial: "+65", aliases: ["Republik Singapura","Singapura"] },
  { code: "SX", name: "Sint Maarten", dial: "+1", aliases: ["Sint Maarten (Dutch part)"] },
  { code: "SK", name: "Slovakia", dial: "+421", aliases: ["Slovak Republic","Slovenská republika"] },
  { code: "SI", name: "Slovenia", dial: "+386", aliases: ["Republic of Slovenia","Republika Slovenija"] },
  { code: "SB", name: "Solomon Islands", dial: "+677" },
  { code: "SO", name: "Somalia", dial: "+252", aliases: ["aṣ-Ṣūmāl","Federal Republic of Somalia","Jamhuuriyadda Federaalka Soomaaliya","Jumhūriyyat aṣ-Ṣūmāl al-Fiderāliyya"] },
  { code: "ZA", name: "South Africa", dial: "+27", aliases: ["Republic of South Africa","RSA","Suid-Afrika"] },
  { code: "KR", name: "South Korea", dial: "+82", aliases: ["Korea","Korea, Republic of","Republic of Korea"] },
  { code: "SS", name: "South Sudan", dial: "+211" },
  { code: "ES", name: "Spain", dial: "+34", aliases: ["Kingdom of Spain","Reino de España"] },
  { code: "LK", name: "Sri Lanka", dial: "+94", aliases: ["Democratic Socialist Republic of Sri Lanka","ilaṅkai"] },
  { code: "SD", name: "Sudan", dial: "+249", aliases: ["Jumhūrīyat as-Sūdān","Republic of the Sudan"] },
  { code: "SR", name: "Suriname", dial: "+597", aliases: ["Republic of Suriname","Republiek Suriname","Sarnam","Sranangron"] },
  { code: "SJ", name: "Svalbard and Jan Mayen", dial: "+47", aliases: ["Svalbard and Jan Mayen Islands"] },
  { code: "SE", name: "Sweden", dial: "+46", aliases: ["Kingdom of Sweden","Konungariket Sverige"] },
  { code: "CH", name: "Switzerland", dial: "+41", aliases: ["Schweiz","Suisse","Svizra","Svizzera","Swiss Confederation"] },
  { code: "SY", name: "Syria", dial: "+963", aliases: ["Al-Jumhūrīyah Al-ʻArabīyah As-Sūrīyah","Syrian Arab Republic"] },
  { code: "TW", name: "Taiwan", dial: "+886", aliases: ["Chinese Taipei","Republic of China","Táiwān","Zhōnghuá Mínguó"] },
  { code: "TJ", name: "Tajikistan", dial: "+992", aliases: ["Çumhuriyi Toçikiston","Republic of Tajikistan","Toçikiston"] },
  { code: "TZ", name: "Tanzania", dial: "+255", aliases: ["Jamhuri ya Muungano wa Tanzania","Tanzania, United Republic of","United Republic of Tanzania"] },
  { code: "TH", name: "Thailand", dial: "+66", aliases: ["Kingdom of Thailand","Prathet","Ratcha Anachak Thai","Thai"] },
  { code: "TL", name: "Timor-Leste", dial: "+670", aliases: ["Democratic Republic of Timor-Leste","East Timor","República Democrática de Timor-Leste","Repúblika Demokrátika Timór-Leste","Timor","Timór Lorosa'e","Timor Lorosae"] },
  { code: "TG", name: "Togo", dial: "+228", aliases: ["République Togolaise","Togolese","Togolese Republic"] },
  { code: "TK", name: "Tokelau", dial: "+690" },
  { code: "TO", name: "Tonga", dial: "+676" },
  { code: "TT", name: "Trinidad and Tobago", dial: "+1", aliases: ["Republic of Trinidad and Tobago"] },
  { code: "TN", name: "Tunisia", dial: "+216", aliases: ["al-Jumhūriyyah at-Tūnisiyyah","Republic of Tunisia"] },
  { code: "TR", name: "Türkiye", dial: "+90", aliases: ["Republic of Turkey","Turkey","Turkiye","Türkiye Cumhuriyeti"] },
  { code: "TM", name: "Turkmenistan", dial: "+993" },
  { code: "TC", name: "Turks and Caicos Islands", dial: "+1" },
  { code: "TV", name: "Tuvalu", dial: "+688" },
  { code: "UG", name: "Uganda", dial: "+256", aliases: ["Jamhuri ya Uganda","Republic of Uganda"] },
  { code: "UA", name: "Ukraine", dial: "+380", aliases: ["Ukrayina"] },
  { code: "AE", name: "United Arab Emirates", dial: "+971", aliases: ["Emirates","UAE"] },
  { code: "GB", name: "United Kingdom", dial: "+44", aliases: ["Britain","England","Great Britain","UK"] },
  { code: "US", name: "United States", dial: "+1", aliases: ["America","United States of America","USA"] },
  { code: "VI", name: "United States Virgin Islands", dial: "+1", aliases: ["Virgin Islands, U.S."] },
  { code: "UY", name: "Uruguay", dial: "+598", aliases: ["Oriental Republic of Uruguay","República Oriental del Uruguay"] },
  { code: "UZ", name: "Uzbekistan", dial: "+998", aliases: ["O‘zbekiston Respublikasi","Republic of Uzbekistan"] },
  { code: "VU", name: "Vanuatu", dial: "+678", aliases: ["Republic of Vanuatu","République de Vanuatu","Ripablik blong Vanuatu"] },
  { code: "VA", name: "Vatican City", dial: "+379", aliases: ["Holy See (Vatican City State)","Stato della Città del Vaticano","Vatican","Vatican City State"] },
  { code: "VE", name: "Venezuela", dial: "+58", aliases: ["Bolivarian Republic of Venezuela","República Bolivariana de Venezuela","Venezuela, Bolivarian Republic of"] },
  { code: "VN", name: "Vietnam", dial: "+84", aliases: ["Cộng hòa Xã hội chủ nghĩa Việt Nam","Socialist Republic of Vietnam","Viet Nam"] },
  { code: "WF", name: "Wallis and Futuna", dial: "+681", aliases: ["Territoire des îles Wallis et Futuna","Territory of the Wallis and Futuna Islands"] },
  { code: "EH", name: "Western Sahara", dial: "+212", aliases: ["Taneẓroft Tutrimt"] },
  { code: "YE", name: "Yemen", dial: "+967", aliases: ["al-Jumhūriyyah al-Yamaniyyah","Yemeni Republic"] },
  { code: "ZM", name: "Zambia", dial: "+260", aliases: ["Republic of Zambia"] },
  { code: "ZW", name: "Zimbabwe", dial: "+263", aliases: ["Republic of Zimbabwe"] },
];

const byCode = new Map(COUNTRIES.map((country) => [country.code, country]));

export function findCountry(code: string): Country | undefined {
  return byCode.get(code);
}

export function countryLabel(country: Country, locale: string): string {
  try {
    const localized = new Intl.DisplayNames([locale], { type: "region" }).of(country.code);
    if (localized && localized !== country.code) return localized;
  } catch {
    // An unknown locale falls back to the English name below.
  }
  return country.name;
}

export function foldCountryQuery(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

function matchScore(text: string, query: string): number | null {
  if (!text) return null;
  if (text === query) return 0;
  if (text.startsWith(query)) return 1;
  if (text.split(" ").some((word) => word.startsWith(query))) return 2;
  const index = text.indexOf(query);
  return index >= 0 ? 3 + index / 1000 : null;
}

function bestScore(country: Country, label: string, query: string): number | null {
  let best: number | null = null;
  const consider = (score: number | null) => {
    if (score !== null && (best === null || score < best)) best = score;
  };
  for (const name of [label, country.name, country.code]) consider(matchScore(foldCountryQuery(name), query));
  for (const alias of country.aliases ?? []) {
    const score = matchScore(foldCountryQuery(alias), query);
    if (score !== null) consider(score + 0.5);
  }
  const digits = query.replace(/^\+/, "");
  if (/^\d+$/.test(digits)) {
    const dial = country.dial.slice(1);
    if (dial === digits) consider(0);
    else if (dial.startsWith(digits)) consider(1);
  }
  return best;
}

// Empty queries stay alphabetical in the active language. Typed queries move
// exact and prefix matches ahead of looser ones, and drop countries that do
// not match.
export function rankCountries(
  countries: readonly Country[],
  query: string,
  labelFor: (country: Country) => string,
): Country[] {
  const folded = foldCountryQuery(query);
  const labeled = countries.map((country) => ({ country, label: labelFor(country) }));
  const compare = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });
  if (!folded) return labeled.sort((a, b) => compare(a.label, b.label)).map((row) => row.country);
  return labeled
    .flatMap((row) => {
      const score = bestScore(row.country, row.label, folded);
      return score === null ? [] : [{ ...row, score }];
    })
    .sort((a, b) => a.score - b.score || compare(a.label, b.label))
    .map((row) => row.country);
}
