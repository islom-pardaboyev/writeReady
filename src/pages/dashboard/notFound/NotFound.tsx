import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

function NotFound() {
  return (
    <>
      <main className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="w-full max-w-2xl">
          {/* 404 Content */}
          <div className="space-y-8 text-center">
            {/* Decorative Element */}
            <div className="relative flex items-center justify-center h-64 mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="font-bold text-gray-300 text-9xl">
                  404
                </div>
              </div>
              <div className="relative text-6xl">🔍</div>
            </div>

            {/* Text Content */}
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                Page Not Found
              </h1>
              <p className="text-lg leading-relaxed text-gray-600">
                Oops! We couldn't find the page you're looking for. It might
                have been moved or deleted.
              </p>
            </div>

            {/* Suggestions */}
            <div className="grid gap-4 py-6 sm:grid-cols-2">
              <div className="p-4 border border-blue-200 rounded-xl bg-blue-50">
                <p className="mb-1 text-sm font-semibold text-blue-900">
                  💡 Helpful Tip
                </p>
                <p className="text-xs text-blue-800">
                  Check the URL spelling or navigate using the menu above
                </p>
              </div>
              <div className="p-4 border border-purple-200 rounded-xl bg-purple-50">
                <p className="mb-1 text-sm font-semibold text-purple-900">
                  🚀 Next Steps
                </p>
                <p className="text-xs text-purple-800">
                  Go back to home or explore our IELTS writing modes
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 font-semibold text-gray-900 transition-all bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                ← Go Back
              </button>
              <NavLink to="/">
                <Button
                  size="lg"
                  className="px-8 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700"
                >
                  🏠 Back to Home
                </Button>
              </NavLink>
            </div>

            {/* Quick Links */}
            <div className="pt-8 border-t border-gray-200">
              <p className="mb-4 text-sm font-semibold text-gray-600">
                Or explore these pages:
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <NavLink
                  to="/mock"
                  className="p-3 text-sm font-medium text-gray-900 transition-all bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md hover:text-blue-600"
                >
                  📝 Mock Test
                </NavLink>
                <NavLink
                  to="/practice"
                  className="p-3 text-sm font-medium text-gray-900 transition-all bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md hover:text-blue-600"
                >
                  ✏️ Practice
                </NavLink>
                <NavLink
                  to="/relax"
                  className="p-3 text-sm font-medium text-gray-900 transition-all bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md hover:text-blue-600"
                >
                  🛋️ Relax Mode
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default NotFound;