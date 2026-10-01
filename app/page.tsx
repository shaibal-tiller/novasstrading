import { getContent } from "@/lib/content-data";
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

export default async function Home() {
  const content = await getContent();

  return (
    <>
      <Header nav={content.nav} site={content.site} />
      <main
        id="main"
        className="flex flex-col gap-[clamp(0.75rem,2vw,1.5rem)] pb-[clamp(0.75rem,2vw,1.5rem)]"
      >
        <Hero hero={content.hero} />
        <About about={content.about} />
        <CoreValues coreValues={content.coreValues} />
        <WhyUs whyUs={content.whyUs} />
        <ProductRange products={content.products} />
        <Portfolio portfolio={content.portfolio} />
        <Sourcing sourcing={content.sourcing} />
        <Process process={content.process} />
        <Divisions divisions={content.divisions} leadTime={content.leadTime} />
        <Compliance compliance={content.compliance} />
        <Partners partners={content.partners} />
        <Profiles profiles={content.profiles} />
        <Contact contact={content.contact} site={content.site} />
      </main>
      <Footer footerBlurb={content.footerBlurb} nav={content.nav} site={content.site} />
      <ScrollTop />
    </>
  );
}

