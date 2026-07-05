// ---------------------------------------------------------------------------
// Nova SS Trading — single source of truth for site content.
// Edit copy here; components read from this file.
// ---------------------------------------------------------------------------

export const site = {
  name: "Nova SS Trading",
  legalName: "Nova SS Trading",
  tagline: "Garments Buying House & Textile Solutions",
  url: "https://www.novasstrading.com",
  description:
    "Nova SS Trading is Bangladesh's premier garments buying house and single-window partner for premium trims, accessories, and fabrics.",
  email: "info@novasstrading.com",
  phone: "+880 1683-809975",
  phoneHref: "+8801683809975",
  address: {
    street: "Road #5, House #357, Baridhara DOHS",
    city: "Dhaka",
    postalCode: "1206",
    country: "Bangladesh",
    full: "Road #5, House #357, Baridhara DOHS, Dhaka, Bangladesh",
    mapUrl: "https://www.google.com/maps?q=Dhaka,+%E5%8F%B7%E8%B7%AFGround+Floor.%E4%B8%80%E6%A5%BC%EF%BC%8CHouse-357%E6%88%BF%EF%BC%8CRoad%E4%B9%90%E6%80%9D%E8%9C%80-%E9%BA%BB%E8%BE%A3%E9%A6%99%E9%94%85%26%E9%B8%A1%E5%85%AC%E7%85%B2%E9%82%AE%E6%94%BF%E7%BC%96%E7%A0%81:+1206&ftid=0x3755c7bc1a191521:0xb6d963abf029eb7b&entry=gps&shh=CAE&lucs=,100820945,94297699,94231188,94280568,47071704,94218641,94282134,100813469,94286869&g_ep=CAISEjI2LjI1LjMuOTMyMTI1MTg3MBgAIIgnKlMsMTAwODIwOTQ1LDk0Mjk3Njk5LDk0MjMxMTg4LDk0MjgwNTY4LDQ3MDcxNzA0LDk0MjE4NjQxLDk0MjgyMTM0LDEwMDgxMzQ2OSw5NDI4Njg2OUICQkQ%3D&skid=f3e380e1-0337-43cc-8496-a010f3671344&g_st=iw",
  },
  social: {
    linkedin: "#",
    instagram: "#",
  },
} as const;

export const nav = [
  { label: "About", href: "#about" },
  { label: "Values", href: "#values" },
  { label: "Divisions", href: "#divisions" },
  { label: "Sourcing", href: "#sourcing" },
  { label: "Process", href: "#process" },
  { label: "Compliance", href: "#compliance" },
  { label: "Profiles", href: "#profiles" },
  { label: "Contact", href: "#contact" },
] as const;

export const hero = {
  eyebrow: "Complete Garments Buying House",
  titlePrefix: "Your single-window partner for",
  title: "premium trims, accessories & fabrics",
  body: "We bridge the gap between global brands and reliable manufacturers, delivering products shaped around quality, innovation, and on-time execution.",
  primaryCta: { label: "Our product divisions", href: "#divisions" },
  secondaryCta: { label: "Apparel sourcing", href: "#sourcing" },
};

export const about = {
  eyebrow: "About Nova SS Trading",
  title: "Delivering the perfect touch & sourcing solutions",
  body: [
    "Established as a trusted partner in the global apparel supply chain, Nova SS Trading operates two specialized divisions — Trims & Accessories and Fabrics — alongside our core Garments Buying House services in Bangladesh.",
    "We support clothing designers and apparel manufacturers worldwide with world-class accessories, premium knitted and woven fabrics, and comprehensive end-to-end production monitoring, ensuring a smooth, single-window sourcing experience.",
  ],
  highlights: [
    "Global standard quality assurance",
    "Unmatched customization & rapid design prototypes",
    "Commitment to sustainability and responsible sourcing",
  ],
  mission: {
    title: "Our Mission",
    body: "To deliver high-quality fabrics, trims, and accessories that empower apparel manufacturers and fashion brands with innovative, sustainable, and reliable solutions — ensuring style, durability, and global competitiveness.",
  },
  vision: {
    title: "Our Vision",
    body: "To become a trusted global leader in fabrics and accessories by setting new standards in quality, innovation, and sustainability, while contributing to the growth of Bangladesh's apparel and textile industry.",
  },
};

