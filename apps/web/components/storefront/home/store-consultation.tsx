/** Dark consultation block: phone, name and button in one row. Submission continues on the contact page. */
export const StoreConsultation = () => (
  <section className="light bg-background px-4 py-8 sm:px-6 sm:py-12 lg:px-8" aria-labelledby="consultation-title">
    <div className="dark mx-auto max-w-7xl rounded-2xl bg-background px-6 py-10 text-foreground sm:px-10 lg:px-14">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] lg:items-end">
        <div>
          <p className="font-display text-xs font-light tracking-[0.4em] text-primary uppercase">
            Нужна консультация?
          </p>
          <h2
            id="consultation-title"
            className="mt-3 font-display text-2xl leading-tight font-extrabold uppercase sm:text-3xl"
          >
            Поможем подобрать инструмент под вашу задачу
          </h2>
        </div>
        <form action="contact" method="get" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="sr-only" htmlFor="consultation-phone">
            Телефон
          </label>
          <input
            id="consultation-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Телефон"
            className="h-12 min-w-0 rounded-lg border bg-card px-4 text-card-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
          <label className="sr-only" htmlFor="consultation-name">
            Имя
          </label>
          <input
            id="consultation-name"
            name="name"
            autoComplete="name"
            placeholder="Имя"
            className="h-12 min-w-0 rounded-lg border bg-card px-4 text-card-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
          <button
            type="submit"
            className="h-12 rounded-lg bg-primary px-6 text-sm font-semibold whitespace-nowrap text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none motion-reduce:transition-none"
          >
            Получить консультацию
          </button>
        </form>
      </div>
      <p className="mt-5 text-center text-xs text-muted-foreground sm:text-left">
        Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
      </p>
    </div>
  </section>
);
