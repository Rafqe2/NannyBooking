"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useTranslation } from "../../components/LanguageProvider";

const content = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: January 1, 2026",
    sections: [
      {
        heading: "1. Who we are",
        body: "NannyBooking is a childcare matching platform operating in Latvia. We connect parents seeking childcare with nannies offering their services. This policy explains how we collect, use, and protect your personal data.",
      },
      {
        heading: "2. What data we collect",
        body: "We collect the information you provide when registering (name, email address, user type), profile data you add voluntarily (photo, location, skills, experience, hourly rate), booking requests and their status, messages exchanged through our platform, and usage data such as pages visited and search queries.",
      },
      {
        heading: "3. How we use your data",
        body: "Your data is used to operate the platform — matching nannies with parents, processing bookings, and enabling communication between users. We do not sell your data to third parties. We may use aggregated, anonymised data to improve the service.",
      },
      {
        heading: "4. Data sharing",
        body: "Contact information (email or phone) is only shared between a parent and a nanny when both parties explicitly consent through the messaging system after a booking is confirmed. Profile information visible on listings (name, photo, location, skills, rate) is publicly accessible to all visitors.",
      },
      {
        heading: "5. Data retention",
        body: "We retain your account data for as long as your account is active. If you delete your account, your personal data is removed within 30 days, except where we are required by law to retain it.",
      },
      {
        heading: "6. Your rights",
        body: "Under GDPR you have the right to access, correct, or delete your personal data at any time. You can do this from your profile settings or by contacting us at privacy@nannybooking.org.",
      },
      {
        heading: "7. Cookies",
        body: "We use strictly necessary cookies to keep you logged in and remember your language preference. We do not use advertising or tracking cookies.",
      },
      {
        heading: "8. Security",
        body: "All data is stored on Supabase infrastructure with encryption at rest and in transit. Access to the database is restricted to authenticated users through row-level security policies.",
      },
      {
        heading: "9. Contact",
        body: "For any privacy-related questions, contact us at privacy@nannybooking.org.",
      },
    ],
  },
  lv: {
    title: "Privātuma politika",
    updated: "Pēdējo reizi atjaunināts: 2026. gada 1. janvāris",
    sections: [
      {
        heading: "1. Kas mēs esam",
        body: "NannyBooking ir bērnu aprūpes savienošanas platforma, kas darbojas Latvijā. Mēs savienojam vecākus, kas meklē bērnu aprūpi, ar auklēm, kas piedāvā savus pakalpojumus. Šī politika paskaidro, kā mēs apkopojam, izmantojam un aizsargājam jūsu personas datus.",
      },
      {
        heading: "2. Kādus datus mēs apkopojam",
        body: "Mēs apkopojam informāciju, ko sniedzat reģistrējoties (vārds, e-pasta adrese, lietotāja tips), profila datus, ko pievienojat brīvprātīgi (foto, atrašanās vieta, prasmes, pieredze, stundas likme), rezervācijas pieprasījumus un to statusu, ziņojumus, kas apmainīti caur mūsu platformu, un lietošanas datus.",
      },
      {
        heading: "3. Kā mēs izmantojam jūsu datus",
        body: "Jūsu dati tiek izmantoti platformas darbībai — aukļu savienošanai ar vecākiem, rezervāciju apstrādei un saziņas nodrošināšanai starp lietotājiem. Mēs nepārdodam jūsu datus trešajām pusēm.",
      },
      {
        heading: "4. Datu kopīgošana",
        body: "Kontaktinformācija (e-pasts vai tālrunis) tiek kopīgota starp vecāku un aukli tikai tad, kad abas puses to skaidri piekrīt caur ziņojumu sistēmu pēc rezervācijas apstiprināšanas. Profila informācija sludinājumos ir publiski pieejama visiem apmeklētājiem.",
      },
      {
        heading: "5. Datu glabāšana",
        body: "Mēs glabājam jūsu konta datus, kamēr jūsu konts ir aktīvs. Ja dzēšat kontu, jūsu personas dati tiek noņemti 30 dienu laikā.",
      },
      {
        heading: "6. Jūsu tiesības",
        body: "Saskaņā ar VDAR jums ir tiesības jebkurā laikā piekļūt, labot vai dzēst savus personas datus. To var izdarīt profila iestatījumos vai sazinoties ar mums pa e-pastu privacy@nannybooking.org.",
      },
      {
        heading: "7. Sīkfaili",
        body: "Mēs izmantojam tikai nepieciešamos sīkfailus, lai saglabātu jūsu sesiju un valodas preferences. Mēs neizmantojam reklāmas vai izsekošanas sīkfailus.",
      },
      {
        heading: "8. Drošība",
        body: "Visi dati tiek glabāti Supabase infrastruktūrā ar šifrēšanu miera stāvoklī un pārsūtīšanas laikā.",
      },
      {
        heading: "9. Kontakti",
        body: "Jautājumiem par privātumu sazinieties ar mums pa e-pastu privacy@nannybooking.org.",
      },
    ],
  },
  ru: {
    title: "Политика конфиденциальности",
    updated: "Последнее обновление: 1 января 2026 г.",
    sections: [
      {
        heading: "1. Кто мы",
        body: "NannyBooking — платформа для подбора услуг по уходу за детьми, работающая в Латвии. Мы соединяем родителей, ищущих уход за детьми, с нянями, предлагающими свои услуги. Эта политика объясняет, как мы собираем, используем и защищаем ваши персональные данные.",
      },
      {
        heading: "2. Какие данные мы собираем",
        body: "Мы собираем информацию при регистрации (имя, email, тип пользователя), данные профиля (фото, местоположение, навыки, опыт, почасовая ставка), запросы на бронирование и их статус, сообщения в системе, а также данные об использовании.",
      },
      {
        heading: "3. Как мы используем ваши данные",
        body: "Ваши данные используются для работы платформы — сопоставления нянь с родителями, обработки бронирований и обеспечения коммуникации между пользователями. Мы не продаём ваши данные третьим лицам.",
      },
      {
        heading: "4. Передача данных",
        body: "Контактная информация (email или телефон) передаётся между родителем и няней только при явном согласии обеих сторон через систему сообщений после подтверждения бронирования.",
      },
      {
        heading: "5. Хранение данных",
        body: "Мы храним данные вашего аккаунта, пока он активен. При удалении аккаунта ваши персональные данные удаляются в течение 30 дней.",
      },
      {
        heading: "6. Ваши права",
        body: "По GDPR вы имеете право в любое время получить доступ, исправить или удалить свои персональные данные через настройки профиля или написав на privacy@nannybooking.org.",
      },
      {
        heading: "7. Файлы cookie",
        body: "Мы используем только необходимые файлы cookie для сохранения сессии и языковых предпочтений. Рекламные и трекинговые cookie не используются.",
      },
      {
        heading: "8. Безопасность",
        body: "Все данные хранятся в инфраструктуре Supabase с шифрованием при хранении и передаче.",
      },
      {
        heading: "9. Контакты",
        body: "По вопросам конфиденциальности обращайтесь на privacy@nannybooking.org.",
      },
    ],
  },
};

export default function PrivacyPage() {
  const { language } = useTranslation();
  const c = content[language as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <section className="bg-gradient-to-br from-brand-50 to-brand-50/40 pt-14 pb-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{c.title}</h1>
          <p className="text-sm text-gray-500">{c.updated}</p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {c.sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{s.heading}</h2>
              <p className="text-gray-600 leading-relaxed text-sm">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
