import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';

const progressAreas = [
  {
    title: 'Activation checklist',
    description: 'See the setup steps you have completed and identify the next useful action for getting started.',
  },
  {
    title: 'Usage overview',
    description: 'Review your product activity and understand how you are using the AIDetector.cx tools available to your account.',
  },
  {
    title: 'Goals and milestones',
    description: 'Keep track of goals, completed milestones, and progress across your work in one place.',
  },
  {
    title: 'Your product journey',
    description: 'Follow a structured view of your adoption journey and find relevant next steps as you explore the platform.',
  },
];

export default function ProgressLandingPage() {
  return (
    <MainLayout>
      <PageMeta
        title="Progress Tracking Dashboard | AIDetector.cx"
        description="Learn how the AIDetector.cx progress dashboard helps you track setup, product activity, goals, milestones, and your journey across the platform."
        canonicalUrl="https://www.aidetector.cx/progress"
        ogTitle="Progress Tracking Dashboard | AIDetector.cx"
        ogDescription="A clear overview of setup, product activity, goals, milestones, and next steps in AIDetector.cx."
      />

      <main>
        <section className="bg-slate-950 text-white py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">
              AIDetector.cx Progress Tracking
            </p>
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight md:text-6xl">
              See your progress. Know your next step.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
              The progress dashboard brings your setup checklist, product activity, goals, and milestones together so you can understand your journey across AIDetector.cx.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Create a free account
              </Link>
              <Link
                to="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/25 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Your work, progress, and next steps in one view
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                AIDetector.cx includes progress tools designed to help account holders understand what they have completed, how they use the platform, and where to go next.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {progressAreas.map((area) => (
                <article key={area.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-xl font-semibold">{area.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{area.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 py-14 md:py-16">
          <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Progress information stays in your account
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              This page explains the progress-tracking features. Personal checklists, usage details, goals, and account activity are available only inside the signed-in dashboard.
            </p>
            <Link to="/login" className="mt-6 inline-flex font-semibold text-primary underline-offset-4 hover:underline">
              Open your progress dashboard
            </Link>
          </div>
        </section>
      </main>
    </MainLayout>
  );
}
