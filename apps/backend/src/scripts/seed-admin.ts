import { NestFactory } from '@nestjs/core';
import bcrypt from 'bcrypt';
import { AppModule } from '../app.module.js';
import { getModelToken } from '@nestjs/mongoose';
import { SuperAdmin, SuperAdminRole } from '../database/schemas/super-admin.schema.js';

async function seedAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const superAdminModel = app.get(getModelToken(SuperAdmin.name));

  const email = process.env.ADMIN_SEED_EMAIL || 'admin@bizeazer.in';
  const password = process.env.ADMIN_SEED_PASSWORD || 'Admin@NotifyIQ2026!';

  console.log(`[SeedAdmin] Checking SuperAdmin account for ${email}...`);

  let admin = await superAdminModel.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 10);

  if (!admin) {
    admin = await superAdminModel.create({
      email,
      passwordHash,
      role: SuperAdminRole.PLATFORM_OWNER,
      permissions: ['*'],
      isActive: true,
      isTotpEnabled: false,
    });
    console.log(`[SeedAdmin] Created initial SuperAdmin (${email}) with role: platform_owner`);
  } else {
    admin.passwordHash = passwordHash;
    admin.role = SuperAdminRole.PLATFORM_OWNER;
    admin.permissions = ['*'];
    admin.isActive = true;
    await admin.save();
    console.log(`[SeedAdmin] Updated existing SuperAdmin (${email}) password and role`);
  }

  console.log(`[SeedAdmin] Seed complete. You can log in with:`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);

  await app.close();
}

seedAdmin().catch((err) => {
  console.error('[SeedAdmin] Error seeding admin:', err);
  process.exit(1);
});
