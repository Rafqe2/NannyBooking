"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useState } from "react";

export default function TestAuthPage() {
  const { user, error, isLoading } = useUser();
  const [testResult, setTestResult] = useState<string>("");

  const testAuth = async () => {
    setTestResult("Testing authentication...");

    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      setTestResult(`Auth test result: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setTestResult(`Auth test error: ${err}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Auth0 Test Page
        </h1>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Current Status</h2>
            <div className="space-y-2">
              <p>
                <strong>Loading:</strong> {isLoading ? "Yes" : "No"}
              </p>
              <p>
                <strong>Error:</strong> {error ? error.message : "None"}
              </p>
              <p>
                <strong>User:</strong> {user ? "Logged in" : "Not logged in"}
              </p>
              {user && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl">
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Name:</strong> {user.name}
                  </p>
                  <p>
                    <strong>Picture:</strong> {user.picture ? "Yes" : "No"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            {!user ? (
              <a
                href="/api/auth/login"
                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
              >
                Sign In
              </a>
            ) : (
              <a
                href="/api/auth/logout"
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Sign Out
              </a>
            )}

            <button
              onClick={testAuth}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Test Auth API
            </button>
          </div>

          {testResult && (
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-2">Test Result</h3>
              <pre className="text-sm bg-white p-4 rounded-xl overflow-auto">
                {testResult}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
