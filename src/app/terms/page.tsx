"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useTranslation } from "../../components/LanguageProvider";

const content = {
  en: {
    title: "Terms of Service",
    updated: "Last updated: January 1, 2026",
    sections: [
      {
        heading: "1. Acceptance of terms",
        body: "By creating an account or using NannyBooking.org, you agree to these Terms of Service. If you do not agree, please do not use the platform.",
      },
      {
        heading: "2. Who can use the platform",
        body: "You must be at least 18 years old to register. By registering, you confirm that the information you provide is accurate and that you will keep it up to date.",
      },
      {
        heading: "3. What NannyBooking.org provides",
        body: "NannyBooking.org is a marketplace that connects parents and nannies. We do not employ nannies, provide childcare ourselves, or guarantee the suitability of any user. All arrangements are made directly between parents and nannies.",
      },
      {
        heading: "4. Listings and bookings",
        body: "Nannies are responsible for the accuracy of their listings, including availability, rates, and qualifications. Parents are responsible for verifying suitability before confirming a booking. NannyBooking.org does not process payments — all financial arrangements are made directly between the parties.",
      },
      {
        heading: "5. Prohibited conduct",
        body: "You may not: post false or misleading information; harass, threaten, or discriminate against other users; use the platform for any unlawful purpose; attempt to circumvent our systems or security; share another user's contact details without their consent.",
      },
      {
        heading: "6. Content",
        body: "You retain ownership of content you post (profile photos, listing descriptions). By posting, you grant NannyBooking.org a non-exclusive licence to display that content on the platform. You are responsible for ensuring your content does not infringe third-party rights.",
      },
      {
        heading: "7. Account termination",
        body: "We reserve the right to suspend or permanently close accounts that violate these terms, post misleading content, or engage in harmful behaviour. You may delete your account at any time from profile settings.",
      },
      {
        heading: "8. Limitation of liability",
        body: "NannyBooking.org is provided 'as is'. We are not liable for the conduct of users, the outcome of childcare arrangements, or any indirect or consequential damages arising from use of the platform.",
      },
      {
        heading: "9. Changes to these terms",
        body: "We may update these terms from time to time. We will notify registered users of significant changes by email. Continued use of the platform after changes take effect constitutes acceptance of the updated terms.",
      },
      {
        heading: "10. Governing law",
        body: "These terms are governed by the laws of the Republic of Latvia. Any disputes shall be resolved in the courts of Latvia.",
      },
    ],
  },
  lv: {
    title: "Pakalpojumu noteikumi",
    updated: "Pēdējo reizi atjaunināts: 2026. gada 1. janvāris",
    sections: [
      {
        heading: "1. Noteikumu akceptēšana",
        body: "Izveidojot kontu vai izmantojot NannyBooking.org, jūs piekrītat šiem pakalpojumu noteikumiem. Ja nepiekrītat, lūdzu, neizmantojiet platformu.",
      },
      {
        heading: "2. Kas var izmantot platformu",
        body: "Jums jābūt vismaz 18 gadus vecam, lai reģistrētos. Reģistrējoties, jūs apliecināt, ka sniegtā informācija ir precīza.",
      },
      {
        heading: "3. Ko nodrošina NannyBooking.org",
        body: "NannyBooking.org ir tirgus vieta, kas savieno vecākus un aukles. Mēs nenodrošinām bērnu aprūpi paši un negarantējam neviena lietotāja piemērotību. Visas vienošanās tiek slēgtas tieši starp vecākiem un auklēm.",
      },
      {
        heading: "4. Sludinājumi un rezervācijas",
        body: "Aukles ir atbildīgas par sludinājumu precizitāti. Vecāki ir atbildīgi par piemērotības pārbaudi pirms rezervācijas apstiprināšanas. NannyBooking.org neapstrādā maksājumus.",
      },
      {
        heading: "5. Aizliegtā rīcība",
        body: "Jūs nedrīkstat: publicēt nepatiesas vai maldinošas ziņas; uzmākties vai diskriminēt citus lietotājus; izmantot platformu nelikumīgiem mērķiem; koplietot cita lietotāja kontaktinformāciju bez viņa piekrišanas.",
      },
      {
        heading: "6. Saturs",
        body: "Jūs saglabājat īpašumtiesības uz publicēto saturu. Publicējot, jūs piešķirat NannyBooking.org neekskluzīvu licenci satura rādīšanai platformā.",
      },
      {
        heading: "7. Konta izbeigšana",
        body: "Mēs paturam tiesības apturēt vai slēgt kontus, kas pārkāpj šos noteikumus. Jūs varat dzēst kontu jebkurā laikā profila iestatījumos.",
      },
      {
        heading: "8. Atbildības ierobežošana",
        body: "NannyBooking.org tiek nodrošināts 'tāds, kāds ir'. Mēs neuzņemamies atbildību par lietotāju rīcību vai bērnu aprūpes vienošanos rezultātiem.",
      },
      {
        heading: "9. Noteikumu izmaiņas",
        body: "Mēs varam atjaunināt šos noteikumus. Par būtiskām izmaiņām reģistrētie lietotāji tiks informēti pa e-pastu.",
      },
      {
        heading: "10. Piemērojamās tiesības",
        body: "Šie noteikumi ir pakļauti Latvijas Republikas tiesību aktiem. Strīdi tiek risināti Latvijas tiesās.",
      },
    ],
  },
  ru: {
    title: "Условия использования",
    updated: "Последнее обновление: 1 января 2026 г.",
    sections: [
      {
        heading: "1. Принятие условий",
        body: "Создавая аккаунт или используя NannyBooking.org, вы соглашаетесь с настоящими Условиями. Если вы не согласны, пожалуйста, не используйте платформу.",
      },
      {
        heading: "2. Кто может пользоваться платформой",
        body: "Для регистрации вам должно быть не менее 18 лет. Регистрируясь, вы подтверждаете, что предоставленные данные достоверны.",
      },
      {
        heading: "3. Что предоставляет NannyBooking.org",
        body: "NannyBooking.org — маркетплейс, соединяющий родителей и нянь. Мы не трудоустраиваем нянь и не гарантируем пригодность пользователей. Все договорённости заключаются напрямую.",
      },
      {
        heading: "4. Объявления и бронирования",
        body: "Няни несут ответственность за точность объявлений. Родители обязаны проверить пригодность перед подтверждением бронирования. NannyBooking.org не обрабатывает платежи.",
      },
      {
        heading: "5. Запрещённые действия",
        body: "Запрещается: публиковать ложную информацию; преследовать или дискриминировать пользователей; использовать платформу в незаконных целях; передавать контактные данные других пользователей без их согласия.",
      },
      {
        heading: "6. Контент",
        body: "Вы сохраняете права на публикуемый контент. Размещая контент, вы предоставляете NannyBooking.org неисключительную лицензию на его отображение.",
      },
      {
        heading: "7. Закрытие аккаунта",
        body: "Мы вправе заблокировать или удалить аккаунты, нарушающие правила. Вы можете удалить аккаунт в настройках профиля.",
      },
      {
        heading: "8. Ограничение ответственности",
        body: "NannyBooking.org предоставляется «как есть». Мы не несём ответственности за действия пользователей или результаты договорённостей по уходу за детьми.",
      },
      {
        heading: "9. Изменения условий",
        body: "Мы можем обновлять условия. О существенных изменениях зарегистрированные пользователи будут уведомлены по email.",
      },
      {
        heading: "10. Применимое право",
        body: "Условия регулируются законодательством Латвийской Республики. Споры разрешаются в судах Латвии.",
      },
    ],
  },
};

export default function TermsPage() {
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
