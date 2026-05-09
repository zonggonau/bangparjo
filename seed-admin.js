const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@bangparjo.shop';
  const password = 'admin123'; // Silakan ganti setelah login
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN'
    },
    create: {
      email,
      name: 'Admin Bang Parjo',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });
  
  console.log('Admin user created/updated:', user.email);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
