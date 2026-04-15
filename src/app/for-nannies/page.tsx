"use client";

import { useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useTranslation } from "../../components/LanguageProvider";
import Link from "next/link";
import { User, FileText, Inbox, MessageCircle, Clock, Euro, Star, MapPin, BarChart2, Baby, Moon, Lightbulb, Camera, Tag, CalendarDays, Pencil } from "lucide-react";

const stepIcons = [
  <User key="user" className="w-7 h-7 text-brand-600" />,
  <FileText key="file" className="w-7 h-7 text-brand-600" />,
  <Inbox key="inbox" className="w-7 h-7 text-brand-600" />,
  <MessageCircle key="msg" className="w-7 h-7 text-brand-600" />,
];

const whyIcons = [
  <Clock key="clock" className="w-6 h-6 text-brand-600" />,
  <Euro key="euro" className="w-6 h-6 text-brand-600" />,
  <Star key="star" className="w-6 h-6 text-brand-600" />,
  <MapPin key="map" className="w-6 h-6 text-brand-600" />,
];

const rateIcons = [
  <BarChart2 key="bar" className="w-6 h-6 text-brand-600" />,
  <Baby key="baby" className="w-6 h-6 text-brand-600" />,
  <Moon key="moon" className="w-6 h-6 text-brand-600" />,
  <Lightbulb key="bulb" className="w-6 h-6 text-brand-600" />,
];

const tipIcons = [
  <Camera key="camera" className="w-6 h-6 text-brand-600" />,
  <Pencil key="pencil" className="w-6 h-6 text-brand-600" />,
  <Tag key="tag" className="w-6 h-6 text-brand-600" />,
  <CalendarDays key="cal" className="w-6 h-6 text-brand-600" />,
];

