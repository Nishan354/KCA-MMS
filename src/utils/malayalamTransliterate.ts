/**
 * Phonetic Transliteration Utility for English to Malayalam script (മലയാളം)
 * Specialized for South Indian / Malayali names, surnames, and initials.
 */

const KNOWN_NAMES: Record<string, string> = {
  wilson: 'വിൽസൺ',
  philip: 'ഫിലിപ്പ്',
  suresh: 'സുരേഷ്',
  kumar: 'കുമാർ',
  pillai: 'പിള്ള',
  anitha: 'അനിത',
  anita: 'അനിത',
  rajendran: 'രാജേന്ദ്രൻ',
  muhammed: 'മുഹമ്മദ്',
  mohammed: 'മുഹമ്മദ്',
  muhammad: 'മുഹമ്മദ്',
  fasil: 'ഫാസിൽ',
  fazil: 'ഫാസിൽ',
  jayanarayanan: 'ജയനാരായണൻ',
  namboodiri: 'നമ്പൂതിരി',
  deepa: 'ദീപ',
  varghese: 'വർഗീസ്',
  ramesh: 'രമേഷ്',
  babu: 'ബാബു',
  shaji: 'ഷാജി',
  mathew: 'മാത്യു',
  mathews: 'മാത്യൂസ്',
  george: 'ജോർജ്ജ്',
  thomas: 'തോമസ്',
  joseph: 'ജോസഫ്',
  chacko: 'ചാക്കോ',
  jacob: 'ജേക്കബ്',
  kurian: 'കുര്യൻ',
  abraham: 'ഏബ്രഹാം',
  john: 'ജോൺ',
  paul: 'പോൾ',
  alex: 'അലക്സ്',
  antony: 'ആന്റണി',
  anthony: 'ആന്റണി',
  baby: 'ബേബി',
  biju: 'ബിജു',
  bipin: 'ബിപിൻ',
  manoj: 'മനോജ്',
  rajesh: 'രാജേഷ്',
  vijayan: 'വിജയൻ',
  vijay: 'വിജയ്',
  priya: 'പ്രിയ',
  radhika: 'രാധിക',
  santhosh: 'സന്തോഷ്',
  santhoshkumar: 'സന്തോഷ് കുമാർ',
  vinod: 'വിനോദ്',
  harikumar: 'ഹരികുമാർ',
  pradeep: 'പ്രദീപ്',
  abdul: 'അബ്ദുൽ',
  kareem: 'കരീം',
  rahman: 'റഹ്മാൻ',
  ali: 'അലി',
  shibu: 'ഷിബു',
  roy: 'റോയ്',
  vinu: 'വിനു',
  joy: 'ജോയ്',
  nair: 'നായർ',
  menon: 'മേനോൻ',
  varma: 'വർമ്മ',
  nambiar: 'നമ്പ്യാർ',
  panicker: 'പണിക്കർ',
  kurup: 'കുറുപ്പ്',
  unni: 'ഉണ്ണി',
  krishnan: 'കൃഷ്ണൻ',
  radhakrishnan: 'രാധാകൃഷ്ണൻ',
  narayanan: 'നാരായണൻ',
  sreedharan: 'ശ്രീധരൻ',
  balakrishnan: 'ബാലകൃഷ്ണൻ',
  unnikrishnan: 'ഉണ്ണികൃഷ്ണൻ',
  gopalakrishnan: 'ഗോപാലകൃഷ്ണൻ',
  jayachandran: 'ജയചന്ദ്രൻ',
  haridas: 'ഹരിദാസ്',
  mohanchandran: 'മോഹൻചന്ദ്രൻ',
  praveen: 'പ്രവീൺ',
  prasanth: 'പ്രശാന്ത്',
  pramod: 'പ്രമോദ്',
  sajeev: 'സജീവ്',
  saji: 'സജി',
  sajan: 'സാജൻ',
  shaju: 'ഷാജു',
  sunil: 'സുനിൽ',
  anil: 'അനിൽ',
  anilkumar: 'അനിൽകുമാർ',
  sunilkumar: 'സുനിൽകുമാർ',
  sasi: 'ശശി',
  sasikumar: 'ശശികുമാർ',
  ajith: 'അജിത്ത്',
  ajay: 'അജയ്',
  ashwin: 'അശ്വിൻ',
  arun: 'അരുൺ',
  akhil: 'അഖിൽ',
  anoop: 'അനൂപ്',
  anand: 'ആനന്ദ്',
  rohit: 'രോഹിത്',
  rahul: 'രാഹുൽ',
  roshan: 'റോഷൻ',
  vishnu: 'വിഷ്ണു',
  sarath: 'ശരത്',
  sujith: 'സുജിത്',
  sumesh: 'സുമേഷ്',
  gireesh: 'ഗിരീഷ്',
  girish: 'ഗിരീഷ്',
  satheesh: 'സതീഷ്',
  rakesh: 'രാകേഷ്',
  mahesh: 'മഹേഷ്',
  dileep: 'ദിലീപ്',
  pramodkumar: 'പ്രമോദ് കുമാർ',
  mini: 'മിനി',
  bindu: 'ബിന്ദു',
  sheeba: 'ഷീബ',
  geetha: 'ഗീത',
  latha: 'ലത',
  sobhana: 'ശോഭന',
  shobha: 'ശോഭ',
  sujatha: 'സുജാത',
  renuka: 'രേണുക',
  renjith: 'രഞ്ജിത്ത്',
  renju: 'രഞ്ജു',
  reshma: 'രേഷ്മ',
  remya: 'രമ്യ',
  ramya: 'രമ്യ',
  soumya: 'സൗമ്യ',
  dhanya: 'ധന്യ',
  kavitha: 'കവിത',
  saranya: 'ശരണ്യ',
  athira: 'ആതിര',
  arya: 'ആര്യ',
  aswathy: 'അശ്വതി',
  anu: 'അനു',
  anju: 'അഞ്ജു',
  anjana: 'അഞ്ജന',
  aparana: 'അപർണ്ണ',
  aparna: 'അപർണ്ണ',
  nisha: 'നിഷ',
  nishan: 'നിഷാൻ',
  sreeja: 'ശ്രീജ',
  sreedevi: 'ശ്രീദേവി',
  lakshmi: 'ലക്ഷ്മി',
  parvathy: 'പാർവ്വതി',
  malini: 'മാലിനി',
  sandhya: 'സന്ധ്യ',
  divya: 'ദിവ്യ',
  neethu: 'നീതു',
  veena: 'വീണ',
  vidya: 'വിദ്യ',
  sruthi: 'ശ്രുതി',
  keerthi: 'കീർത്തി',
};

