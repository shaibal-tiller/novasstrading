// ---------------------------------------------------------------------------
// Nova SS Trading — single source of truth for site content.
// Edit copy here; components read from this file.
// Source documents: template.pdf (company profile) + Products.zip content.
// ---------------------------------------------------------------------------

export const site = {
  name: "Nova SS Trading",
  legalName: "Nova SS Trading",
  tagline: "Garments Buying House — Bangladesh",
  url: "https://www.novasstrading.com",
  description:
    "Nova SS Trading is a leading garments buying house in Bangladesh, sourcing high-quality knitwear, woven, sweaters, accessories & home textile from trusted manufacturers for retailers and wholesalers worldwide.",
  email: "info@novasstrading.com",
  phone: "+880 1683-809975",
  phoneHref: "+8801683809975",
  // wa.me requires the number in international format, digits only.
  whatsapp: "8801683809975",
  whatsappUrl:
    "https://wa.me/8801683809975?text=Hello%20Nova%20SS%20Trading%2C%20I%20would%20like%20to%20enquire%20about%20your%20garments%20sourcing%20services.",
  address: {
    street: "Road #5, House No #357, Baridhara DOHS",
    city: "Dhaka",
    postalCode: "1206",
    country: "Bangladesh",
    full: "Baridhara DOHS, Road #5, House No #357, Dhaka, Bangladesh",
    mapUrl: "https://maps.app.goo.gl/Gh1gSDdGhawUp8HN7",
  },
  social: {
    linkedin: "https://www.linkedin.com/company/nova-ss-trading/",
  },
} as const;

