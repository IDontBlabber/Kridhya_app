// MOCKUP CATALOGUE
// Names and prices follow the old site. Items with `soon: true` have no photograph yet (stand-in satin image).
// Every image is a temporary placeholder until VK's final photography arrives.

const p = (file) => `/images/products/${file}.webp`
const e = (file) => `/images/editorial/${file}.webp`
const g = (file) => `/images/generated/${file}.webp`

// Collection names, blurbs and product names/prices follow the old site (kridhyabydevanshi.com).
// `collection: true` = shown on the Collections page, home and footer. Set it to false to keep a category as a shop filter only.
export const CATEGORIES = [
  { slug: 'pendants', name: 'Pendants', collection: true, blurb: 'Infinity pendants and charms on fine gold-plated chains.', cover: p('padmaraga-dbd399bc') },
  { slug: 'earrings', name: 'Earrings', collection: true, blurb: 'Drops, studs and climbers for every day.', cover: p('ashta-studa-14d0b223') },
  { slug: 'bracelets', name: 'Bracelets', collection: true, blurb: 'Cuffs and slim bracelets, hand-set and gold-plated.', cover: p('ananta-gulabi-914b1b68') },
  { slug: 'rings', name: 'Rings', collection: true, blurb: 'Stacking and statement rings in gold-plated finishes.', cover: p('layered-eternity-336df71a') },
  { slug: 'necklaces', name: 'Necklaces', collection: true, blurb: 'Layered strands and heart-and-infinity necklaces.', cover: e('heart-necklace-gold-satin') },
  { slug: 'brooches', name: 'Brooches', collection: true, blurb: 'A finishing flourish for sarees, blazers and shawls.', cover: p('infinity-brooch-99dfbe5a') },
]
export const COLLECTIONS = CATEGORIES.filter((c) => c.collection)

const base = (o) => ({ priceStatus: 'listed', placeholder: true, finishes: ['Gold'], ...o })

