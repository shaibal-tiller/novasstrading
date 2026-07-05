// ---------------------------------------------------------------------------
// Nova SS Trading — exact mirror of Simple Approach content
// ---------------------------------------------------------------------------

export const site = {
  name: "Nova SS Trading", // Replaced Simple Approach Ltd.
  legalName: "Nova SS Trading",
  tagline: "Global design-led apparel manufacturer",
  url: "https://www.novasstrading.com",
  description:
    "Nova SS Trading is a global design-led apparel manufacturer and supply chain manager established in 2005 and headquartered in Hong Kong.",
  email: "info@novasstrading.com",
  phone: "+880 1683-809975",
  phoneHref: "+8801683809975",
  address: {
    street: "Road #5, House #357, Baridhara DOHS",
    city: "Dhaka",
    postalCode: "1206",
    country: "Bangladesh",
    full: "Road #5, House #357, Baridhara DOHS, Dhaka, Bangladesh",
    mapUrl: "https://www.google.com/maps/place/Baridhara+DOHS,+Dhaka,+Bangladesh",
  },
  social: {
    linkedin: "#",
    instagram: "#",
    facebook: "#",
  },
} as const;

export const nav = [
  { label: "About", href: "#about" },
  { label: "People & Culture", href: "#people" },
  { label: "Design & PD", href: "#design-pd" },
  { label: "Compliance", href: "#compliance" },
  { label: "Technical & QA", href: "#technical" },
  { label: "ESG", href: "#esg" },
  { label: "Customers", href: "#customers" },
  { label: "Contact", href: "#contact" },
  // { label: "Our News", href: "#news" }, // Skipping pages, keeping one-page structure
  // { label: "Press", href: "#press" },
] as const;

export const hero = {
  titleLine1: "This is our",
  titleLine2: "Nova SS Trading",
  subtitle:
    "Your trusted global provider of innovative, design-led and mindfully made fashions.",
  cta: { label: "Discover More", href: "#about" },
};

export const about = {
  heading: "About",
  body: [
    "Nova SS Trading is a global design-led apparel manufacturer and supply chain manager established in 2005 and headquartered in Hong Kong. We have expertise across all product categories from essentials to fashion in Menswear, Ladieswear and Childrenswear. We support and inspire you to create the highest quality and affordable product to fit your customer’s needs, working with brands and retailers across UK, EU, USA and Canada.",
  ],
  vision:
    "Our vision is to become the most trusted global provider of innovative, design led fashion solutions with strong focus on compliance & sustainability.",
  coreValues: [
    { label: "Trust, Integrity & Ethics", color: "#B08A4F" },
    { label: "People First", color: "#1E4D4A" },
    { label: "Entreprenurial Spirit", color: "#8C6C3A" },
    { label: "Customer Centricity", color: "#B08A4F" },
    { label: "Transparency, Collaboration, & Teamwork", color: "#1E4D4A" },
    { label: "Social & Environmental Responsibility", color: "#8C6C3A" },
  ],
};

export const people = {
  heading: "People & Culture",
  body: [
    "With over 400 employees spread across our global offices, we are proud to have a diverse team of multi-cultural, multi-generational and multi-talented individuals with unique backgrounds contributing to Nova SS Trading's growth and success.",
    "We are committed to continue fostering an environment of respect, collaboration & teamwork where our employees feel empowered to take Nova SS Trading’s vision forward.",
  ],
};

export const globalPresence = {
  heading: "Our global presence",
  body: [
    "Nova SS Trading has company offices around the globe, headquartered in Hong Kong with presence in Bangladesh, China, India, Sri Lanka, Turkey and the United Kingdom. This allows us to work more closely with our manufacturers and maintain close relationships across suppliers.",
    "Our leadership team is comprised of executives across HR, Operations, Product Design & Development, Sourcing, Technical & QA, Compliance and ESG.",
  ],
  cta: { label: "Find Us", href: "#contact" },
  locations: [
    { name: "Hong Kong", role: "Hong Kong Operations, Technical, Design & PD, Sourcing" },
  ],
};

export const designPD = {
  heading: "Design & Product Development",
  body: [
    "Our talented global design teams work with you to bring your vision to life using 3D technology for maximum impact. Our state-of-the-art PD facility in Bangladesh houses our sourcing, merchandisers, technicians, pattern and sample room teams to control our proto samples and quality.",
  ],
  pills: [
    { label: "Reduced sampling for speed to market", color: "#B08A4F" },
    { label: "Cost effective & on-trend solutions", color: "#1E4D4A" },
    { label: "Less waste & lower carbon footprint", color: "#8C6C3A" },
  ],
};

