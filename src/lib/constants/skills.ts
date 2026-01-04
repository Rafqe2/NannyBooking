import { Language } from '../i18n';

export const NANNY_SKILLS = [
  "Infant Care",
  "Toddler Care", 
  "Preschool Age",
  "School Age",
  "Special Needs",
  "CPR Certified",
  "First Aid",
  "Meal Preparation",
  "Light Housekeeping",
  "Homework Help",
  "Educational Activities",
  "Outdoor Activities",
  "Pet Care",
  "Driving License",
];

export const NANNY_SKILLS_TRANSLATIONS = {
  "Infant Care": {
    en: "Infant Care",
    lv: "Zīdaiņu aprūpe",
    ru: "Уход за младенцами"
  },
  "Toddler Care": {
    en: "Toddler Care", 
    lv: "Mazuļu aprūpe",
    ru: "Уход за малышами"
  },
  "Preschool Age": {
    en: "Preschool Age",
    lv: "Pirmsskolas vecums",
    ru: "Дошкольный возраст"
  },
  "School Age": {
    en: "School Age",
    lv: "Skolas vecums", 
    ru: "Школьный возраст"
  },
  "Special Needs": {
    en: "Special Needs",
    lv: "Īpašās vajadzības",
    ru: "Особые потребности"
  },
  "CPR Certified": {
    en: "CPR Certified",
    lv: "CPR sertifikāts",
    ru: "Сертификат СЛР"
  },
  "First Aid": {
    en: "First Aid",
    lv: "Pirmā palīdzība",
    ru: "Первая помощь"
  },
  "Meal Preparation": {
    en: "Meal Preparation",
    lv: "Ēdiena gatavošana",
    ru: "Приготовление еды"
  },
  "Light Housekeeping": {
    en: "Light Housekeeping",
    lv: "Viegla mājas uzkopšana",
    ru: "Легкая уборка"
  },
  "Homework Help": {
    en: "Homework Help",
    lv: "Palīdzība ar mājasdarbu",
    ru: "Помощь с домашним заданием"
  },
  "Educational Activities": {
    en: "Educational Activities",
    lv: "Izglītojošas aktivitātes",
    ru: "Образовательные занятия"
  },
  "Outdoor Activities": {
    en: "Outdoor Activities",
    lv: "Aktivitātes ārā",
    ru: "Активности на свежем воздухе"
  },
  "Pet Care": {
    en: "Pet Care",
    lv: "Mājdzīvnieku aprūpe",
    ru: "Уход за питомцами"
  },
  "Driving License": {
    en: "Driving License",
    lv: "Autovadītāja apliecība",
    ru: "Водительские права"
  }
} as const;

export const getTranslatedSkill = (skill: string, language: Language): string => {
  const translation = NANNY_SKILLS_TRANSLATIONS[skill as keyof typeof NANNY_SKILLS_TRANSLATIONS];
  return translation ? translation[language] : skill;
};

export const CANCELLATION_REASONS_TRANSLATIONS = {
  "Emergency came up": {
    en: "Emergency came up",
    lv: "Radusies ārkārtas situācija",
    ru: "Возникла чрезвычайная ситуация"
  },
  "Schedule conflict": {
    en: "Schedule conflict",
    lv: "Grafika konflikts",
    ru: "Конфликт расписания"
  },
  "Found alternative arrangement": {
    en: "Found alternative arrangement",
    lv: "Atrasts alternatīvs risinājums",
    ru: "Найдена альтернативная договоренность"
  },
  "Child is sick": {
    en: "Child is sick",
    lv: "Bērns ir slims",
    ru: "Ребенок болен"
  },
  "Travel plans changed": {
    en: "Travel plans changed",
    lv: "Ceļošanas plāni mainījušies",
    ru: "Планы поездки изменились"
  },
  "Financial reasons": {
    en: "Financial reasons",
    lv: "Finansiāli iemesli",
    ru: "Финансовые причины"
  },
  "Other": {
    en: "Other",
    lv: "Citi",
    ru: "Другое"
  }
} as const;

export const getTranslatedCancellationReason = (reason: string, language: Language): string => {
  const translation = CANCELLATION_REASONS_TRANSLATIONS[reason as keyof typeof CANCELLATION_REASONS_TRANSLATIONS];
  return translation ? translation[language] : reason;
};


