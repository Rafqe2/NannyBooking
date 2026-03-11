"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useTranslation } from "../../components/LanguageProvider";
import Link from "next/link";

const content = {
  en: {
    title: "For Parents",
    subtitle: "Find trusted childcare that fits your family's needs",
    howTitle: "How it works",
    steps: [
      { icon: "🔍", title: "Search", desc: "Enter your city and preferred dates. Browse active listings from vetted nannies near you." },
      { icon: "📋", title: "Review profiles", desc: "Read experience, skills, rates and verified reviews from other families before reaching out." },
      { icon: "📅", title: "Request a booking", desc: "Select the dates you need and send a booking request. The nanny reviews and accepts it." },
      { icon: "💬", title: "Connect directly", desc: "Once accepted, exchange contact details through the secure messaging system and coordinate the details." },
    ],
    whyTitle: "Why NannyBooking.org?",
    whyItems: [
      { icon: "✅", title: "Verified listings", desc: "Every nanny profile is reviewed. You see honest ratings and reviews from real families." },
      { icon: "📍", title: "Latvia-focused", desc: "Built specifically for Latvia. All listings are in Latvian cities and regions you actually live in." },
      { icon: "🔒", title: "Privacy-first", desc: "Contact information is only exchanged after a booking is confirmed — no cold calls or spam." },
      { icon: "💶", title: "Transparent pricing", desc: "Hourly rates are listed upfront. No hidden fees, no commission on the final arrangement." },
    ],
    faqTitle: "Frequently asked questions",
    faqs: [
      { q: "Is it free to use?", a: "Browsing and booking are free for parents. You pay the nanny directly at the agreed rate — NannyBooking.org charges no commission." },
      { q: "How do I know a nanny is trustworthy?", a: "Read reviews left by other families, check their skills and experience section, and always arrange a brief introductory call or meeting before the first booking." },
      { q: "What if the nanny cancels last minute?", a: "You can cancel a booking and rebook with another nanny. We recommend confirming the arrangement at least 24 hours in advance." },
      { q: "Can I post a listing as a parent?", a: "Yes. Post a 'seeking nanny' listing describing your needs — experienced nannies in your area can then contact you directly." },
      { q: "What types of care are available?", a: "Short-term (specific dates, e.g. a weekend) and long-term (ongoing, e.g. weekday evenings). Filter by type when searching." },
    ],
    ctaTitle: "Ready to find your nanny?",
    ctaDesc: "Browse hundreds of listings from experienced childcare providers across Latvia.",
    ctaBtn: "Search nannies",
  },
  lv: {
    title: "Vecākiem",
    subtitle: "Atrodiet uzticamu bērnu aprūpi, kas atbilst jūsu ģimenes vajadzībām",
    howTitle: "Kā tas darbojas",
    steps: [
      { icon: "🔍", title: "Meklēt", desc: "Ievadiet savu pilsētu un vēlamos datumus. Pārlūkojiet aktīvus sludinājumus no pārbaudītām auklēm jūsu tuvumā." },
      { icon: "📋", title: "Aplūkot profilus", desc: "Izlasiet par pieredzi, prasmēm, tarifiem un atsauksmēm no citām ģimenēm pirms sazināšanās." },
      { icon: "📅", title: "Pieprasīt rezervāciju", desc: "Izvēlieties nepieciešamos datumus un nosūtiet rezervācijas pieprasījumu. Aukle pārskata un apstiprina to." },
      { icon: "💬", title: "Sazināties tieši", desc: "Pēc apstiprināšanas apmainiet kontaktinformāciju drošajā ziņojumu sistēmā un vienojieties par detaļām." },
    ],
    whyTitle: "Kāpēc NannyBooking.org?",
    whyItems: [
      { icon: "✅", title: "Pārbaudīti sludinājumi", desc: "Katrs aukles profils tiek pārskatīts. Redzat godīgas vērtējumus un atsauksmes no reālām ģimenēm." },
      { icon: "📍", title: "Latvija fokuss", desc: "Izveidots tieši Latvijai. Visi sludinājumi ir Latvijas pilsētās un reģionos, kur jūs dzīvojat." },
      { icon: "🔒", title: "Privātums pirmajā vietā", desc: "Kontaktinformācija tiek apmainīta tikai pēc rezervācijas apstiprināšanas — nekādi nevēlami zvani vai surogāts." },
      { icon: "💶", title: "Caurspīdīgas cenas", desc: "Stundas tarifi ir norādīti uzreiz. Nav slēpto maksas, nav komisijas no galīgās vienošanās." },
    ],
    faqTitle: "Biežāk uzdotie jautājumi",
    faqs: [
      { q: "Vai tas ir bezmaksas?", a: "Pārlūkošana un rezervācija vecākiem ir bezmaksas. Jūs maksājat auklei tieši par vienoto tarifu — NannyBooking.org neiekasē komisiju." },
      { q: "Kā zināt, vai aukle ir uzticama?", a: "Izlasiet citu ģimeņu atsauksmes, pārbaudiet prasmju un pieredzes sadaļu, un vienmēr rīkojiet īsu iepazīšanās zvanu vai tikšanos pirms pirmās rezervācijas." },
      { q: "Ko darīt, ja aukle atceļ pēdējā brīdī?", a: "Varat atcelt rezervāciju un rezervēt citu aukli. Iesakām apstiprināt vienošanos vismaz 24 stundas iepriekš." },
      { q: "Vai vecāki var publicēt sludinājumu?", a: "Jā. Publicējiet sludinājumu 'meklēju aukli', aprakstot savas vajadzības — pieredzējušas aukles jūsu apkaimē var ar jums sazināties tieši." },
      { q: "Kādi aprūpes veidi ir pieejami?", a: "Īstermiņa (konkrēti datumi, piemēram, nedēļas nogale) un ilgtermiņa (pastāvīgi, piemēram, darbadienu vakari). Meklējot filtrējiet pēc veida." },
    ],
    ctaTitle: "Gatavs atrast aukli?",
    ctaDesc: "Pārlūkojiet simtiem sludinājumu no pieredzējušiem bērnu aprūpes speciālistiem visā Latvijā.",
    ctaBtn: "Meklēt aukles",
  },
  ru: {
    title: "Для родителей",
    subtitle: "Найдите надёжный уход за детьми, подходящий для вашей семьи",
    howTitle: "Как это работает",
    steps: [
      { icon: "🔍", title: "Поиск", desc: "Введите свой город и желаемые даты. Просматривайте активные объявления от проверенных нянь рядом с вами." },
      { icon: "📋", title: "Просмотр профилей", desc: "Читайте об опыте, навыках, тарифах и проверенных отзывах от других семей перед обращением." },
      { icon: "📅", title: "Запрос бронирования", desc: "Выберите нужные даты и отправьте запрос на бронирование. Няня рассматривает и принимает его." },
      { icon: "💬", title: "Связаться напрямую", desc: "После подтверждения обменяйтесь контактными данными через защищённую систему сообщений и согласуйте детали." },
    ],
    whyTitle: "Почему NannyBooking.org?",
    whyItems: [
      { icon: "✅", title: "Проверенные объявления", desc: "Каждый профиль няни проверяется. Вы видите честные оценки и отзывы от реальных семей." },
      { icon: "📍", title: "Фокус на Латвию", desc: "Создано специально для Латвии. Все объявления находятся в городах и регионах, где вы живёте." },
      { icon: "🔒", title: "Конфиденциальность прежде всего", desc: "Контактные данные обмениваются только после подтверждения бронирования — никаких холодных звонков или спама." },
      { icon: "💶", title: "Прозрачные цены", desc: "Почасовые ставки указаны заранее. Никаких скрытых платежей, никакой комиссии с итоговой договорённости." },
    ],
    faqTitle: "Часто задаваемые вопросы",
    faqs: [
      { q: "Это бесплатно?", a: "Просмотр и бронирование бесплатны для родителей. Вы платите няне напрямую по согласованной ставке — NannyBooking.org не берёт комиссию." },
      { q: "Как убедиться, что няня надёжна?", a: "Читайте отзывы других семей, проверяйте раздел навыков и опыта, и всегда устраивайте короткое знакомство по звонку или лично перед первым бронированием." },
      { q: "Что делать, если няня отменяет в последний момент?", a: "Вы можете отменить бронирование и выбрать другую няню. Рекомендуем подтверждать договорённость минимум за 24 часа." },
      { q: "Может ли родитель разместить объявление?", a: "Да. Разместите объявление 'ищу няню', описав свои потребности — опытные няни в вашем районе смогут связаться с вами напрямую." },
      { q: "Какие виды ухода доступны?", a: "Краткосрочный (конкретные даты, например, выходные) и долгосрочный (постоянный, например, вечера в будни). Фильтруйте по типу при поиске." },
    ],
    ctaTitle: "Готовы найти няню?",
    ctaDesc: "Просматривайте сотни объявлений от опытных специалистов по уходу за детьми по всей Латвии.",
    ctaBtn: "Найти нянь",
  },
};

