/**
 * Bilingual dictionary (English + Swahili) for the whole app, UI and email.
 *
 * Plain module with no client/server directive so it can be imported by client
 * components (the language toggle) and server code (API routes, email templates,
 * the matching engine) from one source of truth.
 */

export type Lang = "en" | "sw";
export const LANGS: Lang[] = ["en", "sw"];
export const DEFAULT_LANG: Lang = "en";

export function isLang(v: unknown): v is Lang {
  return v === "en" || v === "sw";
}

type Dict = Record<string, string>;

const en: Dict = {
  "meta.title": "FirstRung. The job hunt, handled for new grads.",
  // nav
  "nav.how": "How it works",
  "nav.why": "Why FirstRung",
  "nav.filter": "The truth filter",
  "nav.getMatched": "Get matched",
  "lang.toggleTo": "Kiswahili", // label that switches TO the other language

  // hero
  "hero.title1": "The job hunt that",
  "hero.title2": "works while you sleep.",
  "hero.sub":
    "Tell FirstRung your degree and the roles you want. We scan jobs across Tanzania and the remote world, and show you the ones that fit, each with the reason it made the cut. No account, nothing saved.",
  "hero.ctaPrimary": "Get matched free",
  "hero.ctaSecondary": "See how it works",
  "hero.trust": "Free. Anonymous. Nothing saved.",
  "hero.sampleLabel": "How a ranked match reads",
  "sample1.title": "Graduate Data Analyst",
  "sample1.where": "Remote, full time",
  "sample1.r1": "Matches your target role",
  "sample1.r2": "Uses your skills: SQL, Python",
  "sample1.r3": "Entry level friendly",
  "sample2.title": "Junior Software Engineer",
  "sample2.where": "Hybrid, Dar es Salaam",
  "sample2.r1": "Remote, the way you like it",
  "sample2.r2": "Posted in the last few days",
  "sample.viewApply": "View and apply",
  "marquee.label": "Matching graduates to roles like these",

  // how it works
  "how.kicker": "How it works",
  "how.title": "Three steps, then you can forget about it.",
  "how.s1.t": "Tell us about you",
  "how.s1.d": "Your degree, your field, the roles you want, and where you want to work. Two minutes, done once.",
  "how.s2.t": "We watch the market",
  "how.s2.d": "Around the clock, across job feeds and company pages, we look for roles that fit your profile.",
  "how.s3.t": "You get the good ones",
  "how.s3.d": "Ranked matches appear on the spot, each with a short reason and a direct link to apply. Nothing else.",

  // why
  "why.kicker": "Why FirstRung",
  "why.title": "A job board sends you everything. We send you the right things.",
  "why.f1.t": "Ranked by fit, not by date",
  "why.f1.d": "You get a short list with a score and a reason for every role, not a thousand tabs to sift through.",
  "why.f2.t": "The entry level truth filter",
  "why.f2.d": "Plenty of listings say entry level, then ask for five years. We read the fine print and leave those out.",
  "why.f3.t": "Nothing to manage",
  "why.f3.d": "No account, no saved data, no dashboard to babysit. You ask, and the roles that actually fit show up.",

  // signup
  "signup.title": "See your matches in two minutes",
  "signup.sub": "Fill this in and see real, live openings matched to you. No account, no email, nothing saved.",

  // form
  "form.field": "Field of study",
  "form.field.ph": "Computer Science",
  "form.degree": "Degree level",
  "form.degree.bachelors": "Bachelor's",
  "form.degree.masters": "Master's",
  "form.degree.phd": "PhD",
  "form.work": "Work style",
  "form.work.any": "Any",
  "form.work.remote": "Remote only",
  "form.work.hybrid": "Hybrid",
  "form.work.onsite": "On site",
  "form.roles": "Target roles, comma separated",
  "form.roles.ph": "Data Analyst, Software Engineer",
  "form.skills": "Skills, comma separated",
  "form.skills.ph": "SQL, Python, Excel",
  "form.locations": "Locations, comma separated",
  "form.locations.ph": "Dar es Salaam, Arusha",
  "form.country": "Country",
  "form.submit": "Show my matches",
  "form.submitting": "Reading the job market",
  "form.trust": "Anonymous. Nothing saved unless you ask us to email you.",

  // results
  "results.matches_one": "{n} live match for you",
  "results.matches_other": "{n} live matches for you",
  "results.none": "No strong matches right now",
  "results.new": "New search",
  "results.viewApply": "View and apply",
  "results.remote": "Remote",
  "results.emptyHelp":
    "Nothing cleared the bar this time. Try broadening your target roles, adding a skill, or switching work style to Any, then search again.",

  // email block in results
  "emailblock.title": "Want your top 3 by email, with how to proceed?",
  "emailblock.placeholder": "you@example.com",
  "emailblock.button": "Email them to me",
  "emailblock.preparing": "Preparing",
  "emailblock.note": "We email a confirmation link first. Click it to receive your matches. Address used once, never stored.",
  "emailblock.confirmSent": "Check {email} for a confirmation link. Click it and we will send your top 3.",
  "emailblock.previewNote": "Preview of the confirmation email (no provider configured, so nothing was sent):",
  "emailblock.error": "Could not send. Please try again.",
  "emailblock.neterror": "Network error. Please try again.",

  // footer
  "footer.privacy": "Anonymous by design. No account, no database, nothing stored. We never see or sell your data.",
  "footer.getMatched": "Get matched",

  // confirm page
  "confirm.title": "One last tap",
  "confirm.body": "Confirm you want your top 3 {field}matches sent to {email}, with how to proceed.",
  "confirm.button": "Confirm and send my matches",
  "confirm.sending": "Sending",
  "confirm.sent": "Sent. Your top 3 matches are on the way to your inbox.",
  "confirm.previewNote": "Confirmed. No email provider is configured, so here is exactly what would be sent:",
  "confirm.error": "Could not send. Please try again.",
  "confirm.neterror": "Network error. Please try again.",
  "confirm.invalidTitle": "This link is invalid or expired",
  "confirm.invalidBody": "Confirmation links last 24 hours. Run a search again and request a fresh one.",
  "confirm.back": "Back to FirstRung",

  // email: confirmation request
  "email.confirm.subject": "Confirm your FirstRung job matches",
  "email.confirm.body":
    "Someone asked FirstRung to email job matches in {field} to this address. If that was you, confirm below and we will send your top 3 with how to proceed.",
  "email.confirm.button": "Confirm and send my matches",
  "email.confirm.ignore":
    "If you did not ask for this, just ignore this email. Nothing will be sent and your address is not stored. This link expires in 24 hours.",

  // email: top matches
  "email.top.subject_one": "Your top {n} match in {field}",
  "email.top.subject_other": "Your top {n} matches in {field}",
  "email.top.subjectNone": "No strong matches yet in your search",
  "email.top.intro_one": "Here is your strongest match right now, ranked by fit.",
  "email.top.intro_other": "Here are your strongest matches right now, ranked by fit.",
  "email.top.none": "Nothing cleared the bar this time. Try broadening your roles, adding a skill, or widening your locations, then search again.",
  "email.top.howTo": "How to proceed",
  "email.top.footer": "You asked FirstRung to email these matches. We did not store your address or your search.",
  "email.viewApply": "View and apply",
  "email.no": "No.",
  "email.remote": "Remote",
  "email.step1": "Open each role and read the requirements once. If it fits, apply the same day. Early applicants get seen first.",
  "email.step2": "Tailor your CV to the words in the listing. Mirror the skills they name that you genuinely have.",
  "email.step3": "If there is a named contact, send a short note saying one concrete reason you fit. Skip the generic cover letter.",
  "email.step4": "Write down what you sent and when, then follow up after about a week if you hear nothing.",

  // match reasons
  "reason.role": 'Matches your target role "{role}"',
  "reason.skills": "Uses your skills: {list}",
  "reason.entry": "Entry level friendly",
  "reason.years": "Asks for {n}+ years, likely not truly entry level",
  "reason.remotePref": "Remote, as you prefer",
  "reason.inArea": "In your area: {area}",
  "reason.remoteOption": "Remote option",
  "reason.fresh": "Posted in the last few days",
};

