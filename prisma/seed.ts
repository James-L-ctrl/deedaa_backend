import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaClient, Role } from '../generated/prisma/client';

const products = [
  {
    slug: 'nude-glow-lip-balm',
    name: 'Nude Glow Lip Balm',
    description: 'A nourishing lip balm with subtle nude tint and natural shine',
    priceCents: 2600,
    imageUrl:
      'https://images.unsplash.com/photo-1583209814468-fce526b91543?auto=format&fit=crop&w=1080&q=80',
    category: 'lips',
    rating: 5,
    stock: 48,
    featured: false,
    bestseller: true,
    badge: null,
    isPreorder: false,
  },
  {
    slug: 'rose-quartz-tint',
    name: 'Rose Quartz Tint',
    description: 'Luxurious pink lip gloss with rose quartz shimmer and hydration',
    priceCents: 3000,
    imageUrl:
      'https://images.unsplash.com/photo-1764777858430-a285d6d9cf50?auto=format&fit=crop&w=1080&q=80',
    category: 'lips',
    rating: 5,
    stock: 36,
    featured: false,
    bestseller: true,
    badge: null,
    isPreorder: false,
  },
  {
    slug: 'blush-velvet-cream',
    name: 'Blush Velvet Cream',
    description: 'Rich blush cream with velvet texture for natural radiance',
    priceCents: 3400,
    imageUrl:
      'https://images.unsplash.com/photo-1767379462101-b93554f3025c?auto=format&fit=crop&w=1080&q=80',
    category: 'cheeks',
    rating: 5,
    stock: 30,
    featured: false,
    bestseller: true,
    badge: null,
    isPreorder: false,
  },
  {
    slug: 'pearl-radiance-serum',
    name: 'Pearl Radiance Serum',
    description: 'Illuminating face serum with pearl extract for glowing skin',
    priceCents: 4200,
    imageUrl:
      'https://images.unsplash.com/photo-1556228634-2e0de958b4b7?auto=format&fit=crop&w=1080&q=80',
    category: 'skincare',
    rating: 5,
    stock: 24,
    featured: false,
    bestseller: false,
    badge: null,
    isPreorder: false,
  },
  {
    slug: 'amber-night-cream',
    name: 'Amber Night Cream',
    description: 'Overnight recovery cream with amber essence for deep nourishment',
    priceCents: 3800,
    imageUrl:
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1080&q=80',
    category: 'skincare',
    rating: 5,
    stock: 22,
    featured: false,
    bestseller: false,
    badge: null,
    isPreorder: false,
  },
  {
    slug: 'sage-eye-gel',
    name: 'Sage Eye Gel',
    description: 'Cooling eye gel with sage extract to reduce puffiness',
    priceCents: 2800,
    imageUrl:
      'https://images.unsplash.com/photo-1570172629677-c5b89d2b5c53?auto=format&fit=crop&w=1080&q=80',
    category: 'skincare',
    rating: 5,
    stock: 40,
    featured: false,
    bestseller: false,
    badge: null,
    isPreorder: false,
  },
  {
    slug: 'lavender-mist',
    name: 'Lavender Mist',
    description: 'Hydrating facial mist with calming lavender essential oil',
    priceCents: 2200,
    imageUrl:
      'https://images.unsplash.com/photo-1570172629677-c5b89d2b5c53?auto=format&fit=crop&w=1080&q=80',
    category: 'skincare',
    rating: 5,
    stock: 50,
    featured: false,
    bestseller: false,
    badge: null,
    isPreorder: false,
  },
  {
    slug: 'coconut-body-butter',
    name: 'Coconut Body Butter',
    description: 'Rich body butter with coconut oil for deep skin hydration',
    priceCents: 3200,
    imageUrl:
      'https://images.unsplash.com/photo-1572561613741-445fbbf9f0f5?auto=format&fit=crop&w=1080&q=80',
    category: 'body',
    rating: 5,
    stock: 28,
    featured: false,
    bestseller: false,
    badge: null,
    isPreorder: false,
  },
  {
    slug: 'velvet-lip-butter-balm',
    name: 'Velvet Lip Butter Balm',
    description: 'Nourishing formula with a weightless, buttery feel',
    priceCents: 2800,
    imageUrl:
      'https://images.unsplash.com/photo-1764777858430-a285d6d9cf50?auto=format&fit=crop&w=1080&q=80',
    category: 'lips',
    rating: 5,
    stock: 42,
    featured: true,
    bestseller: true,
    badge: 'Bestseller',
    isPreorder: false,
  },
  {
    slug: 'rose-lip-tattoo',
    name: 'Rose Lip Tattoo',
    description: 'Long-lasting color that adapts to your natural pH',
    priceCents: 3200,
    imageUrl:
      'https://images.unsplash.com/photo-1767379462101-b93554f3025c?auto=format&fit=crop&w=1080&q=80',
    category: 'lips',
    rating: 5,
    stock: 18,
    featured: true,
    bestseller: false,
    badge: 'New',
    isPreorder: false,
  },
  {
    slug: 'crystal-dew-essence',
    name: 'Crystal Dew Essence',
    description: 'A limited pre-order essence for glass-skin radiance',
    priceCents: 4800,
    imageUrl:
      'https://images.unsplash.com/photo-1556228634-2e0de958b4b7?auto=format&fit=crop&w=1080&q=80',
    category: 'skincare',
    rating: 5,
    stock: 0,
    featured: false,
    bestseller: false,
    badge: 'Pre-order',
    isPreorder: true,
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const pool = new Pool({
    connectionString: url,
    ssl: url.includes('supabase') ? { rejectUnauthorized: isProduction } : undefined,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    for (const product of products) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        create: product,
        update: {
          name: product.name,
          description: product.description,
          priceCents: product.priceCents,
          imageUrl: product.imageUrl,
          category: product.category,
          rating: product.rating,
          featured: product.featured,
          bestseller: product.bestseller,
          badge: product.badge,
          isPreorder: product.isPreorder,
        },
      });
    }

    const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@deedaa.local').toLowerCase();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'DeedaaAdmin1';
    const customerEmail = (process.env.SEED_CUSTOMER_EMAIL ?? 'demo@deedaa.local').toLowerCase();
    const customerPassword = process.env.SEED_CUSTOMER_PASSWORD ?? 'DeedaaShop1';

    const adminHash = await bcrypt.hash(adminPassword, 12);
    const customerHash = await bcrypt.hash(customerPassword, 12);

    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        passwordHash: adminHash,
        name: 'Deedaa Admin',
        role: Role.ADMIN,
      },
      update: { role: Role.ADMIN },
    });

    await prisma.user.upsert({
      where: { email: customerEmail },
      create: {
        email: customerEmail,
        passwordHash: customerHash,
        name: 'Demo Customer',
        role: Role.CUSTOMER,
      },
      update: {},
    });

    console.log(`Seeded ${products.length} products and demo users`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
