"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "./LanguageProvider";
import { useSupabaseUser } from "../lib/useSupabaseUser";
import { UserService, UserProfile } from "../lib/userService";

export default function Footer() {
  const { t } = useTranslation();
  const { user } = useSupabaseUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    UserService.getUserById(user.id).then(setUserProfile);
  }, [user?.id]);

  const isNanny = userProfile?.user_type === "nanny";
  const isParent = userProfile?.user_type === "parent";

  return (
    <footer className="bg-brand-600 text-brand-100">
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">
              NannyBooking
            </h3>
            <p className="text-brand-200 leading-relaxed text-sm">
              {t("footer.description")}
            </p>
          </div>

          {/* For Parents — hidden if user is a nanny */}
          {!isNanny && (
            <div className="space-y-4">
              <h4 className="text-base font-semibold text-white">
                {t("footer.forParents")}
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="/" className="text-brand-200 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm inline-block">
                    {t("footer.findNanny")}
                  </a>
                </li>
                <li>
                  <a href="/for-parents" className="text-brand-200 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm inline-block">
                    {t("footer.howItWorks")}
                  </a>
                </li>
                <li>
                  <a href="/support#safety" className="text-brand-200 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm inline-block">
                    {t("footer.safetyGuidelines")}
                  </a>
                </li>
                <li>
                  <a href="/for-parents" className="text-brand-200 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm inline-block">
                    {t("footer.pricing")}
                  </a>
                </li>
              </ul>
            </div>
          )}

          {/* For Nannies — hidden if user is a parent */}
          {!isParent && (
            <div className="space-y-4">
              <h4 className="text-base font-semibold text-white">
                {t("footer.forNannies")}
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="/" className="text-brand-200 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm inline-block">
                    {t("footer.findFamilies")}
                  </a>
                </li>
                <li>
                  <a href="/for-nannies" className="text-brand-200 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm inline-block">
                    {t("footer.setRates")}
                  </a>
                </li>
                <li>
                  <a href="/create-advertisement" className="text-brand-200 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm inline-block">
                    {t("footer.createProfile")}
                  </a>
                </li>
                <li>
                  <a href="/for-nannies" className="text-brand-200 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm inline-block">
                    {t("footer.successStories")}
                  </a>
                </li>
              </ul>
            </div>
          )}

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-white">
              {t("footer.support")}
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="/support" className="text-brand-200 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm inline-block">
                  {t("footer.helpCenter")}
                </a>
              </li>
              <li>
                <a href="/support#contact" className="text-brand-200 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm inline-block">
                  {t("footer.contact")}
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-brand-200 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm inline-block">
                  {t("footer.privacy")}
                </a>
              </li>
              <li>
                <a href="/terms" className="text-brand-200 hover:text-white hover:translate-x-1 transition-all duration-200 text-sm inline-block">
                  {t("footer.terms")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-brand-500 pt-8">
          <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm">
            <span className="text-brand-300">
              {t("footer.copyright")}
            </span>
            <a href="/privacy" className="text-brand-200 hover:text-white transition-colors duration-200">
              {t("footer.privacy")}
            </a>
            <a href="/terms" className="text-brand-200 hover:text-white transition-colors duration-200">
              {t("footer.terms")}
            </a>
            <a href="/sitemap-page" className="text-brand-200 hover:text-white transition-colors duration-200">
              {t("footer.sitemap")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
