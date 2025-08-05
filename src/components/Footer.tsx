export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Auklite</h3>
              <p className="text-gray-600 leading-relaxed">
                Connecting families with trusted childcare professionals across
                Latvia. Safe, reliable, and professional childcare solutions.
              </p>
            </div>
          </div>

          {/* For Parents */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">For Parents</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Find a Nanny
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Safety Guidelines
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Background Checks
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* For Nannies */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">For Nannies</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Find Families
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Set Your Rates
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Safety Tips
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Success Stories
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Support</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Safety Guidelines
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Background Checks
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
                © 2024 Auklite, Inc.
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
              >
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
