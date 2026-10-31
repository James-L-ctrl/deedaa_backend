import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaClient, Role } from '../generated/prisma/client';

async function patchAdmin() {
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
    const email = "Lagunaj.james@gmail.com".toLowerCase();
    const password = "Pass-Admin-Log-In";
    const name = "Lagunaj James";

    const passwordHash = await bcrypt.hash(password, 12);

    console.log(`Patching admin user: ${email}...`);

    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash,
        name,
        role: Role.ADMIN,
      },
      update: {
        passwordHash,
        name,
        role: Role.ADMIN,
      },
    });

    console.log('Successfully patched admin user.');
  } catch (error) {
    console.error('Error patching admin:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

patchAdmin();