export const productMix = {
  heading: "Our product mix",
  body: "With production facilities across 5 countries and product categories across ladies, mens and childrenswear, we bring collections to life at a competitive price point and quality manufacturing.",
  categories: [
    {
      id: "mens",
      label: "Mens",
      items: ["Soft wovens", "Jersey", "Sweaters"],
    },
    {
      id: "ladies",
      label: "Ladies",
      items: ["Soft wovens", "Jersey", "Sweaters"],
    },
    {
      id: "childrenswear",
      label: "Childrenswear",
      items: ["Soft wovens", "Jersey", "Sweaters"],
    },
  ],
};

export const compliance = {
  heading: "Compliance you can trust",
  body: [
    "As a large, growing design led sourcing business, our experienced compliance team provides a layer of protection against risk for our business and for our customers. It also exists to provide protection to our partner factories' employees, our customers and ultimately the end consumer and other stakeholders. Alongside our in-house compliance team and framework, we are supported by an 80 member global PDS compliance team helping us to adapt to new markets and territories.",
    "At Nova SS Trading we are proud of the security and reassurance our Compliance team provides through its diligence in maintaining social standards, ensuring strict adherence to labours laws and in the broader execution of its responsibilities.",
  ],
  certifications: [],
};

export const technicalQA = {
  heading: "Technical & Quality Assurance",
  body: [
    "At Nova SS Trading, product quality is a core priority. We assist our partner factories in engineering end-to-end quality into our products with the support of more than 50 members of our Technical and Quality Assurance teams.",
    "By focusing on incorporating quality at each stage of the manufacturing process, from garment development through production and beyond, our Technical and Quality Assurance team members provide value to our partner factories, our Clients, and the final Consumer.",
    "The end result is clothing that is exquisitely designed and well-made, with exceptional fit, style, and durability.",
  ],
};

export const esg = {
  heading: "ESG",
  body: [
    "Nova SS Trading’s Environmental, Social and Governance strategy brings together worker wellbeing and environmental responsibility to go beyond legal requirements and focus our efforts.",
  ],
  pillars: [
    { label: "Governance & Capacity Building", color: "#B08A4F" },
    { label: "Rights & Relationships", color: "#1E4D4A" },
    { label: "Responsible & Efficient Resource Use", color: "#8C6C3A" },
  ],
  cta1: { label: "DOWNLOAD OUR 2024 ESG REPORT", href: "#" },
  reportText: "Nova SS Trading co-commissioned a report intended to enable suppliers in the apparel value chain, and others who are seeking to understand upcoming legislation, to better understand how impending sustainability-related legislation in the Global North will impact them. You can download the report and learn more here:",
  cta2: { label: "DOWNLOAD THE REPORT", href: "#" },
};

export const pdsGroup = {
  heading: "A group you can rely on",
  body: "PDS Limited is a global fashion infrastructure platform offering product development, sourcing, manufacturing, and distribution for major brands and retailers worldwide handling over $1.5 billion of Gross Merchandise Value, operating a vast global network covering over 60 offices in 22 countries, with over 10,000 employees and factory associates worldwide. PDS also offers a bespoke end-to-end outsourcing solution, engaging dedicated talent and infrastructure as an extended arm of retailers and brands.",
  cta: { label: "DISCOVER MORE", href: "https://pdsltd.com" }
}

export const customers = {
  heading: "Our Customers",
  count: 10,
};

export const contact = {
  heading: "Let's work together",
  body: "Please submit your inquiry below.",
  subjects: [
    "General Inquiry",
    "Sourcing",
    "Compliance",
    "Design & PD",
  ],
};

export const footerNav = {
  col1: [
    { label: "ABOUT", href: "#about" },
    { label: "PEOPLE & CULTURE", href: "#people" },
    { label: "DESIGN & PD", href: "#design-pd" },
    { label: "COMPLIANCE", href: "#compliance" },
    { label: "TECHNICAL & QA", href: "#technical" },
    { label: "ESG", href: "#esg" },
    { label: "CONTACT", href: "#contact" },
  ],
  col2: [] as { label: string; href: string }[],
};
