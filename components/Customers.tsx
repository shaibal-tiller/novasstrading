import { customers } from "@/lib/content";

export function Customers() {
  // Generate a list of placeholder logos for the marquee
  const logos = Array.from({ length: customers.count }, (_, i) => i + 1);

  return (
    <section id="customers" className="section-wrap">
      <div className="section-card section-card--alt overflow-hidden !py-12">
        <h2 className="text-center font-sans text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">
          {customers.heading}
        </h2>
        
        <div className="relative mt-8 flex overflow-hidden">
          {/* Fading edges for the marquee */}
          <div className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#EDE8E6] to-transparent" />
          <div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#EDE8E6] to-transparent" />

          {/* Scrolling track */}
          <div className="flex w-max animate-marquee gap-16 py-4 pr-16 lg:gap-24 lg:pr-24">
            {/* Double the logos to create seamless loop */}
            {[...logos, ...logos].map((i, idx) => (
              <div
                key={`${i}-${idx}`}
                className="flex items-center justify-center grayscale transition-all duration-300 hover:grayscale-0 opacity-50 hover:opacity-100"
              >
                <div className="h-12 w-32 rounded bg-ink/10 flex items-center justify-center text-[0.6rem] uppercase tracking-widest text-ink/40 font-mono">
                  Logo {i}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
