"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useTranslation } from "../../components/LanguageProvider";
import Link from "next/link";

const content = {
  en: {
    title: "For Nannies",
    subtitle: "Turn your childcare experience into a flexible career",
    howTitle: "How to get started",
    steps: [
      { icon: "👤", title: "Create your profile", desc: "Sign up, complete your profile with your experience, skills and a short bio that families will see." },
      { icon: "📝", title: "Post a listing", desc: "Create a listing — short-term for specific dates, or long-term for ongoing availability. Set your hourly rate." },
      { icon: "📬", title: "Receive requests", desc: "Families find your listing and send booking requests. You review and accept or decline at your own pace." },
      { icon: "💬", title: "Coordinate & earn", desc: "Exchange contact details once the booking is confirmed and arrange the details directly with the family." },
    ],
    whyTitle: "Why join NannyBooking.org?",
    whyItems: [
      { icon: "🕐", title: "Flexible schedule", desc: "You set your available dates and hours. Take bookings only when it suits you — no obligation." },
      { icon: "💶", title: "You set the rate", desc: "Define your own hourly rate. No platform commission — what you agree with the family is what you earn." },
      { icon: "⭐", title: "Build your reputation", desc: "Collect verified reviews from families you've worked with. A strong profile brings more bookings organically." },
      { icon: "📍", title: "Local & targeted", desc: "Listings are filtered by city, so you only get requests from families in areas where you're willing to work." },
    ],
    ratesTitle: "How to set your rates",
    ratesIntro: "Your hourly rate is visible on your listing and is one of the first things families check. Here's how to approach it.",
    rateItems: [
      { icon: "📊", title: "Market range in Latvia", desc: "Most nannies in Latvia charge between €5–€12/h. Experienced nannies or those with formal education, first aid certification, or language skills typically charge €8–€15/h." },
      { icon: "🧒", title: "Factor in the number of children", desc: "If a family has multiple children, consider setting a higher rate or negotiating a per-child supplement directly with the family after booking." },
      { icon: "🌙", title: "Evening & weekend rates", desc: "Evening, overnight or weekend care is typically priced 20–40% higher than daytime rates. You can mention this in your listing description." },
      { icon: "💡", title: "Start competitive, then raise it", desc: "New to the platform? Start at a rate that's easy to book and build up reviews. Once you have 3–5 positive reviews, gradually increase your rate." },
    ],
    tipsTitle: "Tips for a great profile",
    tips: [
      { icon: "📸", title: "Add a clear photo", desc: "Profiles with a friendly, professional photo receive significantly more attention from parents." },
      { icon: "✍️", title: "Write a detailed bio", desc: "Mention your experience with different age groups, any certifications (first aid, education), and your childcare approach." },
      { icon: "🏷️", title: "Select relevant skills", desc: "Tick all the skills that apply — cooking, tutoring, special needs, swimming, etc. Parents filter by these." },
      { icon: "📅", title: "Keep dates current", desc: "Short-term listings auto-deactivate after 7 days. Re-activate with fresh dates to stay visible in search results." },
    ],
    faqTitle: "Frequently asked questions",
    faqs: [
      { q: "Is it free to join?", a: "Yes — creating a profile and posting listings is completely free. NannyBooking.org charges no registration or listing fees." },
      { q: "How do I get paid?", a: "You agree on payment terms directly with the family. Most arrange cash or bank transfer. NannyBooking.org does not process payments." },
      { q: "Can I set my own hours?", a: "Absolutely. For short-term listings you pick specific dates and times. For long-term you describe general availability." },
      { q: "What if a family cancels?", a: "Families can cancel bookings before they are confirmed. Always agree on a cancellation policy with the family for confirmed bookings." },
      { q: "How do reviews work?", a: "After a completed booking, the family can leave a star rating and written review on your profile. Honest reviews help you build trust." },
    ],
    ctaTitle: "Start earning on your terms",
    ctaDesc: "Create your free profile today and reach hundreds of families looking for experienced childcare.",
    ctaBtn: "Create a listing",
  },
  lv: {
    title: "Auklēm",
    subtitle: "Pārvērtiet savu bērnu aprūpes pieredzi elastīgā karjerā",
    howTitle: "Kā sākt",
    steps: [
      { icon: "👤", title: "Izveidot profilu", desc: "Reģistrējieties, aizpildiet profilu ar savu pieredzi, prasmēm un īsu bio, ko redzēs ģimenes." },
      { icon: "📝", title: "Publicēt sludinājumu", desc: "Izveidojiet sludinājumu — īstermiņa konkrētiem datumiem vai ilgtermiņa pastāvīgai pieejamībai. Nosakiet stundu tarifu." },
      { icon: "📬", title: "Saņemt pieprasījumus", desc: "Ģimenes atrod jūsu sludinājumu un nosūta rezervācijas pieprasījumus. Jūs pārskatāt un pieņemat vai noraidāt pēc saviem ieskatiem." },
      { icon: "💬", title: "Koordinēt un nopelnīt", desc: "Apmainiet kontaktinformāciju pēc rezervācijas apstiprināšanas un saskaņojiet detaļas tieši ar ģimeni." },
    ],
    whyTitle: "Kāpēc pievienoties NannyBooking.org?",
    whyItems: [
      { icon: "🕐", title: "Elastīgs grafiks", desc: "Jūs nosakāt savus pieejamos datumus un stundas. Pieņemiet rezervācijas tikai tad, kad jums ērti — bez pienākuma." },
      { icon: "💶", title: "Jūs nosakāt tarifu", desc: "Definējiet savu stundas tarifu. Nav platformas komisijas — tas, par ko vienojaties ar ģimeni, ir jūsu pelņa." },
      { icon: "⭐", title: "Veidojiet reputāciju", desc: "Vāciet pārbaudītas atsauksmes no ģimenēm, ar kurām esat strādājuši. Spēcīgs profils piesaista vairāk rezervāciju." },
      { icon: "📍", title: "Lokāls un mērķtiecīgs", desc: "Sludinājumi tiek filtrēti pēc pilsētas, tāpēc pieprasījumus saņemat tikai no ģimenēm jūsu vēlamajā reģionā." },
    ],
    ratesTitle: "Kā noteikt savu tarifu",
    ratesIntro: "Jūsu stundas tarifs ir redzams sludinājumā un ir viens no pirmajiem, ko ģimenes pārbauda. Lūk, kā tam pieiet.",
    rateItems: [
      { icon: "📊", title: "Tirgus diapazons Latvijā", desc: "Lielākā daļa aukļu Latvijā iekasē €5–€12/h. Pieredzējušas aukles vai tās ar formālo izglītību, pirmās palīdzības sertifikātu vai valodu prasmēm parasti iekasē €8–€15/h." },
      { icon: "🧒", title: "Ņemiet vērā bērnu skaitu", desc: "Ja ģimenei ir vairāki bērni, apsveriet augstāku tarifu vai vienojieties par papildu maksu par katru bērnu tieši ar ģimeni pēc rezervācijas." },
      { icon: "🌙", title: "Vakara un nedēļas nogales tarifi", desc: "Vakara, nakts vai nedēļas nogales aprūpe parasti tiek novērtēta par 20–40% augstāk nekā dienas laikā. To varat pieminēt sludinājuma aprakstā." },
      { icon: "💡", title: "Sāciet konkurētspējīgi, tad paaugstiniet", desc: "Jauns platformā? Sāciet ar tarifu, ar kuru viegli iegūt rezervācijas, un veidojiet atsauksmes. Kad jums būs 3–5 pozitīvas atsauksmes, pakāpeniski palieliniet tarifu." },
    ],
    tipsTitle: "Padomi lieliskam profilam",
    tips: [
      { icon: "📸", title: "Pievienojiet skaidru fotogrāfiju", desc: "Profili ar draudzīgu, profesionālu fotogrāfiju saņem ievērojami vairāk uzmanības no vecākiem." },
      { icon: "✍️", title: "Uzrakstiet detalizētu bio", desc: "Miniet savu pieredzi ar dažādām vecuma grupām, sertifikātus (pirmā palīdzība, izglītība) un pieeju bērnu aprūpei." },
      { icon: "🏷️", title: "Izvēlieties atbilstošas prasmes", desc: "Atzīmējiet visas atbilstošās prasmes — gatavošana, mācīšana, speciālās vajadzības, peldēšana u.c. Vecāki filtrē pēc tām." },
      { icon: "📅", title: "Uzturiet datumus aktuālus", desc: "Īstermiņa sludinājumi automātiski deaktivējas pēc 7 dienām. Aktivizējiet atkārtoti ar jauniem datumiem, lai paliktu redzams." },
    ],
    faqTitle: "Biežāk uzdotie jautājumi",
    faqs: [
      { q: "Vai pievienošanās ir bezmaksas?", a: "Jā — profila izveide un sludinājumu publicēšana ir pilnīgi bezmaksas. NannyBooking.org neiekasē reģistrācijas vai sludinājumu maksas." },
      { q: "Kā tiek veikts maksājums?", a: "Maksājuma nosacījumus vienojas tieši ar ģimeni. Lielākā daļa izmanto skaidru naudu vai bankas pārskaitījumu. NannyBooking.org neapstrādā maksājumus." },
      { q: "Vai varu pats noteikt darba laiku?", a: "Noteikti. Īstermiņa sludinājumiem izvēlaties konkrētus datumus un laikus. Ilgtermiņa sludinājumiem aprakstāt vispārējo pieejamību." },
      { q: "Ko darīt, ja ģimene atceļ?", a: "Ģimenes var atcelt rezervācijas pirms to apstiprināšanas. Vienmēr vienojieties ar ģimeni par atcelšanas politiku apstiprinātām rezervācijām." },
      { q: "Kā darbojas atsauksmes?", a: "Pēc pabeigtas rezervācijas ģimene var atstāt zvaigžņu vērtējumu un rakstiskas atsauksmes jūsu profilā. Godīgas atsauksmes palīdz veidot uzticamību." },
    ],
    ctaTitle: "Sāciet pelnīt pēc saviem noteikumiem",
    ctaDesc: "Šodien izveidojiet bezmaksas profilu un sasniedziet simtiem ģimeņu, kas meklē pieredzējušu bērnu aprūpi.",
    ctaBtn: "Izveidot sludinājumu",
  },
  ru: {
    title: "Для нянь",
    subtitle: "Превратите свой опыт ухода за детьми в гибкую карьеру",
    howTitle: "Как начать",
    steps: [
      { icon: "👤", title: "Создать профиль", desc: "Зарегистрируйтесь, заполните профиль своим опытом, навыками и кратким описанием, которое увидят семьи." },
      { icon: "📝", title: "Разместить объявление", desc: "Создайте объявление — краткосрочное на конкретные даты или долгосрочное для постоянной доступности. Установите почасовую ставку." },
      { icon: "📬", title: "Получать запросы", desc: "Семьи находят ваше объявление и отправляют запросы на бронирование. Вы рассматриваете и принимаете или отклоняете в удобном темпе." },
      { icon: "💬", title: "Координировать и зарабатывать", desc: "Обменяйтесь контактами после подтверждения бронирования и согласуйте детали напрямую с семьёй." },
    ],
    whyTitle: "Почему стоит присоединиться к NannyBooking.org?",
    whyItems: [
      { icon: "🕐", title: "Гибкий график", desc: "Вы сами устанавливаете доступные даты и часы. Принимайте бронирования только тогда, когда вам удобно — никаких обязательств." },
      { icon: "💶", title: "Вы устанавливаете ставку", desc: "Определите свою почасовую ставку. Никакой комиссии платформы — то, о чём вы договорились с семьёй, и есть ваш заработок." },
      { icon: "⭐", title: "Создайте репутацию", desc: "Собирайте проверенные отзывы от семей, с которыми вы работали. Сильный профиль привлекает больше бронирований." },
      { icon: "📍", title: "Локально и целенаправленно", desc: "Объявления фильтруются по городу, поэтому вы получаете запросы только от семей в нужных вам районах." },
    ],
    ratesTitle: "Как установить ставку",
    ratesIntro: "Ваша почасовая ставка видна в объявлении и является одним из первых, что проверяют семьи. Вот как к этому подойти.",
    rateItems: [
      { icon: "📊", title: "Рыночный диапазон в Латвии", desc: "Большинство нянь в Латвии берут €5–€12/ч. Опытные няни или с профессиональным образованием, сертификатом первой помощи или языковыми навыками обычно берут €8–€15/ч." },
      { icon: "🧒", title: "Учитывайте количество детей", desc: "Если в семье несколько детей, рассмотрите более высокую ставку или договоритесь о доплате за каждого ребёнка напрямую с семьёй после бронирования." },
      { icon: "🌙", title: "Вечерние и выходные ставки", desc: "Вечерний, ночной или уход в выходные дни обычно оцениваются на 20–40% выше дневных. Можно упомянуть это в описании объявления." },
      { icon: "💡", title: "Начните конкурентоспособно, затем повышайте", desc: "Новичок на платформе? Начните со ставки, с которой легко получить бронирования, и накапливайте отзывы. Когда у вас будет 3–5 положительных отзывов, постепенно повышайте ставку." },
    ],
    tipsTitle: "Советы для отличного профиля",
    tips: [
      { icon: "📸", title: "Добавьте чёткое фото", desc: "Профили с дружелюбным, профессиональным фото получают значительно больше внимания от родителей." },
      { icon: "✍️", title: "Напишите подробное описание", desc: "Упомяните опыт с разными возрастными группами, сертификаты (первая помощь, образование) и ваш подход к уходу." },
      { icon: "🏷️", title: "Выберите актуальные навыки", desc: "Отметьте все подходящие навыки — готовка, обучение, особые потребности, плавание и т.д. Родители фильтруют по ним." },
      { icon: "📅", title: "Актуализируйте даты", desc: "Краткосрочные объявления автоматически деактивируются через 7 дней. Повторно активируйте с новыми датами, чтобы оставаться в поиске." },
    ],
    faqTitle: "Часто задаваемые вопросы",
    faqs: [
      { q: "Бесплатно ли это?", a: "Да — создание профиля и размещение объявлений абсолютно бесплатно. NannyBooking.org не берёт регистрационных или листинговых сборов." },
      { q: "Как происходит оплата?", a: "Условия оплаты вы согласовываете напрямую с семьёй. Большинство используют наличные или банковский перевод. NannyBooking.org не обрабатывает платежи." },
      { q: "Могу ли я сам устанавливать часы?", a: "Конечно. Для краткосрочных объявлений вы выбираете конкретные даты и время. Для долгосрочных описываете общую доступность." },
      { q: "Что делать, если семья отменяет?", a: "Семьи могут отменять бронирования до их подтверждения. Всегда договаривайтесь с семьёй о политике отмены для подтверждённых бронирований." },
      { q: "Как работают отзывы?", a: "После завершённого бронирования семья может оставить звёздный рейтинг и письменный отзыв на вашем профиле. Честные отзывы помогают строить доверие." },
    ],
    ctaTitle: "Начните зарабатывать на своих условиях",
    ctaDesc: "Создайте бесплатный профиль сегодня и охватите сотни семей, ищущих опытный уход за детьми.",
    ctaBtn: "Создать объявление",
  },
};

export default function ForNanniesPage() {
  const { language } = useTranslation();
  const c = content[language as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 to-purple-50/40 pt-14 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            🧒 {c.title}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">{c.subtitle}</h1>
          <Link
            href="/create-advertisement"
            className="inline-block mt-4 px-8 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
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
                <div className="text-3xl mb-3">{step.icon}</div>
                <div className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1">Step {i + 1}</div>
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

      {/* Rates guide */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">{c.ratesTitle}</h2>
          <p className="text-center text-gray-500 text-sm mb-10 max-w-xl mx-auto">{c.ratesIntro}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {c.rateItems.map((item, i) => (
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

      {/* Tips */}
      <section className="py-16 px-4 bg-gray-50/60">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">{c.tipsTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {c.tips.map((tip, i) => (
              <div key={i} className="flex gap-4 border border-gray-100 rounded-2xl p-6 bg-white shadow-sm">
                <div className="text-2xl flex-shrink-0">{tip.icon}</div>
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
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">{c.ctaTitle}</h2>
          <p className="text-indigo-200 mb-8 text-lg">{c.ctaDesc}</p>
          <Link
            href="/create-advertisement"
            className="inline-block px-10 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
          >
            {c.ctaBtn}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