const content = {
  en: {
    title: "For Nannies",
    subtitle: "Your experience. Your schedule. Your rates.",
    howTitle: "How to get started",
    steps: [
      { title: "Create your profile", desc: "Sign up and tell about yourself — experience, skills, availability and a short bio that families will see before contacting you." },
      { title: "Set your terms", desc: "Set your hourly rate and availability — short-term, long-term or both. You decide which offers to accept." },
      { title: "Receive requests", desc: "Families in your area find your profile and send a booking request. Review and respond at your own discretion." },
      { title: "Connect directly", desc: "After the booking is confirmed, exchange contact details and agree on the details directly with the family." },
    ],
    whyTitle: "Why join NannyBooking?",
    whyItems: [
      { title: "Flexible schedule", desc: "You choose when you are available. Accept requests that fit your life." },
      { title: "You set the rate", desc: "Set your hourly rate and change it at any time. No commissions — what you agree with the family is what you receive in full." },
      { title: "Reviews that work for you", desc: "After each booking, families can leave a review. The more positive ratings, the more new requests." },
      { title: "Families find you", desc: "Your listing is visible to families in your city and neighbourhood. You don't need to search for clients — they come to you." },
    ],
    ratesTitle: "How to set your rates",
    ratesIntro: "Your hourly rate is visible on your listing and is one of the first things families check. Here's what can help you choose.",
    rateItems: [
      { title: "Market range in Latvia", desc: "Most nannies in Latvia charge €5–€12/h. With formal education, a first aid certificate or language skills the rate is typically €8–€15/h." },
      { title: "Factor in the number of children", desc: "If a family has multiple children, you can set a higher rate or agree on a supplement per additional child directly with the family." },
      { title: "Evening and weekend rates", desc: "Care in the evenings, nights or on weekends is typically valued 20–40% higher. Mention it in your profile description so families know in advance." },
      { title: "Start with a competitive rate", desc: "New to the platform? Start with a lower rate to get your first bookings and reviews faster. After 3–5 positive ratings you can raise your rate." },
    ],
    tipsTitle: "Tips to help you stand out",
    tips: [
      { title: "Add a good photo", desc: "A friendly, clear photo is the first thing families notice. Choose an image where you are smiling and natural — it builds trust even before reading your profile." },
      { title: "Write a personal description", desc: "Tell about your experience with different age groups, certifications and approach to childcare. Families want to understand who you are, not just what you can do." },
      { title: "Mark your skills", desc: "Cooking, tutoring, special needs, swimming — the more precisely you indicate, the easier it is for families to find you using filters." },
      { title: "Update dates regularly", desc: "Short-term listings auto-deactivate after 7 days. Update them with current dates so your profile is always visible in search results." },
    ],
    faqTitle: "Frequently asked questions",
    faqs: [
      { q: "Is registration free?", a: "Yes — creating a profile and posting listings is free. If you want greater visibility or additional features, paid plans are available — but you can start completely for free." },
      { q: "How does payment work with the family?", a: "You agree on payment directly with the family — NannyBooking does not process payments and does not charge commission on your earnings. Most use cash or bank transfer." },
      { q: "Do I choose my own working hours?", a: "Completely. For short-term listings specify specific dates and hours, for long-term listings — your general availability. You accept only the requests that suit you." },
      { q: "What if a family cancels a booking?", a: "Families can cancel a booking before it is confirmed. We recommend briefly discussing cancellation terms before the first meeting so both parties have clarity." },
      { q: "How do reviews work?", a: "After a completed booking, the family can leave a star rating and written review on your profile. You cannot edit them, but you can respond — this shows families that you care." },
    ],
    ctaTitle: "Ready to start?",
    ctaDesc: "Create your free profile and let families in your area find you.",
    ctaBtn: "Create a profile",
    stepLabel: "Step",
  },
  lv: {
    title: "Auklītēm",
    subtitle: "Jūsu pieredze. Jūsu grafiks. Jūsu cenas.",
    howTitle: "Kā sākt",
    steps: [
      { title: "Izveidojiet profilu", desc: "Reģistrējieties un pastāstiet par sevi — pieredze, prasmes, pieejamība un īss apraksts, ko ģimenes redzēs pirms sazināšanās." },
      { title: "Norādiet savus nosacījumus", desc: "Nosakiet stundas likmi un pieejamību — īstermiņa, ilgtermiņa vai abiem variantiem. Jūs lemjat, kādus piedāvājumus pieņemt." },
      { title: "Saņemiet pieprasījumus", desc: "Ģimenes jūsu apkaimē atrod jūsu profilu un nosūta rezervācijas pieprasījumu. Pārskatiet un atbildiet pēc saviem ieskatiem." },
      { title: "Sazināties tieši", desc: "Pēc rezervācijas apstiprināšanas apmainiet kontaktinformāciju un vienojieties par detaļām tieši ar ģimeni." },
    ],
    whyTitle: "Kāpēc pievienoties NannyBooking?",
    whyItems: [
      { title: "Elastīgs grafiks", desc: "Jūs izvēlaties, kad esat pieejama. Pieņemiet pieprasījumus, kas iederas jūsu dzīvē." },
      { title: "Jūs nosakāt tarifu", desc: "Norādiet savu stundas likmi un mainiet to jebkurā brīdī. Nav komisiju — ko vienojaties ar ģimeni, to saņemat pilnībā." },
      { title: "Atsauksmes, kas strādā jūsu labā", desc: "Pēc katras rezervācijas ģimenes var atstāt atsauksmi. Jo vairāk pozitīvu vērtējumu, jo vairāk jaunu pieprasījumu." },
      { title: "Ģimenes atrod jūs", desc: "Jūsu sludinājums ir redzams ģimenēm jūsu pilsētā un apkaimē. Jums nav jāmeklē klienti — viņi nāk pie jums." },
    ],
    ratesTitle: "Kā noteikt savu tarifu",
    ratesIntro: "Jūsu stundas tarifs ir redzams sludinājumā un ir viens no pirmajiem, ko ģimenes pārbauda. Lūk, kas var palīdzēt izvēlēties.",
    rateItems: [
      { title: "Tirgus diapazons Latvijā", desc: "Lielākā daļa auklīšu Latvijā iekasē €5–€12/h. Ar formālo izglītību, pirmās palīdzības sertifikātu vai valodu prasmēm tarifs parasti ir €8–€15/h." },
      { title: "Ņemiet vērā bērnu skaitu", desc: "Ja ģimenē ir vairāki bērni, varat norādīt augstāku likmi vai vienoties par piemaksu par katru papildu bērnu tieši ar ģimeni." },
      { title: "Vakara un nedēļas nogales tarifi", desc: "Aprūpe vakaros, naktīs vai brīvdienās parasti tiek novērtēta par 20–40% augstāk. Pieminiet to sava profila aprakstā, lai ģimenes zina jau iepriekš." },
      { title: "Sāciet ar konkurētspējīgu tarifu", desc: "Ja esat jauna platformā, sāciet ar zemāku likmi, lai ātrāk iegūtu pirmās rezervācijas un atsauksmes. Pēc 3–5 pozitīviem vērtējumiem varat tarifu paaugstināt." },
    ],
    tipsTitle: "Padomi, kas palīdz izcelties",
    tips: [
      { title: "Pievienojiet labu fotogrāfiju", desc: "Draudzīga, skaidra fotogrāfija ir pirmais, ko ģimenes pamana. Izvēlieties attēlu, kurā esat smaidoša un dabiska — tas rada uzticību vēl pirms profila lasīšanas." },
      { title: "Uzrakstiet personīgu aprakstu", desc: "Pastāstiet par savu pieredzi ar dažādām vecuma grupām, sertifikātiem un pieeju bērnu aprūpei. Ģimenes vēlas saprast, kas jūs esat, ne tikai ko jūs protat." },
      { title: "Atzīmējiet savas prasmes", desc: "Gatavošana, mācīšana, speciālās vajadzības, peldēšana — jo precīzāk norādīsiet, jo vieglāk ģimenēm būs jūs atrast, izmantojot filtrus." },
      { title: "Atjaunojiet datumus regulāri", desc: "Īstermiņa sludinājumi automātiski deaktivējas pēc 7 dienām. Atjaunojiet tos ar aktuāliem datumiem, lai jūsu profils vienmēr būtu redzams meklēšanas rezultātos." },
    ],
    faqTitle: "Biežāk uzdotie jautājumi",
    faqs: [
      { q: "Vai reģistrācija ir bezmaksas?", a: "Jā — profila izveide un sludinājumu publicēšana ir bez maksas. Ja vēlaties lielāku redzamību vai papildu iespējas, ir pieejami arī maksas plāni — bet sākt var pilnīgi bez maksas." },
      { q: "Kā notiek norēķini ar ģimeni?", a: "Par samaksu jūs vienojaties tieši ar ģimeni — NannyBooking neapstrādā maksājumus un neiekasē komisiju no jūsu ienākumiem. Lielākā daļa izmanto skaidru naudu vai bankas pārskaitījumu." },
      { q: "Vai es pati izvēlos darba laiku?", a: "Pilnībā. Īstermiņa sludinājumiem norādiet konkrētus datumus un stundas, ilgtermiņa sludinājumiem — savu vispārējo pieejamību. Jūs pieņemat tikai tos pieprasījumus, kas jums der." },
      { q: "Ko darīt, ja ģimene atceļ rezervāciju?", a: "Ģimenes var atcelt rezervāciju pirms tās apstiprināšanas. Iesakām jau pirms pirmās tikšanās īsi aprunāties par atcelšanas nosacījumiem, lai abām pusēm ir skaidrība." },
      { q: "Kā darbojas atsauksmes?", a: "Pēc pabeigtas rezervācijas ģimene var atstāt zvaigžņu vērtējumu un rakstisku atsauksmi jūsu profilā. Jūs nevarat tās rediģēt, bet varat atbildēt — tas rāda ģimenēm, ka jums rūp." },
    ],
    ctaTitle: "Gatava sākt?",
    ctaDesc: "Izveidojiet profilu bez maksas un ļaujiet ģimenēm jūsu apkaimē atrast jūs.",
    ctaBtn: "Izveidot profilu",
    stepLabel: "Solis",
  },
  ru: {
    title: "Для нянь",
    subtitle: "Ваш опыт. Ваш график. Ваши цены.",
    howTitle: "Как начать",
    steps: [
      { title: "Создайте профиль", desc: "Зарегистрируйтесь и расскажите о себе — опыт, навыки, доступность и краткое описание, которое семьи увидят перед тем, как связаться с вами." },
      { title: "Укажите свои условия", desc: "Установите почасовую ставку и доступность — краткосрочно, долгосрочно или оба варианта. Вы решаете, какие предложения принимать." },
      { title: "Получайте запросы", desc: "Семьи в вашем районе находят ваш профиль и отправляют запрос на бронирование. Рассматривайте и отвечайте по своему усмотрению." },
      { title: "Связывайтесь напрямую", desc: "После подтверждения бронирования обменяйтесь контактными данными и согласуйте детали напрямую с семьёй." },
    ],
    whyTitle: "Почему стоит присоединиться к NannyBooking?",
    whyItems: [
      { title: "Гибкий график", desc: "Вы выбираете, когда доступны. Принимайте запросы, которые вписываются в вашу жизнь." },
      { title: "Вы устанавливаете ставку", desc: "Укажите свою почасовую ставку и меняйте её в любое время. Без комиссий — то, о чём договорились с семьёй, получаете полностью." },
      { title: "Отзывы, работающие на вас", desc: "После каждого бронирования семьи могут оставить отзыв. Чем больше положительных оценок, тем больше новых запросов." },
      { title: "Семьи находят вас", desc: "Ваше объявление видно семьям в вашем городе и районе. Вам не нужно искать клиентов — они приходят к вам." },
    ],
    ratesTitle: "Как установить свой тариф",
    ratesIntro: "Ваша почасовая ставка видна в объявлении и является одним из первых, что проверяют семьи. Вот что может помочь выбрать.",
    rateItems: [
      { title: "Рыночный диапазон в Латвии", desc: "Большинство нянь в Латвии берут €5–€12/ч. С профессиональным образованием, сертификатом первой помощи или языковыми навыками ставка обычно €8–€15/ч." },
      { title: "Учитывайте количество детей", desc: "Если в семье несколько детей, можно установить более высокую ставку или договориться о доплате за каждого дополнительного ребёнка напрямую с семьёй." },
      { title: "Вечерние и выходные ставки", desc: "Уход по вечерам, ночью или в выходные обычно оценивается на 20–40% выше. Упомяните это в описании профиля, чтобы семьи знали заранее." },
      { title: "Начните с конкурентоспособной ставки", desc: "Новичок на платформе? Начните с более низкой ставки, чтобы быстрее получить первые бронирования и отзывы. После 3–5 положительных оценок можно повысить ставку." },
    ],
    tipsTitle: "Советы, которые помогут выделиться",
    tips: [
      { title: "Добавьте хорошее фото", desc: "Дружелюбное, чёткое фото — первое, что замечают семьи. Выберите снимок, где вы улыбаетесь и выглядите естественно — это создаёт доверие ещё до прочтения профиля." },
      { title: "Напишите личное описание", desc: "Расскажите о своём опыте с разными возрастными группами, сертификатах и подходе к уходу за детьми. Семьи хотят понять, кто вы, а не только что умеете." },
      { title: "Отметьте свои навыки", desc: "Готовка, обучение, особые потребности, плавание — чем точнее укажете, тем легче семьям найти вас через фильтры." },
      { title: "Регулярно обновляйте даты", desc: "Краткосрочные объявления автоматически деактивируются через 7 дней. Обновляйте их актуальными датами, чтобы профиль всегда был виден в результатах поиска." },
    ],
    faqTitle: "Часто задаваемые вопросы",
    faqs: [
      { q: "Регистрация бесплатна?", a: "Да — создание профиля и размещение объявлений бесплатно. Если хотите большей видимости или дополнительных возможностей, доступны платные планы — но начать можно совершенно бесплатно." },
      { q: "Как происходят расчёты с семьёй?", a: "Об оплате договариваетесь напрямую с семьёй — NannyBooking не обрабатывает платежи и не берёт комиссию с ваших доходов. Большинство используют наличные или банковский перевод." },
      { q: "Сама ли я выбираю рабочее время?", a: "Полностью. Для краткосрочных объявлений укажите конкретные даты и часы, для долгосрочных — свою общую доступность. Вы принимаете только те запросы, которые вам подходят." },
      { q: "Что делать, если семья отменяет бронирование?", a: "Семьи могут отменить бронирование до его подтверждения. Рекомендуем заранее кратко обсудить условия отмены, чтобы у обеих сторон была ясность." },
      { q: "Как работают отзывы?", a: "После завершённого бронирования семья может оставить звёздный рейтинг и письменный отзыв на вашем профиле. Вы не можете их редактировать, но можете ответить — это показывает семьям, что вам важно." },
    ],
    ctaTitle: "Готова начать?",
    ctaDesc: "Создайте профиль бесплатно и позвольте семьям в вашем районе найти вас.",
    ctaBtn: "Создать профиль",
    stepLabel: "Шаг",
  },
};

