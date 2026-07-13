import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { CoreValues } from "@/components/CoreValues";
import { WhyUs } from "@/components/WhyUs";
import { ProductRange } from "@/components/ProductRange";
import { Portfolio } from "@/components/Portfolio";
import { Divisions } from "@/components/Divisions";
import { Sourcing } from "@/components/Sourcing";
import { Process } from "@/components/Process";
import { Compliance } from "@/components/Compliance";
import { Partners } from "@/components/Partners";
import { Profiles } from "@/components/Profiles";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { ScrollTop } from "@/components/ScrollTop";

export default function Home() {
  return (
    <>
      <Header />
      <main
        id="main"
        className="flex flex-col gap-[clamp(0.75rem,2vw,1.5rem)] pb-[clamp(0.75rem,2vw,1.5rem)]"
      >
        <Hero />
        <About />
        <CoreValues />
        <WhyUs />
        <ProductRange />
        <Portfolio />
        <Sourcing />
        <Process />
        <Divisions />
        <Compliance />
        <Partners />
        <Profiles />
        <Contact />
      </main>
      <Footer />
      <ScrollTop />
    </>
  );
}
