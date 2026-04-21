import Link from 'next/link';

const prizeBands = [
  { label: '5 matches', value: 'Jackpot pool' },
  { label: '4 matches', value: 'Shared prize' },
  { label: '3 matches', value: 'Monthly wins' },
];

const steps = [
  'Subscribe monthly or yearly',
  'Add your latest Stableford scores',
  'Support a UK golf charity',
  'Enter the monthly draw',
];

export default function Page() {
  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <section className="relative min-h-[92vh] overflow-hidden bg-slate-950">
        <img
          src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1800&q=85"
          alt="Golf course fairway at sunrise"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/58 to-emerald-950/15" />

        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="text-xl font-extrabold tracking-normal text-white">
              GolfHeroes
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="hidden rounded-md px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 sm:inline-flex"
              >
                Dashboard
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-100"
              >
                Join
              </Link>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-3xl">
              <p className="mb-5 inline-flex rounded-md bg-emerald-400 px-3 py-1 text-sm font-bold text-slate-950">
                Monthly golf draw supporting UK charities
              </p>
              <h1 className="max-w-4xl text-5xl font-extrabold leading-tight tracking-normal text-white sm:text-6xl lg:text-7xl">
                GolfHeroes
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white sm:text-xl">
                Turn your Stableford scores into monthly prize entries while directing part of every subscription toward golf charities.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="rounded-md bg-emerald-400 px-6 py-3 text-center text-base font-extrabold text-slate-950 transition hover:bg-emerald-300"
                >
                  Start membership
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-md border border-white/35 px-6 py-3 text-center text-base font-bold text-white transition hover:bg-white/10"
                >
                  View dashboard
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-white/18 bg-white/92 p-5 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Next draw</p>
                  <h2 className="text-2xl font-extrabold text-slate-950">Monthly prize pool</h2>
                </div>
                <div className="rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white">
                  GBP
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {prizeBands.map((band) => (
                  <div
                    key={band.label}
                    className="flex items-center justify-between rounded-md bg-slate-100 px-4 py-3"
                  >
                    <span className="font-bold text-slate-800">{band.label}</span>
                    <span className="text-sm font-semibold text-emerald-700">{band.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-emerald-50 p-4">
                  <p className="text-3xl font-extrabold text-emerald-700">5</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">scores kept per member</p>
                </div>
                <div className="rounded-md bg-amber-50 p-4">
                  <p className="text-3xl font-extrabold text-amber-700">10%</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">minimum charity contribution</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-950">How it works</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              A simple member flow: subscribe, record scores, support a charity, and track draw results from your dashboard.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => (
              <div key={step} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-extrabold text-emerald-700">0{index + 1}</p>
                <h3 className="mt-2 text-lg font-bold text-slate-950">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