export default function ForParentsPage() {
  const { language } = useTranslation();
  const c = content[language as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-50 to-indigo-50/40 pt-14 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            👨‍👩‍👧 {c.title}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">{c.subtitle}</h1>
          <Link
            href="/"
            className="inline-block mt-4 px-8 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
          >
            {c.ctaBtn}
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">{c.howTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {c.steps.map((step, i) => (
              <div key={i} className="relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{step.icon}</div>
                <div className="text-xs font-bold text-purple-500 uppercase tracking-wide mb-1">Step {i + 1}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why NannyBooking.org */}
      <section className="py-16 px-4 bg-gray-50/60">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">{c.whyTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {c.whyItems.map((item, i) => (
              <div key={i} className="flex gap-4 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="text-2xl flex-shrink-0">{item.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">{c.faqTitle}</h2>
          <div className="space-y-4">
            {c.faqs.map((faq, i) => (
              <details key={i} className="group border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-medium text-gray-900 select-none list-none">
                  {faq.q}
                  <span className="text-purple-400 group-open:rotate-180 transition-transform duration-200 ml-4 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">{c.ctaTitle}</h2>
          <p className="text-purple-200 mb-8 text-lg">{c.ctaDesc}</p>
          <Link
            href="/"
            className="inline-block px-10 py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-colors shadow-lg"
          >
            {c.ctaBtn}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
