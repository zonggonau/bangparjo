const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
<<<<<<< HEAD
const prisma = new PrismaClient();
async function main() {
  const email = 'cristoperzonggonau@gmail.com';
  const password = 'Z0ngg0n4U';
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, role: 'ADMIN', name: 'Crist Zong' },
    create: { email, name: 'Crist Zong', password: hashedPassword, role: 'ADMIN' }
  });
  console.log('✅ Super admin:', user.email, '| Role:', user.role);
}
main().catch(e => console.error('❌', e)).finally(() => prisma.$disconnect());
=======

const prisma = new PrismaClient();

async function main() {
  const email = 'cristoperzonggonau@gmail.com';
  const password = 'Z0ngg0n4U';

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Crist Zong'
    },
    create: {
      email,
      name: 'Crist Zong',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('✅ Super admin created:', user.email, '| Role:', user.role);
}

main()
  .catch(e => console.error('❌', e))
  .finally(() => prisma.$disconnect());
>>>>>>> server
