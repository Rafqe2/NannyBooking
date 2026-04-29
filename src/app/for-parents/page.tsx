"use client";

import { useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useTranslation } from "../../components/LanguageProvider";
import Link from "next/link";
import { Search, ClipboardList, CalendarDays, MessageCircle, CheckCircle, MapPin, Lock, Euro, Users } from "lucide-react";

const stepIcons = [
  <Search key="search" className="w-5 h-5 text-brand-600" />,
  <ClipboardList key="clipboard" className="w-5 h-5 text-brand-600" />,
  <CalendarDays key="calendar" className="w-5 h-5 text-brand-600" />,
  <MessageCircle key="message" className="w-5 h-5 text-brand-600" />,
];

const whyIcons = [
  <CheckCircle key="check" className="w-5 h-5 text-brand-600" />,
  <MapPin key="map" className="w-5 h-5 text-brand-600" />,
  <Lock key="lock" className="w-5 h-5 text-brand-600" />,
  <Euro key="euro" className="w-5 h-5 text-brand-600" />,
];

const content = {
  en: {
    title: "For Parents",
    subtitle: "Find the nanny you trust. Find the family that values you.",
    description: "NannyBooking connects parents and nannies in one place. You choose, you agree — we just help you find each other.",
    howTitle: "How it works",
    steps: [
      { title: "Search", desc: "Enter your location and preferred dates. Browse available listings in your area." },
      { title: "Review profiles", desc: "Read about the nanny's experience, skills, and hourly rate. Reviews from other families will help you choose." },
      { title: "Request a booking", desc: "Select a date and send a request. The nanny will receive it and confirm or suggest another time." },
      { title: "Connect directly", desc: "Once confirmed, exchange contact details and agree on the details. We recommend a short introductory call before the first meeting." },
    ],
    whyTitle: "Why parents choose NannyBooking?",
    whyEyebrow: "Why us",
    whyItems: [
      { title: "Verified profiles", desc: "Every nanny creates their own profile with experience, skills, and hourly rate. Family reviews help you choose." },
      { title: "Flexible for any situation", desc: "Need a nanny for one evening or regularly every weekday? Find someone who fits exactly your schedule." },
      { title: "Privacy first", desc: "Your contact details are exchanged only after a booking is confirmed — you control who you communicate with." },
      { title: "Transparent pricing", desc: "Nannies set their own hourly rates and you see them right away. No commissions, no hidden costs." },
    ],
    faqTitle: "Frequently asked questions",
    faqs: [
      { q: "How much does it cost?", a: "Registration and profile creation are completely free for nannies. Browsing is free for parents — a small platform fee applies only when you want to contact a nanny. NannyBooking does not charge commission on nanny earnings." },
      { q: "How do I choose the right nanny?", a: "Every nanny has a profile with experience, skills, and hourly rate. Read reviews from other families and always arrange a short introductory call or meeting before the first time." },
      { q: "What if the nanny cancels last minute?", a: "You can immediately search for another nanny and send a new booking request. We recommend confirming care at least 24 hours in advance so both sides have time to prepare." },
      { q: "Can I as a parent post a listing?", a: "Yes — describe what care you need and nannies in your area will be able to contact you directly. This is a good option if you prefer to receive offers rather than searching yourself." },
      { q: "What types of care can be found here?", a: "Both short-term (e.g. one evening or weekend care) and long-term (regular weekday evenings or full-time care). In search you can filter by type that fits your needs." },
    ],
    ctaTitle: "Start searching now",
    ctaDesc: "Find a nanny in your city — browse profiles, read reviews and connect directly.",
    ctaBtn: "Find nannies",
    heroBtn: "Find a nanny",
    stepLabel: "Step",
  },
  lv: {
    title: "Vecākiem",
    subtitle: "Atrodiet auklīti, kurai uzticaties. Atrodiet ģimeni, kas jūs novērtē.",
    description: "NannyBooking savieno vecākus ar auklītēm vienuviet. Jūs izvēlaties, jūs vienojaties — mēs tikai palīdzam atrast vienam otru.",
    howTitle: "Kā tas darbojas",
    steps: [
      { title: "Meklēt", desc: "Ievadiet savu atrašanās vietu un vēlamos datumus. Apskatiet pieejamos sludinājumus savā apkaimē." },
      { title: "Iepazīties ar profiliem", desc: "Izlasiet par auklītes pieredzi, prasmēm un stundas likmi. Atsauksmes no citām ģimenēm palīdzēs izvēlēties." },
      { title: "Pieprasīt rezervāciju", desc: "Izvēlieties datumu un nosūtiet pieprasījumu. Auklīte to saņems un apstiprinās vai piedāvās citu laiku." },
      { title: "Sazināties tieši", desc: "Pēc apstiprināšanas apmainiet kontaktinformāciju un vienojieties par detaļām. Iesakām īsu iepazīšanās zvanu pirms pirmās tikšanās." },
    ],
    whyTitle: "Kāpēc vecāki izvēlas NannyBooking?",
    whyEyebrow: "Kāpēc mēs",
    whyItems: [
      { title: "Pārbaudīti profili", desc: "Katra auklīte veido savu profilu ar pieredzi, prasmēm un stundas likmi. Ģimeņu atsauksmes palīdz jums izvēlēties." },
      { title: "Elastīgs jebkurai situācijai", desc: "Nepieciešama auklīte vienai vakara stundai vai regulāri katru darba dienu? Atrodiet cilvēku, kas atbilst tieši jūsu grafikam." },
      { title: "Privātums pirmajā vietā", desc: "Jūsu kontaktinformācija tiek apmainīta tikai pēc rezervācijas apstiprināšanas — jūs kontrolējat, ar ko sazināties." },
      { title: "Caurspīdīgas cenas", desc: "Auklītes nosaka savas stundas likmes, jūs tās redzat uzreiz. Bez komisijām, bez slēptām izmaksām." },
    ],
    faqTitle: "Biežāk uzdotie jautājumi",
    faqs: [
      { q: "Cik tas maksā?", a: "Auklītēm reģistrācija un profila izveide ir pilnīgi bezmaksas. Vecākiem pārlūkošana ir bez maksas — neliela platformas maksa tiek piemērota tikai tad, kad vēlaties sazināties ar auklīti. NannyBooking neiekasē komisiju no auklīšu ienākumiem." },
      { q: "Kā izvēlēties pareizo auklīti?", a: "Katrai auklītei ir profils ar pieredzi, prasmēm un stundas likmi. Izlasiet citu ģimeņu atsauksmes un vienmēr sarīkojiet īsu iepazīšanās zvanu vai tikšanos pirms pirmās reizes." },
      { q: "Ko darīt, ja aukle atceļ pēdējā brīdī?", a: "Varat uzreiz meklēt citu auklīti un nosūtīt jaunu rezervācijas pieprasījumu. Iesakām vienoties par aprūpi vismaz 24 stundas iepriekš, lai abām pusēm ir laiks sagatavoties." },
      { q: "Vai es kā vecāks varu publicēt sludinājumu?", a: "Jā — aprakstiet, kāda aprūpe jums nepieciešama, un auklītes jūsu apkaimē varēs sazināties ar jums tieši. Tas ir labs variants, ja vēlaties saņemt piedāvājumus, nevis meklēt pašam." },
      { q: "Kāda veida aprūpi šeit var atrast?", a: "Gan īstermiņa (piemēram, viena vakara vai nedēļas nogales aprūpe), gan ilgtermiņa (regulāri darba dienu vakari vai pilna laika aprūpe). Meklēšanā varat filtrēt pēc veida, kas atbilst jūsu vajadzībām." },
    ],
    ctaTitle: "Sāciet meklēšanu jau tagad",
    ctaDesc: "Atrodiet auklīti savā pilsētā — pārlūkojiet profilus, izlasiet atsauksmes un sazināties tieši.",
    ctaBtn: "Meklēt auklītes",
    heroBtn: "Meklēt auklīti",
    stepLabel: "Solis",
  },
  ru: {
    title: "Для родителей",
    subtitle: "Найдите няню, которой доверяете. Найдите семью, которая вас ценит.",
    description: "NannyBooking объединяет родителей и нянь в одном месте. Вы выбираете, вы договариваетесь — мы просто помогаем найти друг друга.",
    howTitle: "Как это работает",
    steps: [
      { title: "Поиск", desc: "Введите своё местоположение и желаемые даты. Просматривайте доступные объявления в вашем районе." },
      { title: "Знакомство с профилями", desc: "Читайте об опыте, навыках и почасовой ставке няни. Отзывы других семей помогут вам выбрать." },
      { title: "Запрос бронирования", desc: "Выберите дату и отправьте запрос. Няня получит его и подтвердит или предложит другое время." },
      { title: "Связаться напрямую", desc: "После подтверждения обменяйтесь контактами и согласуйте детали. Рекомендуем короткий вводный звонок перед первой встречей." },
    ],
    whyTitle: "Почему родители выбирают NannyBooking?",
    whyEyebrow: "Почему мы",
    whyItems: [
      { title: "Проверенные профили", desc: "Каждая няня создаёт свой профиль с опытом, навыками и почасовой ставкой. Отзывы семей помогают вам выбрать." },
      { title: "Гибко для любой ситуации", desc: "Нужна няня на один вечерний час или регулярно каждый будний день? Найдите человека, подходящего именно под ваш график." },
      { title: "Конфиденциальность прежде всего", desc: "Ваши контактные данные передаются только после подтверждения бронирования — вы контролируете, с кем общаться." },
      { title: "Прозрачные цены", desc: "Няни устанавливают свои почасовые ставки, вы видите их сразу. Без комиссий, без скрытых платежей." },
    ],
    faqTitle: "Часто задаваемые вопросы",
    faqs: [
      { q: "Сколько это стоит?", a: "Регистрация и создание профиля для нянь абсолютно бесплатны. Просмотр для родителей бесплатен — небольшая комиссия платформы применяется только тогда, когда вы хотите связаться с няней. NannyBooking не взимает комиссию с заработка нянь." },
      { q: "Как выбрать правильную няню?", a: "У каждой няни есть профиль с опытом, навыками и почасовой ставкой. Читайте отзывы других семей и всегда проводите короткий вводный звонок или встречу перед первым разом." },
      { q: "Что делать, если няня отменяет в последний момент?", a: "Вы можете сразу искать другую няню и отправить новый запрос на бронирование. Рекомендуем договариваться об уходе как минимум за 24 часа, чтобы у обеих сторон было время подготовиться." },
      { q: "Могу ли я как родитель разместить объявление?", a: "Да — опишите, какой уход вам нужен, и няни в вашем районе смогут связаться с вами напрямую. Это хороший вариант, если вы хотите получать предложения, а не искать самостоятельно." },
      { q: "Какие виды ухода здесь можно найти?", a: "Как краткосрочный (например, уход на один вечер или выходные), так и долгосрочный (регулярные вечера в будни или уход на полный день). В поиске можно фильтровать по нужному вам типу." },
    ],
    ctaTitle: "Начните поиск прямо сейчас",
    ctaDesc: "Найдите няню в своём городе — просматривайте профили, читайте отзывы и связывайтесь напрямую.",
    ctaBtn: "Найти нянь",
    heroBtn: "Найти няню",
    stepLabel: "Шаг",
  },
};

