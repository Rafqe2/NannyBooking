"use client";

import { useTranslation } from "./LanguageProvider";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                NannyBooking
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t("footer.description")}
              </p>
            </div>
          </div>

          {/* For Parents */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">
              {t("footer.forParents")}
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  {t("footer.findNanny")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  {t("footer.safetyGuidelines")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  {t("footer.backgroundChecks")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  {t("footer.pricing")}
                </a>
              </li>
            </ul>
          </div>

          {/* For Nannies */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">
              {t("footer.forNannies")}
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  {t("footer.findFamilies")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  {t("footer.setRates")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  {t("footer.safetyTips")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  {t("footer.successStories")}
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">
              {t("footer.support")}
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  {t("footer.helpCenter")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  {t("footer.contact")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  {t("footer.safetyGuidelines")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  {t("footer.backgroundChecks")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm">
              <a
                href="#"
                className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
              >
                {t("footer.copyright")}
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
              >
                {t("footer.privacy")}
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
              >
                {t("footer.terms")}
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
              >
                {t("footer.sitemap")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