export const coreValues = {
  eyebrow: "Our Compass",
  title: "Core business beliefs",
  intro:
    "What guides our team daily to exceed international benchmarks and build reliable supply networks.",
  values: [
    {
      title: "Quality Excellence",
      body: "We hold world-class standards in every product, ensuring durability, consistency, and a premium finish.",
    },
    {
      title: "Innovation",
      body: "We continuously explore new ideas, designs, and technologies to meet the changing needs of the fashion industry.",
    },
    {
      title: "Sustainability",
      body: "We prioritize eco-friendly materials and responsible production to protect the environment for future generations.",
    },
    {
      title: "Integrity",
      body: "We believe in honesty, transparency, and fairness across every single part of our business operations.",
    },
  ],
};

export const whyUs = {
  eyebrow: "Why Nova SS Trading",
  title: "A partnership built for high-yield supply chains",
  intro:
    "Collaborating with us offers high-yield supply chains, unmatched responsiveness, and complete peace of mind.",
  reasons: [
    {
      title: "High-Quality Standards",
      body: "Both Fabrics and Trims divisions run separate, rigorous QA checks conforming to international benchmarks before shipping.",
    },
    {
      title: "Customization",
      body: "Tailor-made solutions developed exactly to your brief, with quick prototype design and fast sampling lead times.",
    },
    {
      title: "On-Time Delivery",
      body: "We respect tight fashion-season timelines, guaranteeing prompt communication and timely shipment dispatch.",
    },
  ],
};

export const divisions = {
  eyebrow: "Our Specializations",
  title: "Trims, accessories & fabrics divisions",
  intro:
    "A comprehensive overview of our product lines, custom creations, and production capabilities.",
  items: [
    {
      index: "Division 01",
      title: "Trims & Accessories",
      body: "Our Trims & Accessories wing is a trusted source for high-quality garment accents that add real retail value to finished products. We provide a single-window solution shaped around international brands and local manufacturers.",
      productsLabel: "Products include",
      products:
        "Buttons (plastic, metal, wood, shell), zippers, hook & loops, draw cords, sewing threads, size / woven / printed / care labels, leather patches, elastic bands, and complete packaging materials.",
      bullets: [
        "Elastic & band production — waistbands, straps, shoulder bands",
        "Decorative & functional trims — laces, ribbons, piping",
        "Embroidery & custom branding solutions",
      ],
    },
    {
      index: "Division 02",
      title: "Premium Fabrics",
      body: "The Fabrics wing is dedicated to producing and supplying premium-quality fabrics for the evolving textile and fashion industries. We partner comfort with creativity, satisfying international standards and ethical sourcing.",
      productsLabel: "Sourced & supplied fabrics",
      products:
        "Cotton, polyester, viscose, rayon, wool, linen, silk, chiffon, georgette, satin, denim, twill, poplin, fleece, jersey knit, lycra, canvas, velvet, and organza.",
      bullets: [
        "Pocketing fabric — TC, TR, 100% cotton sheeting, twilled & plain weave",
        "Interlining — fusible, sew-in, double dot, powder dot, woven & non-woven",
        "Custom finishing, dyeing, printing, coating & functional treatments",
      ],
    },
  ],
};

