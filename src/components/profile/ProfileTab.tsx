"use client";

import { useState } from "react";
import { useTranslation } from "../LanguageProvider";
import { supabase } from "../../lib/supabase";
import LocationAutocomplete from "../LocationAutocomplete";
import { formatMonthYear } from "../../lib/date";
import { UserProfile } from "../../lib/userService";
import { Database } from "../../types/database";
import { User } from "@supabase/supabase-js";

type Advertisement = Database["public"]["Tables"]["advertisements"]["Row"];

interface ProfileTabProps {
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  user: User | null;
  advertisements: Advertisement[];
  setAdvertisements: React.Dispatch<React.SetStateAction<Advertisement[]>>;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  uploadingPhoto: boolean;
  editForm: { name: string; user_type: "parent" | "nanny" | "pending" | "admin"; additional_info: string; phone: string; location: string };
  setEditForm: React.Dispatch<React.SetStateAction<{ name: string; user_type: "parent" | "nanny" | "pending" | "admin"; additional_info: string; phone: string; location: string }>>;
  photoInputRef: React.RefObject<HTMLInputElement>;
  handlePhotoUpload: (file: File) => Promise<void>;
  handleRemovePhoto: () => Promise<void>;
  handleEditSubmit: (e: React.FormEvent) => Promise<void>;
  setToast: (toast: { message: string; type: "error" | "success" } | null) => void;
}

export default function ProfileTab({
  userProfile,
  setUserProfile,
  user,
  advertisements,
  setAdvertisements,
  isEditing,
  setIsEditing,
  uploadingPhoto,
  editForm,
  setEditForm,
  photoInputRef,
  handlePhotoUpload,
  handleRemovePhoto,
  handleEditSubmit,
  setToast,
}: ProfileTabProps) {
  const { t, language } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Profile Form */}
        {isEditing ? (
          <div className="p-6 sm:p-8">
            <h3 className="text-2xl font-semibold mb-6 text-gray-900">
              {t("profile.editProfile")}
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Account type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t("profile.accountType")}
                </label>
                <div className="flex gap-3">
                  {(["nanny", "parent"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, user_type: role })}
                      className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                        editForm.user_type === role
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {role === "nanny" ? t("profile.nanny") : t("profile.parent")}
                    </button>
                  ))}
                </div>
                {editForm.user_type !== userProfile?.user_type && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                    {t("profile.roleChangeWarning")}
                  </p>
                )}
              </div>
              {/* Photo upload hint */}
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span>
                  <button type="button" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto} className="text-purple-600 hover:underline font-medium">
                    {userProfile?.picture ? "Change photo" : t("profile.uploadPhoto")}
                  </button>
                  {userProfile?.picture && (
                    <>
                      {" · "}
                      <button type="button" onClick={handleRemovePhoto} disabled={uploadingPhoto} className="text-red-500 hover:underline">
                        {t("profile.removePhoto")}
                      </button>
                    </>
                  )}
                  {uploadingPhoto && <span className="ml-2 text-gray-400">uploading…</span>}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("profile.phoneNumber")}
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers, spaces, +, -, and parentheses
                      if (
                        /^[\d\s\+\-\(\)]*$/.test(value) &&
                        value.length <= 20
                      ) {
                        setEditForm({ ...editForm, phone: value });
                      }
                    }}
                    maxLength={20}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+371 2000 0000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editForm.phone.length}/20 characters
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("profile.location")}
                  </label>
                  <LocationAutocomplete
                    value={editForm.location}
                    onChange={(next) =>
                      setEditForm({ ...editForm, location: next.label })
                    }
                    placeholder="Rīga"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("profile.bio")}
                  </label>
                  <textarea
                    value={editForm.additional_info}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 1000) {
                        setEditForm({
                          ...editForm,
                          additional_info: value,
                        });
                      }
                    }}
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder={
                      userProfile?.user_type === "parent"
                        ? t("profile.parentBioPlaceholder")
                        : userProfile?.user_type === "nanny"
                        ? t("profile.nannyBioPlaceholder")
                        : t("profile.addBio")
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editForm.additional_info.length}/1000 characters
                  </p>
                </div>
              </div>
              {/* Removed duplicate Bio section */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    if (!user?.id || isDeleting) return;
                    const sure = confirm(t("profile.deleteAccountConfirm"));
                    if (!sure) return;
                    setIsDeleting(true);
                    try {
                      // Call API to delete profile + auth user (service role)
                      const token = (await supabase.auth.getSession()).data
                        .session?.access_token;
                      const resp = await fetch("/api/account/delete", {
                        method: "POST",
                        headers: {
                          "content-type": "application/json",
                          authorization: token ? `Bearer ${token}` : "",
                        },
                        body: JSON.stringify({ userId: user.id }),
                      });
                      if (!resp.ok) {
                        const body = await resp.json().catch(() => ({} as any));
                        alert(body?.error || t("profile.deleteAccountFailed"));
                        return;
                      }
                      await supabase.auth.signOut();
                      window.location.replace("/");
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isUpdating || isDeleting}
                  className="px-6 py-3 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting
                    ? t("profile.deleting")
                    : t("profile.deleteAccount")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isUpdating}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("profile.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t("profile.saving")}</span>
                    </>
                  ) : (
                    t("profile.saveChanges")
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-8">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">
              {t("profile.profileInformation")}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{t("profile.phoneNumber")}</p>
                  <p className="text-gray-900 font-medium text-sm">{userProfile?.phone || t("profile.notSet")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{t("profile.location")}</p>
                  <p className="text-gray-900 font-medium text-sm">{userProfile?.location || t("profile.notSet")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{t("profile.email")}</p>
                  <p className="text-gray-900 font-medium text-sm">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{t("profile.memberSince")}</p>
                  <p className="text-gray-900 font-medium text-sm">
                    {userProfile?.created_at ? formatMonthYear(userProfile.created_at, language) : t("profile.recently")}
                  </p>
                </div>
              </div>
              <div className="lg:col-span-2 flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{t("profile.bio")}</p>
                  <p className="text-gray-900 leading-relaxed text-sm">
                    {editForm.additional_info || t("profile.noBioAdded")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
          <h3 className="text-2xl font-semibold text-gray-900">
            {t("profile.accountSettings")}
          </h3>
        </div>
        <div className="p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div>
                <h4 className="font-medium text-gray-900">
                  {t("profile.emailNotifications")}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {t("profile.emailNotificationsDesc")}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div>
                <h4 className="font-medium text-gray-900">
                  {t("profile.smsNotifications")}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {t("profile.smsNotificationsDesc")}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