const INITIALS_MAP: Record<string, string> = {
  a: 'എ.',
  b: 'ബി.',
  c: 'സി.',
  d: 'ഡി.',
  e: 'ഇ.',
  f: 'എഫ്.',
  g: 'ജി.',
  h: 'എച്ച്.',
  i: 'ഐ.',
  j: 'ജെ.',
  k: 'കെ.',
  l: 'എൽ.',
  m: 'എം.',
  n: 'എൻ.',
  o: 'ഒ.',
  p: 'പി.',
  q: 'ക്യു.',
  r: 'ആർ.',
  s: 'എസ്.',
  t: 'ടി.',
  u: 'യു.',
  v: 'വി.',
  w: 'ഡബ്ല്യു.',
  x: 'എക്സ്.',
  y: 'വൈ.',
  z: 'ഇസഡ്.',
};

/**
 * Phonetic syllabic mapping rules
 */
const VOWELS: [RegExp, string][] = [
  [/^aa/i, 'ആ'],
  [/^ai/i, 'ഐ'],
  [/^au/i, 'ഔ'],
  [/^ee/i, 'ഈ'],
  [/^oo/i, 'ഊ'],
  [/^a/i, 'അ'],
  [/^i/i, 'ഇ'],
  [/^u/i, 'ഉ'],
  [/^e/i, 'എ'],
  [/^o/i, 'ഒ'],
];

const MATRAS: [RegExp, string][] = [
  [/^aa/i, 'ാ'],
  [/^ai/i, 'ൈ'],
  [/^au/i, 'ൗ'],
  [/^ee/i, 'ീ'],
  [/^oo/i, 'ൂ'],
  [/^a/i, ''],
  [/^i/i, 'ി'],
  [/^u/i, 'ു'],
  [/^e/i, 'െ'],
  [/^o/i, 'ൊ'],
];

