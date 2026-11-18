/** Visual lead form; submission continues on the existing contact page. */
export const StoreConsultation = () => (
  <section className="px-4 py-8 sm:px-6 sm:py-14 lg:px-8" aria-labelledby="consultation-title">
    <div className="storefront-concrete mx-auto max-w-7xl rounded-sm border px-5 py-10 sm:px-10 lg:px-14">
      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
        <div>
          <h2
            id="consultation-title"
            className="font-display text-3xl font-black tracking-[-0.01em] uppercase sm:text-4xl"
          >
            Консультация
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Оставьте контакты — поможем выбрать инструмент и рассчитать срок аренды.
          </p>
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
            className="h-12 min-w-0 rounded-sm border border-white bg-white px-4 text-[#111] placeholder:text-[#666] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
          <label className="sr-only" htmlFor="consultation-name">
            Имя
          </label>
          <input
            id="consultation-name"
            name="name"
            autoComplete="name"
            placeholder="Имя"
            className="h-12 min-w-0 rounded-sm border border-white bg-white px-4 text-[#111] placeholder:text-[#666] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
          <button
            type="submit"
            className="h-12 rounded-sm bg-primary px-6 text-sm font-semibold whitespace-nowrap text-primary-foreground uppercase transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            Отправить заявку
          </button>
        </form>
      </div>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
      </p>
    </div>
  </section>
);