export const nav = [
  { label: "About", href: "#about" },
  { label: "Values", href: "#values" },
  { label: "Products", href: "#products" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Services", href: "#sourcing" },
  { label: "Process", href: "#process" },
  { label: "Divisions", href: "#divisions" },
  { label: "Contact", href: "#contact" },
] as const;

export const hero = {
  eyebrow: "Bangladesh's Premier Garments Buying House",
  companyName: "Nova SS Trading",
  tagline: "Where Quality Meets Global Fashion.",
  body: "We source from trusted manufacturers in Bangladesh and deliver to retailers and wholesalers worldwide — superior-quality garments at competitive prices, with the highest standards of professionalism and ethics.",
  primaryCta: { label: "Explore our products", href: "#products" },
  secondaryCta: { label: "Our services", href: "#sourcing" },
  stats: [
    { v: "5", l: "Core product ranges" },
    { v: "8", l: "Stage working process" },
    { v: "24h", l: "Inquiry response" },
  ],
};

export const about = {
  eyebrow: "About Nova SS Trading",
  title: "A trusted garments buying house in Bangladesh",
  body: [
    "Nova SS Trading is a leading garments buying house specialising in sourcing high-quality garments from manufacturers and delivering them to retailers and wholesalers. Our experienced team is dedicated to providing the best service to our clients — delivering superior-quality garments at competitive prices while maintaining the highest standards of professionalism and ethics.",
    "We work with all kinds of garments and apparel across a product range of knitwear, woven, sweaters, accessories and home textile — always following the buyer's requirement. Acting as the bridge between international buyers and reliable local manufacturers, our team manages design, sampling, production monitoring and shipment support for a smooth, single-window experience.",
  ],
  highlights: [
    "Knitwear, woven, sweaters, accessories & home textile",
    "Experienced merchandising, QA & production follow-up team",
    "Transparency, professionalism and on-time delivery",
  ],
  mission: {
    title: "Our Mission",
    body: "To deliver world-class clothing solutions by connecting global buyers with dependable Bangladeshi manufacturers — ensuring quality, ethical practice and timely delivery while growing long-term partnerships built on trust and transparency.",
  },
  vision: {
    title: "Our Vision",
    body: "To be a leading global buying house from Bangladesh, known for innovation, sustainability and excellence in apparel sourcing — empowering clients with a competitive edge while promoting ethical growth across the textile and garment sector.",
  },
};

export const coreValues = {
  eyebrow: "Our Compass",
  title: "Core business values",
  intro:
    "At Nova SS Trading, we believe in shaping a better tomorrow. Quality, trust and timely delivery define our commitment, while innovation and sustainability guide the journey ahead.",
  values: [
    {
      title: "Integrity",
      body: "Honesty and transparency in every dealing.",
    },
    {
      title: "Quality Excellence",
      body: "Delivering superior products and services is our priority.",
    },
    {
      title: "Customer Focus",
      body: "Understanding and exceeding client expectations.",
    },
    {
      title: "Collaboration",
      body: "Strong teamwork with partners, clients and employees.",
    },
    {
      title: "Innovation",
      body: "Embracing creativity and new ideas in sourcing and production.",
    },
    {
      title: "Sustainability",
      body: "Promoting ethical practices and eco-friendly solutions.",
    },
    {
      title: "Reliability",
      body: "On-time delivery and dependable service, every time.",
    },
    {
      title: "Continuous Improvement",
      body: "Constantly refining our processes, skills and performance.",
    },
  ],
};

export const whyUs = {
  eyebrow: "Why Choose Us",
  title: "Reliable apparel sourcing, end to end",
  intro:
    "We provide reliable, high-quality apparel sourcing with a focus on timely delivery, ethical practice and long-term client satisfaction — offering seamless production, sourcing and export support for global buyers.",
  reasons: [
    {
      title: "Trusted Supplier Network",
      body: "Strong partnerships with leading garment factories for reliable sourcing and high-quality products.",
    },
    {
      title: "Strict Quality Control",
      body: "Every product passes rigorous inspection to meet international standards and buyer expectations.",
    },
    {
      title: "On-Time Delivery",
      body: "We prioritise punctuality and deliver every order within the agreed timeline.",
    },
    {
      title: "Custom & Private Label",
      body: "Tailored products and packaging to client specification, supporting your brand identity.",
    },
    {
      title: "Professional Team",
      body: "Experienced experts who manage sourcing, production and export efficiently.",
    },
    {
      title: "Sustainability & Ethics",
      body: "A firm commitment to ethical sourcing and eco-friendly manufacturing.",
    },
  ],
};

export const products = {
  eyebrow: "Our Product Range",
  title: "Five core ranges, every buyer requirement",
  intro:
    "We work with all kinds of garments and apparel — knitwear, woven, sweaters, accessories & home textile — always built to the buyer's requirement.",
  items: [
    {
      title: "Knitwear",
      body: "T-shirts, polos, hoodies, sweatshirts and full knit programs for women, men and kids.",
      image: "products/categories/knitwear-1.jpg",
      alt: "Knitwear — fine-gauge knitted top",
    },
    {
      title: "Woven",
      body: "Shirts, trousers, denim, jackets and outerwear developed in trusted woven factories.",
      image: "products/categories/denim-1.jpg",
      alt: "Woven & denim garments",
    },
    {
      title: "Sweaters",
      body: "Pullovers, cardigans, turtlenecks and heavy-gauge winter knits across all yarn counts.",
      image: "products/men/men-turtleneck-sweater-grey.jpg",
      alt: "Grey turtleneck sweater, front and back",
    },
    {
      title: "Accessories",
      body: "Fashion accessories plus complete trims support — labels, tags, buttons, zippers and packaging.",
      image: "trims-accessories-flat-lay.png",
      alt: "Flat-lay of garment accessories and trims",
    },
    {
      title: "Home Textile",
      body: "Bedding, towels, kitchen linen and woven home-textile programs to buyer specification.",
      image: "stacked-premium-fabric-rolls.png",
      alt: "Stacked rolls of home-textile fabrics",
    },
  ],
};

export const portfolio = {
  eyebrow: "Sourcing Portfolio",
  title: "Women, Men & Kids — every category covered",
  intro:
    "Across our factory network we produce all major clothing categories to Western retail standards. A snapshot of recent developments and production follows.",
  tabs: [
    {
      key: "woman",
      label: "Women",
      categories: [
        "Dresses",
        "T-Shirts | Sweatshirts",
        "Shirts",
        "Tops | Bodies",
        "Shorts | Skorts",
        "Trousers",
        "Jeans",
        "Skirts",
        "Knitwear",
        "Jackets | Blazers",
        "Cardigans | Jumpers",
      ],
      photos: [
        { src: "products/categories/womenswear-1.jpg", alt: "Womenswear — tailored co-ord set" },
        { src: "products/categories/womenswear-2.jpg", alt: "Womenswear — navy blazer over white blouse" },
        { src: "products/categories/denim-1.jpg", alt: "Womenswear — washed denim romper" },
        { src: "products/categories/knitwear-1.jpg", alt: "Womenswear — red open-knit jumper" },
        { src: "products/categories/activewear-1.jpg", alt: "Womenswear — activewear leggings and top" },
        { src: "products/categories/sleepwear-2.jpg", alt: "Womenswear — printed pyjama set" },
      ],
    },
    {
      key: "man",
      label: "Men",
      categories: [
        "Linen",
        "T-Shirts",
        "Shirts",
        "Shorts | Jorts",
        "Trousers",
        "Jeans",
        "Summer Knits",
        "Summer Shirts",
        "Polo Shirts",
        "Swimwear",
        "Jackets | Coats",
        "Leather",
        "Sweaters | Cardigans",
        "Hoodies | Sweatshirts",
        "Suits",
        "Matching Sets",
        "Overshirts | Blazers",
        "Wintery Garments",
      ],
      photos: [
        { src: "products/men/men-hooded-puffer-olive-black.jpg", alt: "Menswear — olive & black hooded puffer jacket" },
        { src: "products/men/men-quilted-puffer-jacket-black.jpg", alt: "Menswear — black quilted puffer jacket" },
        { src: "products/men/men-hybrid-softshell-jacket-black.jpg", alt: "Menswear — black hybrid softshell jacket" },
        { src: "products/men/men-track-jacket-olive.jpg", alt: "Menswear — olive zip-through track jacket" },
        { src: "products/men/men-quilted-hybrid-jacket-black.jpg", alt: "Menswear — quilted hybrid jacket" },
        { src: "products/men/men-puffer-jacket-black-slim.jpg", alt: "Menswear — slim black puffer jacket" },
        { src: "products/men/men-hooded-puffer-olive-mannequin.jpg", alt: "Menswear — hooded puffer on mannequin" },
        { src: "products/men/men-crew-tshirts-grey.jpg", alt: "Menswear — grey crew-neck t-shirts, front & back" },
        { src: "products/men/men-polo-shirt-beige.jpg", alt: "Menswear — beige polo shirt, front & back" },
        { src: "products/men/men-turtleneck-sweater-grey.jpg", alt: "Menswear — grey turtleneck sweater" },
        { src: "products/men/men-vneck-sweater-grey.jpg", alt: "Menswear — grey v-neck sweater" },
        { src: "products/men/men-half-zip-sweater-cream.jpg", alt: "Menswear — cream half-zip sweater" },
        { src: "products/men/men-henley-tshirt-brown.jpg", alt: "Menswear — brown henley t-shirt" },
        { src: "products/men/men-turtleneck-sweater-charcoal.jpg", alt: "Menswear — charcoal turtleneck sweater" },
      ],
    },
    {
      key: "kids",
      label: "Kids",
      categories: [
        "Dresses | Dungarees | Rompers",
        "T-Shirts",
        "Shirts",
        "Bodysuits",
        "Sweatshirts",
        "Briefs | Bermuda Shorts",
        "Trousers | Leggings",
        "Coats | One-Piece Suits",
        "Knitwear",
        "Shoes | Bags",
        "Underwear | Pyjamas",
        "Accessories",
      ],
      photos: [
        { src: "products/kids/kids-striped-dungaree-yellow.jpg", alt: "Kidswear — yellow striped jersey dungaree" },
        { src: "products/kids/kids-strawberry-frill-romper.jpg", alt: "Kidswear — strawberry-print frill romper" },
        { src: "products/kids/kids-car-print-tshirt-green.jpg", alt: "Kidswear — green adventure-car print t-shirt" },
        { src: "products/kids/kids-jungle-print-sleepsuit-red.jpg", alt: "Kidswear — red jungle-print footed sleepsuit" },
        { src: "products/kids/kids-star-print-sleepsuit.jpg", alt: "Kidswear — star-print sleepsuit" },
        { src: "products/kids/kids-floral-sleepsuit-pink.jpg", alt: "Kidswear — pink floral sleepsuit" },
        { src: "products/kids/kids-bodysuit-mauve.jpg", alt: "Kidswear — mauve long-sleeve bodysuit" },
        { src: "products/kids/kids-car-graphic-tshirt-orange.jpg", alt: "Kidswear — orange car graphic t-shirt" },
        { src: "products/kids/kids-dungaree-dress-beige.jpg", alt: "Kidswear — beige twill dungaree dress" },
        { src: "products/kids/kids-animal-print-tshirt.jpg", alt: "Kidswear — safari animal print t-shirt" },
        { src: "products/kids/kids-pocket-print-tshirt-blue.jpg", alt: "Kidswear — light blue pocket-print t-shirt" },
        { src: "products/kids/kids-tie-dye-tshirt-orange.jpg", alt: "Kidswear — orange tie-dye graphic t-shirt" },
        { src: "products/kids/kids-skater-graphic-tshirt-teal.jpg", alt: "Kidswear — teal skater graphic t-shirt" },
        { src: "products/kids/kids-teddy-graphic-tshirt-red.jpg", alt: "Kidswear — red teddy graphic t-shirt" },
        { src: "products/kids/kids-dino-graphic-tshirt-navy.jpg", alt: "Kidswear — navy dinosaur graphic t-shirt" },
        { src: "products/kids/kids-yacht-club-tshirt-green.jpg", alt: "Kidswear — green yacht-club print t-shirt" },
      ],
    },
  ],
  extra: {
    label: "Also covering",
    items: ["Activewear", "Sleepwear", "Denim", "Knitwear", "Lingerie", "Jackets & Outerwear"],
  },
};

export const divisions = {
  eyebrow: "Our Divisions",
  title: "Trims, accessories & fabrics divisions",
  intro:
    "Alongside our core garments buying-house operations, two specialised supply divisions give buyers a complete single-window source for trims, accessories and fabrics.",
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
  eyebrow: "Our Services",
  title: "End-to-end buying house services",
  intro:
    "We also can ensure you various aspects to meet your manufacturing need according to your requirements.",
  pillars: [
    {
      title: "Quick Service",
      icon: "clock",
      body: "Rapid response times and fast turnaround at every stage of the sourcing process.",
    },
    {
      title: "Strongest Quality",
      icon: "thumb",
      body: "Rigorous quality checks ensure every garment meets international retail standards.",
    },
    {
      title: "Communication",
      icon: "check",
      body: "Transparent, proactive updates keep buyers informed at every production milestone.",
    },
    {
      title: "Problem Solving",
      icon: "gear",
      body: "Our experienced team resolves sourcing, production and logistics challenges efficiently.",
    },
  ],
  // All eight services are the client's own (template.pdf, "Our Services").
  // Bodies are kept to a single tight line so the grid sits beside the
  // checklist on one screen.
  services: [
    {
      title: "Product Sourcing",
      body: "Direct access to Bangladesh's finest factories — premium fabrics, on-trend design, competitive pricing.",
    },
    {
      title: "Sampling & Development",
      body: "Accurate samples built with the factory, refined until design, fit and fabric are right.",
    },
    {
      title: "Production Monitoring",
      body: "Supervision from cutting to finishing — fewer defects, delivery dates protected.",
    },
    {
      title: "Compliance & Ethics",
      body: "Only factories with safe conditions, fair labour and environmental responsibility.",
    },
    {
      title: "Shipment & Export",
      body: "Packing, logistics, documentation and customs handled through to global delivery.",
    },
    {
      title: "Custom & Private Label",
      body: "Bespoke design, branding and private-label programmes for distinctive collections.",
    },
    {
      title: "Trend & Market Insight",
      body: "Fashion-trend updates and competitive analysis to keep your sourcing ahead.",
    },
    {
      title: "After-Sales Support",
      body: "Responsive aftercare, quick issue resolution and continuous improvement.",
    },
  ],
  checklistLabel: "We also ensure",
  checklist: [
    "Factory Evaluation",
    "Fully Compliant Manufacturing Units",
    "Merchandising & Daily Production Follow-Up",
    "Product Analysis",
    "Raw Materials Sourcing",
    "Fabric Sourcing & Quality Testing",
    "Bulk Production & Quality Monitoring",
    "In-Line Checks",
    "Initial Production Checks",
    "In-House Materials",
  ],
};

export const process = {
  eyebrow: "How We Work",
  title: "Our working process",
  intro:
    "Six transparent stages — from sourcing to shipment — ensuring every order meets our clients' requirements.",
  steps: [
    {
      n: "01",
      icon: "sourcing",
      title: "Sourcing",
      body: "We have a network of trusted manufacturers from whom we source high-quality garments that meet our clients' requirements.",
    },
    {
      n: "02",
      icon: "quality",
      title: "Quality Control",
      body: "Our experienced quality control team ensures that all garments meet the required standards before shipping.",
    },
    {
      n: "03",
      icon: "design",
      title: "Design and Development",
      body: "We have a team of experienced designers who can help clients develop new designs or modify existing ones.",
    },
    {
      n: "04",
      icon: "compliance",
      title: "Compliance",
      body: "We ensure that all manufacturers we work with comply with international labour laws and ethical standards. Most of our factories are Oekotex and BSCI Certified.",
    },
    {
      n: "05",
      icon: "packing",
      title: "Packing",
      body: "Only approved goods are packed and the buyer is assured of receiving quality merchandise. All packing instructions of the buyer are fully respected.",
    },
    {
      n: "06",
      icon: "shipment",
      title: "Shipment / Cargo Handling",
      body: "All shipping documents are reviewed and verified as per the buyer's instruction. Cargo is handled by a reputable forwarder, ensuring correct ETD and ETA of vessels — because on-time delivery is as important to us as it is to the buyer.",
    },
  ],
};

export const compliance = {
  eyebrow: "Standards & Integrity",
  title: "Quality assurance & compliance",
  intro:
    "We enforce strict quality protocols and ethical standards across all manufacturing partners.",
  protocolTitle: "Our quality assurance protocol",
  protocolBody: [
    "At Nova SS Trading, quality sits at the heart of everything we do. Every order follows a strict quality-assurance protocol so that each garment meets international benchmarks and buyer expectations.",
    "Our experienced in-house QA officers inspect raw materials, supervise cutting and stitching tables, and perform inspections prior to any third-party inspection (SGS, Intertek, and others).",
  ],
  checks: [
    {
      title: "Material Inspection",
      body: "Thorough checking of raw yarns, fabrics, and trims.",
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
    { name: "BGMEA", detail: "Bangladesh Garment Manufacturers & Exporters Association", src: "logos/member-1.png" },
    { name: "DCCI", detail: "Dhaka Chamber of Commerce & Industry", src: "logos/member-2.png" },
    { name: "BGBA", detail: "Bangladesh Garments Buying House Association", src: "logos/member-3.png" },
  ],
  footnote:
    "Nova SS Trading partners only with factories that uphold safe working conditions, fair labour practices and environmental responsibility — safeguarding both factory workers and retail consumers worldwide.",
};

export const profiles = {
  eyebrow: "Official Documents",
  title: "Our company profile",
  intro:
    "Download our official corporate profile to explore our product range, services and working process.",
  documents: [
    {
      title: "Corporate Company Profile",
      body: "Complete overview of our garments buying-house operations — product range, services, working process, portfolio and memberships.",
      href: "/company-profile/NOVA_SS_TRADING_Company_Profile.pdf",
    },
  ],
};

export const partners = {
  eyebrow: "Our Clients",
  title: "Brands & retailers we serve",
  intro:
    "We are trusted by international brands and retailers across the apparel value chain.",
  logos: [
    { name: "LPP", src: "logos/client-1.png" },
    { name: "CATO", src: "logos/client-2.png" },
    { name: "Jeunesse", src: "logos/client-3.png" },
  ],
  memberships: [
    { name: "BGMEA", src: "logos/member-1.png" },
    { name: "DCCI", src: "logos/member-2.png" },
    { name: "BGBA", src: "logos/member-3.png" },
  ],
};

export const contact = {
  eyebrow: "Connect With Us",
  title: "Get in touch",
  intro:
    "Send us your garments sourcing specs, tech packs, or product inquiry and receive details within 24 hours.",
  cards: [
    { label: "Call us", value: site.phone, href: `tel:${site.phoneHref}` },
    { label: "WhatsApp", value: site.phone, href: site.whatsappUrl },
    { label: "E-mail address", value: site.email, href: `mailto:${site.email}` },
    { label: "Office address", value: site.address.full, href: site.address.mapUrl },
  ],
  subjects: [
    "Knitwear / Woven / Sweaters",
    "Accessories & Home Textile",
    "Trims & Fabrics Divisions",
    "Other Inquiry",
  ],
};

export const footerBlurb =
  "A leading garments buying house in Bangladesh — sourcing high-quality knitwear, woven, sweaters, accessories & home textile for retailers and wholesalers worldwide.";
