import { Link } from 'react-router-dom';
import { 
  FlagIcon, 
  BoltIcon, 
  UsersIcon, 
  GlobeAltIcon, 
  KeyIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Real-time Updates',
    description: 'Toggle features instantly across all your platforms without waiting for a new deployment.',
    icon: BoltIcon,
  },
  {
    name: 'Multi-Environment',
    description: 'Manage flags separately for Development, Staging, and Production environments.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Advanced Targeting',
    description: 'Deliver the right features to the right users with flexible targeting rules and segments.',
    icon: UsersIcon,
  },
  {
    name: 'API Key Management',
    description: 'Securely connect your applications with dedicated Server, Client, and SDK keys.',
    icon: KeyIcon,
  },
  {
    name: 'Audit Logs',
    description: 'Track every change and maintain full visibility of who modified what and when.',
    icon: ChartBarIcon,
  },
  {
    name: 'Multi-Tenant Ready',
    description: 'Built-in support for Organizations and Brands. Perfect for SaaS and Enterprise.',
    icon: ShieldCheckIcon,
  },
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Navigation */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                <FlagIcon className="h-6 w-6 text-white" />
              </span>
              <span className="text-xl font-bold tracking-tight text-gray-900">Flagify</span>
            </Link>
          </div>
          <div className="flex flex-1 justify-end gap-x-6">
            <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900 pt-2">
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="isolate">
        {/* Hero section */}
        <div className="relative pt-14">
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div className="py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
              <div className="mx-auto max-w-2xl lg:text-center">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                  Feature Flag Management for Modern Teams
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Deploy faster and more reliably with Flagify. Control features in real-time, 
                  target specific users, and manage multiple environments with our powerful open-source platform.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link
                    to="/register"
                    className="rounded-md bg-primary-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                  >
                    Start for Free
                  </Link>
                  <a href="#features" className="text-sm font-semibold leading-6 text-gray-900 uppercase tracking-widest">
                    Learn more <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
              <div className="mt-16 flow-root sm:mt-24">
                <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                  <img
                    src="/screenshot.png"
                    alt="App screenshot"
                    width={2432}
                    height={1442}
                    className="rounded-md shadow-2xl ring-1 ring-gray-900/10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature section */}
        <div id="features" className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600 uppercase tracking-widest">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Powerful features to ship with confidence
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Stop worrying about deployment windows. Release features to specific segments, run beta programs, and kill problematic features instantly.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
            <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:gap-x-16">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Trusted by developers worldwide</h2>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Flagify is designed to handle enterprise workloads while remaining simple enough for individual developers. Our architecture ensures that feature evaluation happens locally in your SDK for maximum performance.
                </p>
                <div className="mt-10 flex gap-x-8 text-base font-semibold leading-7 text-gray-900 border-t border-gray-200 pt-10">
                  <div className="flex flex-col gap-y-3">
                    <span className="text-4xl font-bold text-primary-600">10k+</span>
                    <span>Daily Evaluations</span>
                  </div>
                  <div className="flex flex-col gap-y-3">
                    <span className="text-4xl font-bold text-primary-600">99.9%</span>
                    <span>Uptime Guarantee</span>
                  </div>
                  <div className="flex flex-col gap-y-3">
                    <span className="text-4xl font-bold text-primary-600">{'< 1ms'}</span>
                    <span>Local Evaluation</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-8 flex flex-col justify-center border border-gray-100">
                <div className="space-y-4">
                  {[
                    "Self-hosted & Private",
                    "Intuitive Web Interface",
                    "SDKs for all major languages",
                    "Granular Targeting Rules",
                    "Organization Management",
                    "Unlimited Projects & Flags"
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-x-3 text-gray-700">
                      <CheckCircleIcon className="h-6 w-6 text-green-500" />
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-32 bg-gray-900 sm:mt-56">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <FlagIcon className="h-8 w-8 text-primary-500" />
              <span className="text-xl font-bold text-white uppercase tracking-tighter">Flagify</span>
            </div>
            <p className="text-xs leading-5 text-gray-400">
              &copy; {new Date().getFullYear()} Flagify. Open source under MIT License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