export const PRODUCTS = [
  base({
    slug: 'infinity-heart-necklace', name: 'Infinity Heart Necklace', category: 'necklaces', price: 4200,
    finishes: ['Gold', 'Rose Gold', 'Silver'], badge: 'Bestseller',
    images: [p('infinity-heart-necklace-a83d0c09'), e('heart-necklace-gold-satin'), p('infinity-heart-necklace-29cfc86d'), p('infinity-heart-necklace-e5353036')],
    short: 'A pavé heart entwined with an infinity loop on a fine adjustable chain.',
  }),
  base({
    slug: 'double-strand-infinity-necklace', name: 'Double Strand Infinity Necklace', category: 'necklaces', price: 5600,
    finishes: ['Gold', 'Rose Gold', 'Silver'], badge: 'New',
    images: [e('double-strand-gold-satin'), p('double-strand-infinity-necklace-a87280cc'), e('double-strand-rose-satin'), p('double-strand-infinity-necklace-31169cda')],
    short: 'Two delicate strands — a solitaire drop above, an infinity drop below.',
  }),
  base({
    slug: 'eternal-love-infinity-necklace', name: 'Eternal Love Infinity Necklace', category: 'necklaces', price: 4800,
    finishes: ['Gold', 'Rose Gold', 'Silver'],
    images: [e('lariat-gold-satin'), p('eternal-love-infinity-necklace-77f49dad'), e('lariat-rose-satin'), e('lariat-silver-satin')],
    short: 'A Y-lariat finished with an infinity knot and a tiny heart drop.',
  }),
  base({
    slug: 'the-lemniscate', name: 'The lemniscate', category: 'pendants', price: 5600,
    images: [p('the-lemniscate-5dd8e835'), p('the-lemniscate-8c35dd3d')],
    short: 'An open infinity link suspending a blush pear-cut drop.',
  }),
  base({
    slug: 'padmaraga', name: 'Padmarāga', category: 'pendants', price: 4100,
    finishes: ['Rose Gold', 'Gold', 'Silver'], badge: 'New',
    images: [p('padmaraga-dbd399bc'), p('padmaraga-ed357230'), p('padmaraga-21637905')],
    short: 'A sparkling crown setting above a peach-toned pear drop.',
  }),
  base({
    slug: 'ashta', name: 'Ashta', category: 'pendants', price: 5750,
    images: [p('ashta-4ef671e9'), p('ashta-a0153cdb')],
    short: 'A sculpted figure-eight pendant on a whisper-fine chain.',
  }),
  base({
    slug: 'granthi', name: 'Granthi', category: 'pendants', price: 5100,
    finishes: ['Silver'],
    images: [p('granthi-78bcb8aa'), p('granthi-detail')],
    short: 'A softly knotted loop — simple, symbolic, everyday.',
  }),
  base({
    slug: 'sandhya', name: 'Sandhyā', category: 'pendants', price: 5600,
    images: [p('sandhya-055169bf'), p('sandhya-detail')],
    short: 'An infinity bar with a petite blush drop, like dusk light.',
  }),
  base({
    slug: 'ashta-studs', name: 'Ashtā studs', category: 'earrings', price: 4200,
    finishes: ['Gold', 'Silver'], badge: 'Bestseller',
    images: [p('ashta-studa-14d0b223'), p('ashta-studa-ff8ef6aa'), p('ashta-studa-0510a271')],
    short: 'Figure-eight studs cradling a faceted peach pear stone.',
  }),
  base({
    slug: 'bindu', name: 'Bindu', category: 'earrings', price: 2600,
    finishes: ['Rose Gold', 'Silver', 'Gold'],
    images: [p('bindu-246a05b3'), p('bindu-4ca2503a'), p('bindu-7017036c')],
    short: 'Infinity studs with a single centre sparkle.',
  }),
  base({
    slug: 'sandhya-studs', name: 'Sandhyā Studs', category: 'earrings', price: 2600,
    finishes: ['Rose Gold'],
    images: [p('sandhya-studs-2a48f163'), p('sandhya-studs-detail')],
    short: 'Rose-toned infinity studs with a blush drop.',
  }),
  base({
    slug: 'dipa', name: 'Dipā', category: 'earrings', price: 4150,
    images: [p('dipa-ef310d0b'), p('dipa-detail')],
    short: 'Elongated flame-shaped drops with a glowing peach stone.',
  }),
  base({
    slug: 'granthi-drops', name: 'Granthi drops', category: 'earrings', price: 3750,
    images: [p('granthi-drops-6461b56d'), p('granthi-drops-detail')],
    short: 'Twin knotted loops finished with pink pear drops.',
  }),
  base({
    slug: 'gulal', name: 'Gulāl', category: 'earrings', price: 2600,
    finishes: ['Silver'], badge: 'Statement',
    images: [p('gulal-9fea571a'), p('gulal-detail')],
    short: 'Hoop-hung drops with a rich magenta bezel-set stone.',
  }),
  base({
    slug: 'ananta-gulabi', name: 'Ananta Gulābi', category: 'bracelets', price: 11500,
    finishes: ['Rose Gold', 'Gold'], badge: 'Bestseller',
    images: [p('ananta-gulabi-914b1b68'), p('ananta-gulabi-088b7222'), p('ananta-gulabi-25d3bc55')],
    short: 'An open infinity cuff traced with rose-pink stones.',
  }),
  base({
    slug: 'ananta-nilam', name: 'Ananta Nīlam', category: 'bracelets', price: 11500,
    finishes: ['Silver'],
    images: [p('ananta-nilam-23dc2088'), p('ananta-nilam-c41abf25')],
    short: 'The Ananta silhouette in silver with deep blue stones.',
  }),
  base({
    slug: 'blue-eye-infinity-bracelet', name: 'Blue Eye Infinity Bracelet', category: 'bracelets', price: 6500,
    images: [p('blue-eye-infinity-bracelet-63910e4b'), p('blue-eye-infinity-bracelet-detail')],
    short: 'A protective evil-eye charm set into a sparkling infinity cuff.',
  }),
  base({
    slug: 'double-loop-bracelet', name: 'Double Loop Bracelet', category: 'bracelets', price: 6850,
    images: [p('double-loop-ad-bracelet-3d7e9793'), p('double-loop-bracelet-detail')],
    short: 'Interlocking pavé loops on a fine chain.',
  }),
  base({
    slug: 'bindu-cuff', name: 'Bindu Cuff', category: 'bracelets', price: 14750,
    finishes: ['Rose Gold'], badge: 'New',
    images: [p('bindu-cuff-f7658393'), p('bindu-cuff-detail')],
    short: 'A crossover cuff meeting at a sparkling infinity centre.',
  }),
  base({
    slug: 'layered-eternity', name: 'Layered eternity', category: 'rings', price: 5100,
    finishes: ['Silver', 'Rose Gold'],
    images: [p('layered-eternity-336df71a'), p('layered-eternity-detail')],
    short: 'Stacked eternity bands in two tones, worn as one.',
  }),
  base({
    slug: 'infinity-brooch', name: 'Infinity brooch', category: 'brooches', price: 4100,
    finishes: ['Rose Gold', 'Silver'],
    images: [p('infinity-brooch-99dfbe5a'), p('infinity-brooch-faff9bb7')],
    short: 'A sculptural infinity with a channel of sparkle.',
  }),
  base({
    slug: 'lemniscate-brooch', name: 'Lemniscate brooch', category: 'brooches', price: 3100,
    finishes: ['Silver', 'Gold'],
    images: [p('lemniscate-brooch-0b7273f4'), p('lemniscate-brooch-a1509eda')],
    short: 'A clean, polished infinity pin with a pavé crossing.',
  }),
  base({
    slug: 'infinity-pearl-pendant', name: 'Infinity Pearl Pendant', category: 'pendants', price: 3500,
    images: [p('knotted-pendant-51b5fb79'), p('infinity-pearl-pendant-detail')],
    short: 'An infinity pendant on a fine gold-plated chain.',
  }),
  base({
    slug: 'leaf-infinity-pendant', name: 'Leaf Infinity Pendant', category: 'pendants', price: 3500,
    images: [e('necklace-closeup'), p('leaf-infinity-pendant-detail')],
    short: 'An infinity pendant with a delicate leaf motif on a fine chain.',
  }),
  base({
    slug: 'lila', name: 'Līlā', category: 'pendants', price: 5200,
    images: [p('ashta-a0153cdb'), p('lila-detail')],
    short: 'An infinity pendant worn close, on a fine gold-plated chain.',
  }),
  base({
    slug: 'orbit-drops', name: 'Orbit drops', category: 'earrings', price: 3500,
    images: [p('gulal-9fea571a'), p('orbit-drops-detail')],
    short: 'Drop earrings with orbiting loops, made for every day.',
  }),
  base({
    slug: 'sangam', name: 'Saṅgam', category: 'bracelets', price: 14100,
    images: [p('double-loop-ad-bracelet-3d7e9793'), p('sangam-detail')],
    short: 'Interlocking loops on a slim, hand-set gold-plated bracelet.',
  }),
  base({
    slug: 'double-infinity-ring', name: 'Double Infinity Ring', category: 'rings', price: 3100,
    images: [p('bindu-cuff-f7658393'), p('double-infinity-ring-detail')],
    short: 'Two infinity loops crossing on a gold-plated band.',
  }),
  base({
    slug: 'eternal-loop', name: 'Eternal loop', category: 'rings', price: 4750,
    images: [p('layered-eternity-336df71a'), p('eternal-loop-detail')],
    short: 'A stacking ring with an endless loop of stones.',
  }),
  base({
    slug: 'eternal-promise', name: 'Eternal promise', category: 'rings', price: 4200,
    images: [e('ring-still-life'), p('eternal-promise-detail')],
    short: 'A statement ring in a gold-plated finish.',
  }),
  base({
    slug: 'scattered-ring', name: 'Scattered Ring', category: 'rings', price: 3100,
    images: [e('collection-still-life'), p('scattered-ring-detail')],
    short: 'A stacking ring with scattered stone detail.',
  }),
]

export const getProduct = (slug) => PRODUCTS.find((x) => x.slug === slug)
export const getCategory = (slug) => CATEGORIES.find((c) => c.slug === slug)
export const byCategory = (slug) => PRODUCTS.filter((x) => x.category === slug)

// "Jewellery Highlights" (Home). Hand-picked pieces; the first is shown large. Edit slugs / lines here.
export const HIGHLIGHTS = [
  { slug: 'infinity-heart-necklace', tag: 'Bestseller', line: 'A pavé heart held in an endless loop — the piece most often chosen as a gift.' },
  { slug: 'double-strand-infinity-necklace', tag: 'New', line: 'Two fine strands, one quiet statement.' },
  { slug: 'ananta-gulabi', tag: 'Cuff', line: 'Rose-pink stones traced along an open infinity.' },
  { slug: 'ashta-studs', tag: 'Everyday studs', line: 'Figure-eight studs with a peach pear stone.' },
  { slug: 'gulal', tag: 'Statement', line: 'A magenta bezel stone for the evenings.' },
]
