export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-brand-600 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-600">Loading…</p>
      </div>
    </div>
  );
}