const pageTitles: Record<string, string> = {
  en: "For Nannies | NannyBooking",
  lv: "Auklītēm | NannyBooking",
  ru: "Для нянь | NannyBooking",
};

export default function ForNanniesPage() {
  const { language } = useTranslation();
  const c = content[language as keyof typeof content] || content.en;

  useEffect(() => {
    document.title = pageTitles[language] ?? pageTitles.en;
  }, [language]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 to-brand-50/40 pt-14 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Baby className="w-4 h-4" />{c.title}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">{c.subtitle}</h1>
          <Link
            href="/create-advertisement"
            className="inline-block mt-4 px-8 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
          >
            {c.ctaBtn}
          </Link>

        </div>
      </section>

      {/* How to get started */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">{c.howTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {c.steps.map((step, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-3">{stepIcons[i]}</div>
                <div className="text-xs font-bold text-brand-500 uppercase tracking-wide mb-1">{c.stepLabel} {i + 1}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why join */}
      <section className="py-16 px-4 bg-gray-50/60">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">{c.whyTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {c.whyItems.map((item, i) => (
              <div key={i} className="flex gap-4 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex-shrink-0 mt-0.5">{whyIcons[i]}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rates guide */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">{c.ratesTitle}</h2>
          <p className="text-center text-gray-500 text-sm mb-10 max-w-xl mx-auto">{c.ratesIntro}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {c.rateItems.map((item, i) => (
              <div key={i} className="flex gap-4 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex-shrink-0 mt-0.5">{rateIcons[i]}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-16 px-4 bg-gray-50/60">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">{c.tipsTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {c.tips.map((tip, i) => (
              <div key={i} className="flex gap-4 border border-gray-100 rounded-2xl p-6 bg-white shadow-sm">
                <div className="flex-shrink-0 mt-0.5">{tipIcons[i]}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{tip.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-gray-50/60">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">{c.faqTitle}</h2>
          <div className="space-y-4">
            {c.faqs.map((faq, i) => (
              <details key={i} className="group border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-medium text-gray-900 select-none list-none">
                  {faq.q}
                  <span className="text-brand-400 group-open:rotate-180 transition-transform duration-200 ml-4 flex-shrink-0">
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
      <section className="py-16 px-4 bg-gradient-to-r from-brand-600 to-brand-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">{c.ctaTitle}</h2>
          <p className="text-brand-200 mb-8 text-lg">{c.ctaDesc}</p>
          <Link
            href="/create-advertisement"
            className="inline-block px-10 py-3 bg-white text-brand-700 font-bold rounded-xl hover:bg-brand-50 transition-colors shadow-lg"
          >
            {c.ctaBtn}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
