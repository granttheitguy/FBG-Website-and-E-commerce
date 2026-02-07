import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Production guard: prevent accidental seeding in production
    if (process.env.NODE_ENV === 'production') {
        console.error('ERROR: Cannot run seed in production environment. Set NODE_ENV=development to seed.')
        process.exit(1)
    }

    console.log('Starting database seed...')

    // Create Super Admin
    const superAdminPassword = await hash('SuperAdmin@2024', 12)
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@fashionbygrant.com' },
        update: {},
        create: {
            name: 'Super Admin',
            email: 'admin@fashionbygrant.com',
            passwordHash: superAdminPassword,
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
        },
    })
    console.log('Super Admin created:', superAdmin.email)

    // Create sample Admin
    const adminPassword = await hash('Admin@2024', 12)
    const admin = await prisma.user.upsert({
        where: { email: 'grant@fashionbygrant.com' },
        update: {},
        create: {
            name: 'Grant A.',
            email: 'grant@fashionbygrant.com',
            passwordHash: adminPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
        },
    })
    console.log('Admin created:', admin.email)

    // Create sample Staff
    const staffPassword = await hash('Staff@2024', 12)
    const staff = await prisma.user.upsert({
        where: { email: 'staff@fashionbygrant.com' },
        update: {},
        create: {
            name: 'Sarah J.',
            email: 'staff@fashionbygrant.com',
            passwordHash: staffPassword,
            role: 'STAFF',
            status: 'ACTIVE',
        },
    })
    console.log('Staff created:', staff.email)

    // Create sample Customer
    const customerPassword = await hash('Customer@2024', 12)
    const customer = await prisma.user.upsert({
        where: { email: 'customer@fashionbygrant.com' },
        update: {},
        create: {
            name: 'John Doe',
            email: 'customer@fashionbygrant.com',
            passwordHash: customerPassword,
            role: 'CUSTOMER',
            status: 'ACTIVE',
            profile: {
                create: {
                    phone: '+234 800 123 4567',
                },
            },
        },
    })
    console.log('Customer created:', customer.email)

    // ============================================
    // CATEGORIES
    // ============================================
    const categoryData = [
        { name: 'Aso-Oke Series', slug: 'aso-oke', description: 'Traditional hand-woven Aso-Oke fabric pieces crafted with heritage techniques.' },
        { name: 'Senator Sets', slug: 'senator', description: 'Classic Nigerian senator wear combining elegance with comfort.' },
        { name: 'Royal Agbada', slug: 'agbada', description: 'Majestic flowing robes that make a statement at any occasion.' },
        { name: 'Adire Collection', slug: 'adire', description: 'Resist-dyed fabric designs rooted in Yoruba artistry.' },
        { name: 'Contemporary', slug: 'contemporary', description: 'Modern interpretations of African fashion for the global citizen.' },
        { name: 'Accessories', slug: 'accessories', description: 'Caps, shoes, and finishing touches for your outfit.' },
        { name: 'Wedding Collection', slug: 'wedding', description: 'Bespoke wedding attire for grooms and groomsmen.' },
    ]

    for (const cat of categoryData) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: { description: cat.description },
            create: cat,
        })
    }
    console.log('Categories seeded')

    // ============================================
    // COLLECTIONS
    // ============================================
    const collectionData = [
        { name: 'Heritage Line', slug: 'heritage-line', description: 'Our flagship collection celebrating Nigerian craftsmanship.' },
        { name: 'New Arrivals', slug: 'new-arrivals', description: 'The latest additions to our catalog.' },
        { name: 'Best Sellers', slug: 'best-sellers', description: 'Customer favorites and top-rated pieces.' },
        { name: 'Ramadan Collection', slug: 'ramadan-collection', description: 'Elegant pieces for the holy month.' },
    ]

    for (const col of collectionData) {
        await prisma.collection.upsert({
            where: { slug: col.slug },
            update: {},
            create: col,
        })
    }
    console.log('Collections seeded')

    // ============================================
    // SHIPPING ZONES (using native JSON arrays for PostgreSQL)
    // ============================================
    const shippingZones = [
        {
            name: 'Lagos',
            states: ['Lagos'],
            rates: [
                { name: 'Standard Delivery', price: 2500, estimatedDays: '1-2' },
                { name: 'Express Delivery', price: 5000, estimatedDays: 'Same day' },
            ],
        },
        {
            name: 'South-West',
            states: ['Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti'],
            rates: [
                { name: 'Standard Delivery', price: 3500, estimatedDays: '2-3' },
                { name: 'Express Delivery', price: 6500, estimatedDays: '1-2' },
            ],
        },
        {
            name: 'South-East & South-South',
            states: ['Anambra', 'Enugu', 'Imo', 'Abia', 'Ebonyi', 'Rivers', 'Bayelsa', 'Delta', 'Edo', 'Akwa Ibom', 'Cross River'],
            rates: [
                { name: 'Standard Delivery', price: 4500, estimatedDays: '3-5' },
                { name: 'Express Delivery', price: 8000, estimatedDays: '2-3' },
            ],
        },
        {
            name: 'North-Central',
            states: ['Abuja FCT', 'Kwara', 'Kogi', 'Niger', 'Nasarawa', 'Plateau', 'Benue'],
            rates: [
                { name: 'Standard Delivery', price: 4000, estimatedDays: '3-5' },
                { name: 'Express Delivery', price: 7500, estimatedDays: '2-3' },
            ],
        },
        {
            name: 'North-West & North-East',
            states: ['Kaduna', 'Kano', 'Katsina', 'Sokoto', 'Kebbi', 'Zamfara', 'Jigawa', 'Bauchi', 'Gombe', 'Borno', 'Yobe', 'Adamawa', 'Taraba'],
            rates: [
                { name: 'Standard Delivery', price: 5500, estimatedDays: '5-7' },
                { name: 'Express Delivery', price: 9500, estimatedDays: '3-4' },
            ],
        },
    ]

    for (const zone of shippingZones) {
        const existing = await prisma.shippingZone.findFirst({ where: { name: zone.name } })
        if (!existing) {
            await prisma.shippingZone.create({
                data: {
                    name: zone.name,
                    states: JSON.stringify(zone.states),
                    rates: {
                        create: zone.rates.map(r => ({
                            name: r.name,
                            price: r.price,
                            estimatedDays: r.estimatedDays,
                        })),
                    },
                },
            })
        }
    }
    console.log('Shipping zones seeded')

    // ============================================
    // STORE SETTINGS
    // ============================================
    const settingsCount = await prisma.storeSettings.count()
    if (settingsCount === 0) {
        await prisma.storeSettings.create({
            data: {
                storeName: 'Fashion By Grant',
                storeEmail: 'hello@fashionbygrant.com',
                storePhone: '+234 800 FBG 0001',
                currency: 'NGN',
                whatsappNumber: '+2348001234567',
                freeShippingThreshold: 100000,
                socialLinks: JSON.stringify({
                    instagram: 'https://instagram.com/fashionbygrant',
                    twitter: 'https://twitter.com/fashionbygrant',
                    facebook: 'https://facebook.com/fashionbygrant',
                }),
            },
        })
    }
    console.log('Store settings seeded')

    // ============================================
    // CMS PAGE CONTENT
    // ============================================
    const pages = [
        {
            slug: 'about',
            title: 'About Fashion By Grant',
            content: `<div class="space-y-8">
<h2 class="text-2xl font-serif font-bold">Our Story</h2>
<p>Fashion By Grant (FBG) is a premium Nigerian fashion house specializing in bespoke menswear that celebrates African heritage while embracing contemporary style. Founded with a passion for quality craftsmanship, we create pieces that make every man feel confident and distinguished.</p>

<h2 class="text-2xl font-serif font-bold">Our Mission</h2>
<p>To redefine African menswear by blending traditional craftsmanship with modern design sensibilities, making high-quality fashion accessible to the discerning gentleman.</p>

<h2 class="text-2xl font-serif font-bold">What Sets Us Apart</h2>
<ul class="list-disc pl-6 space-y-2">
<li><strong>Heritage Fabrics:</strong> We source the finest Aso-Oke, Adire, and premium fabrics from local artisans.</li>
<li><strong>Expert Tailoring:</strong> Each piece is crafted by skilled tailors with decades of experience.</li>
<li><strong>Custom Fit:</strong> We offer bespoke tailoring for a perfect, personalized fit.</li>
<li><strong>Modern Design:</strong> Our designs blend traditional aesthetics with contemporary fashion trends.</li>
</ul>

<h2 class="text-2xl font-serif font-bold">Visit Our Studio</h2>
<p>We welcome you to visit our studio in Lagos for a personal consultation and fitting experience. Book an appointment today.</p>
</div>`,
        },
        {
            slug: 'faq',
            title: 'Frequently Asked Questions',
            content: `<div class="space-y-6">
<div>
<h3 class="text-lg font-bold">How do I place an order?</h3>
<p>Browse our catalog, select your desired items, choose your size, and proceed to checkout. You can pay securely via Paystack.</p>
</div>

<div>
<h3 class="text-lg font-bold">What payment methods do you accept?</h3>
<p>We accept all major debit/credit cards, bank transfers, and USSD payments through Paystack.</p>
</div>

<div>
<h3 class="text-lg font-bold">How long does delivery take?</h3>
<p>Delivery times vary by location: Lagos (1-2 days), South-West (2-3 days), other regions (3-7 days). Express delivery options are available.</p>
</div>

<div>
<h3 class="text-lg font-bold">Can I get custom measurements?</h3>
<p>Yes! We offer bespoke tailoring. Visit our studio or use our size guide to send your measurements. Contact us via WhatsApp for assistance.</p>
</div>

<div>
<h3 class="text-lg font-bold">What is your return policy?</h3>
<p>We accept returns within 7 days of delivery for items in original condition. Custom/bespoke orders are non-refundable but can be altered.</p>
</div>

<div>
<h3 class="text-lg font-bold">Do you ship internationally?</h3>
<p>Currently, we deliver nationwide across Nigeria. International shipping is coming soon. Contact us for special arrangements.</p>
</div>
</div>`,
        },
        {
            slug: 'size-guide',
            title: 'Size Guide',
            content: `<div class="space-y-6">
<p>Finding your perfect fit is essential. Use the guide below to determine your ideal size, or visit our studio for a professional measurement session.</p>

<h2 class="text-xl font-serif font-bold">Standard Size Chart (in inches)</h2>
<div class="overflow-x-auto">
<table class="w-full border-collapse border border-obsidian-200">
<thead><tr class="bg-surface-secondary">
<th class="border border-obsidian-200 px-4 py-2">Size</th>
<th class="border border-obsidian-200 px-4 py-2">Chest</th>
<th class="border border-obsidian-200 px-4 py-2">Waist</th>
<th class="border border-obsidian-200 px-4 py-2">Hip</th>
<th class="border border-obsidian-200 px-4 py-2">Shoulder</th>
</tr></thead>
<tbody>
<tr><td class="border border-obsidian-200 px-4 py-2 text-center">S</td><td class="border border-obsidian-200 px-4 py-2 text-center">36-38</td><td class="border border-obsidian-200 px-4 py-2 text-center">30-32</td><td class="border border-obsidian-200 px-4 py-2 text-center">36-38</td><td class="border border-obsidian-200 px-4 py-2 text-center">17</td></tr>
<tr><td class="border border-obsidian-200 px-4 py-2 text-center">M</td><td class="border border-obsidian-200 px-4 py-2 text-center">38-40</td><td class="border border-obsidian-200 px-4 py-2 text-center">32-34</td><td class="border border-obsidian-200 px-4 py-2 text-center">38-40</td><td class="border border-obsidian-200 px-4 py-2 text-center">18</td></tr>
<tr><td class="border border-obsidian-200 px-4 py-2 text-center">L</td><td class="border border-obsidian-200 px-4 py-2 text-center">40-42</td><td class="border border-obsidian-200 px-4 py-2 text-center">34-36</td><td class="border border-obsidian-200 px-4 py-2 text-center">40-42</td><td class="border border-obsidian-200 px-4 py-2 text-center">19</td></tr>
<tr><td class="border border-obsidian-200 px-4 py-2 text-center">XL</td><td class="border border-obsidian-200 px-4 py-2 text-center">42-44</td><td class="border border-obsidian-200 px-4 py-2 text-center">36-38</td><td class="border border-obsidian-200 px-4 py-2 text-center">42-44</td><td class="border border-obsidian-200 px-4 py-2 text-center">20</td></tr>
<tr><td class="border border-obsidian-200 px-4 py-2 text-center">XXL</td><td class="border border-obsidian-200 px-4 py-2 text-center">44-46</td><td class="border border-obsidian-200 px-4 py-2 text-center">38-40</td><td class="border border-obsidian-200 px-4 py-2 text-center">44-46</td><td class="border border-obsidian-200 px-4 py-2 text-center">21</td></tr>
</tbody>
</table>
</div>

<h2 class="text-xl font-serif font-bold">How to Measure</h2>
<ul class="list-disc pl-6 space-y-2">
<li><strong>Chest:</strong> Measure around the fullest part of your chest, keeping the tape level.</li>
<li><strong>Waist:</strong> Measure around your natural waistline, keeping the tape comfortably loose.</li>
<li><strong>Hip:</strong> Measure around the fullest part of your hips.</li>
<li><strong>Shoulder:</strong> Measure from one shoulder point to the other across your back.</li>
</ul>

<p>Need help? <a href="/contact" class="text-gold-500 underline">Contact us</a> or visit our studio for a professional fitting.</p>
</div>`,
        },
        {
            slug: 'delivery',
            title: 'Delivery Information',
            content: `<div class="space-y-6">
<h2 class="text-xl font-serif font-bold">Delivery Zones & Rates</h2>
<p>We deliver across all 36 states of Nigeria and the FCT. Shipping rates are calculated based on your location at checkout.</p>

<h2 class="text-xl font-serif font-bold">Free Shipping</h2>
<p>Orders over &#8358;100,000 qualify for free standard delivery nationwide.</p>

<h2 class="text-xl font-serif font-bold">Order Tracking</h2>
<p>Once your order ships, you will receive a tracking number via email. Track your order status from your account dashboard.</p>
</div>`,
        },
        {
            slug: 'terms',
            title: 'Terms & Conditions',
            content: `<div class="space-y-6">
<p>By using the Fashion By Grant website and services, you agree to the following terms.</p>

<h2 class="text-xl font-serif font-bold">Orders & Payment</h2>
<p>All prices are listed in Nigerian Naira (NGN). Payment is processed securely via Paystack. Orders are confirmed only after successful payment.</p>

<h2 class="text-xl font-serif font-bold">Returns & Exchanges</h2>
<p>Ready-to-wear items may be returned within 7 days of delivery in their original condition with tags attached. Bespoke/custom orders are non-refundable but may be altered within 14 days of delivery. Refunds are processed within 5-10 business days.</p>

<h2 class="text-xl font-serif font-bold">Privacy</h2>
<p>We collect only the information necessary to process your orders and improve your shopping experience. Your personal data is never shared with third parties without your consent.</p>

<h2 class="text-xl font-serif font-bold">Intellectual Property</h2>
<p>All designs, images, and content on this website are the property of Fashion By Grant and may not be reproduced without written permission.</p>
</div>`,
        },
        {
            slug: 'bespoke',
            title: 'Bespoke Tailoring',
            content: `<div class="space-y-6">
<p class="text-lg">Experience the art of made-to-measure fashion. Our bespoke service creates garments uniquely tailored to your body, style, and occasion.</p>

<h2 class="text-xl font-serif font-bold">How It Works</h2>
<ol class="list-decimal pl-6 space-y-2">
<li><strong>Consultation:</strong> Book an appointment at our studio or contact us via WhatsApp to discuss your vision.</li>
<li><strong>Fabric Selection:</strong> Choose from our curated collection of premium fabrics including Aso-Oke, Italian linen, and more.</li>
<li><strong>Measurements:</strong> Our expert tailors take precise measurements for a flawless fit.</li>
<li><strong>Design & Craft:</strong> Your garment is designed and handcrafted by our skilled artisans.</li>
<li><strong>Fitting & Delivery:</strong> A fitting session ensures perfection before final delivery.</li>
</ol>

<h2 class="text-xl font-serif font-bold">Pricing</h2>
<p>Bespoke pieces start from &#8358;50,000 depending on fabric choice, design complexity, and embellishments. Contact us for a personalized quote.</p>

<h2 class="text-xl font-serif font-bold">Timeline</h2>
<p>Standard bespoke orders take 2-3 weeks. Rush orders (1 week) are available at an additional cost.</p>
</div>`,
        },
        {
            slug: 'studio',
            title: 'Our Studio',
            content: `<div class="space-y-6">
<p class="text-lg">Visit the Fashion By Grant studio for a personalized shopping and tailoring experience.</p>

<h2 class="text-xl font-serif font-bold">Location</h2>
<p>Lagos, Nigeria (Full address available upon booking)</p>

<h2 class="text-xl font-serif font-bold">Services Available</h2>
<ul class="list-disc pl-6 space-y-2">
<li>Professional body measurements</li>
<li>Fabric consultation and selection</li>
<li>Bespoke design consultations</li>
<li>Fittings and alterations</li>
<li>Ready-to-wear try-ons</li>
</ul>

<h2 class="text-xl font-serif font-bold">Hours</h2>
<p>Monday - Saturday: 9:00 AM - 6:00 PM<br/>Sunday: By appointment only</p>

<p>Book your visit on our <a href="/#consultation" class="text-gold-500 underline">consultation page</a> or call us directly.</p>
</div>`,
        },
        {
            slug: 'alterations',
            title: 'Alterations Service',
            content: `<div class="space-y-6">
<p>We offer professional alteration services for all garments purchased from Fashion By Grant.</p>

<h2 class="text-xl font-serif font-bold">What We Offer</h2>
<ul class="list-disc pl-6 space-y-2">
<li>Hemming and tapering</li>
<li>Waist adjustments</li>
<li>Sleeve length modifications</li>
<li>Full resizing</li>
<li>Embroidery additions</li>
</ul>

<h2 class="text-xl font-serif font-bold">Pricing</h2>
<p>Minor alterations on FBG purchases are complimentary within the first 14 days. Major alterations and non-FBG garments are charged starting from &#8358;5,000.</p>

<h2 class="text-xl font-serif font-bold">How to Request</h2>
<p>Bring your garment to our studio or contact us to arrange pickup and delivery within Lagos.</p>
</div>`,
        },
        {
            slug: 'fabric-sourcing',
            title: 'Fabric Sourcing',
            content: `<div class="space-y-6">
<p class="text-lg">We source premium fabrics from across Nigeria and internationally, ensuring every piece meets our quality standards.</p>

<h2 class="text-xl font-serif font-bold">Our Fabrics</h2>
<ul class="list-disc pl-6 space-y-2">
<li><strong>Aso-Oke:</strong> Hand-woven in Oyo and Kwara states, our Aso-Oke fabrics are the finest available.</li>
<li><strong>Adire:</strong> Resist-dyed fabrics from Abeokuta and Osogbo artisans.</li>
<li><strong>Italian Linen:</strong> Imported premium linen for our senator and contemporary lines.</li>
<li><strong>Guinea Brocade:</strong> Sourced from trusted suppliers for our Agbada collection.</li>
</ul>

<h2 class="text-xl font-serif font-bold">Custom Fabric Orders</h2>
<p>Looking for a specific fabric? We can source it for you. Contact us with your requirements and we will provide a quote within 48 hours.</p>
</div>`,
        },
        {
            slug: 'group-orders',
            title: 'Group Orders',
            content: `<div class="space-y-6">
<p class="text-lg">Planning a wedding, event, or corporate function? We specialize in group orders with coordinated designs and special pricing.</p>

<h2 class="text-xl font-serif font-bold">Group Order Benefits</h2>
<ul class="list-disc pl-6 space-y-2">
<li>Discounted pricing for orders of 5+ pieces</li>
<li>Coordinated fabric and design options</li>
<li>Dedicated project manager for your order</li>
<li>Group measurement sessions at our studio</li>
<li>Flexible payment plans available</li>
</ul>

<h2 class="text-xl font-serif font-bold">Get Started</h2>
<p>Contact us via WhatsApp or email to discuss your group order requirements. We recommend placing group orders at least 4 weeks before your event.</p>
</div>`,
        },
    ]

    for (const page of pages) {
        await prisma.pageContent.upsert({
            where: { slug: page.slug },
            update: { content: page.content, title: page.title },
            create: page,
        })
    }
    console.log('CMS pages seeded')

    // ============================================
    // CRM: DEFAULT SEGMENTS
    // ============================================
    const segments = [
        { name: 'VIP', description: 'High-value customers with 5+ orders or 500k+ spend', color: '#C8973E' },
        { name: 'Regular', description: 'Returning customers with 2-4 orders', color: '#78716C' },
        { name: 'New', description: 'Customers with their first order', color: '#3B82F6' },
        { name: 'At Risk', description: 'Customers who have not ordered in 90+ days', color: '#EF4444' },
    ]

    for (const seg of segments) {
        await prisma.customerSegment.upsert({
            where: { name: seg.name },
            update: {},
            create: seg,
        })
    }
    console.log('Customer segments seeded')

    // ============================================
    // CRM: DEFAULT TAGS
    // ============================================
    const tags = [
        { name: 'Wedding Client', color: '#C8973E' },
        { name: 'Bespoke Regular', color: '#8B5CF6' },
        { name: 'Corporate', color: '#3B82F6' },
        { name: 'Celebrity', color: '#EC4899' },
        { name: 'Influencer', color: '#F59E0B' },
    ]

    for (const tag of tags) {
        await prisma.customerTag.upsert({
            where: { name: tag.name },
            update: {},
            create: tag,
        })
    }
    console.log('Customer tags seeded')

    // ============================================
    // PRODUCTS (12 products with images & variants)
    // ============================================

    const categories = await prisma.category.findMany()
    const catBySlug = (slug: string) => categories.find(c => c.slug === slug)!

    const collections = await prisma.collection.findMany()
    const colBySlug = (slug: string) => collections.find(c => c.slug === slug)!

    const productDefs = [
        {
            name: 'Heritage Agbada Set',
            slug: 'heritage-agbada-set',
            descriptionShort: 'A regal three-piece agbada set crafted from premium Guinea Brocade with intricate hand embroidery.',
            descriptionLong: 'The Heritage Agbada Set is a masterpiece of Nigerian craftsmanship. This three-piece ensemble includes the flowing agbada robe, an inner dashiki top, and matching trousers. Made from imported Guinea Brocade fabric, each piece features painstaking hand embroidery that takes our artisans over 40 hours to complete. Perfect for weddings, naming ceremonies, and important celebrations.',
            basePrice: 185000,
            isFeatured: true,
            isNew: false,
            madeToOrder: false,
            categorySlugs: ['agbada'],
            collectionSlugs: ['heritage-line', 'best-sellers'],
            images: [
                'https://images.unsplash.com/photo-1621609764095-b32bbe35cf3a?w=800&q=80',
                'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
            ],
            variants: [
                { sku: 'HAS-M', size: 'M', stockQty: 5 },
                { sku: 'HAS-L', size: 'L', stockQty: 8 },
                { sku: 'HAS-XL', size: 'XL', stockQty: 6 },
                { sku: 'HAS-XXL', size: 'XXL', stockQty: 3 },
            ],
        },
        {
            name: 'Lagos Executive Kaftan',
            slug: 'lagos-executive-kaftan',
            descriptionShort: 'A sleek, modern kaftan designed for the Lagos executive who demands style and comfort.',
            descriptionLong: 'The Lagos Executive Kaftan blends traditional Nigerian kaftan design with contemporary minimalism. Tailored from premium Italian linen, it features a subtle embroidered neckline and a relaxed silhouette that transitions effortlessly from the boardroom to evening events. Available in our signature neutral palette.',
            basePrice: 95000,
            isFeatured: true,
            isNew: false,
            madeToOrder: false,
            categorySlugs: ['contemporary'],
            collectionSlugs: ['best-sellers'],
            images: [
                'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80',
                'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80',
            ],
            variants: [
                { sku: 'LEK-S', size: 'S', stockQty: 4 },
                { sku: 'LEK-M', size: 'M', stockQty: 10 },
                { sku: 'LEK-L', size: 'L', stockQty: 12 },
                { sku: 'LEK-XL', size: 'XL', stockQty: 7 },
            ],
        },
        {
            name: 'Ankara Print Senator',
            slug: 'ankara-print-senator',
            descriptionShort: 'Bold Ankara print meets classic senator styling in this standout piece.',
            descriptionLong: 'Our Ankara Print Senator takes the beloved senator silhouette and elevates it with vibrant Ankara fabric sourced from local Abeokuta artisans. The set includes a fitted top with mandarin collar and matching straight-cut trousers. A conversation starter at any gathering.',
            basePrice: 75000,
            isFeatured: false,
            isNew: true,
            madeToOrder: false,
            categorySlugs: ['senator'],
            collectionSlugs: ['new-arrivals'],
            images: [
                'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=800&q=80',
                'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=800&q=80',
            ],
            variants: [
                { sku: 'APS-S', size: 'S', stockQty: 6 },
                { sku: 'APS-M', size: 'M', stockQty: 9 },
                { sku: 'APS-L', size: 'L', stockQty: 7 },
                { sku: 'APS-XL', size: 'XL', stockQty: 4 },
            ],
        },
        {
            name: 'Classic Aso Oke Suit',
            slug: 'classic-aso-oke-suit',
            descriptionShort: 'A timeless Aso Oke three-piece suit hand-woven by master artisans from Iseyin.',
            descriptionLong: 'The Classic Aso Oke Suit represents the pinnacle of Nigerian textile artistry. Hand-woven by fourth-generation weavers in Iseyin, Oyo State, this three-piece suit features the traditional agbada, buba, and sokoto. Each set takes approximately two weeks to weave, ensuring exceptional quality and a unique pattern that no two pieces share identically.',
            basePrice: 250000,
            isFeatured: true,
            isNew: false,
            madeToOrder: false,
            categorySlugs: ['aso-oke'],
            collectionSlugs: ['heritage-line', 'best-sellers'],
            images: [
                'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=800&q=80',
                'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80',
                'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
            ],
            variants: [
                { sku: 'CAOS-M', size: 'M', stockQty: 3 },
                { sku: 'CAOS-L', size: 'L', stockQty: 5 },
                { sku: 'CAOS-XL', size: 'XL', stockQty: 4 },
            ],
        },
        {
            name: 'Modern Dashiki Shirt',
            slug: 'modern-dashiki-shirt',
            descriptionShort: 'A contemporary take on the classic dashiki, perfect for casual Fridays and weekend outings.',
            descriptionLong: 'Our Modern Dashiki Shirt reimagines the iconic West African garment for today\'s fashion-forward man. Cut from breathable cotton with a relaxed fit, it features embroidered neckline detailing inspired by traditional motifs but rendered in a minimalist style. Pair it with chinos or jeans for effortless style.',
            basePrice: 35000,
            isFeatured: false,
            isNew: true,
            madeToOrder: false,
            categorySlugs: ['contemporary'],
            collectionSlugs: ['new-arrivals'],
            images: [
                'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&q=80',
                'https://images.unsplash.com/photo-1590330297626-d7aff25a0431?w=800&q=80',
            ],
            variants: [
                { sku: 'MDS-S', size: 'S', stockQty: 15 },
                { sku: 'MDS-M', size: 'M', stockQty: 20 },
                { sku: 'MDS-L', size: 'L', stockQty: 18 },
                { sku: 'MDS-XL', size: 'XL', stockQty: 10 },
                { sku: 'MDS-XXL', size: 'XXL', stockQty: 5 },
            ],
        },
        {
            name: 'Bespoke Wedding Agbada',
            slug: 'bespoke-wedding-agbada',
            descriptionShort: 'A show-stopping wedding agbada with premium embroidery, made to your exact specifications.',
            descriptionLong: 'The Bespoke Wedding Agbada is our flagship made-to-order piece. Every detail is customized to your preferences — from fabric selection (Guinea Brocade, Cashmere blend, or Silk) to embroidery pattern, color palette, and fit. Includes a personal consultation, two fitting sessions, and complimentary cap to match. Allow 3-4 weeks for delivery.',
            basePrice: 450000,
            isFeatured: true,
            isNew: false,
            madeToOrder: true,
            categorySlugs: ['agbada', 'wedding'],
            collectionSlugs: ['heritage-line'],
            images: [
                'https://images.unsplash.com/photo-1621609764095-b32bbe35cf3a?w=800&q=80',
                'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=800&q=80',
                'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80',
            ],
            variants: [
                { sku: 'BWA-CUSTOM', size: 'Custom', stockQty: 0, priceOverride: 450000 },
            ],
        },
        {
            name: 'Premium Lace Senator',
            slug: 'premium-lace-senator',
            descriptionShort: 'An elevated senator set crafted from imported Swiss voile lace.',
            descriptionLong: 'The Premium Lace Senator brings unmatched luxury to the senator silhouette. Made from imported Swiss voile lace with intricate pattern work, this two-piece set features a structured top with horn buttons and tailored trousers. Lined for comfort and opacity, it is the perfect choice for high-profile events and celebrations.',
            basePrice: 120000,
            isFeatured: false,
            isNew: false,
            madeToOrder: false,
            categorySlugs: ['senator'],
            collectionSlugs: ['best-sellers'],
            images: [
                'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
                'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80',
            ],
            variants: [
                { sku: 'PLS-M', size: 'M', stockQty: 6 },
                { sku: 'PLS-L', size: 'L', stockQty: 8 },
                { sku: 'PLS-XL', size: 'XL', stockQty: 5 },
                { sku: 'PLS-XXL', size: 'XXL', stockQty: 2 },
            ],
        },
        {
            name: 'Casual Friday Kaftan',
            slug: 'casual-friday-kaftan',
            descriptionShort: 'A lightweight cotton kaftan for relaxed elegance at work and beyond.',
            descriptionLong: 'The Casual Friday Kaftan is designed for men who want to look polished without compromising on comfort. Made from premium soft cotton with a relaxed A-line cut, it features a simple embroidered neckline and side pockets. Available in earthy tones that pair well with loafers or sandals.',
            basePrice: 55000,
            isFeatured: false,
            isNew: true,
            madeToOrder: false,
            categorySlugs: ['contemporary'],
            collectionSlugs: ['new-arrivals'],
            images: [
                'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80',
                'https://images.unsplash.com/photo-1590330297626-d7aff25a0431?w=800&q=80',
            ],
            variants: [
                { sku: 'CFK-S', size: 'S', stockQty: 8 },
                { sku: 'CFK-M', size: 'M', stockQty: 14 },
                { sku: 'CFK-L', size: 'L', stockQty: 11 },
                { sku: 'CFK-XL', size: 'XL', stockQty: 6 },
            ],
        },
        {
            name: 'Royal Aso Oke Cap',
            slug: 'royal-aso-oke-cap',
            descriptionShort: 'A hand-woven Aso Oke fila cap that completes your traditional ensemble.',
            descriptionLong: 'The Royal Aso Oke Cap (fila) is the finishing touch for any traditional outfit. Hand-woven from the same premium Aso Oke fabric used in our suits, this cap features traditional folding styles and a comfortable inner lining. Each cap is unique due to the hand-weaving process.',
            basePrice: 25000,
            isFeatured: false,
            isNew: false,
            madeToOrder: false,
            categorySlugs: ['accessories', 'aso-oke'],
            collectionSlugs: ['heritage-line'],
            images: [
                'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&q=80',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
            ],
            variants: [
                { sku: 'RAOC-SM', size: 'S/M', stockQty: 12 },
                { sku: 'RAOC-LXL', size: 'L/XL', stockQty: 10 },
            ],
        },
        {
            name: 'Designer Fila Cap',
            slug: 'designer-fila-cap',
            descriptionShort: 'A contemporary fila cap in premium fabric with modern embroidered accents.',
            descriptionLong: 'The Designer Fila Cap is a modern reinterpretation of the classic Yoruba cap. Crafted from premium brocade fabric with subtle gold embroidery accents, it adds a contemporary edge to both traditional and fusion outfits. The structured design holds its shape beautifully.',
            basePrice: 18000,
            isFeatured: false,
            isNew: true,
            madeToOrder: false,
            categorySlugs: ['accessories'],
            collectionSlugs: ['new-arrivals'],
            images: [
                'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&q=80',
                'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80',
            ],
            variants: [
                { sku: 'DFC-SM', size: 'S/M', stockQty: 18 },
                { sku: 'DFC-LXL', size: 'L/XL', stockQty: 15 },
            ],
        },
        {
            name: 'Embroidered Grand Boubou',
            slug: 'embroidered-grand-boubou',
            descriptionShort: 'A majestic grand boubou with full-body embroidery for maximum impact.',
            descriptionLong: 'The Embroidered Grand Boubou is a statement piece designed for men who want to command attention. This flowing robe features elaborate machine and hand embroidery covering the entire front panel and sleeves. Made from imported shadda fabric, it comes with a matching inner top and trousers. Ideal for traditional weddings, chieftaincy events, and festive celebrations.',
            basePrice: 320000,
            isFeatured: true,
            isNew: false,
            madeToOrder: false,
            categorySlugs: ['agbada'],
            collectionSlugs: ['heritage-line', 'best-sellers'],
            images: [
                'https://images.unsplash.com/photo-1621609764095-b32bbe35cf3a?w=800&q=80',
                'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=800&q=80',
                'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=800&q=80',
            ],
            variants: [
                { sku: 'EGB-M', size: 'M', stockQty: 2 },
                { sku: 'EGB-L', size: 'L', stockQty: 4 },
                { sku: 'EGB-XL', size: 'XL', stockQty: 3 },
                { sku: 'EGB-XXL', size: 'XXL', stockQty: 2 },
            ],
        },
        {
            name: 'Slim Fit Ankara Blazer',
            slug: 'slim-fit-ankara-blazer',
            descriptionShort: 'A bold Ankara blazer with a modern slim cut, perfect for making a fashion-forward statement.',
            descriptionLong: 'The Slim Fit Ankara Blazer fuses African print with Western tailoring for a truly unique piece. Made from high-quality Ankara cotton with a tailored slim fit, it features functioning buttons, inner pockets, and a contrasting solid lining. Wear it with solid trousers and a crisp shirt for a contemporary African look that works at cocktail events and creative offices alike.',
            basePrice: 85000,
            isFeatured: false,
            isNew: true,
            madeToOrder: false,
            categorySlugs: ['contemporary', 'adire'],
            collectionSlugs: ['new-arrivals'],
            images: [
                'https://images.unsplash.com/photo-1590330297626-d7aff25a0431?w=800&q=80',
                'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
                'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=800&q=80',
            ],
            variants: [
                { sku: 'SFAB-S', size: 'S', stockQty: 5 },
                { sku: 'SFAB-M', size: 'M', stockQty: 8 },
                { sku: 'SFAB-L', size: 'L', stockQty: 6 },
                { sku: 'SFAB-XL', size: 'XL', stockQty: 3 },
            ],
        },
    ]

    const createdProducts: Array<{ slug: string; id: string; name: string; basePrice: number; variants: Array<{ id: string; sku: string; size: string | null }> }> = []

    for (const pDef of productDefs) {
        const existing = await prisma.product.findUnique({ where: { slug: pDef.slug } })
        if (existing) {
            const variants = await prisma.productVariant.findMany({ where: { productId: existing.id } })
            createdProducts.push({
                slug: existing.slug,
                id: existing.id,
                name: existing.name,
                basePrice: existing.basePrice,
                variants: variants.map(v => ({ id: v.id, sku: v.sku, size: v.size })),
            })
            continue
        }

        const product = await prisma.product.create({
            data: {
                name: pDef.name,
                slug: pDef.slug,
                descriptionShort: pDef.descriptionShort,
                descriptionLong: pDef.descriptionLong,
                basePrice: pDef.basePrice,
                isFeatured: pDef.isFeatured,
                isNew: pDef.isNew,
                madeToOrder: pDef.madeToOrder,
                status: 'ACTIVE',
                categories: {
                    connect: pDef.categorySlugs.map(s => ({ id: catBySlug(s).id })),
                },
                collections: {
                    connect: pDef.collectionSlugs.map(s => ({ id: colBySlug(s).id })),
                },
                images: {
                    create: pDef.images.map((url, i) => ({
                        imageUrl: url,
                        sortOrder: i,
                    })),
                },
                variants: {
                    create: pDef.variants.map(v => ({
                        sku: v.sku,
                        size: v.size,
                        stockQty: v.stockQty,
                        priceOverride: (v as { priceOverride?: number }).priceOverride ?? null,
                        status: 'ACTIVE',
                    })),
                },
            },
            include: { variants: true },
        })

        createdProducts.push({
            slug: product.slug,
            id: product.id,
            name: product.name,
            basePrice: product.basePrice,
            variants: product.variants.map(v => ({ id: v.id, sku: v.sku, size: v.size })),
        })
    }
    console.log(`Products seeded: ${createdProducts.length}`)

    // Helper to find products by slug
    const productBySlug = (slug: string) => createdProducts.find(p => p.slug === slug)!

    // ============================================
    // ORDERS (8 orders with items, payments, status logs)
    // ============================================

    const nigerianAddresses = [
        JSON.stringify({ firstName: 'John', lastName: 'Doe', address: '15 Admiralty Way, Lekki Phase 1', city: 'Lagos', state: 'Lagos', phone: '+234 800 123 4567' }),
        JSON.stringify({ firstName: 'John', lastName: 'Doe', address: '42 Adeola Odeku Street, Victoria Island', city: 'Lagos', state: 'Lagos', phone: '+234 800 123 4567' }),
        JSON.stringify({ firstName: 'John', lastName: 'Doe', address: '8 Awolowo Road, Ikoyi', city: 'Lagos', state: 'Lagos', phone: '+234 800 123 4567' }),
    ]

    const orderDefs = [
        {
            orderNumber: 'FBG-2024-001',
            status: 'DELIVERED',
            paymentStatus: 'PAID',
            placedAt: new Date('2024-08-15'),
            items: [
                { slug: 'heritage-agbada-set', variantIndex: 1, qty: 1 },
                { slug: 'royal-aso-oke-cap', variantIndex: 0, qty: 1 },
            ],
            shippingCost: 0, // free shipping (over 100k)
            statusLogs: [
                { oldStatus: 'PENDING', newStatus: 'CONFIRMED', date: '2024-08-15', note: 'Payment confirmed via Paystack' },
                { oldStatus: 'CONFIRMED', newStatus: 'PROCESSING', date: '2024-08-16', note: 'Order being prepared' },
                { oldStatus: 'PROCESSING', newStatus: 'SHIPPED', date: '2024-08-18', note: 'Shipped via GIG Logistics' },
                { oldStatus: 'SHIPPED', newStatus: 'DELIVERED', date: '2024-08-20', note: 'Delivered successfully' },
            ],
            trackingNumber: 'GIG-LG-2024081801',
        },
        {
            orderNumber: 'FBG-2024-002',
            status: 'DELIVERED',
            paymentStatus: 'PAID',
            placedAt: new Date('2024-09-10'),
            items: [
                { slug: 'classic-aso-oke-suit', variantIndex: 1, qty: 1 },
            ],
            shippingCost: 0,
            statusLogs: [
                { oldStatus: 'PENDING', newStatus: 'CONFIRMED', date: '2024-09-10', note: 'Payment confirmed' },
                { oldStatus: 'CONFIRMED', newStatus: 'PROCESSING', date: '2024-09-11', note: null },
                { oldStatus: 'PROCESSING', newStatus: 'SHIPPED', date: '2024-09-14', note: 'Shipped via DHL' },
                { oldStatus: 'SHIPPED', newStatus: 'DELIVERED', date: '2024-09-16', note: 'Delivered to customer' },
            ],
            trackingNumber: 'DHL-NG-2024091401',
        },
        {
            orderNumber: 'FBG-2024-003',
            status: 'PROCESSING',
            paymentStatus: 'PAID',
            placedAt: new Date('2024-11-20'),
            items: [
                { slug: 'lagos-executive-kaftan', variantIndex: 2, qty: 1 },
                { slug: 'designer-fila-cap', variantIndex: 0, qty: 2 },
            ],
            shippingCost: 0,
            statusLogs: [
                { oldStatus: 'PENDING', newStatus: 'CONFIRMED', date: '2024-11-20', note: 'Payment confirmed' },
                { oldStatus: 'CONFIRMED', newStatus: 'PROCESSING', date: '2024-11-21', note: 'Preparing order' },
            ],
            trackingNumber: null,
        },
        {
            orderNumber: 'FBG-2024-004',
            status: 'PROCESSING',
            paymentStatus: 'PAID',
            placedAt: new Date('2024-11-25'),
            items: [
                { slug: 'embroidered-grand-boubou', variantIndex: 1, qty: 1 },
            ],
            shippingCost: 0,
            statusLogs: [
                { oldStatus: 'PENDING', newStatus: 'CONFIRMED', date: '2024-11-25', note: 'Payment confirmed via Paystack' },
                { oldStatus: 'CONFIRMED', newStatus: 'PROCESSING', date: '2024-11-26', note: 'Embroidery in progress' },
            ],
            trackingNumber: null,
        },
        {
            orderNumber: 'FBG-2024-005',
            status: 'SHIPPED',
            paymentStatus: 'PAID',
            placedAt: new Date('2024-11-18'),
            items: [
                { slug: 'premium-lace-senator', variantIndex: 0, qty: 1 },
                { slug: 'royal-aso-oke-cap', variantIndex: 1, qty: 1 },
            ],
            shippingCost: 0,
            statusLogs: [
                { oldStatus: 'PENDING', newStatus: 'CONFIRMED', date: '2024-11-18', note: 'Payment confirmed' },
                { oldStatus: 'CONFIRMED', newStatus: 'PROCESSING', date: '2024-11-19', note: null },
                { oldStatus: 'PROCESSING', newStatus: 'SHIPPED', date: '2024-11-22', note: 'Shipped via GIG Logistics' },
            ],
            trackingNumber: 'GIG-LG-2024112201',
        },
        {
            orderNumber: 'FBG-2024-006',
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            placedAt: new Date('2024-12-01'),
            items: [
                { slug: 'modern-dashiki-shirt', variantIndex: 1, qty: 2 },
                { slug: 'casual-friday-kaftan', variantIndex: 2, qty: 1 },
            ],
            shippingCost: 0,
            statusLogs: [],
            trackingNumber: null,
        },
        {
            orderNumber: 'FBG-2024-007',
            status: 'CANCELLED',
            paymentStatus: 'REFUNDED',
            placedAt: new Date('2024-10-05'),
            items: [
                { slug: 'ankara-print-senator', variantIndex: 2, qty: 1 },
            ],
            shippingCost: 2500,
            statusLogs: [
                { oldStatus: 'PENDING', newStatus: 'CONFIRMED', date: '2024-10-05', note: 'Payment confirmed' },
                { oldStatus: 'CONFIRMED', newStatus: 'CANCELLED', date: '2024-10-07', note: 'Customer requested cancellation - wrong size selected' },
            ],
            trackingNumber: null,
        },
        {
            orderNumber: 'FBG-2024-008',
            status: 'REFUNDED',
            paymentStatus: 'REFUNDED',
            placedAt: new Date('2024-09-25'),
            items: [
                { slug: 'slim-fit-ankara-blazer', variantIndex: 1, qty: 1 },
            ],
            shippingCost: 2500,
            statusLogs: [
                { oldStatus: 'PENDING', newStatus: 'CONFIRMED', date: '2024-09-25', note: 'Payment confirmed' },
                { oldStatus: 'CONFIRMED', newStatus: 'PROCESSING', date: '2024-09-26', note: null },
                { oldStatus: 'PROCESSING', newStatus: 'SHIPPED', date: '2024-09-28', note: null },
                { oldStatus: 'SHIPPED', newStatus: 'DELIVERED', date: '2024-09-30', note: null },
                { oldStatus: 'DELIVERED', newStatus: 'REFUNDED', date: '2024-10-03', note: 'Customer returned item - fabric quality concern' },
            ],
            trackingNumber: 'GIG-LG-2024092801',
        },
    ]

    const createdOrders: Array<{ id: string; orderNumber: string; status: string }> = []

    for (const oDef of orderDefs) {
        const existingOrder = await prisma.order.findUnique({ where: { orderNumber: oDef.orderNumber } })
        if (existingOrder) {
            createdOrders.push({ id: existingOrder.id, orderNumber: existingOrder.orderNumber, status: existingOrder.status })
            continue
        }

        // Calculate totals
        let subtotal = 0
        const orderItems: Array<{ productId: string; productVariantId: string; nameSnapshot: string; skuSnapshot: string; unitPrice: number; quantity: number; totalPrice: number }> = []

        for (const item of oDef.items) {
            const prod = productBySlug(item.slug)
            const variant = prod.variants[item.variantIndex]
            const price = prod.basePrice
            subtotal += price * item.qty
            orderItems.push({
                productId: prod.id,
                productVariantId: variant.id,
                nameSnapshot: `${prod.name} - ${variant.size}`,
                skuSnapshot: variant.sku,
                unitPrice: price,
                quantity: item.qty,
                totalPrice: price * item.qty,
            })
        }

        const total = subtotal + oDef.shippingCost

        const order = await prisma.order.create({
            data: {
                orderNumber: oDef.orderNumber,
                userId: customer.id,
                customerEmail: customer.email,
                status: oDef.status,
                paymentStatus: oDef.paymentStatus,
                subtotal,
                shippingCost: oDef.shippingCost,
                total,
                currency: 'NGN',
                shippingAddress: nigerianAddresses[0],
                billingAddress: nigerianAddresses[0],
                trackingNumber: oDef.trackingNumber,
                placedAt: oDef.placedAt,
                items: {
                    create: orderItems,
                },
                statusLogs: {
                    create: oDef.statusLogs.map(sl => ({
                        changedByUserId: admin.id,
                        oldStatus: sl.oldStatus,
                        newStatus: sl.newStatus,
                        note: sl.note,
                        createdAt: new Date(sl.date),
                    })),
                },
            },
        })

        // Create payment record for paid orders
        if (oDef.paymentStatus !== 'UNPAID') {
            await prisma.payment.create({
                data: {
                    orderId: order.id,
                    reference: `PAY-${oDef.orderNumber}`,
                    amount: total,
                    currency: 'NGN',
                    status: oDef.paymentStatus === 'REFUNDED' ? 'REFUNDED' : 'SUCCESS',
                    provider: 'PAYSTACK',
                    providerRef: `psk_${oDef.orderNumber.toLowerCase().replace(/-/g, '')}`,
                    paidAt: oDef.placedAt,
                },
            })
        }

        createdOrders.push({ id: order.id, orderNumber: order.orderNumber, status: order.status })
    }
    console.log(`Orders seeded: ${createdOrders.length}`)

    // ============================================
    // REVIEWS (6 reviews for delivered products)
    // ============================================

    const reviewDefs = [
        {
            productSlug: 'heritage-agbada-set',
            rating: 5,
            title: 'Absolutely magnificent craftsmanship',
            comment: 'I wore this to my brother\'s wedding in Ibadan and the compliments were endless. The embroidery work is exceptional and the fabric quality is top-notch. FBG never disappoints. The fit was perfect, and the three-piece set looked regal. Will definitely be ordering more for the festive season.',
            status: 'APPROVED',
            createdAt: new Date('2024-08-25'),
        },
        {
            productSlug: 'classic-aso-oke-suit',
            rating: 5,
            title: 'True heritage piece - worth every Naira',
            comment: 'This Aso Oke suit is the real deal. You can feel the hand-woven quality the moment you touch it. I have received nothing but praise at every event I have worn it to. The colors are vibrant and the tailoring is impeccable. This is what authentic Nigerian fashion looks like.',
            status: 'APPROVED',
            createdAt: new Date('2024-09-20'),
        },
        {
            productSlug: 'lagos-executive-kaftan',
            rating: 4,
            title: 'Great quality, runs slightly large',
            comment: 'The fabric and finish are excellent. I ordered a medium but it fits more like a large, so I would suggest sizing down. The linen is breathable and perfect for Lagos weather. The embroidery around the neckline is subtle and elegant. Taking off one star only for the sizing issue.',
            status: 'APPROVED',
            createdAt: new Date('2024-11-22'),
        },
        {
            productSlug: 'modern-dashiki-shirt',
            rating: 5,
            title: 'Perfect for casual Fridays',
            comment: 'I bought this for wearing to the office on casual Fridays and it has become my go-to. The cotton is so comfortable and the minimalist embroidery is just right - not too much, not too little. I have already ordered a second one in a different color.',
            status: 'PENDING',
            createdAt: new Date('2024-12-02'),
        },
        {
            productSlug: 'premium-lace-senator',
            rating: 4,
            title: 'Luxurious feel, excellent tailoring',
            comment: 'The Swiss lace is beautiful and the senator set fits perfectly. I wore this to a chieftaincy ceremony in Abeokuta and it held up beautifully throughout the day. The lining is comfortable against the skin. Only minor note is the buttons could be slightly more premium to match the fabric quality.',
            status: 'PENDING',
            createdAt: new Date('2024-11-28'),
        },
        {
            productSlug: 'slim-fit-ankara-blazer',
            rating: 4,
            title: 'Bold design but fabric concern',
            comment: 'The design is stunning and I love the bold Ankara print. However, the fabric felt slightly different from what I expected based on the photos. The fit is great though and I got many compliments at a cocktail event. Would have preferred a slightly thicker material.',
            status: 'REJECTED',
            createdAt: new Date('2024-10-01'),
        },
    ]

    for (const rDef of reviewDefs) {
        const prod = productBySlug(rDef.productSlug)
        const existing = await prisma.review.findUnique({
            where: { productId_userId: { productId: prod.id, userId: customer.id } },
        })
        if (!existing) {
            await prisma.review.create({
                data: {
                    productId: prod.id,
                    userId: customer.id,
                    rating: rDef.rating,
                    title: rDef.title,
                    comment: rDef.comment,
                    status: rDef.status,
                    createdAt: rDef.createdAt,
                },
            })
        }
    }
    console.log('Reviews seeded')

    // ============================================
    // CUSTOMER MEASUREMENTS (2 profiles)
    // ============================================

    const measurementDefs = [
        {
            label: 'Formal Wear',
            chest: 102,
            shoulder: 46,
            sleeveLength: 64,
            neck: 39,
            backLength: 72,
            waist: 86,
            hip: 100,
            inseam: 82,
            outseam: 108,
            thigh: 58,
            height: 180,
            weight: 82,
            notes: 'Prefers slightly loose fit around chest for agbada and senator styles',
            measuredBy: 'Grant A.',
            measuredAt: new Date('2024-08-10'),
        },
        {
            label: 'Casual Wear',
            chest: 102,
            shoulder: 46,
            sleeveLength: 63,
            neck: 39,
            backLength: 71,
            waist: 86,
            hip: 100,
            inseam: null,
            outseam: null,
            thigh: null,
            height: 180,
            weight: 82,
            notes: 'Relaxed fit preferred for dashiki and kaftan styles',
            measuredBy: 'Sarah J.',
            measuredAt: new Date('2024-09-05'),
        },
    ]

    const createdMeasurements: Array<{ id: string; label: string }> = []

    for (const mDef of measurementDefs) {
        // Check if measurement with this label already exists for the customer
        const existing = await prisma.customerMeasurement.findFirst({
            where: { userId: customer.id, label: mDef.label },
        })
        if (existing) {
            createdMeasurements.push({ id: existing.id, label: existing.label })
            continue
        }

        const m = await prisma.customerMeasurement.create({
            data: {
                userId: customer.id,
                ...mDef,
            },
        })
        createdMeasurements.push({ id: m.id, label: m.label })
    }
    console.log('Customer measurements seeded')

    // ============================================
    // BESPOKE ORDERS (4 at different stages)
    // ============================================

    const bespokeDefs = [
        {
            orderNumber: 'BSP-2024-001',
            status: 'INQUIRY',
            customerName: 'John Doe',
            customerEmail: customer.email,
            customerPhone: '+234 800 123 4567',
            designDescription: 'Custom wedding agbada in white and gold Guinea Brocade with heavy embroidery on the front panel and sleeves. Matching fila cap with gold thread trim.',
            estimatedPrice: 500000,
            finalPrice: null,
            depositAmount: null,
            depositPaid: false,
            fabricDetails: 'White Guinea Brocade with gold thread embroidery',
            estimatedCompletionDate: null,
            customerNotes: 'Wedding is in March 2025. Need it ready by end of February.',
            internalNotes: 'Customer referred by Chief Adekunle. VIP treatment.',
            measurementLabel: 'Formal Wear',
            statusLogs: [
                { oldStatus: 'NEW', newStatus: 'INQUIRY', date: '2024-11-28', note: 'Customer enquiry received via WhatsApp' },
            ],
            tasks: [],
        },
        {
            orderNumber: 'BSP-2024-002',
            status: 'IN_PRODUCTION',
            customerName: 'John Doe',
            customerEmail: customer.email,
            customerPhone: '+234 800 123 4567',
            designDescription: 'Three-piece Aso Oke set in royal blue and silver. Agbada with cap-style shoulder embroidery, matching buba and sokoto.',
            estimatedPrice: 350000,
            finalPrice: 380000,
            depositAmount: 190000,
            depositPaid: true,
            fabricDetails: 'Hand-woven Aso Oke from Iseyin - Royal Blue with Silver metallic thread',
            estimatedCompletionDate: new Date('2024-12-20'),
            customerNotes: 'Need this for my father\'s 70th birthday celebration in Ibadan.',
            internalNotes: 'Fabric arrived from Iseyin. Quality is excellent. Embroidery pattern approved.',
            measurementLabel: 'Formal Wear',
            statusLogs: [
                { oldStatus: 'NEW', newStatus: 'INQUIRY', date: '2024-10-15', note: 'Customer enquiry via website' },
                { oldStatus: 'INQUIRY', newStatus: 'QUOTED', date: '2024-10-17', note: 'Quote sent: N350,000 base + N30,000 for extra embroidery' },
                { oldStatus: 'QUOTED', newStatus: 'CONFIRMED', date: '2024-10-20', note: 'Customer approved quote, 50% deposit received' },
                { oldStatus: 'CONFIRMED', newStatus: 'IN_PRODUCTION', date: '2024-10-25', note: 'Fabric sourced, cutting commenced' },
            ],
            tasks: [
                { title: 'Cut fabric pieces', stage: 'CUTTING', status: 'COMPLETED', assignToStaff: true, estimatedHours: 3, actualHours: 2.5, completedAt: new Date('2024-10-27'), priority: 1, sortOrder: 1, notes: 'All pieces cut. Agbada panels are 4 yards each.' },
                { title: 'Sew agbada body', stage: 'SEWING', status: 'COMPLETED', assignToStaff: true, estimatedHours: 8, actualHours: 10, completedAt: new Date('2024-11-05'), priority: 1, sortOrder: 2, notes: 'Body complete, ready for embroidery' },
                { title: 'Embroidery on front panel', stage: 'EMBROIDERY', status: 'IN_PROGRESS', assignToStaff: true, estimatedHours: 15, actualHours: null, completedAt: null, priority: 2, sortOrder: 3, notes: 'Using silver metallic thread. 60% complete.' },
                { title: 'Final assembly and QC', stage: 'FINISHING', status: 'NOT_STARTED', assignToStaff: false, estimatedHours: 4, actualHours: null, completedAt: null, priority: 0, sortOrder: 4, notes: null },
            ],
        },
        {
            orderNumber: 'BSP-2024-003',
            status: 'FITTING',
            customerName: 'John Doe',
            customerEmail: customer.email,
            customerPhone: '+234 800 123 4567',
            designDescription: 'Senator set in deep burgundy Italian wool blend. Slim fit with discreet side pockets and Chinese collar.',
            estimatedPrice: 180000,
            finalPrice: 180000,
            depositAmount: 90000,
            depositPaid: true,
            fabricDetails: 'Italian wool-blend, deep burgundy, imported from Milan',
            estimatedCompletionDate: new Date('2024-12-10'),
            customerNotes: 'Wearing this to a corporate gala dinner. Need it sharp.',
            internalNotes: 'First fitting done. Minor adjustments needed on sleeve length. Second fitting scheduled for Dec 5.',
            measurementLabel: 'Formal Wear',
            statusLogs: [
                { oldStatus: 'NEW', newStatus: 'INQUIRY', date: '2024-10-01', note: 'Walk-in consultation at studio' },
                { oldStatus: 'INQUIRY', newStatus: 'QUOTED', date: '2024-10-02', note: 'Quote provided' },
                { oldStatus: 'QUOTED', newStatus: 'CONFIRMED', date: '2024-10-05', note: 'Deposit received' },
                { oldStatus: 'CONFIRMED', newStatus: 'IN_PRODUCTION', date: '2024-10-08', note: 'Fabric arrived, production started' },
                { oldStatus: 'IN_PRODUCTION', newStatus: 'FITTING', date: '2024-11-20', note: 'First fitting completed. Sleeve adjustment needed.' },
            ],
            tasks: [],
        },
        {
            orderNumber: 'BSP-2024-004',
            status: 'DELIVERED',
            customerName: 'John Doe',
            customerEmail: customer.email,
            customerPhone: '+234 800 123 4567',
            designDescription: 'Adire-print kaftan with modern cut. Hand-dyed indigo Adire fabric from Abeokuta with minimalist embroidery at neckline.',
            estimatedPrice: 120000,
            finalPrice: 125000,
            depositAmount: 62500,
            depositPaid: true,
            fabricDetails: 'Hand-dyed indigo Adire fabric from Abeokuta master dyers',
            estimatedCompletionDate: new Date('2024-09-15'),
            actualCompletionDate: new Date('2024-09-14'),
            customerNotes: 'Love the result! Will be back for more Adire pieces.',
            internalNotes: 'Customer very satisfied. Gave permission for us to photograph the piece for our portfolio.',
            measurementLabel: 'Casual Wear',
            statusLogs: [
                { oldStatus: 'NEW', newStatus: 'INQUIRY', date: '2024-08-10', note: 'Email enquiry' },
                { oldStatus: 'INQUIRY', newStatus: 'QUOTED', date: '2024-08-12', note: 'Quote sent' },
                { oldStatus: 'QUOTED', newStatus: 'CONFIRMED', date: '2024-08-15', note: 'Full payment received' },
                { oldStatus: 'CONFIRMED', newStatus: 'IN_PRODUCTION', date: '2024-08-18', note: 'Production started' },
                { oldStatus: 'IN_PRODUCTION', newStatus: 'FITTING', date: '2024-09-10', note: 'Fitting completed - perfect fit' },
                { oldStatus: 'FITTING', newStatus: 'DELIVERED', date: '2024-09-14', note: 'Delivered to customer at studio' },
            ],
            tasks: [],
        },
    ]

    for (const bDef of bespokeDefs) {
        const existing = await prisma.bespokeOrder.findUnique({ where: { orderNumber: bDef.orderNumber } })
        if (existing) continue

        const measurement = createdMeasurements.find(m => m.label === bDef.measurementLabel)

        await prisma.bespokeOrder.create({
            data: {
                orderNumber: bDef.orderNumber,
                userId: customer.id,
                customerName: bDef.customerName,
                customerEmail: bDef.customerEmail,
                customerPhone: bDef.customerPhone,
                status: bDef.status,
                designDescription: bDef.designDescription,
                estimatedPrice: bDef.estimatedPrice,
                finalPrice: bDef.finalPrice,
                depositAmount: bDef.depositAmount,
                depositPaid: bDef.depositPaid,
                fabricDetails: bDef.fabricDetails,
                estimatedCompletionDate: bDef.estimatedCompletionDate,
                actualCompletionDate: (bDef as { actualCompletionDate?: Date }).actualCompletionDate ?? null,
                customerNotes: bDef.customerNotes,
                internalNotes: bDef.internalNotes,
                measurementId: measurement?.id ?? null,
                statusLogs: {
                    create: bDef.statusLogs.map(sl => ({
                        changedByUserId: admin.id,
                        oldStatus: sl.oldStatus,
                        newStatus: sl.newStatus,
                        note: sl.note,
                        createdAt: new Date(sl.date),
                    })),
                },
                tasks: {
                    create: bDef.tasks.map(t => ({
                        title: t.title,
                        stage: t.stage,
                        status: t.status,
                        description: t.notes,
                        assignedToId: t.assignToStaff ? staff.id : null,
                        estimatedHours: t.estimatedHours,
                        actualHours: t.actualHours,
                        completedAt: t.completedAt,
                        priority: t.priority,
                        sortOrder: t.sortOrder,
                        notes: t.notes,
                    })),
                },
            },
        })
    }
    console.log('Bespoke orders seeded')

    // ============================================
    // CUSTOMER INTERACTIONS (5)
    // ============================================

    const interactionCount = await prisma.customerInteraction.count({ where: { userId: customer.id } })
    if (interactionCount === 0) {
        const interactionDefs = [
            {
                type: 'WHATSAPP',
                subject: 'Wedding agbada inquiry',
                description: 'Customer reached out via WhatsApp asking about bespoke wedding agbada options. Shared fabric samples and discussed pricing. Customer is planning a March 2025 wedding and wants something unique.',
                staffUserId: admin.id,
                createdAt: new Date('2024-11-28'),
            },
            {
                type: 'VISIT',
                subject: 'Studio consultation - measurements and fabric selection',
                description: 'Customer visited the studio for measurement taking and fabric selection for the Aso Oke bespoke order. Spent 1.5 hours reviewing fabric options and finalized the royal blue with silver thread combination. Measurements taken and recorded.',
                staffUserId: admin.id,
                createdAt: new Date('2024-10-15'),
            },
            {
                type: 'CALL',
                subject: 'Follow-up on bespoke order BSP-2024-002',
                description: 'Called customer to update on embroidery progress. Shared photos via WhatsApp. Customer is pleased with the progress and confirmed the timeline is still workable.',
                staffUserId: staff.id,
                createdAt: new Date('2024-11-15'),
            },
            {
                type: 'EMAIL',
                subject: 'Order FBG-2024-001 delivery confirmation',
                description: 'Sent delivery confirmation email with care instructions for the Heritage Agbada Set. Customer replied expressing satisfaction with the quality and asking about the Aso Oke collection.',
                staffUserId: staff.id,
                createdAt: new Date('2024-08-20'),
            },
            {
                type: 'WHATSAPP',
                subject: 'Size inquiry for senator set',
                description: 'Customer messaged asking about sizing for the Premium Lace Senator. Recommended size L based on their measurement profile. Customer placed order FBG-2024-005 afterwards.',
                staffUserId: admin.id,
                createdAt: new Date('2024-11-17'),
            },
        ]

        for (const iDef of interactionDefs) {
            await prisma.customerInteraction.create({
                data: {
                    userId: customer.id,
                    staffUserId: iDef.staffUserId,
                    type: iDef.type,
                    subject: iDef.subject,
                    description: iDef.description,
                    createdAt: iDef.createdAt,
                },
            })
        }
    }
    console.log('Customer interactions seeded')

    // ============================================
    // WISHLIST ITEMS (4)
    // ============================================

    const wishlistSlugs = ['bespoke-wedding-agbada', 'embroidered-grand-boubou', 'casual-friday-kaftan', 'slim-fit-ankara-blazer']

    for (const slug of wishlistSlugs) {
        const prod = productBySlug(slug)
        const existing = await prisma.wishlistItem.findUnique({
            where: { userId_productId: { userId: customer.id, productId: prod.id } },
        })
        if (!existing) {
            await prisma.wishlistItem.create({
                data: {
                    userId: customer.id,
                    productId: prod.id,
                },
            })
        }
    }
    console.log('Wishlist items seeded')

    // ============================================
    // NOTIFICATIONS (6)
    // ============================================

    const notifCount = await prisma.notification.count({ where: { userId: customer.id } })
    if (notifCount === 0) {
        const notifDefs = [
            {
                title: 'Order Delivered',
                message: 'Your order FBG-2024-001 (Heritage Agbada Set) has been delivered successfully. We hope you love it!',
                type: 'ORDER_UPDATE',
                isRead: true,
                linkUrl: '/account/orders/FBG-2024-001',
                createdAt: new Date('2024-08-20'),
            },
            {
                title: 'Order Shipped',
                message: 'Your order FBG-2024-005 is on its way! Track it with number GIG-LG-2024112201.',
                type: 'ORDER_UPDATE',
                isRead: true,
                linkUrl: '/account/orders/FBG-2024-005',
                createdAt: new Date('2024-11-22'),
            },
            {
                title: 'Bespoke Order Update',
                message: 'Great news! Your bespoke Aso Oke set (BSP-2024-002) embroidery is 60% complete. Estimated delivery: Dec 20.',
                type: 'BESPOKE',
                isRead: false,
                linkUrl: '/account/bespoke/BSP-2024-002',
                createdAt: new Date('2024-11-25'),
            },
            {
                title: 'New Collection Available',
                message: 'Our new Ramadan Collection is now live! Discover elegant pieces perfect for the holy month.',
                type: 'SYSTEM',
                isRead: false,
                linkUrl: '/collections/ramadan-collection',
                createdAt: new Date('2024-11-30'),
            },
            {
                title: 'Review Approved',
                message: 'Your review for "Heritage Agbada Set" has been approved and is now visible on the product page. Thank you for your feedback!',
                type: 'SYSTEM',
                isRead: true,
                linkUrl: '/products/heritage-agbada-set',
                createdAt: new Date('2024-08-26'),
            },
            {
                title: 'Fitting Appointment Reminder',
                message: 'Reminder: Your fitting appointment for bespoke order BSP-2024-003 is scheduled for December 5 at 2:00 PM at our Lagos studio.',
                type: 'BESPOKE',
                isRead: false,
                linkUrl: '/account/bespoke/BSP-2024-003',
                createdAt: new Date('2024-12-03'),
            },
        ]

        for (const nDef of notifDefs) {
            await prisma.notification.create({
                data: {
                    userId: customer.id,
                    ...nDef,
                },
            })
        }
    }
    console.log('Notifications seeded')

    // ============================================
    // NEWSLETTER SUBSCRIBERS (6)
    // ============================================

    const newsletterDefs = [
        { email: 'adetayo.banks@gmail.com', isSubscribed: true, source: 'homepage' },
        { email: 'chinwe.okonkwo@yahoo.com', isSubscribed: true, source: 'checkout' },
        { email: 'femi.adesanya@outlook.com', isSubscribed: false, source: 'homepage', unsubscribedAt: new Date('2024-10-15') },
        { email: 'blessing.igwe@gmail.com', isSubscribed: true, source: 'footer' },
        { email: 'yusuf.abdullahi@hotmail.com', isSubscribed: true, source: 'homepage' },
        { email: 'ngozi.eze@gmail.com', isSubscribed: false, source: 'checkout', unsubscribedAt: new Date('2024-11-20') },
    ]

    for (const nsDef of newsletterDefs) {
        await prisma.newsletterSubscriber.upsert({
            where: { email: nsDef.email },
            update: {},
            create: nsDef,
        })
    }
    console.log('Newsletter subscribers seeded')

    // ============================================
    // CONSULTATION BOOKINGS (4)
    // ============================================

    const consultCount = await prisma.consultationBooking.count()
    if (consultCount === 0) {
        const consultDefs = [
            {
                name: 'Chukwuemeka Obi',
                phone: '+234 802 345 6789',
                email: 'chukwuemeka.obi@gmail.com',
                type: 'MEASUREMENT',
                message: 'I need to get measured for a senator set and agbada for my traditional wedding. My fiancee wants us to coordinate outfits.',
                status: 'CONFIRMED',
                preferredDate: new Date('2024-12-10'),
            },
            {
                name: 'Adebayo Fashola',
                phone: '+234 803 456 7890',
                email: 'adebayo.fashola@yahoo.com',
                type: 'WEDDING',
                message: 'Planning a wedding in February 2025. Need outfits for the groom, best man, and 6 groomsmen. Looking at matching Aso Oke sets.',
                status: 'PENDING',
                preferredDate: new Date('2024-12-15'),
            },
            {
                name: 'Ibrahim Musa',
                phone: '+234 806 567 8901',
                email: null,
                type: 'FABRIC',
                message: 'I have my own design in mind but need help sourcing specific Aso Oke fabric. Looking for a gold and navy combination.',
                status: 'COMPLETED',
                preferredDate: new Date('2024-11-20'),
            },
            {
                name: 'Tunde Bakare',
                phone: '+234 805 678 9012',
                email: 'tunde.b@outlook.com',
                type: 'MEASUREMENT',
                message: 'First time customer. Want to get measured and explore your contemporary collection for corporate events.',
                status: 'CANCELLED',
                preferredDate: new Date('2024-12-05'),
            },
        ]

        for (const cDef of consultDefs) {
            await prisma.consultationBooking.create({ data: cDef })
        }
    }
    console.log('Consultation bookings seeded')

    // ============================================
    // CONTACT MESSAGES (4)
    // ============================================

    const contactCount = await prisma.contactMessage.count()
    if (contactCount === 0) {
        const contactDefs = [
            {
                firstName: 'Olumide',
                lastName: 'Akinwale',
                email: 'olumide.akinwale@gmail.com',
                message: 'Good day, I was referred to your brand by a colleague who wore a stunning agbada from Fashion By Grant to a company event. I would like to know if you do corporate bulk orders for matching outfits. We have a company retreat coming up in January and need about 20 pieces.',
                isRead: true,
                createdAt: new Date('2024-11-10'),
            },
            {
                firstName: 'Amara',
                lastName: 'Nwosu',
                email: 'amara.nwosu@yahoo.com',
                message: 'Hello, I am looking for a gift for my husband\'s 40th birthday. He loves traditional Nigerian fashion but I am not sure of his exact measurements. Do you offer gift cards or can I book a surprise measurement session for him?',
                isRead: false,
                createdAt: new Date('2024-11-28'),
            },
            {
                firstName: 'Kayode',
                lastName: 'Ogundimu',
                email: 'kayode.o@hotmail.com',
                message: 'I placed order FBG-2024-005 last week and the tracking number does not seem to be working on the GIG Logistics website. Can you please confirm the status of my delivery? I need the outfit by this weekend.',
                isRead: false,
                createdAt: new Date('2024-11-24'),
            },
            {
                firstName: 'Fatima',
                lastName: 'Suleiman',
                email: 'fatima.s@gmail.com',
                message: 'Assalamu alaikum, I am organizing a Walimah (wedding reception) for my brother and we are interested in your Ramadan Collection for the groomsmen. Do you ship to Abuja? What are the delivery timelines? JazakAllah khair.',
                isRead: true,
                createdAt: new Date('2024-12-01'),
            },
        ]

        for (const cDef of contactDefs) {
            await prisma.contactMessage.create({ data: cDef })
        }
    }
    console.log('Contact messages seeded')

    // ============================================
    // SUPPLIERS (4)
    // ============================================

    const supplierDefs = [
        {
            name: 'Adekunle Textiles Ltd',
            contactName: 'Chief Bayo Adekunle',
            email: 'info@adekunletextiles.com.ng',
            phone: '+234 802 111 2233',
            whatsapp: '+234 802 111 2233',
            address: '45 Balogun Street, Lagos Island',
            city: 'Lagos',
            state: 'Lagos',
            notes: 'Primary supplier for Guinea Brocade and imported fabrics. Reliable, 15+ year relationship. Offers 30-day payment terms.',
        },
        {
            name: 'Iseyin Aso Oke Cooperative',
            contactName: 'Alhaji Rasheed Adeyemi',
            email: 'iseyinasoke@gmail.com',
            phone: '+234 806 222 3344',
            whatsapp: '+234 806 222 3344',
            address: '12 Weaving Quarter, Iseyin',
            city: 'Iseyin',
            state: 'Oyo',
            notes: 'Hand-woven Aso Oke fabrics from master weavers. Lead time 2-3 weeks for custom weaves. Quality is exceptional.',
        },
        {
            name: 'Kano Lace & Brocade Market',
            contactName: 'Mallam Usman Garba',
            email: null,
            phone: '+234 803 333 4455',
            whatsapp: '+234 803 333 4455',
            address: 'Kantin Kwari Market, Kano',
            city: 'Kano',
            state: 'Kano',
            notes: 'Best prices on lace and brocade fabrics. Cash only. Ships via Dangote transport. Reliable but no email - WhatsApp only.',
        },
        {
            name: 'Abeokuta Adire Artisans Guild',
            contactName: 'Mrs. Folake Ogunbiyi',
            email: 'adireartisans@gmail.com',
            phone: '+234 805 444 5566',
            whatsapp: '+234 805 444 5566',
            address: '8 Itoku Street, Abeokuta',
            city: 'Abeokuta',
            state: 'Ogun',
            notes: 'Traditional hand-dyed Adire fabrics. Each piece is unique. Supports local women artisans. Lead time 1-2 weeks.',
        },
    ]

    const createdSuppliers: Array<{ id: string; name: string }> = []

    for (const sDef of supplierDefs) {
        const existing = await prisma.supplier.findFirst({ where: { name: sDef.name } })
        if (existing) {
            createdSuppliers.push({ id: existing.id, name: existing.name })
            continue
        }
        const s = await prisma.supplier.create({ data: sDef })
        createdSuppliers.push({ id: s.id, name: s.name })
    }
    console.log('Suppliers seeded')

    // ============================================
    // FABRIC INVENTORY (8 fabrics)
    // ============================================

    const supplierByName = (name: string) => createdSuppliers.find(s => s.name === name)

    const fabricDefs = [
        {
            name: 'Premium Guinea Brocade - White',
            type: 'Brocade',
            color: 'White',
            pattern: 'Damask',
            quantityYards: 45,
            minStockLevel: 20,
            costPerYard: 8500,
            supplierName: 'Adekunle Textiles Ltd',
            location: 'Shelf A1',
            notes: 'Primary fabric for wedding agbadas. Fast-moving, reorder at 20 yards.',
        },
        {
            name: 'Aso Oke - Royal Blue/Silver',
            type: 'Aso Oke',
            color: 'Royal Blue with Silver',
            pattern: 'Sanyan weave',
            quantityYards: 12,
            minStockLevel: 10,
            costPerYard: 15000,
            supplierName: 'Iseyin Aso Oke Cooperative',
            location: 'Shelf B2',
            notes: 'Hand-woven. Currently allocated for BSP-2024-002. Reorder soon.',
        },
        {
            name: 'Swiss Voile Lace - Cream',
            type: 'Lace',
            color: 'Cream',
            pattern: 'Floral embroidery',
            quantityYards: 30,
            minStockLevel: 15,
            costPerYard: 12000,
            supplierName: 'Adekunle Textiles Ltd',
            location: 'Shelf A3',
            notes: 'Used for Premium Lace Senator line. Imported from Austria.',
        },
        {
            name: 'Ankara Cotton - Geometric Print',
            type: 'Ankara',
            color: 'Multi (Orange/Blue/Yellow)',
            pattern: 'Geometric',
            quantityYards: 60,
            minStockLevel: 25,
            costPerYard: 3500,
            supplierName: 'Adekunle Textiles Ltd',
            location: 'Shelf C1',
            notes: 'High-quality Dutch wax print. Used for Ankara Senator and Blazer lines.',
        },
        {
            name: 'Italian Linen - Stone',
            type: 'Cotton',
            color: 'Stone/Beige',
            pattern: 'Plain',
            quantityYards: 8,
            minStockLevel: 15,
            costPerYard: 9000,
            supplierName: 'Adekunle Textiles Ltd',
            location: 'Shelf A2',
            notes: 'LOW STOCK - Used for Lagos Executive Kaftan. Reorder placed Nov 20.',
        },
        {
            name: 'Adire Indigo - Traditional Oniko',
            type: 'Adire',
            color: 'Indigo Blue',
            pattern: 'Oniko (tie-dye)',
            quantityYards: 25,
            minStockLevel: 10,
            costPerYard: 6000,
            supplierName: 'Abeokuta Adire Artisans Guild',
            location: 'Shelf B1',
            notes: 'Hand-dyed by master artisans. Each piece unique. Popular for bespoke kaftan orders.',
        },
        {
            name: 'Shadda Fabric - Gold',
            type: 'Brocade',
            color: 'Gold',
            pattern: 'Shadda stripe',
            quantityYards: 5,
            minStockLevel: 10,
            costPerYard: 7500,
            supplierName: 'Kano Lace & Brocade Market',
            location: 'Shelf A4',
            notes: 'LOW STOCK - Critical. Used for Grand Boubou collection. Reorder urgently.',
        },
        {
            name: 'Cashmere Blend - Navy',
            type: 'Silk',
            color: 'Navy Blue',
            pattern: 'Plain',
            quantityYards: 18,
            minStockLevel: 10,
            costPerYard: 18000,
            supplierName: 'Adekunle Textiles Ltd',
            location: 'Shelf A5',
            notes: 'Premium imported fabric for high-end senator sets. Handle with care.',
        },
    ]

    const fabricCount = await prisma.fabricInventory.count()
    if (fabricCount === 0) {
        for (const fDef of fabricDefs) {
            const supplier = supplierByName(fDef.supplierName)
            await prisma.fabricInventory.create({
                data: {
                    name: fDef.name,
                    type: fDef.type,
                    color: fDef.color,
                    pattern: fDef.pattern,
                    quantityYards: fDef.quantityYards,
                    minStockLevel: fDef.minStockLevel,
                    costPerYard: fDef.costPerYard,
                    supplierId: supplier?.id ?? null,
                    location: fDef.location,
                    notes: fDef.notes,
                    isAvailable: true,
                },
            })
        }
    }
    console.log('Fabric inventory seeded')

    // ============================================
    // RETURN REQUESTS (2)
    // ============================================

    const returnCount = await prisma.returnRequest.count()
    if (returnCount === 0) {
        // Use delivered/refunded orders for returns
        const order8 = createdOrders.find(o => o.orderNumber === 'FBG-2024-008')
        const order1 = createdOrders.find(o => o.orderNumber === 'FBG-2024-001')

        if (order8) {
            await prisma.returnRequest.create({
                data: {
                    orderId: order8.id,
                    userId: customer.id,
                    reason: 'The Ankara Blazer fabric quality feels different from what was shown in the product photos. The material is thinner than expected and the print colors are slightly faded compared to the listing.',
                    status: 'APPROVED',
                    refundAmount: 87500,
                    adminNotes: 'Customer complaint validated. Fabric batch QC issue identified. Full refund approved. Item returned in good condition.',
                },
            })
        }

        if (order1) {
            await prisma.returnRequest.create({
                data: {
                    orderId: order1.id,
                    userId: customer.id,
                    reason: 'The Aso Oke cap that came with the Heritage Agbada Set is slightly smaller than expected. I would like to exchange it for a larger size if possible.',
                    status: 'PENDING',
                    refundAmount: null,
                    adminNotes: null,
                },
            })
        }
    }
    console.log('Return requests seeded')

    // ============================================
    // SUPPORT TICKETS (3)
    // ============================================

    const ticketCount = await prisma.supportTicket.count()
    if (ticketCount === 0) {
        const order5 = createdOrders.find(o => o.orderNumber === 'FBG-2024-005')
        const order3 = createdOrders.find(o => o.orderNumber === 'FBG-2024-003')

        // Ticket 1: Shipping inquiry (RESOLVED)
        await prisma.supportTicket.create({
            data: {
                userId: customer.id,
                orderId: order5?.id ?? null,
                subject: 'Tracking number not working for order FBG-2024-005',
                status: 'RESOLVED',
                priority: 'HIGH',
                messages: {
                    create: [
                        {
                            senderUserId: customer.id,
                            message: 'Hello, I received a tracking number GIG-LG-2024112201 for my order but when I enter it on the GIG Logistics website, it says "not found". Can you please check? I need this outfit by this weekend.',
                            createdAt: new Date('2024-11-23'),
                        },
                        {
                            senderUserId: staff.id,
                            message: 'Hi John, thank you for reaching out. I have checked with GIG Logistics and the tracking number was entered incorrectly in our system. The correct tracking number is GIG-LG-2024112201A. I have updated your order. You can track it here: https://giglogistics.com/track. Your package is currently in transit and should arrive by Friday.',
                            createdAt: new Date('2024-11-23'),
                        },
                        {
                            senderUserId: customer.id,
                            message: 'Thank you Sarah, the updated tracking number works. I can see it is at the Lagos hub. Appreciate the quick response!',
                            createdAt: new Date('2024-11-23'),
                        },
                        {
                            senderUserId: staff.id,
                            message: 'You are welcome! Your package should be delivered tomorrow. Please let us know once you receive it. Have a great day!',
                            isInternal: false,
                            createdAt: new Date('2024-11-23'),
                        },
                    ],
                },
            },
        })

        // Ticket 2: Order inquiry (OPEN)
        await prisma.supportTicket.create({
            data: {
                userId: customer.id,
                orderId: order3?.id ?? null,
                subject: 'When will order FBG-2024-003 be shipped?',
                status: 'OPEN',
                priority: 'NORMAL',
                messages: {
                    create: [
                        {
                            senderUserId: customer.id,
                            message: 'Hi, I placed order FBG-2024-003 about 10 days ago and it still shows as "Processing". I ordered a Lagos Executive Kaftan and 2 Designer Fila Caps. Can you give me an update on when it will be shipped? I have an event coming up on December 8th.',
                            createdAt: new Date('2024-11-30'),
                        },
                        {
                            senderUserId: admin.id,
                            message: 'Internal note: The kaftan is ready. Waiting on the fila caps from the embroidery unit. Expected completion: Dec 3.',
                            isInternal: true,
                            createdAt: new Date('2024-11-30'),
                        },
                    ],
                },
            },
        })

        // Ticket 3: General inquiry (OPEN)
        await prisma.supportTicket.create({
            data: {
                userId: customer.id,
                subject: 'Loyalty program or referral discounts?',
                status: 'OPEN',
                priority: 'LOW',
                messages: {
                    create: [
                        {
                            senderUserId: customer.id,
                            message: 'I have been a regular customer and have made several purchases this year. Do you have any loyalty program or referral discount for returning customers? I have referred 3 friends who have also made purchases. Would love to know if there are any rewards.',
                            createdAt: new Date('2024-12-01'),
                        },
                    ],
                },
            },
        })
    }
    console.log('Support tickets seeded')

    // ============================================
    // SEGMENT MEMBERSHIPS & TAG ASSIGNMENTS
    // ============================================

    const vipSegment = await prisma.customerSegment.findUnique({ where: { name: 'VIP' } })
    if (vipSegment) {
        const existing = await prisma.customerSegmentMember.findUnique({
            where: { userId_segmentId: { userId: customer.id, segmentId: vipSegment.id } },
        })
        if (!existing) {
            await prisma.customerSegmentMember.create({
                data: { userId: customer.id, segmentId: vipSegment.id },
            })
        }
    }

    const bespokeTag = await prisma.customerTag.findUnique({ where: { name: 'Bespoke Regular' } })
    const weddingTag = await prisma.customerTag.findUnique({ where: { name: 'Wedding Client' } })

    if (bespokeTag) {
        const existing = await prisma.customerTagAssignment.findUnique({
            where: { userId_tagId: { userId: customer.id, tagId: bespokeTag.id } },
        })
        if (!existing) {
            await prisma.customerTagAssignment.create({
                data: { userId: customer.id, tagId: bespokeTag.id },
            })
        }
    }

    if (weddingTag) {
        const existing = await prisma.customerTagAssignment.findUnique({
            where: { userId_tagId: { userId: customer.id, tagId: weddingTag.id } },
        })
        if (!existing) {
            await prisma.customerTagAssignment.create({
                data: { userId: customer.id, tagId: weddingTag.id },
            })
        }
    }
    console.log('Segment memberships and tag assignments seeded')

    // ============================================
    // ACTIVITY LOGS (sample entries)
    // ============================================

    const activityCount = await prisma.activityLog.count()
    if (activityCount === 0) {
        const activityDefs = [
            { userId: admin.id, action: 'ORDER_STATUS_CHANGED', entityType: 'Order', entityId: 'FBG-2024-001', metadata: JSON.stringify({ from: 'PROCESSING', to: 'SHIPPED' }), createdAt: new Date('2024-08-18') },
            { userId: admin.id, action: 'BESPOKE_ORDER_CREATED', entityType: 'BespokeOrder', entityId: 'BSP-2024-002', metadata: JSON.stringify({ customerName: 'John Doe', estimatedPrice: 350000 }), createdAt: new Date('2024-10-15') },
            { userId: staff.id, action: 'PRODUCT_CREATED', entityType: 'Product', entityId: 'heritage-agbada-set', metadata: JSON.stringify({ productName: 'Heritage Agbada Set', price: 185000 }), createdAt: new Date('2024-07-01') },
            { userId: admin.id, action: 'CUSTOMER_NOTE_ADDED', entityType: 'User', entityId: customer.id, metadata: JSON.stringify({ note: 'VIP customer, prefers agbada styles' }), createdAt: new Date('2024-09-20') },
            { userId: customer.id, action: 'LOGIN', entityType: 'User', entityId: customer.id, metadata: null, createdAt: new Date('2024-12-01') },
        ]

        for (const aDef of activityDefs) {
            await prisma.activityLog.create({ data: aDef })
        }
    }
    console.log('Activity logs seeded')

    // ============================================
    // COUPONS (sample discount codes)
    // ============================================

    const couponDefs = [
        { code: 'WELCOME10', type: 'PERCENTAGE', value: 10, minOrderAmount: 50000, maxUses: 100, isActive: true, expiresAt: new Date('2025-06-30') },
        { code: 'NEWCUSTOMER', type: 'FIXED', value: 5000, minOrderAmount: 30000, maxUses: 50, usedCount: 12, isActive: true, expiresAt: new Date('2025-03-31') },
        { code: 'VIP20', type: 'PERCENTAGE', value: 20, minOrderAmount: 100000, maxUses: 20, usedCount: 3, isActive: true, expiresAt: new Date('2025-12-31') },
    ]

    for (const cpDef of couponDefs) {
        await prisma.coupon.upsert({
            where: { code: cpDef.code },
            update: {},
            create: cpDef,
        })
    }
    console.log('Coupons seeded')

    // ============================================
    // CUSTOMER NOTES
    // ============================================

    const noteCount = await prisma.customerNote.count({ where: { userId: customer.id } })
    if (noteCount === 0) {
        const noteDefs = [
            { createdByUserId: admin.id, note: 'VIP customer. Prefers agbada and senator styles. Very particular about embroidery quality. Budget is not a concern.', createdAt: new Date('2024-08-25') },
            { createdByUserId: staff.id, note: 'Customer prefers WhatsApp communication over email. Best to reach between 10 AM - 4 PM.', createdAt: new Date('2024-09-10') },
            { createdByUserId: admin.id, note: 'Referred by Chief Adekunle. Has referred 3 other customers to us. Consider loyalty discount.', createdAt: new Date('2024-11-28') },
        ]

        for (const nDef of noteDefs) {
            await prisma.customerNote.create({
                data: {
                    userId: customer.id,
                    ...nDef,
                },
            })
        }
    }
    console.log('Customer notes seeded')

    console.log('\n--- Seed complete! ---')
    console.log('\nTest Credentials:')
    console.log('Super Admin: admin@fashionbygrant.com / SuperAdmin@2024')
    console.log('Admin:       grant@fashionbygrant.com / Admin@2024')
    console.log('Staff:       staff@fashionbygrant.com / Staff@2024')
    console.log('Customer:    customer@fashionbygrant.com / Customer@2024')
}

main()
    .catch((e) => {
        console.error('Seed error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