export const leadTime = {
  eyebrow: "Lead-Time Framework",
  title: "Product & lead-time framework",
  intro:
    "We pride ourselves on efficiency, rapid sampling turnaround, and tight production timelines.",
  columns: ["Products / Accessories", "Sample Lead-Time", "Production Lead-Time"],
  rows: [
    ["Hang Tags / Swing Tags", "2–4 Days", "3–7 Days"],
    ["Woven Labels & Size Labels", "2–4 Days", "3–7 Days"],
    ["Printed / Care / Wash Care Labels", "2–4 Days", "3–7 Days"],
    ["Leather Patches", "2–4 Days", "3–7 Days"],
    ["Elastic Bands & Drawstring Elastics", "2–4 Days", "3–7 Days"],
    ["Sewing Threads, Twill Tape, Strings", "2–4 Days", "3–7 Days"],
    ["Buttons & Zippers", "2–4 Days", "3–7 Days"],
    ["Hooks & Eyes, Snaps / Press Studs", "2–4 Days", "3–7 Days"],
    ["Velcro, Buckles, Toggles, Eyelets", "2–4 Days", "3–7 Days"],
    ["Poly Bags, Interlinings & Fusible Tapes", "2–4 Days", "3–7 Days"],
  ],
};

export const sourcing = {
  eyebrow: "RMG Supply Chain Services",
  title: "Garments sourcing & export operations",
  intro:
    "Acting as the bridge between international retail buyers and certified local apparel manufacturers in Bangladesh, we manage the entire lifecycle of apparel design, manufacture, quality inspection, and global shipment support.",
  services: [
    {
      title: "Product Sourcing",
      body: "We connect buyers with the best manufacturers in Bangladesh, sourcing natural and synthetic textiles at competitive pricing.",
    },
    {
      title: "Sampling & Development",
      body: "Building exact-fit samples, refining specifications, and developing custom styles according to your brand design requirements.",
    },
    {
      title: "Production Monitoring",
      body: "Continuous supervisors checking cutting, sewing, and finishing in factories to enforce timelines and prevent bottlenecks.",
    },
    {
      title: "Logistics & Export",
      body: "Handling customs clearance, freight shipping arrangements, escrow accounts, L/C, and FOB / CFR / CIF terms safely.",
    },
    {
      title: "Private Label Solutions",
      body: "Bespoke packaging, brand hangtags, custom print runs, and unique clothing details specifically for your brand label.",
    },
    {
      title: "Trend & Market Insights",
      body: "Sharing fashion industry trends, local yarn-rate developments, and sourcing logistics updates to keep you ahead.",
    },
  ],
  portfolio: {
    title: "Our apparel sourcing portfolio",
    intro:
      "Across our factory networks, we produce all clothing categories conforming to major Western retailers.",
    categories: [
      {
        title: "Menswear",
        body: "Polos, tees, shirts, corporate trousers, outerwear, chinos, and basics.",
      },
      {
        title: "Womenswear",
        body: "Fashion tops, dresses, cardigans, blouses, knit tees, activewear, and sleepwear.",
      },
      {
        title: "Kidswear",
        body: "Comfy knit rompers, shirts, jeans, hoodies, pyjamas, and organic basics.",
      },
      {
        title: "Knitwear & Denim",
        body: "Heavy denim trousers, jackets, fleece hoodies, cotton sweatpants, and knitwear.",
      },
    ],
  },
};

export const process = {
  eyebrow: "How We Work",
  title: "Our structured working process",
  intro:
    "Eight stages of rigorous, transparent, and efficient buying-house workflow.",
  steps: [
    {
      n: "01",
      title: "Requirement Analysis",
      body: "We start by understanding your exact specifications: product type, design sheets, quantity, fabric, target pricing, and timelines.",
    },
    {
      n: "02",
      title: "Supplier & Fabric Sourcing",
      body: "We engage trusted mills and production units to secure raw fabrics and trims matching specifications.",
    },
    {
      n: "03",
      title: "Sampling & Development",
      body: "Creating visual and fit samples for buyer approval, tweaking measurements and colours prior to booking bulk production.",
    },
    {
      n: "04",
      title: "Production Monitoring",
      body: "Daily milestone reports during sewing and dyeing to prevent bottlenecks and protect agreed shipment seasons.",
    },
    {
      n: "05",
      title: "Quality Inspection",
      body: "Rigorous inline and final inspections using AQL standards, checking stitching accuracy and fabric strength.",
    },
    {
      n: "06",
      title: "Packing & Logistics",
      body: "Carton packing to exact packaging briefs, shipping document preparation, L/C handling, and export code verification.",
    },
    {
      n: "07",
      title: "Shipment & Delivery",
      body: "Managing safe loading at Chittagong Port, freight tracking, and customs documents for secure port clearance.",
    },
    {
      n: "08",
      title: "After-Sales Support",
      body: "Quick resolution, feedback collection, and client care to ensure our partnerships persist for decades.",
    },
  ],
};

