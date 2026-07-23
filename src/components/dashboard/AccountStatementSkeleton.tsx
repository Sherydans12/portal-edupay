export function AccountStatementSkeleton() {
  return (
    <div
      className="min-h-screen animate-pulse bg-slate-50 text-slate-900"
      role="status"
      aria-busy="true"
      aria-label="Cargando estado de cuenta"
    >
      <span className="sr-only">Cargando estado de cuenta</span>

      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-6 py-6 lg:block">
        <div className="h-12 w-44 rounded-lg bg-tenant-primary/15" />
        <div className="mt-10 space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-11 rounded-lg bg-slate-200" />
          ))}
        </div>
      </aside>

      <header className="h-[65px] border-b border-slate-200 bg-white lg:ml-72" />

      <main className="px-3 py-5 sm:px-4 lg:ml-72 lg:px-8 lg:py-8">
        <section className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
            <div className="space-y-3">
              <div className="h-4 w-32 rounded bg-tenant-secondary/20" />
              <div className="h-8 w-64 max-w-full rounded bg-tenant-primary/15" />
              <div className="h-4 w-80 max-w-full rounded bg-slate-200" />
            </div>
            <div className="h-20 w-full rounded-xl bg-tenant-primary/20 sm:w-44" />
          </div>

          {[0, 1].map((student) => (
            <article
              key={student}
              className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 p-5">
                <div className="h-11 w-11 rounded-lg bg-tenant-primary/15" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 max-w-full rounded bg-slate-200" />
                  <div className="h-4 w-64 max-w-full rounded bg-slate-200" />
                </div>
              </div>
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className="grid gap-4 border-b border-slate-100 px-4 py-5 last:border-0 md:grid-cols-[32px_1fr_150px_130px_140px]"
                >
                  {[0, 1, 2, 3, 4].map((cell) => (
                    <div key={cell} className="h-5 rounded bg-slate-200" />
                  ))}
                </div>
              ))}
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
