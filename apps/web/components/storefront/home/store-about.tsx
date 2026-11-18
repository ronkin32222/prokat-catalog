import Image from "next/image";

/** Compact proof block with replaceable image slots. */
export const StoreAbout = () => (
  <section id="about" className="py-16 sm:py-24" aria-labelledby="about-title">
    <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:px-8">
      <div className="flex flex-col justify-center">
        <p className="font-display text-sm font-light tracking-[0.04em] text-primary uppercase">
          О прокате
        </p>
        <h2
          id="about-title"
          className="mt-3 font-display text-4xl leading-[1.05] font-black tracking-[-0.01em] uppercase sm:text-5xl"
        >
          Инструмент, на который можно положиться
        </h2>
        <p className="mt-5 max-w-xl text-muted-foreground">
          Помогаем подобрать технику под задачу, быстро оформляем аренду и выдаём оборудование
          чистым и проверенным.
        </p>
        <dl className="mt-8 grid grid-cols-2 gap-6 border-t pt-6">
          <div>
            <dt className="text-sm text-muted-foreground">Довольных клиентов</dt>
            <dd className="font-display mt-1 text-4xl font-extrabold tabular-nums text-primary sm:text-5xl">
              95%
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Поддержка</dt>
            <dd className="font-display mt-1 text-4xl font-extrabold tabular-nums text-primary sm:text-5xl">
              24/7
            </dd>
          </div>
        </dl>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {["/demo/about-1.webp", "/demo/about-2.webp"].map((src, index) => (
          <div
            key={src}
            className={
              index === 1
                ? "relative aspect-[4/3] overflow-hidden rounded-sm border sm:mt-12"
                : "relative aspect-[4/3] overflow-hidden rounded-sm border"
            }
          >
            <Image
              src={src}
              alt="Инструмент в прокате"
              fill
              sizes="(max-width: 639px) 100vw, 33vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  </section>
);
