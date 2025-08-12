"use client";

import { useEffect, useState } from "react";
import { useSupabaseUser } from "../lib/useSupabaseUser";
import { LV_CITIES } from "../lib/constants/cities";
import { NANNY_SKILLS } from "../lib/constants/skills";
import { AdvertisementService } from "../lib/advertisementService";
import { UserService } from "../lib/userService";

interface AdvertisementForm {
  type: "short-term" | "long-term";
  title: string;
  description: string;
  experience: string;
  skills: string[];
  availability: {
    dates: Date[];
    startTime: string;
    endTime: string;
  };
  location: {
    city: string;
    address: string;
    zipCode: string;
  };
  pricePerHour: number;
  additionalInfo: string;
}

export default function CreateAdvertisement() {
  const { user } = useSupabaseUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<
    "parent" | "nanny" | "pending" | null
  >(null);
  const [formData, setFormData] = useState<AdvertisementForm>({
    type: "short-term",
    title: "",
    description: "",
    experience: "",
    skills: [],
    availability: {
      dates: [],
      startTime: "09:00",
      endTime: "17:00",
    },
    location: {
      city: "",
      address: "",
      zipCode: "",
    },
    pricePerHour: 0,
    additionalInfo: "",
  });

  const availableSkills = NANNY_SKILLS;

  const cities = LV_CITIES;

  // Load user profile to determine user type for conditional form copy
  useEffect(() => {
    const load = async () => {
      if (!user?.email) return;
      const profile = await UserService.getUserByEmail(user.email);
      setUserType((profile?.user_type as any) || null);
    };
    load();
  }, [user?.email]);

  const isParent = userType === "parent";
  const isNanny = userType === "nanny";

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!user?.id || !user?.email) {
      setError("User not authenticated");
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare advertisement data for database
      const advertisementData = {
        type: formData.type,
        title: formData.title,
        description: formData.description,
        experience: formData.experience,
        skills: formData.skills,
        availability_start_time: formData.availability.startTime,
        availability_end_time: formData.availability.endTime,
        location_city: formData.location.city,
        location_address: formData.location.address || null,
        location_zip_code: formData.location.zipCode || null,
        price_per_hour: formData.pricePerHour,
        additional_info: formData.additionalInfo || null,
      };

      // Enforce limits: one active, up to three inactive
      const hasActive = await AdvertisementService.hasActiveAd(user.id);
      if (hasActive) {
        setError("You already have an active advertisement.");
        setIsSubmitting(false);
        return;
      }
      const inactiveCount = await AdvertisementService.getInactiveCount(
        user.id
      );
      if (inactiveCount >= 3) {
        setError("You already have 3 inactive advertisements.");
        setIsSubmitting(false);
        return;
      }

      // Create advertisement as inactive by default
      const createdAdvertisement =
        await AdvertisementService.createAdvertisement(
          user.id,
          advertisementData
        );

      if (!createdAdvertisement) {
        setError("Failed to create advertisement");
        setIsSubmitting(false);
        return;
      }

      console.log("Advertisement created successfully:", createdAdvertisement);
      window.location.href = "/profile";
    } catch (error) {
      console.error("Error creating advertisement:", error);
      setError("An error occurred while creating the advertisement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const titlePlaceholder = isParent
    ? "e.g., Looking for a caring nanny in Rīga"
    : "e.g., Experienced Nanny Available for Weekend Care";
  const priceLabel = isParent
    ? "Budget per Hour (€) *"
    : "Price per Hour (€) *";
  const experienceLabel = isParent
    ? "Requirements & Preferences *"
    : "Experience & Background *";
  const descriptionLabel = isParent
    ? "Job Description *"
    : "Service Description *";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Advertisement
          </h1>
          <p className="text-gray-600 mt-2">
            Create a professional advertisement to showcase your childcare
            services
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Service Type */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {isParent ? "Care Needed" : "Service Type"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="serviceType"
                  value="short-term"
                  checked={formData.type === "short-term"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value as "short-term" | "long-term",
                    }))
                  }
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {isParent ? "Short-term Need" : "Short-term Care"}
                  </div>
                  <div className="text-sm text-gray-600">
                    One-time or occasional childcare
                  </div>
                </div>
              </label>
              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="serviceType"
                  value="long-term"
                  checked={formData.type === "long-term"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value as "short-term" | "long-term",
                    }))
                  }
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {isParent ? "Long-term Need" : "Long-term Care"}
                  </div>
                  <div className="text-sm text-gray-600">
                    Regular, ongoing childcare
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advertisement Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder={titlePlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {priceLabel}
              </label>
              <input
                type="number"
                value={formData.pricePerHour}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pricePerHour: Number(e.target.value),
                  }))
                }
                placeholder="25"
                min="0"
                step="0.50"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Availability */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Availability
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.availability.startTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      availability: {
                        ...prev.availability,
                        startTime: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.availability.endTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      availability: {
                        ...prev.availability,
                        endTime: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Dates
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Select dates"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.location.city}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: { ...prev.location, city: e.target.value },
                    }))
                  }
                  list="city-options"
                  placeholder="Rīga"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <datalist id="city-options">
                  {cities.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: { ...prev.location, address: e.target.value },
                    }))
                  }
                  placeholder="Brīvības iela 123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.location.zipCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: { ...prev.location, zipCode: e.target.value },
                    }))
                  }
                  placeholder="LV-1010"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            {!isParent && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Skills & Certifications
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableSkills.map((skill) => (
                    <label
                      key={skill}
                      className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.skills.includes(skill)}
                        onChange={() => handleSkillToggle(skill)}
                        className="mr-2"
                      />
                      <span className="text-sm">{skill}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {experienceLabel}
            </label>
            <textarea
              value={formData.experience}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, experience: e.target.value }))
              }
              rows={4}
              placeholder={
                isParent
                  ? "List key requirements (e.g., experience with infants, Latvian/Russian speaking, driving license)."
                  : "Tell families about your childcare experience, education, and background."
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {descriptionLabel}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={4}
              placeholder={
                isParent
                  ? "Describe your family, schedule, duties, and expectations."
                  : "Describe what services you offer (meal prep, homework help, etc.)."
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Additional Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Information
            </label>
            <textarea
              value={formData.additionalInfo}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  additionalInfo: e.target.value,
                }))
              }
              rows={3}
              placeholder="Any additional information you'd like families to know about you or your services..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Error Message */}
          {error && <div className="text-red-500 text-sm mt-4">{error}</div>}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) window.history.back();
                else window.location.href = "/profile";
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                "Create Advertisement"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