const pageTitles: Record<string, string> = {
  en: "For Parents | NannyBooking",
  lv: "Vecākiem | NannyBooking",
  ru: "Для родителей | NannyBooking",
};

function goToResults(e: React.MouseEvent) {
  e.preventDefault();
  try {
    sessionStorage.setItem(
      "nannybooking:lastSearch",
      JSON.stringify({ location: "Location", startDate: null, endDate: null, openResults: true })
    );
    sessionStorage.setItem("nannybooking:restoreNext", "1");
  } catch {}
  window.location.href = "/";
}

export default function ForParentsPage() {
  const { language } = useTranslation();
  const c = content[language as keyof typeof content] || content.en;

  useEffect(() => {
    document.title = pageTitles[language] ?? pageTitles.en;
  }, [language]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero */}
      <section className="relative bg-brand-600 overflow-hidden px-6 md:px-12 pt-16 pb-20">
        <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-brand-500 opacity-20 pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-brand-700 opacity-25 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-500/40 text-brand-100 text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-6">
            <Users className="w-3.5 h-3.5" />{c.title}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">{c.subtitle}</h1>
          <p className="text-brand-200 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">{c.description}</p>
          <Link
            href="/"
            onClick={goToResults}
            className="inline-block px-8 py-3 bg-white text-brand-700 font-bold rounded-xl hover:bg-brand-50 transition-colors shadow-lg"
          >
            {c.heroBtn}
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[10px] font-bold tracking-[0.22em] uppercase text-brand-400 mb-3">{c.howTitle}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {c.steps.map((step, i) => (
              <div key={i} className="relative rounded-3xl p-7 overflow-hidden" style={{ backgroundColor: '#E9E5DD' }}>
                <div className="w-10 h-10 rounded-2xl bg-brand-200/60 flex items-center justify-center mb-5">
                  {stepIcons[i]}
                </div>
                <div className="text-[10px] font-bold text-brand-500 tracking-[0.18em] uppercase mb-2">{c.stepLabel} {i + 1}</div>
                <h3 className="text-base font-bold text-brand-800 mb-2">{step.title}</h3>
                <p className="text-sm text-brand-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why NannyBooking */}
      <section className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[10px] font-bold tracking-[0.22em] uppercase text-brand-400 mb-3">{c.whyEyebrow}</p>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-10 text-center">{c.whyTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {c.whyItems.map((item, i) => (
              <div key={i} className="flex gap-4 rounded-3xl p-7 bg-white border border-gray-100 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center mt-0.5">
                  {whyIcons[i]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative overflow-hidden py-16 px-4 md:px-8" style={{ backgroundColor: '#E9E5DD' }}>
        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-brand-600 opacity-[0.05] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 rounded-full bg-brand-600 opacity-[0.04] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-brand-600 opacity-[0.03] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-center text-[10px] font-bold tracking-[0.22em] uppercase text-brand-400 mb-3">{c.faqTitle}</p>
          <div className="space-y-3">
            {c.faqs.map((faq, i) => (
              <details key={i} className="group rounded-2xl bg-white overflow-hidden shadow-sm">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-semibold text-gray-900 select-none list-none text-sm">
                  {faq.q}
                  <span className="text-brand-400 group-open:rotate-180 transition-transform duration-200 ml-4 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-5 pt-3 text-sm text-gray-500 leading-relaxed border-t border-gray-50">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{c.ctaTitle}</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">{c.ctaDesc}</p>
          <Link
            href="/"
            onClick={goToResults}
            className="inline-block px-10 py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-lg"
          >
            {c.ctaBtn}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
