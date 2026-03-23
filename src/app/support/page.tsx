"use client";

import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useTranslation } from "../../components/LanguageProvider";
import { Handshake, Phone, ClipboardList, Lock, Star, AlertTriangle, LifeBuoy } from "lucide-react";

const safetyIcons = [
  <Handshake key="handshake" className="w-6 h-6 text-amber-600" />,
  <Phone key="phone" className="w-6 h-6 text-amber-600" />,
  <ClipboardList key="clipboard" className="w-6 h-6 text-amber-600" />,
  <Lock key="lock" className="w-6 h-6 text-amber-600" />,
  <Star key="star" className="w-6 h-6 text-amber-600" />,
  <AlertTriangle key="alert" className="w-6 h-6 text-amber-600" />,
];

const content = {
  en: {
    title: "Support & Help Center",
    subtitle: "Find answers, guidance, and ways to get in touch",
    gettingStartedTitle: "Getting started",
    gettingStartedItems: [
      { q: "How do I create an account?", a: "Click 'Log in' in the top-right corner and sign in with your Google or Facebook account. Your profile is created automatically." },
      { q: "Do I need to complete my profile before posting?", a: "Yes. After signing in you'll be guided through profile setup — choose whether you are a parent or a nanny, add your name, location, and a short bio." },
      { q: "Is NannyBooking.org free to use?", a: "Browsing and basic use are free. Posting listings, receiving bookings, and all core features have no charge. We do not take commission on any payments between parents and nannies." },
      { q: "Which cities does NannyBooking.org cover?", a: "NannyBooking.org covers all cities and towns across Latvia. Location search is powered by OpenStreetMap and restricted to Latvia." },
    ],
    bookingsTitle: "Bookings",
    bookingsItems: [
      { q: "How do I book a nanny?", a: "Find a listing you like, click 'Book', choose your date(s), add an optional note, and submit the request. The nanny will receive a notification and can accept or decline." },
      { q: "How do I know if my booking was accepted?", a: "Check the 'Bookings' tab in your profile. Accepted bookings show a green 'Confirmed' badge. You will also see a messaging conversation become available." },
      { q: "Can I cancel a booking?", a: "Yes. Open the booking in your profile and click 'Cancel booking'. We recommend doing this as early as possible out of courtesy to the other party." },
      { q: "What if the nanny doesn't respond?", a: "If a booking request is not accepted within a reasonable time, cancel it and try another nanny. There is no penalty for cancelling an unconfirmed request." },
    ],
    messagingTitle: "Messaging",
    messagingItems: [
      { q: "Why can I only send templates?", a: "Template-only messaging protects your privacy. After a booking is confirmed, each party can send a connect template, then share their actual contact details (email or WhatsApp) through the secure form." },
      { q: "How do I share my phone number or email?", a: "After sending a connect template, a 'Share your contact info' form appears. Enter your email and/or WhatsApp number — it gets sent as a formatted message visible only to the other party." },
      { q: "Can the other party see my email in my profile?", a: "No. Email addresses and phone numbers are never displayed in public profiles or search results. They are only shared explicitly through the messaging contact form." },
    ],
    listingsTitle: "Listings & ads",
    listingsItems: [
      { q: "How many ads can I have?", a: "You can have 1 active ad and up to 3 inactive (draft) ads at a time. Activate one when you are ready to receive bookings." },
      { q: "Why was my listing automatically deactivated?", a: "Long-term listings are automatically deactivated after 7 days of being active to keep search results fresh. Short-term listings deactivate when all selected dates have passed. Simply re-activate your listing from your profile." },
      { q: "Can I edit my active listing?", a: "You can update availability dates and locations while a listing is active. Title, type, price, description and skills are locked — deactivate first to edit those." },
    ],
    safetyTitle: "Safety guidelines",
    safetyItems: [
      { title: "Meet before the first booking", desc: "Arrange a short video or in-person introduction before the first session. This helps both parties feel comfortable and confirm expectations." },
      { title: "Verify contact info", desc: "After exchanging contact details through the platform, confirm via a quick call before meeting in person." },
      { title: "Discuss expectations clearly", desc: "Agree on the schedule, tasks, emergency contacts, house rules, and payment before the first session." },
      { title: "Keep initial contact on-platform", desc: "Use the in-app messaging to initiate contact. Share personal contact details only after a booking is confirmed." },
      { title: "Leave honest reviews", desc: "After a completed booking, your review helps the community. Be factual and constructive — it builds trust for everyone." },
      { title: "Report concerns", desc: "If you encounter inappropriate content or behaviour, contact us immediately using the form below." },
    ],
    contactTitle: "Contact us",
    contactDesc: "Have a question not covered above, or need to report an issue? Send us a message and we'll get back to you within 1 business day.",
    contactEmailLabel: "Your email",
    contactEmailPlaceholder: "you@example.com",
    contactMessageLabel: "Message",
    contactMessagePlaceholder: "Describe your issue or question in detail...",
    contactSendBtn: "Send message",
    contactSentMsg: "Thank you! Your message has been sent. We'll be in touch soon.",
  },
  lv: {
    title: "Atbalsts un palīdzības centrs",
    subtitle: "Atrodiet atbildes, norādījumus un saziņas iespējas",
    gettingStartedTitle: "Sākšana",
    gettingStartedItems: [
      { q: "Kā izveidot kontu?", a: "Noklikšķiniet uz 'Pieteikties' augšējā labajā stūrī un pierakstieties ar savu Google vai Facebook kontu. Jūsu profils tiek izveidots automātiski." },
      { q: "Vai man jāaizpilda profils pirms publicēšanas?", a: "Jā. Pēc pieteikšanās jūs tiks vadīts caur profila iestatīšanu — izvēlieties, vai esat vecāks vai aukle, pievienojiet vārdu, atrašanās vietu un īsu bio." },
      { q: "Vai NannyBooking.org ir bezmaksas?", a: "Pārlūkošana un pamata izmantošana ir bezmaksas. Sludinājumu publicēšanai, rezervāciju saņemšanai un visām pamatfunkcijām nav maksas. Mēs neiekasējam komisiju no jebkādiem maksājumiem starp vecākiem un auklēm." },
      { q: "Kuras pilsētas aptver NannyBooking.org?", a: "NannyBooking.org aptver visas Latvijas pilsētas un ciematus. Atrašanās vietas meklēšana darbojas ar OpenStreetMap un ir ierobežota ar Latviju." },
    ],
    bookingsTitle: "Rezervācijas",
    bookingsItems: [
      { q: "Kā rezervēt aukli?", a: "Atrodiet sludinājumu, kas jums patīk, noklikšķiniet 'Rezervēt', izvēlieties datumu(-s), pievienojiet piezīmi un nosūtiet pieprasījumu. Aukle saņems paziņojumu un varēs pieņemt vai noraidīt." },
      { q: "Kā uzzināt, vai rezervācija tika pieņemta?", a: "Skatiet cilni 'Rezervācijas' savā profilā. Pieņemtās rezervācijas rāda zaļu 'Apstiprināts' zīmi. Arī ziņojumu saruna kļūs pieejama." },
      { q: "Vai varu atcelt rezervāciju?", a: "Jā. Atveriet rezervāciju savā profilā un noklikšķiniet 'Atcelt rezervāciju'. Iesakām to darīt pēc iespējas agrāk ievērībā pret otru pusi." },
      { q: "Ko darīt, ja aukle neatbild?", a: "Ja rezervācijas pieprasījums netiek pieņemts saprātīgā laikā, atceliet to un izmēģiniet citu aukli. Nav soda par neapstiprināta pieprasījuma atcelšanu." },
    ],
    messagingTitle: "Ziņojumi",
    messagingItems: [
      { q: "Kāpēc varu sūtīt tikai veidnes?", a: "Tikai veidņu ziņojumi aizsargā jūsu privātumu. Pēc rezervācijas apstiprināšanas katra puse var nosūtīt savienošanās veidni, pēc tam dalīties ar kontaktinformāciju (e-pastu vai WhatsApp) caur drošo formu." },
      { q: "Kā dalīties ar tālruņa numuru vai e-pastu?", a: "Pēc savienošanās veidnes nosūtīšanas parādās 'Dalīties ar kontaktinformāciju' forma. Ievadiet e-pastu un/vai WhatsApp numuru — tas tiek nosūtīts formatētā ziņojumā, kas redzams tikai otrai pusei." },
      { q: "Vai otra puse var redzēt manu e-pastu manā profilā?", a: "Nē. E-pasta adreses un tālruņa numuri nekad netiek rādīti publiskajos profilos vai meklēšanas rezultātos. Tie tiek kopīgoti tikai ar ziņojumu kontaktu formas starpniecību." },
    ],
    listingsTitle: "Sludinājumi",
    listingsItems: [
      { q: "Cik daudz sludinājumu man var būt?", a: "Jums var būt 1 aktīvs sludinājums un līdz 3 neaktīviem (melnrakstu) sludinājumiem vienlaikus. Aktivizējiet vienu, kad esat gatavs(-a) saņemt rezervācijas." },
      { q: "Kāpēc mans sludinājums tika automātiski deaktivizēts?", a: "Ilgtermiņa sludinājumi automātiski deaktivējas pēc 7 aktīvām dienām, lai meklēšanas rezultāti paliktu aktuāli. Īstermiņa sludinājumi deaktivējas, kad visi izvēlētie datumi ir pagājuši. Vienkārši atkārtoti aktivizējiet sludinājumu no profila." },
      { q: "Vai varu rediģēt aktīvo sludinājumu?", a: "Aktīva sludinājuma laikā varat atjaunināt pieejamības datumus un atrašanās vietas. Nosaukums, veids, cena, apraksts un prasmes ir bloķētas — vispirms deaktivizējiet, lai tos rediģētu." },
    ],
    safetyTitle: "Drošības vadlīnijas",
    safetyItems: [
      { title: "Tikieties pirms pirmās rezervācijas", desc: "Pirms pirmās sesijas rīkojiet īsu video vai klātienes iepazīšanos. Tas palīdz abām pusēm justies ērti un apstiprināt cerības." },
      { title: "Pārbaudiet kontaktinformāciju", desc: "Pēc kontaktinformācijas apmaiņas caur platformu, pirms personīgās tikšanās apstipriniet to ar ātru zvanu." },
      { title: "Skaidri apspriediet cerības", desc: "Vienojieties par grafiku, uzdevumiem, ārkārtas kontaktiem, mājas noteikumiem un maksājumu pirms pirmās sesijas." },
      { title: "Saglabājiet sākotnējo kontaktu platformā", desc: "Izmantojiet platformas ziņojumapmaiņu, lai sāktu kontaktu. Kopīgojiet personīgo kontaktinformāciju tikai pēc rezervācijas apstiprināšanas." },
      { title: "Atstājiet godīgas atsauksmes", desc: "Pēc pabeigtas rezervācijas jūsu atsauksme palīdz kopienai. Esiet faktiski un konstruktīvi — tas veido uzticamību visiem." },
      { title: "Ziņojiet par bažām", desc: "Ja sastopaties ar nepiemērotu saturu vai uzvedību, nekavējoties sazinieties ar mums, izmantojot zemāk esošo formu." },
    ],
    contactTitle: "Sazinieties ar mums",
    contactDesc: "Vai jums ir jautājums, kas nav apskatīts iepriekš, vai jums jāziņo par problēmu? Nosūtiet mums ziņojumu, un mēs atbildēsim 1 darba dienas laikā.",
    contactEmailLabel: "Jūsu e-pasts",
    contactEmailPlaceholder: "jūs@piemers.lv",
    contactMessageLabel: "Ziņojums",
    contactMessagePlaceholder: "Aprakstiet savu problēmu vai jautājumu detalizēti...",
    contactSendBtn: "Nosūtīt ziņojumu",
    contactSentMsg: "Paldies! Jūsu ziņojums ir nosūtīts. Drīzumā ar jums sazināsimies.",
  },
  ru: {
    title: "Поддержка и справочный центр",
    subtitle: "Найдите ответы, руководство и способы связаться с нами",
    gettingStartedTitle: "Начало работы",
    gettingStartedItems: [
      { q: "Как создать аккаунт?", a: "Нажмите 'Войти' в правом верхнем углу и войдите через Google или Facebook. Ваш профиль создаётся автоматически." },
      { q: "Нужно ли заполнить профиль перед публикацией?", a: "Да. После входа вас проведут через настройку профиля — выберите, являетесь ли вы родителем или няней, добавьте имя, местоположение и краткое описание." },
      { q: "NannyBooking.org бесплатен?", a: "Просмотр и базовое использование бесплатны. Размещение объявлений, получение бронирований и все основные функции бесплатны. Мы не берём комиссию с платежей между родителями и нянями." },
      { q: "Какие города охватывает NannyBooking.org?", a: "NannyBooking.org охватывает все города и посёлки Латвии. Поиск по местоположению работает через OpenStreetMap и ограничен Латвией." },
    ],
    bookingsTitle: "Бронирования",
    bookingsItems: [
      { q: "Как забронировать няню?", a: "Найдите понравившееся объявление, нажмите 'Забронировать', выберите дату(ы), добавьте заметку и отправьте запрос. Няня получит уведомление и сможет принять или отклонить." },
      { q: "Как узнать, что бронирование принято?", a: "Проверьте вкладку 'Бронирования' в профиле. Принятые бронирования показывают зелёный значок 'Подтверждено'. Также станет доступен чат с другой стороной." },
      { q: "Могу ли я отменить бронирование?", a: "Да. Откройте бронирование в профиле и нажмите 'Отменить бронирование'. Рекомендуем делать это как можно раньше из уважения к другой стороне." },
      { q: "Что делать, если няня не отвечает?", a: "Если запрос на бронирование не принят в разумные сроки, отмените его и попробуйте другую няню. За отмену неподтверждённого запроса штрафов нет." },
    ],
    messagingTitle: "Сообщения",
    messagingItems: [
      { q: "Почему я могу отправлять только шаблоны?", a: "Шаблонные сообщения защищают вашу конфиденциальность. После подтверждения бронирования каждая сторона может отправить шаблон подключения, затем поделиться контактными данными (email или WhatsApp) через защищённую форму." },
      { q: "Как поделиться номером телефона или email?", a: "После отправки шаблона подключения появляется форма 'Поделитесь контактной информацией'. Введите email и/или номер WhatsApp — он отправляется как форматированное сообщение, видное только другой стороне." },
      { q: "Может ли другая сторона увидеть мой email в профиле?", a: "Нет. Адреса электронной почты и телефонные номера никогда не отображаются в публичных профилях или результатах поиска. Они передаются только через форму контактов в сообщениях." },
    ],
    listingsTitle: "Объявления",
    listingsItems: [
      { q: "Сколько объявлений у меня может быть?", a: "У вас может быть 1 активное объявление и до 3 неактивных (черновиков) одновременно. Активируйте одно, когда будете готовы принимать бронирования." },
      { q: "Почему моё объявление автоматически деактивировалось?", a: "Долгосрочные объявления автоматически деактивируются через 7 дней активности, чтобы результаты поиска оставались свежими. Краткосрочные деактивируются, когда все выбранные даты прошли. Просто повторно активируйте объявление из профиля." },
      { q: "Могу ли я редактировать активное объявление?", a: "Вы можете обновлять даты доступности и местоположения, пока объявление активно. Название, тип, цена, описание и навыки заблокированы — сначала деактивируйте, чтобы их редактировать." },
    ],
    safetyTitle: "Рекомендации по безопасности",
    safetyItems: [
      { title: "Встретьтесь перед первым бронированием", desc: "Организуйте короткое видео или личное знакомство перед первым сеансом. Это помогает обеим сторонам чувствовать себя комфортно и уточнить ожидания." },
      { title: "Проверьте контактные данные", desc: "После обмена контактами через платформу подтвердите их коротким звонком перед личной встречей." },
      { title: "Чётко обговорите ожидания", desc: "Согласуйте расписание, задачи, экстренные контакты, правила дома и оплату перед первым сеансом." },
      { title: "Сохраняйте начальный контакт на платформе", desc: "Используйте внутренние сообщения для инициирования контакта. Делитесь личными данными только после подтверждения бронирования." },
      { title: "Оставляйте честные отзывы", desc: "После завершённого бронирования ваш отзыв помогает сообществу. Будьте объективны и конструктивны — это строит доверие для всех." },
      { title: "Сообщайте об инцидентах", desc: "Если вы столкнулись с неприемлемым контентом или поведением, немедленно свяжитесь с нами через форму ниже." },
    ],
    contactTitle: "Свяжитесь с нами",
    contactDesc: "Есть вопрос, не описанный выше, или нужно сообщить о проблеме? Напишите нам, и мы ответим в течение 1 рабочего дня.",
    contactEmailLabel: "Ваш email",
    contactEmailPlaceholder: "вы@example.com",
    contactMessageLabel: "Сообщение",
    contactMessagePlaceholder: "Подробно опишите свой вопрос или проблему...",
    contactSendBtn: "Отправить сообщение",
    contactSentMsg: "Спасибо! Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время.",
  },
};

