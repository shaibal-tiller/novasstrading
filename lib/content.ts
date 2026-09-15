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
    "Nova SS Trading is a leading garments buying house in Bangladesh, sourcing high-quality knitwear, woven, sweaters, lingerie & accessories from trusted manufacturers for retailers and wholesalers worldwide.",
  email: "info@novasstrading.com",
  phone: "+880 1351-153898",
  phoneHref: "+8801351153898",
  // wa.me requires the number in international format, digits only.
  whatsapp: "8801351153898",
  whatsappUrl:
    "https://wa.me/8801351153898?text=Hello%20Nova%20SS%20Trading%2C%20I%20would%20like%20to%20enquire%20about%20your%20garments%20sourcing%20services.",
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
    "We work with all kinds of garments and apparel across a product range of knitwear, woven, sweaters, lingerie and accessories — always following the buyer's requirement. Acting as the bridge between international buyers and reliable local manufacturers, our team manages design, sampling, production monitoring and shipment support for a smooth, single-window experience.",
  ],
  highlights: [
    "Knitwear, woven, sweaters, lingerie & accessories",
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
    "We work with all kinds of garments and apparel — knitwear, woven, sweaters, lingerie & accessories — always built to the buyer's requirement.",
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
      image: "products/men/men-charcoal-crew-neck-sweater.png",
      alt: "Charcoal crew-neck sweater",
    },
    {
      title: "Lingerie",
      body: "Bras, bralettes and lace-trim intimates developed across a full range of colourways and constructions.",
      image: "products/lingerie/lingerie-black-smooth-bra.png",
      alt: "Lingerie — black smooth bra",
    },
    {
      title: "Accessories",
      body: "Fashion accessories plus complete trims support — labels, tags, buttons, zippers and packaging.",
      image: "trims-accessories-flat-lay.jpg",
      alt: "Flat-lay of garment accessories and trims",
    },
  ],
};

type PortfolioPhoto = { src: string; alt: string; detail?: string[] };
type PortfolioTab = {
  key: string;
  label: string;
  categories: string[];
  photos: PortfolioPhoto[];
};