const CONSONANTS: [RegExp, string][] = [
  [/^kkh/i, 'ക്ക്'],
  [/^tth/i, 'ത്ത്'],
  [/^ssh/i, 'ഷ്'],
  [/^ch/i, 'ച'],
  [/^kh/i, 'ഖ'],
  [/^gh/i, 'ഘ'],
  [/^ng/i, 'ങ്ങ'],
  [/^th/i, 'ത'],
  [/^dh/i, 'ധ'],
  [/^ph/i, 'ഫ'],
  [/^bh/i, 'ഭ'],
  [/^sh/i, 'ഷ'],
  [/^zh/i, 'ഴ'],
  [/^nj/i, 'ഞ'],
  [/^k/i, 'ക'],
  [/^g/i, 'ഗ'],
  [/^j/i, 'ജ'],
  [/^t/i, 'ട'],
  [/^d/i, 'ഡ'],
  [/^n/i, 'ന'],
  [/^p/i, 'പ'],
  [/^b/i, 'ബ'],
  [/^m/i, 'മ'],
  [/^y/i, 'യ'],
  [/^r/i, 'ര'],
  [/^l/i, 'ല'],
  [/^v/i, 'വ'],
  [/^w/i, 'വ'],
  [/^s/i, 'സ'],
  [/^h/i, 'ഹ'],
  [/^f/i, 'ഫ'],
  [/^z/i, 'സ'],
];

/**
 * Phonetically transliterates a single English word into Malayalam
 */
function transliterateWord(rawWord: string): string {
  const clean = rawWord.trim().toLowerCase();
  if (!clean) return '';

  // Check known full name/surname dictionary
  if (KNOWN_NAMES[clean]) {
    return KNOWN_NAMES[clean];
  }

  // Check if single initial e.g. "K." or "N"
  const stripped = clean.replace(/[^a-z]/g, '');
  if (stripped.length === 1 && INITIALS_MAP[stripped]) {
    return INITIALS_MAP[stripped];
  }

  let result = '';
  let i = 0;
  const len = clean.length;
  let isStartOfWord = true;

  while (i < len) {
    const substr = clean.slice(i);

    // If at start and starts with a vowel
    if (isStartOfWord) {
      let matchedVowel = false;
      for (const [re, mal] of VOWELS) {
        const m = substr.match(re);
        if (m) {
          result += mal;
          i += m[0].length;
          isStartOfWord = false;
          matchedVowel = true;
          break;
        }
      }
      if (matchedVowel) continue;
    }

    // Match Consonant
    let matchedConsonant = false;
    for (const [re, mal] of CONSONANTS) {
      const m = substr.match(re);
      if (m) {
        const cLen = m[0].length;
        const afterConsonant = clean.slice(i + cLen);

        // Check if vowel follows consonant
        let matchedMatra = false;
        for (const [vRe, matra] of MATRAS) {
          const vm = afterConsonant.match(vRe);
          if (vm) {
            result += mal + matra;
            i += cLen + vm[0].length;
            matchedMatra = true;
            break;
          }
        }

        if (!matchedMatra) {
          // If at the end of word, add chandrakkala (്) or chillu
          if (i + cLen >= len) {
            if (m[0] === 'n') {
              result += 'ൻ';
            } else if (m[0] === 'r') {
              result += 'ർ';
            } else if (m[0] === 'l') {
              result += 'ൽ';
            } else {
              result += mal + '്';
            }
          } else {
            // Conjunct or virama
            result += mal + '്';
          }
          i += cLen;
        }

        isStartOfWord = false;
        matchedConsonant = true;
        break;
      }
    }

    if (!matchedConsonant) {
      // Unrecognized character (like dot, digit, hyphen)
      result += clean[i];
      i += 1;
      isStartOfWord = clean[i - 1] === ' ' || clean[i - 1] === '.';
    }
  }

  return result;
}

/**
 * Transliterates full English name (multi-word) into natural Malayalam script
 */
export function transliterateEnglishToMalayalam(englishName: string): string {
  if (!englishName || !englishName.trim()) return '';

  const words = englishName.trim().split(/\s+/);
  const malayalamWords = words.map((w) => transliterateWord(w));
  return malayalamWords.join(' ');
}