export default function SupportPage() {
  const { language } = useTranslation();
  const c = content[language as keyof typeof content] || content.en;

  const sections = [
    { title: c.gettingStartedTitle, items: c.gettingStartedItems },
    { title: c.bookingsTitle, items: c.bookingsItems },
    { title: c.messagingTitle, items: c.messagingItems },
    { title: c.listingsTitle, items: c.listingsItems },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-50 to-brand-50/30 pt-14 pb-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <LifeBuoy className="w-4 h-4" />{c.title}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 leading-tight">{c.title}</h1>
          <p className="text-gray-500 text-lg">{c.subtitle}</p>
        </div>
      </section>

      {/* FAQ Sections */}
      {sections.map((section) => (
        <section key={section.title} className="py-12 px-4 border-b border-gray-100">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{section.title}</h2>
            <div className="space-y-3">
              {section.items.map((item, i) => (
                <details key={i} className="group border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-medium text-gray-900 select-none list-none">
                    {item.q}
                    <span className="text-brand-400 group-open:rotate-180 transition-transform duration-200 ml-4 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Safety Guidelines */}
      <section className="py-16 px-4 bg-amber-50/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">{c.safetyTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {c.safetyItems.map((item, i) => (
              <div key={i} className="bg-white border border-amber-100 rounded-2xl p-5 shadow-sm">
                <div className="mb-3">{safetyIcons[i]}</div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{c.contactTitle}</h2>
          <p className="text-gray-500 text-sm text-center mb-8">{c.contactDesc}</p>
          <ContactForm c={c} />
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ContactForm({ c }: { c: typeof content["en"] }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), message: message.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-6 py-5 text-green-800">
        <svg className="w-6 h-6 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium">{c.contactSentMsg}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{c.contactEmailLabel}</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={c.contactEmailPlaceholder}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{c.contactMessageLabel}</label>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={c.contactMessagePlaceholder}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {sending ? "Sending…" : c.contactSendBtn}
      </button>
    </form>
  );
}
