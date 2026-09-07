"use strict";
/**
 * Database seeder — creates the single demo user.
 *
 * Run with:  npm run seed
 *
 * This is idempotent: if the user already exists it will not be modified.
 * The password is bcrypt-hashed with cost factor 12.
 *
 * Demo credentials:
 *   Email:    demo@example.com
 *   Password: password
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config"); // Load .env before Prisma initialises
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    // Hash password with bcrypt (cost factor 12 is a good balance of security/speed)
    const passwordHash = await bcryptjs_1.default.hash('password', 12);
    const user = await prisma.user.upsert({
        where: { email: 'demo@example.com' },
        update: {}, // Do not overwrite existing data
        create: {
            email: 'demo@example.com',
            passwordHash,
            // subscriptionStatus defaults to "inactive" per the schema
        },
    });
    console.log(`✅ Demo user ready: ${user.email} (id: ${user.id})`);
    console.log('   Login with: demo@example.com / password');
}
main()
    .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
