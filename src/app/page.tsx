"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import Footer from "../components/Footer";
import SearchResults from "../components/SearchResults";

export default function Home() {
  const [searchParams, setSearchParams] = useState({
    location: "Location",
    startDate: null as Date | null,
    endDate: null as Date | null,
  });
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (
    location: string,
    startDate: Date | null,
    endDate: Date | null
  ) => {
    setSearchParams({ location, startDate, endDate });
    setShowResults(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Search Bar - At Top */}
      <div className="bg-white border-b border-gray-200 shadow-lg">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Main Content */}
      {!showResults ? (
        <main className="flex-1 px-8 py-16">
          <div className="text-center max-w-6xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 text-gray-900 leading-tight">
              Find Your Perfect
              <span className="block text-purple-600">Childcare Match</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-12">
              Connect trusted parents with qualified nannies in your area. Safe,
              reliable, and professional childcare solutions.
            </p>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  For Parents
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Find experienced, background-checked nannies who match your
                  family's needs and schedule.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  For Nannies
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Connect with families looking for quality childcare. Set your
                  rates and availability.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  Safe & Secure
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  All users are verified with background checks and references
                  for peace of mind.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  500+
                </div>
                <div className="text-gray-600">Trusted Nannies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  1,200+
                </div>
                <div className="text-gray-600">Happy Families</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  98%
                </div>
                <div className="text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <SearchResults
          searchParams={searchParams}
          onBackToSearch={() => setShowResults(false)}
        />
      )}

      {/* Footer - Scrollable */}
      <Footer />
    </div>
  );
}
