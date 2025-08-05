"use client";

import { useState, useEffect } from "react";

interface SearchParams {
  location: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface SearchResultsProps {
  searchParams: SearchParams;
  onBackToSearch: () => void;
}

interface Nanny {
  id: string;
  name: string;
  location: string;
  rating: number;
  hourlyRate: number;
  experience: string;
  languages: string[];
  availability: string;
  image: string;
  verified: boolean;
  reviews: number;
}

export default function SearchResults({
  searchParams,
  onBackToSearch,
}: SearchResultsProps) {
  const [nannies, setNannies] = useState<Nanny[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with Supabase query later
  const mockNannies: Nanny[] = [
    {
      id: "1",
      name: "Anna Petrova",
      location: "Riga, Latvia",
      rating: 4.8,
      hourlyRate: 12,
      experience: "5 years",
      languages: ["Latvian", "Russian", "English"],
      availability: "Weekdays, Weekends",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      verified: true,
      reviews: 24,
    },
    {
      id: "2",
      name: "Maria Ivanova",
      location: "Riga, Latvia",
      rating: 4.9,
      hourlyRate: 15,
      experience: "8 years",
      languages: ["Latvian", "Russian", "English"],
      availability: "Weekdays",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      verified: true,
      reviews: 31,
    },
    {
      id: "3",
      name: "Elena Kuzmina",
      location: "Jūrmala, Latvia",
      rating: 4.7,
      hourlyRate: 14,
      experience: "6 years",
      languages: ["Latvian", "Russian"],
      availability: "Weekends",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      verified: true,
      reviews: 18,
    },
    {
      id: "4",
      name: "Sofia Volkov",
      location: "Riga, Latvia",
      rating: 4.6,
      hourlyRate: 11,
      experience: "3 years",
      languages: ["Latvian", "English"],
      availability: "Weekdays, Weekends",
      image:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
      verified: false,
      reviews: 12,
    },
    {
      id: "5",
      name: "Natalia Sokolova",
      location: "Daugavpils, Latvia",
      rating: 4.9,
      hourlyRate: 13,
      experience: "7 years",
      languages: ["Latvian", "Russian", "English"],
      availability: "Weekdays",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      verified: true,
      reviews: 28,
    },
    {
      id: "6",
      name: "Irina Popova",
      location: "Liepāja, Latvia",
      rating: 4.5,
      hourlyRate: 10,
      experience: "4 years",
      languages: ["Latvian", "Russian"],
      availability: "Weekends",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      verified: false,
      reviews: 9,
    },
  ];

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      // Filter nannies based on search parameters
      let filteredNannies = mockNannies;

      if (searchParams.location !== "Location") {
        filteredNannies = filteredNannies.filter((nanny) =>
          nanny.location
            .toLowerCase()
            .includes(searchParams.location.toLowerCase())
        );
      }

      setNannies(filteredNannies);
      setLoading(false);
    }, 1000);
  }, [searchParams]);

  const formatSearchSummary = () => {
    const { location, startDate, endDate } = searchParams;

    if (location === "Location" && !startDate && !endDate) {
      return "All nannies available";
    }

    let summary = "Nannies available";

    if (location !== "Location") {
      summary += ` in ${location}`;
    }

    if (startDate) {
      if (endDate) {
        summary += ` for dates: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
      } else {
        summary += ` for date: ${startDate.toLocaleDateString()}`;
      }
    } else if (endDate) {
      summary += ` for date: ${endDate.toLocaleDateString()}`;
    }

    return summary;
  };

  if (loading) {
    return (
      <main className="flex-1 px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for nannies...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Search Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {formatSearchSummary()}
          </h2>
          <p className="text-gray-600">
            {nannies.length} nanny{nannies.length !== 1 ? "ies" : ""} found
          </p>
        </div>

        {/* Nanny Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nannies.map((nanny) => (
            <div
              key={nanny.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Nanny Image */}
              <div className="relative h-48 bg-gray-200">
                <img
                  src={nanny.image}
                  alt={nanny.name}
                  className="w-full h-full object-cover"
                />
                {nanny.verified && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    ✓ Verified
                  </div>
                )}
              </div>

              {/* Nanny Info */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {nanny.name}
                  </h3>
                  <div className="flex items-center">
                    <span className="text-yellow-400">★</span>
                    <span className="text-sm font-medium text-gray-700 ml-1">
                      {nanny.rating}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({nanny.reviews})
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-3">{nanny.location}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Experience:</span>
                    <span className="font-medium">{nanny.experience}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Rate:</span>
                    <span className="font-medium">
                      €{nanny.hourlyRate}/hour
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Availability:</span>
                    <span className="font-medium">{nanny.availability}</span>
                  </div>
                </div>

                {/* Languages */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Languages:</p>
                  <div className="flex flex-wrap gap-1">
                    {nanny.languages.map((language, index) => (
                      <span
                        key={index}
                        className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact Button */}
                <button className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200">
                  Contact {nanny.name}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {nannies.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👶</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No nannies found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or location
            </p>
            <button
              onClick={onBackToSearch}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200"
            >
              Modify Search
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
