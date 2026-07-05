import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { PeopleCulture } from "@/components/PeopleCulture";
import { GlobalPresence } from "@/components/GlobalPresence";
import { Divisions } from "@/components/Divisions";
import { ProductMix } from "@/components/ProductMix";
import { Compliance } from "@/components/Compliance";
import { TechnicalQA } from "@/components/TechnicalQA";
import { Sourcing } from "@/components/Sourcing";
import { Customers } from "@/components/Customers";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main
        id="main"
        className="flex flex-col gap-[clamp(0.5rem,1.5vw,1rem)] pb-[clamp(0.5rem,1.5vw,1rem)]"
      >
        <Hero />
        <About />
        <PeopleCulture />
        <GlobalPresence />
        <Divisions />
        <ProductMix />
        <Compliance />
        <TechnicalQA />
        <Sourcing />
        <Customers />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
