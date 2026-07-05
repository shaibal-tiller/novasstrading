// ---------------------------------------------------------------------------
// Nova SS Trading — content for the Simple Approach-inspired layout.
// Edit copy here; components read from this file.
// ---------------------------------------------------------------------------

export const site = {
  name: "Nova SS Trading",
  legalName: "Nova SS Trading",
  tagline: "Garments Buying House & Textile Solutions",
  url: "https://www.novasstrading.com",
  description:
    "Nova SS Trading is a design-led garments buying house and single-window partner for premium trims, accessories, and fabrics — established in Bangladesh, serving global brands and retailers.",
  email: "info@novasstrading.com",
  phone: "+880 1683-809975",
  phoneHref: "+8801683809975",
  address: {
    street: "Road #5, House #357, Baridhara DOHS",
    city: "Dhaka",
    postalCode: "1206",
    country: "Bangladesh",
    full: "Road #5, House #357, Baridhara DOHS, Dhaka, Bangladesh",
    mapUrl:
      "https://www.google.com/maps/place/Baridhara+DOHS,+Dhaka,+Bangladesh",
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
  { label: "Divisions", href: "#divisions" },
  { label: "Compliance", href: "#compliance" },
  { label: "Sourcing", href: "#sourcing" },
  { label: "Product Mix", href: "#products" },
  { label: "Customers", href: "#customers" },
  { label: "Contact", href: "#contact" },
] as const;

export const hero = {
  titleLine1: "This is",
  titleLine2: "Nova SS Trading",
  subtitle:
    "Your trusted single-window partner for innovative, design-led trims, accessories, and premium fabrics.",
  cta: { label: "Discover More", href: "#about" },
};

export const about = {
  heading: "About",
  body: [
    "Nova SS Trading is a design-led garments buying house and textile solutions provider established in Bangladesh. We operate two specialized divisions — Trims & Accessories and Premium Fabrics — alongside comprehensive apparel sourcing services for global brands and retailers.",
    "We support and inspire you to achieve the highest quality products at competitive pricing, working with clothing designers, manufacturers, and fashion brands across Europe, North America, and Asia.",
  ],
  vision:
    "Our vision is to become the most trusted global provider of innovative, quality-driven textile solutions with a strong focus on compliance & sustainability.",
  coreValues: [
    { label: "Quality Excellence", color: "#B08A4F" },
    { label: "Innovation & Design", color: "#1E4D4A" },
    { label: "Integrity & Transparency", color: "#8C6C3A" },
    { label: "Customer Centricity", color: "#B08A4F" },
    { label: "Sustainable Sourcing", color: "#1E4D4A" },
    { label: "On-Time Delivery", color: "#8C6C3A" },
  ],
};

export const people = {
  heading: "People & Culture",
  body: [
    "With a dedicated team of professionals spread across our operations, we are proud to have a diverse group of multi-talented individuals with deep expertise in garments, textiles, and supply chain management.",
    "We are committed to fostering an environment of respect, collaboration, and continuous learning where our employees feel empowered to deliver exceptional results for our partners worldwide.",
  ],
};

export const globalPresence = {
  heading: "Our global presence",
  body: [
    "Nova SS Trading is headquartered in Dhaka, Bangladesh, with sourcing networks extending across South Asia and manufacturing partnerships reaching global markets. This allows us to work closely with certified factories and maintain strong supplier relationships.",
    "Our leadership team comprises experts across operations, product development, sourcing, quality assurance, and compliance.",
  ],
  cta: { label: "Find Us", href: "#contact" },
  locations: [
    { name: "Dhaka, Bangladesh", role: "HQ — Operations, Sourcing & QA" },
    { name: "Chittagong, Bangladesh", role: "Port & Logistics Operations" },
    { name: "South Asia Network", role: "Manufacturing & Supply Chain" },
  ],
};

export const divisions = {
  heading: "Our Specialized Divisions",
  body: "Our talented sourcing and QA teams work with you to bring your requirements to life. Our specialized divisions in Trims & Accessories and Premium Fabrics provide a comprehensive single-window solution for all your garment manufacturing needs.",
  pills: [
    { label: "Single-window sourcing solution", color: "#B08A4F" },
    { label: "Competitive pricing & rapid sampling", color: "#1E4D4A" },
    { label: "Quality-assured supply chains", color: "#8C6C3A" },
  ],
  divisions: [
    {
      title: "Trims & Accessories",
      body: "Buttons, zippers, labels, elastic bands, draw cords, packaging materials, and complete branding solutions.",
    },
    {
      title: "Premium Fabrics",
      body: "Cotton, polyester, denim, jersey knit, twill, fleece, interlining, pocketing fabric, and custom finishing.",
    },
  ],
};

export const productMix = {
  heading: "Our product mix",
  body: "With production networks across Bangladesh and product categories spanning menswear, womenswear, and kidswear, we bring collections to life at competitive price points with quality manufacturing.",
  categories: [
    {
      id: "mens",
      label: "Mens",
      items: ["Polos & Tees", "Shirts & Trousers", "Chinos & Outerwear", "Corporate Basics"],
    },
    {
      id: "ladies",
      label: "Ladies",
      items: ["Fashion Tops & Dresses", "Blouses & Cardigans", "Knit Tees & Activewear", "Sleepwear"],
    },
    {
      id: "kids",
      label: "Kids",
      items: ["Knit Rompers & Hoodies", "Jeans & Pyjamas", "Organic Basics", "School Uniforms"],
    },
  ],
};

export const compliance = {
  heading: "Compliance you can trust",
  body: [
    "As a growing design-led sourcing business, our experienced compliance framework provides a layer of protection against risk for our business and for our customers. It ensures protection for factory workers, the end consumer, and all stakeholders in the supply chain.",
    "At Nova SS Trading, we are proud of the security and reassurance our compliance protocols provide through diligent maintenance of social standards and strict adherence to international quality benchmarks.",
  ],
  certifications: ["OEKO-TEX® Standard 100", "FSC® Certified", "BSCI / WRAP Compliant"],
};

export const technicalQA = {
  heading: "Technical & Quality Assurance",
  body: [
    "At Nova SS Trading, product quality is a core priority. We assist our partner factories in engineering end-to-end quality into products with the support of our dedicated Technical and Quality Assurance team.",
    "By focusing on incorporating quality at each stage — from garment development through production and beyond — our QA team provides exceptional value to partner factories, clients, and the final consumer.",
    "The end result is product that is well-made, with exceptional fit, style, and durability.",
  ],
};

export const sourcing = {
  heading: "Sourcing & Supply Chain",
  body: "Nova SS Trading's end-to-end sourcing strategy brings together supplier management, production monitoring, and logistics to go beyond basic buying-house services and deliver comprehensive supply chain solutions.",
  pillars: [
    { label: "Factory Verification & Capacity Building", color: "#B08A4F" },
    { label: "Supplier Relationships & Fair Practices", color: "#1E4D4A" },
    { label: "Efficient Logistics & On-Time Delivery", color: "#8C6C3A" },
  ],
  downloadLabel: "Download Our Company Profile",
  downloadHref: "/company-profile/NOVA_SS_TRADING_Company_Profile.pdf",
};

export const customers = {
  heading: "Our Customers",
  count: 10,
};

export const contact = {
  heading: "Let's work together",
  body: "Send us your garments sourcing specs, fabric needs, or trims inquiry and receive details within 24 hours.",
  subjects: [
    "Trims & Accessories Division",
    "Fabrics Division",
    "Garments Sourcing / Buying House",
    "Other Inquiry",
  ],
};

export const footerNav = {
  col1: [
    { label: "About", href: "#about" },
    { label: "People & Culture", href: "#people" },
    { label: "Divisions", href: "#divisions" },
    { label: "Compliance", href: "#compliance" },
  ],
  col2: [
    { label: "Sourcing", href: "#sourcing" },
    { label: "Product Mix", href: "#products" },
    { label: "Customers", href: "#customers" },
    { label: "Contact", href: "#contact" },
  ],
};