const sw: Dict = {
  "meta.title": "FirstRung. Utafutaji kazi, umerahisishwa kwa wahitimu.",
  "nav.how": "Jinsi inavyofanya kazi",
  "nav.why": "Kwa nini FirstRung",
  "nav.filter": "Kichujio cha ukweli",
  "nav.getMatched": "Pata nafasi",
  "lang.toggleTo": "English",

  "hero.title1": "Utafutaji kazi",
  "hero.title2": "unaofanya kazi ukiwa umelala.",
  "hero.sub":
    "Mwambie FirstRung shahada yako na kazi unazotaka. Tunachunguza kazi kote Tanzania na ulimwengu wa mtandaoni, na kukuonyesha zinazokufaa, kila moja ikiwa na sababu ya kuchaguliwa. Hakuna akaunti, hakuna kinachohifadhiwa.",
  "hero.ctaPrimary": "Pata nafasi bure",
  "hero.ctaSecondary": "Ona jinsi inavyofanya kazi",
  "hero.trust": "Bure. Bila kujulikana. Hakuna kinachohifadhiwa.",
  "hero.sampleLabel": "Jinsi nafasi iliyopangwa inavyoonekana",
  "sample1.title": "Mchambuzi wa Data (Mhitimu)",
  "sample1.where": "Mtandaoni, muda kamili",
  "sample1.r1": "Inalingana na kazi unayolenga",
  "sample1.r2": "Inatumia ujuzi wako: SQL, Python",
  "sample1.r3": "Inafaa kwa wahitimu wapya",
  "sample2.title": "Mhandisi wa Programu (Mwanzo)",
  "sample2.where": "Mchanganyiko, Dar es Salaam",
  "sample2.r1": "Mtandaoni, kama upendavyo",
  "sample2.r2": "Imewekwa siku chache zilizopita",
  "sample.viewApply": "Tazama na uombe",
  "marquee.label": "Tunaunganisha wahitimu na kazi kama hizi",

  "how.kicker": "Jinsi inavyofanya kazi",
  "how.title": "Hatua tatu, kisha unaweza kuisahau.",
  "how.s1.t": "Tuambie kukuhusu",
  "how.s1.d": "Shahada yako, fani yako, kazi unazotaka, na mahali unapotaka kufanya kazi. Dakika mbili, mara moja tu.",
  "how.s2.t": "Tunafuatilia soko",
  "how.s2.d": "Mchana na usiku, kwenye tovuti za kazi na kurasa za makampuni, tunatafuta kazi zinazolingana na wasifu wako.",
  "how.s3.t": "Unapata zilizo bora",
  "how.s3.d": "Nafasi zilizopangwa zinaonekana papo hapo, kila moja ikiwa na sababu fupi na kiungo cha kuomba moja kwa moja. Hakuna kingine.",

  "why.kicker": "Kwa nini FirstRung",
  "why.title": "Tovuti za kazi zinakuletea kila kitu. Sisi tunakuletea zinazokufaa.",
  "why.f1.t": "Zimepangwa kwa ufaafu, si kwa tarehe",
  "why.f1.d": "Unapata orodha fupi yenye alama na sababu kwa kila kazi, si maelfu ya kurasa za kupekua.",
  "why.f2.t": "Kichujio cha ukweli cha ngazi ya mwanzo",
  "why.f2.d": "Matangazo mengi yanasema ngazi ya mwanzo, kisha yanaomba uzoefu wa miaka mitano. Tunasoma maelezo madogo na kuyaacha.",
  "why.f3.t": "Hakuna cha kusimamia",
  "why.f3.d": "Hakuna akaunti, hakuna data iliyohifadhiwa, hakuna dashibodi ya kuangalia. Unauliza, na kazi zinazokufaa zinajitokeza.",

  "signup.title": "Ona nafasi zako katika dakika mbili",
  "signup.sub": "Jaza hapa na uone nafasi halisi zilizopo zinazokufaa. Hakuna akaunti, hakuna barua pepe, hakuna kinachohifadhiwa.",

  "form.field": "Fani ya masomo",
  "form.field.ph": "Sayansi ya Kompyuta",
  "form.degree": "Ngazi ya shahada",
  "form.degree.bachelors": "Shahada ya kwanza",
  "form.degree.masters": "Shahada ya uzamili",
  "form.degree.phd": "Shahada ya uzamivu (PhD)",
  "form.work": "Aina ya kazi",
  "form.work.any": "Yoyote",
  "form.work.remote": "Mtandaoni pekee",
  "form.work.hybrid": "Mchanganyiko",
  "form.work.onsite": "Ofisini",
  "form.roles": "Kazi unazolenga, tenga kwa koma",
  "form.roles.ph": "Mchambuzi wa Data, Mhandisi wa Programu",
  "form.skills": "Ujuzi, tenga kwa koma",
  "form.skills.ph": "SQL, Python, Excel",
  "form.locations": "Maeneo, tenga kwa koma",
  "form.locations.ph": "Dar es Salaam, Arusha",
  "form.country": "Nchi",
  "form.submit": "Nionyeshe nafasi zangu",
  "form.submitting": "Tunasoma soko la kazi",
  "form.trust": "Bila kujulikana. Hakuna kinachohifadhiwa isipokuwa ukituomba tukutumie barua pepe.",

  "results.matches_one": "Nafasi {n} halisi kwa ajili yako",
  "results.matches_other": "Nafasi {n} halisi kwa ajili yako",
  "results.none": "Hakuna nafasi madhubuti kwa sasa",
  "results.new": "Tafuta upya",
  "results.viewApply": "Tazama na uombe",
  "results.remote": "Mtandaoni",
  "results.emptyHelp":
    "Hakuna kilichofikia kiwango safari hii. Jaribu kupanua kazi unazolenga, kuongeza ujuzi, au kubadilisha aina ya kazi kuwa Yoyote, kisha tafuta tena.",

  "emailblock.title": "Unataka 3 bora kwa barua pepe, pamoja na jinsi ya kuendelea?",
  "emailblock.placeholder": "wewe@mfano.com",
  "emailblock.button": "Nitumie kwa barua pepe",
  "emailblock.preparing": "Inaandaa",
  "emailblock.note": "Tunatuma kiungo cha uthibitisho kwanza. Bofya ili upokee nafasi zako. Anwani inatumika mara moja, haihifadhiwi kamwe.",
  "emailblock.confirmSent": "Angalia {email} kupata kiungo cha uthibitisho. Bofya na tutakutumia 3 bora.",
  "emailblock.previewNote": "Onyesho la barua pepe ya uthibitisho (hakuna mtoa huduma, kwa hivyo hakuna kilichotumwa):",
  "emailblock.error": "Imeshindikana kutuma. Tafadhali jaribu tena.",
  "emailblock.neterror": "Hitilafu ya mtandao. Tafadhali jaribu tena.",

  "footer.privacy": "Bila kujulikana kwa muundo. Hakuna akaunti, hakuna hifadhidata, hakuna kinachohifadhiwa. Hatuoni wala kuuza data yako.",
  "footer.getMatched": "Pata nafasi",

  "confirm.title": "Bofyo moja la mwisho",
  "confirm.body": "Thibitisha unataka nafasi 3 bora za {field}zitumwe kwa {email}, pamoja na jinsi ya kuendelea.",
  "confirm.button": "Thibitisha na utume nafasi zangu",
  "confirm.sending": "Inatuma",
  "confirm.sent": "Imetumwa. Nafasi zako 3 bora zinaelekea kwenye kikasha chako.",
  "confirm.previewNote": "Imethibitishwa. Hakuna mtoa huduma wa barua pepe, kwa hivyo hapa ndipo kingetumwa:",
  "confirm.error": "Imeshindikana kutuma. Tafadhali jaribu tena.",
  "confirm.neterror": "Hitilafu ya mtandao. Tafadhali jaribu tena.",
  "confirm.invalidTitle": "Kiungo hiki si sahihi au kimepitwa na muda",
  "confirm.invalidBody": "Viungo vya uthibitisho hudumu saa 24. Tafuta tena na uombe kipya.",
  "confirm.back": "Rudi FirstRung",

  "email.confirm.subject": "Thibitisha nafasi zako za kazi za FirstRung",
  "email.confirm.body":
    "Mtu fulani aliomba FirstRung itume nafasi za kazi za {field} kwenye anwani hii. Kama ulikuwa wewe, thibitisha hapa chini nasi tutakutumia 3 bora pamoja na jinsi ya kuendelea.",
  "email.confirm.button": "Thibitisha na utume nafasi zangu",
  "email.confirm.ignore":
    "Kama hukuomba hili, puuza barua pepe hii. Hakuna kitakachotumwa na anwani yako haihifadhiwi. Kiungo hiki kitaisha baada ya saa 24.",

  "email.top.subject_one": "Nafasi {n} bora katika {field}",
  "email.top.subject_other": "Nafasi {n} bora katika {field}",
  "email.top.subjectNone": "Bado hakuna nafasi madhubuti katika utafutaji wako",
  "email.top.intro_one": "Hii ndiyo nafasi yako madhubuti kwa sasa, imepangwa kwa ufaafu.",
  "email.top.intro_other": "Hizi ndizo nafasi zako madhubuti kwa sasa, zimepangwa kwa ufaafu.",
  "email.top.none": "Hakuna kilichofikia kiwango safari hii. Jaribu kupanua kazi zako, kuongeza ujuzi, au kupanua maeneo, kisha tafuta tena.",
  "email.top.howTo": "Jinsi ya kuendelea",
  "email.top.footer": "Uliomba FirstRung ikutumie nafasi hizi. Hatukuhifadhi anwani yako wala utafutaji wako.",
  "email.viewApply": "Tazama na uombe",
  "email.no": "Na.",
  "email.remote": "Mtandaoni",
  "email.step1": "Fungua kila kazi na usome mahitaji mara moja. Kama inakufaa, omba siku hiyo hiyo. Wanaoomba mapema huonekana kwanza.",
  "email.step2": "Boresha CV yako kulingana na maneno yaliyo kwenye tangazo. Onyesha ujuzi waliotaja ambao unao kweli.",
  "email.step3": "Kama kuna mtu wa kuwasiliana naye, tuma ujumbe mfupi ukieleza sababu moja ya wazi inayokufanya ufae. Acha barua ya jumla.",
  "email.step4": "Andika ulichotuma na lini, kisha fuatilia baada ya takriban wiki moja kama hujasikia chochote.",

  "reason.role": 'Inalingana na kazi unayolenga "{role}"',
  "reason.skills": "Inatumia ujuzi wako: {list}",
  "reason.entry": "Inafaa kwa wahitimu wapya",
  "reason.years": "Inaomba miaka {n}+, huenda si ngazi ya mwanzo kweli",
  "reason.remotePref": "Mtandaoni, kama upendavyo",
  "reason.inArea": "Katika eneo lako: {area}",
  "reason.remoteOption": "Chaguo la mtandaoni",
  "reason.fresh": "Imewekwa siku chache zilizopita",
};

const DICTS: Record<Lang, Dict> = { en, sw };

function interpolate(s: string, params?: Record<string, string | number>): string {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

/** Translate a key in a given language, with optional {param} interpolation. */
export function t(lang: Lang, key: string, params?: Record<string, string | number>): string {
  const dict = DICTS[lang] ?? en;
  const value = dict[key] ?? en[key] ?? key;
  return interpolate(value, params);
}