export const portfolio = {
  eyebrow: "Sourcing Portfolio",
  title: "Women, Men, Kids & Lingerie — every category covered",
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
        { src: "products/women/women-striped-midi-dress.jpg", alt: "Womenswear — multicolour striped midi dress" },
        { src: "products/women/women-crossover-waist-jeans-blue.jpg", alt: "Womenswear — crossover-waist wide-leg jeans" },
        { src: "products/women/women-striped-batwing-top-navy.jpg", alt: "Womenswear — navy striped batwing top" },
        { src: "products/women/women-skinny-jeans-black.jpg", alt: "Womenswear — black skinny jeans" },
        { src: "products/women/women-bootcut-jeans-black.jpg", alt: "Womenswear — black high-waist bootcut jeans" },
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
        {
          src: "products/men/men-graphic-cotton-blend-tshirt-ivory.png",
          alt: "Menswear — ivory graphic cotton-blend t-shirt",
          detail: ["Composition: 54% BCI cotton, 46% Eco Coolmax", "GSM: 260", "Crew neckline · Short sleeves · Chest and back graphics"],
        },
        {
          src: "products/men/men-tonal-jacquard-tshirt-ivory.png",
          alt: "Menswear — ivory tonal jacquard t-shirt",
          detail: ["Composition: 85% polyester, 15% expanded jacquard cotton", "GSM: 160", "Tonal jacquard pattern · Crew neckline · Short sleeves"],
        },
        {
          src: "products/men/men-contrast-raglan-top.png",
          alt: "Menswear — contrast raglan top",
          detail: ["Composition: 100% cotton", "GSM: 190", "Contrast raglan sleeves · Contrast crew-neck trim · Woven label at hem"],
        },
        {
          src: "products/men/men-striped-long-sleeve-top.png",
          alt: "Menswear — striped long-sleeve top",
          detail: ["Composition: 100% cotton", "GSM: 200", "Horizontal stripe pattern · Crew neckline · Ribbed cuffs"],
        },
        {
          src: "products/men/men-abstract-print-long-sleeve-top.png",
          alt: "Menswear — abstract print long-sleeve top",
          detail: ["Composition: 100% cotton", "GSM: 165", "All-over print · Crew neckline · Long sleeves"],
        },
        {
          src: "products/men/men-regular-fit-check-shirt.png",
          alt: "Menswear — regular fit check shirt",
          detail: ["Composition: 100% cotton", "Regular fit · Width 56 in · Shrinkage 3–5% · GSM 135", "Point collar · Short sleeves · Button-front closure"],
        },
        {
          src: "products/men/men-slim-fit-stripe-shirt-blue.png",
          alt: "Menswear — slim fit blue stripe shirt",
          detail: ["Composition: 100% cotton", "Slim fit · Width 56 in · Shrinkage 2–3% · GSM 162", "Mandarin collar · Chest patch pocket · Curved hem"],
        },
        {
          src: "products/men/men-camp-collar-casual-shirt.png",
          alt: "Menswear — camp collar casual shirt",
          detail: ["Composition: 100% polyester", "Regular fit · Width 56 in · Shrinkage 3–4% · GSM 125", "Revere collar · Full button-front closure · Short sleeves"],
        },
        {
          src: "products/men/men-olive-casual-shirt.png",
          alt: "Menswear — olive casual shirt",
          detail: ["Composition: 68% polyester, 20% cotton, 12% viscose", "Regular fit · Width 56 in · Shrinkage 2–3% · GSM 125", "Point collar · Chest patch pocket · Long sleeves with button cuffs"],
        },
        {
          src: "products/men/men-stretch-tailored-formal-shirt.png",
          alt: "Menswear — stretch tailored formal shirt",
          detail: ["Composition: 97% cotton, 3% elastane", "Tailored fit · Width 56 in · Shrinkage 2–4% · GSM 180", "Classic point collar · Pocket-free front · Centre box pleat at back"],
        },
        {
          src: "products/men/men-yarn-dyed-stripe-shirt.png",
          alt: "Menswear — yarn-dyed stripe shirt",
          detail: ["Composition: 100% cotton", "Regular fit · Width 55 in · Shrinkage 3–4% · GSM 120", "Classic point collar · Pocket-free front · Long sleeves with button cuffs"],
        },
        {
          src: "products/men/men-brushed-plaid-overshirt.png",
          alt: "Menswear — brushed plaid overshirt",
          detail: ["Composition: 65% polyester, 35% cotton", "Brushed plaid fabric · Regular fit · Width 56 in · Shrinkage 4–5% · GSM 400", "Soft brushed hand feel · Full button-front closure · Chest flap pockets"],
        },
        {
          src: "products/men/men-yale-collegiate-sweat-set-top.png",
          alt: "Menswear — Yale collegiate sweatshirt",
          detail: ["Fabrication: 60/40 CVC loop-back terry, 300 gsm", "Raglan sweatshirt sleeves · Ribbed neckline and trims · Drawstring waistband", "Two-piece set"],
        },
        {
          src: "products/men/men-yale-collegiate-sweat-set-trousers.png",
          alt: "Menswear — Yale collegiate sweat trousers",
          detail: ["Fabrication: 60/40 CVC loop-back terry, 300 gsm", "Matching trousers from the two-piece set"],
        },
        {
          src: "products/men/men-harvard-heritage-set-top.png",
          alt: "Menswear — Harvard heritage sweatshirt",
          detail: ["Fabrication: 60/40 CVC loop-back terry, 300 gsm", "Oversized sweatshirt · Coordinated front and leg prints · Elasticated drawstring waist", "Two-piece set"],
        },
        {
          src: "products/men/men-harvard-heritage-set-trousers.png",
          alt: "Menswear — Harvard heritage sweat trousers",
          detail: ["Fabrication: 60/40 CVC loop-back terry, 300 gsm", "Matching trousers from the two-piece set"],
        },
        {
          src: "products/men/men-essential-striped-lounge-set.png",
          alt: "Menswear — essential striped lounge set",
          detail: ["Fabrication: 60% cotton, 40% polyester French terry — top 260 gsm, shorts 200 gsm", "Drop-shoulder T-shirt · Curved-hem shorts · Drawstring waistband", "Two-piece set"],
        },
        {
          src: "products/men/men-abstract-print-lounge-set.png",
          alt: "Menswear — abstract print lounge set",
          detail: ["Fabrication: top 80% PSCP cotton / 20% recycled cotton, shorts 95% cotton / 5% elastane — 160 gsm", "All-over abstract print · Elasticated waistband · Fitted cycling shorts", "Two-piece set"],
        },
        {
          src: "products/men/men-v-neck-knit-vest-blue.png",
          alt: "Menswear — pale blue V-neck knit vest",
          detail: ["Composition: 68% cotton, 32% nylon", "Knitted, ribbed edges · 200g weight, 12GG gauge", "Sleeveless construction · Ribbed neckline and armholes · Ribbed hem"],
        },
        {
          src: "products/men/men-textured-crew-neck-sweater-mustard.png",
          alt: "Menswear — mustard textured crew-neck sweater",
          detail: ["Composition: 70% viscose, 30% nylon", "Basket-weave knit · 352g weight, 12GG gauge"],
        },
        {
          src: "products/men/men-quarter-zip-knit-sweater.png",
          alt: "Menswear — quarter-zip knit sweater",
          detail: ["Composition: 100% cotton", "Knitted · 396g weight, 12GG gauge"],
        },
        {
          src: "products/men/men-blue-textured-crew-neck-sweater.png",
          alt: "Menswear — blue textured crew-neck sweater",
          detail: ["Composition: 100% cotton", "Vertical patterned knit · 366g weight, 12GG gauge"],
        },
        {
          src: "products/men/men-charcoal-crew-neck-sweater.png",
          alt: "Menswear — charcoal crew-neck sweater",
          detail: ["Composition: 100% cotton", "Knitted · 288g weight, 12GG gauge"],
        },
        {
          src: "products/men/men-black-textured-crew-neck-sweater.png",
          alt: "Menswear — black textured crew-neck sweater",
          detail: ["Composition: 100% cotton", "Textured front, plain-knit back · 366g weight, 12GG gauge"],
        },
        {
          src: "products/men/men-olive-open-neck-knit-sweater.png",
          alt: "Menswear — olive open-neck knit sweater",
          detail: ["Composition: 100% cotton", "Textured front, plain-knit sleeves · 366g weight, 12GG gauge"],
        },
        {
          src: "products/men/men-button-neck-knit-sweater.png",
          alt: "Menswear — button-neck knit sweater",
          detail: ["Composition: 100% cotton", "Horizontal textured knit · 408g weight, 12GG gauge"],
        },
        {
          src: "products/men/men-contrast-trim-knit-shirt.png",
          alt: "Menswear — brown contrast-trim knit shirt",
          detail: ["Composition: 100% cotton", "Textured knit · 366g weight, 12GG gauge", "Full button-front opening · Contrast collar and placket · Short sleeves"],
        },
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
        { src: "products/men/men-slim-shirt-black.jpg", alt: "Menswear — black slim-fit shirt" },
        { src: "products/men/men-camp-collar-shirt-ivory.jpg", alt: "Menswear — ivory jacquard camp-collar shirt" },
        { src: "products/men/men-tshirt-graphic-blue.jpg", alt: "Menswear — blue graphic-print t-shirt" },
        { src: "products/men/men-tshirt-graphic-ivory.jpg", alt: "Menswear — ivory embroidered t-shirt" },
        { src: "products/men/men-tshirt-beige.jpg", alt: "Menswear — beige oversized t-shirt" },
        { src: "products/men/men-chino-pants-beige.jpg", alt: "Menswear — beige chino trousers" },
        { src: "products/men/men-cargo-pants-black.jpg", alt: "Menswear — black cargo trousers" },
        { src: "products/men/men-jacquard-tshirt-ivory.jpg", alt: "Menswear — ivory jacquard t-shirt" },
        { src: "products/men/men-flannel-overshirt-check.jpg", alt: "Menswear — check flannel overshirt" },
        { src: "products/men/men-cargo-joggers-charcoal.jpg", alt: "Menswear — charcoal cargo joggers" },
        { src: "products/men/men-ribbed-tank-grey.jpg", alt: "Menswear — grey ribbed tank top" },
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
        {
          src: "products/kids/kids-paris-bow-graphic-top.png",
          alt: "Kidswear — Paris bow graphic top",
          detail: ["Composition: 95% cotton, 5% elastane", "Single jersey · GSM 160–180", "3D fabric bow · Soft mesh print detail · Gold glitter stars"],
        },
        {
          src: "products/kids/kids-cupcake-graphic-top.png",
          alt: "Kidswear — cupcake graphic top",
          detail: ["Composition: to be confirmed", "Single jersey · GSM 180–200", "Sequin cupcake appliqué · Raised silicone dots · Chenille letter patch"],
        },
        {
          src: "products/kids/kids-astronaut-graphic-top.png",
          alt: "Kidswear — astronaut graphic top",
          detail: ["Composition: 100% cotton", "Single jersey · GSM 220–240", "Pigment screen print · Chest placement artwork · Crew neckline"],
        },
        {
          src: "products/kids/kids-monster-print-top.png",
          alt: "Kidswear — monster print top",
          detail: ["Composition: 100% cotton", "Single jersey · GSM 160–180", "Multicolour pigment print · All-over monster motifs · Crew neckline"],
        },
        {
          src: "products/kids/kids-metallic-flower-sweatshirt.png",
          alt: "Kidswear — metallic flower sweatshirt",
          detail: ["Composition: 95% cotton, 5% elastane", "Brushed fleece · GSM 280–300", "3D silver flower appliqué · Multicolour fabric piping · Stepped rib hem"],
        },
        {
          src: "products/kids/kids-ruffle-star-sweatshirt.png",
          alt: "Kidswear — ruffle star sweatshirt",
          detail: ["Composition: 94% cotton, 6% elastane", "French terry · GSM 240–260", "3D star appliqué · Sequin embellishment · Side vents at rib hem"],
        },
        {
          src: "products/kids/kids-monster-pocket-sweatshirt.png",
          alt: "Kidswear — monster pocket sweatshirt",
          detail: ["Composition: 100% cotton", "Brushed single jersey fleece · GSM 280", "Kangaroo pocket · Fabric appliqué · 3D faux fur ears"],
        },
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
    {
      key: "lingerie",
      label: "Lingerie",
      categories: [
        "Bras | Balconette",
        "Bralettes",
        "Push-Up",
        "T-Shirt Bras",
        "Lace & Crochet",
        "Sheer Mesh",
      ],
      photos: [
        {
          src: "products/lingerie/lingerie-cream-lace-bra.png",
          alt: "Lingerie — cream scalloped lace bra",
          detail: ["Composition: 62% polyamide, 18% elastane", "Lace underband", "Non-wired cups · Adjustable straps · Pull-on lace back"],
        },
        {
          src: "products/lingerie/lingerie-ivory-sheer-lace-bra.png",
          alt: "Lingerie — ivory sheer floral lace bra",
          detail: ["Composition: 80% polyamide, 20% elastane", "Sheer floral lace", "Non-padded, underwired cups · Adjustable straps · Hook-and-eye fastening"],
        },
        {
          src: "products/lingerie/lingerie-sage-smooth-molded-bra.png",
          alt: "Lingerie — sage smooth molded bra",
          detail: ["Composition: 97% nylon, 3% polyurethane", "Smooth molded cups, polyester lining", "Lined, padded cups · Underwired support · Adjustable straps"],
        },
        {
          src: "products/lingerie/lingerie-wine-lace-panel-bra.png",
          alt: "Lingerie — wine lace panel bra",
          detail: ["Composition: 82% polyamide, 18% elastane", "Molded cups, lace panels", "Lined, padded cups · Adjustable textured straps · Hook-and-eye fastening"],
        },
        {
          src: "products/lingerie/lingerie-black-smooth-bra.png",
          alt: "Lingerie — black smooth bra",
          detail: ["Composition: 95% polyester, 5% polyamide", "Smooth cups, satin-look wings", "Lined, padded cups · Underwired support · Adjustable straps"],
        },
        { src: "products/lingerie/lingerie-lace-balconette-bra-blush.png", alt: "Lingerie — blush lace balconette bra" },
        { src: "products/lingerie/lingerie-lace-bra-blush-satin.png", alt: "Lingerie — blush satin lace bra" },
        { src: "products/lingerie/lingerie-lace-pushup-bra-nude.png", alt: "Lingerie — nude lace push-up bra" },
        { src: "products/lingerie/lingerie-sheer-lace-bra-peach.png", alt: "Lingerie — peach sheer lace bra" },
        { src: "products/lingerie/lingerie-tshirt-bra-slate-grey.png", alt: "Lingerie — slate grey t-shirt bra" },
        { src: "products/lingerie/lingerie-tshirt-bra-sage-grey.png", alt: "Lingerie — sage grey t-shirt bra" },
        { src: "products/lingerie/lingerie-lace-bra-plum.png", alt: "Lingerie — plum lace bra" },
        { src: "products/lingerie/lingerie-tshirt-bra-mauve.png", alt: "Lingerie — mauve t-shirt bra" },
        { src: "products/lingerie/lingerie-crochet-bralette-cream.png", alt: "Lingerie — cream crochet bralette" },
        { src: "products/lingerie/lingerie-tshirt-bra-sage-green.png", alt: "Lingerie — sage green t-shirt bra" },
        { src: "products/lingerie/lingerie-tshirt-bra-sage-green-racerback.png", alt: "Lingerie — sage green racerback t-shirt bra" },
        { src: "products/lingerie/lingerie-lace-bralette-ivory.jpg", alt: "Lingerie — ivory lace triangle bralette" },
        { src: "products/lingerie/lingerie-lace-bra-black-satin.png", alt: "Lingerie — black satin lace-trim bra" },
        { src: "products/lingerie/lingerie-tshirt-bra-black.png", alt: "Lingerie — black t-shirt bra" },
      ],
    },
  ] as PortfolioTab[],
  extra: {
    label: "Also covering",
    items: ["Activewear", "Sleepwear", "Denim", "Knitwear", "Jackets & Outerwear"],
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
    "Lingerie & Accessories",
    "Trims & Fabrics Divisions",
    "Other Inquiry",
  ],
};

export const footerBlurb =
  "A leading garments buying house in Bangladesh — sourcing high-quality knitwear, woven, sweaters, lingerie & accessories for retailers and wholesalers worldwide.";