export const compliance = {
  eyebrow: "Standards & Integrity",
  title: "Quality assurance & compliance",
  intro:
    "We enforce strict quality protocols and eco-friendly standards across all manufacturing partners.",
  protocolTitle: "Our quality assurance protocol",
  protocolBody: [
    "At Nova SS Trading, quality sits at the heart of everything we do. Both our Fabrics and Trims & Accessories divisions follow strict quality-assurance protocols so that every product meets international benchmarks.",
    "Our experienced in-house QA officers inspect raw materials, supervise cutting and stitching tables, and perform tests prior to any third-party inspection (SGS, Intertek, and others).",
  ],
  checks: [
    {
      title: "Material Inspection",
      body: "Thorough checking of raw yarns, chemicals, and trims.",
    },
    {
      title: "Process Monitoring",
      body: "Continuous supervision to maintain sizing and sewing precision.",
    },
    {
      title: "Product Testing",
      body: "Testing for strength, stretch, colourfastness, and eco-safety.",
    },
    {
      title: "Final Inspection",
      body: "Enforcing strict AQL standards on final packed cartons.",
    },
    {
      title: "Continuous Improvement",
      body: "Regular training for suppliers and factory audits.",
    },
  ],
  certifications: [
    { name: "OEKO-TEX®", detail: "Standard 100 Certified" },
    { name: "FSC®", detail: "Forest Stewardship Council" },
    { name: "BSCI / WRAP", detail: "Ethical Audits Compliant" },
  ],
  footnote:
    "Nova SS Trading promotes eco-friendly manufacturing. Our products conform to the strictest hazardous-chemical bans, safeguarding both factory workers and retail consumers worldwide.",
};

export const profiles = {
  eyebrow: "Official Documents",
  title: "Our company profiles",
  intro:
    "Download our official corporate profiles to explore our manufacturing capabilities and sourcing strategies.",
  documents: [
    {
      title: "Corporate Company Profile",
      body: "Complete overview of our Trims & Accessories Division and Fabrics Division. Includes product catalogs and lead times.",
      href: "/company-profile/NOVA_SS_TRADING_Company_Profile.pdf",
    },
    {
      title: "Apparel Sourcing Profile",
      body: "Detailed insights into our Garments Buying House operations, product categories, and working process.",
      href: "/company-profile/NOVA_SS_TRADING_Sourcing_Profile.pdf",
    },
  ],
};

export const partners = {
  eyebrow: "Trusted By",
  title: "Brands & manufacturers we serve",
  intro:
    "We partner with global brands, retailers, and certified manufacturers across the apparel value chain.",
  // Replace each with a real partner logo — see MEDIA_PROMPTS.md (LOGO-01 … LOGO-10)
  count: 10,
};

export const contact = {
  eyebrow: "Connect With Us",
  title: "Get in touch",
  intro:
    "Send us your garments sourcing specs, fabric needs, or trims inquiry and receive details within 24 hours.",
  cards: [
    { label: "Call / WhatsApp", value: site.phone, href: `tel:${site.phoneHref}` },
    { label: "E-mail address", value: site.email, href: `mailto:${site.email}` },
    { label: "Office address", value: site.address.full, href: site.address.mapUrl },
  ],
  subjects: [
    "Trims & Accessories Division",
    "Fabrics Division",
    "Garments Sourcing / Buying House",
    "Other Inquiry",
  ],
};

export const footerBlurb =
  "A premier garments buying house and single-window partner for premium trims, accessories, and fabrics in Bangladesh.";
