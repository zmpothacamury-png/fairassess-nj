export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        FairAssess NJ
      </h1>
      <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
        FairAssess NJ is a public, reproducible study of whether New Jersey
        towns over-assess lower-priced homes compared with expensive ones.
      </p>
      <p className="mt-6 max-w-xl text-base text-zinc-500 dark:text-zinc-500">
        A free tool to check your property tax assessment is coming soon.
      </p>
    </main>
  );
}
