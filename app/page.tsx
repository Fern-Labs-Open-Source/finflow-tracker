export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">FinFlow Tracker</h1>
        <p className="text-center text-gray-600 mb-4">
          Personal finance tracker with multi-currency support
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/api/auth/signin"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sign In
          </a>
          <a
            href="/api/portfolio/summary"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Test API
          </a>
        </div>
      </div>
    </main>
  );
}
