export default function HeaderBanner() {
  return (
    <header className="relative h-56 bg-gradient-to-r from-blue-950 via-blue-800 to-blue-700 bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 text-white">
        <p className="mb-2 text-base font-medium tracking-wide opacity-90">
          안전한 현장, 건강한 근로환경
        </p>
        <h1 className="text-4xl font-bold tracking-tight">
          산업안전보건 통합 커뮤니티
        </h1>
      </div>
    </header>
  );
}
