"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";
import { useTranslation } from "../../components/LanguageProvider";

const siteMap = {
  en: [
    {
      category: "Main",
      links: [
        { label: "Home — Search nannies", href: "/" },
        { label: "Login / Sign up", href: "/login" },
      ],
    },
    {
      category: "For Parents",
      links: [
        { label: "How it works for parents", href: "/for-parents" },
        { label: "Browse nanny listings", href: "/" },
      ],
    },
    {
      category: "For Nannies",
      links: [
        { label: "How it works for nannies", href: "/for-nannies" },
        { label: "Create a listing", href: "/create-advertisement" },
      ],
    },
    {
      category: "Support",
      links: [
        { label: "Help centre", href: "/support" },
        { label: "Safety guidelines", href: "/support#safety" },
        { label: "Contact us", href: "/support#contact" },
      ],
    },
    {
      category: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
  ],
  lv: [
    {
      category: "Galvenā",
      links: [
        { label: "Sākumlapa — Meklēt aukles", href: "/" },
        { label: "Ieiet / Reģistrēties", href: "/login" },
      ],
    },
    {
      category: "Vecākiem",
      links: [
        { label: "Kā tas darbojas vecākiem", href: "/for-parents" },
        { label: "Pārlūkot aukļu sludinājumus", href: "/" },
      ],
    },
    {
      category: "Auklēm",
      links: [
        { label: "Kā tas darbojas auklēm", href: "/for-nannies" },
        { label: "Izveidot sludinājumu", href: "/create-advertisement" },
      ],
    },
    {
      category: "Atbalsts",
      links: [
        { label: "Palīdzības centrs", href: "/support" },
        { label: "Drošības vadlīnijas", href: "/support#safety" },
        { label: "Sazināties ar mums", href: "/support#contact" },
      ],
    },
    {
      category: "Juridiskā informācija",
      links: [
        { label: "Privātuma politika", href: "/privacy" },
        { label: "Pakalpojumu noteikumi", href: "/terms" },
      ],
    },
  ],
  ru: [
    {
      category: "Главная",
      links: [
        { label: "Главная — Найти няню", href: "/" },
        { label: "Войти / Зарегистрироваться", href: "/login" },
      ],
    },
    {
      category: "Для родителей",
      links: [
        { label: "Как это работает для родителей", href: "/for-parents" },
        { label: "Просмотр объявлений нянь", href: "/" },
      ],
    },
    {
      category: "Для нянь",
      links: [
        { label: "Как это работает для нянь", href: "/for-nannies" },
        { label: "Создать объявление", href: "/create-advertisement" },
      ],
    },
    {
      category: "Поддержка",
      links: [
        { label: "Центр помощи", href: "/support" },
        { label: "Правила безопасности", href: "/support#safety" },
        { label: "Связаться с нами", href: "/support#contact" },
      ],
    },
    {
      category: "Правовая информация",
      links: [
        { label: "Политика конфиденциальности", href: "/privacy" },
        { label: "Условия использования", href: "/terms" },
      ],
    },
  ],
};

const titles = {
  en: "Sitemap",
  lv: "Vietnes karte",
  ru: "Карта сайта",
};

export default function SitemapPage() {
  const { language } = useTranslation();
  const sections = siteMap[language as keyof typeof siteMap] || siteMap.en;
  const title = titles[language as keyof typeof titles] || titles.en;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <section className="bg-gradient-to-br from-brand-50 to-brand-50/40 pt-14 pb-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">{title}</h1>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-10">
          {sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-sm font-bold text-brand-600 uppercase tracking-widest mb-4">
                {section.category}
              </h2>
              <ul className="space-y-2">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <Link
                      href={link.href}
                      className="text-gray-700 hover:text-brand-600 transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
