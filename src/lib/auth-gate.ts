import { prisma } from './db';

/**
 * Checks if an email address is authorized to log in or request an OTP code.
 * - Admin users are always allowed.
 * - Regular users must have an active subscription OR at least one paid/completed order.
 */
export async function isEmailAuthorized(email: string): Promise<{
  authorized: boolean;
  isAdmin: boolean;
  userExists: boolean;
  reason?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      authorized: false,
      isAdmin: false,
      userExists: false,
      reason: 'Invalid email format.'
    };
  }

  // 1. Check if user exists in the database
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
    select: { id: true, role: true, password: true }
  });

  // If the user has an ADMIN role, they are always authorized to login
  if (user && user.role === 'ADMIN') {
    return { authorized: true, isAdmin: true, userExists: true };
  }

  // 2. Check if the email exists as an active subscriber
  const subscriber = await prisma.subscriber.findUnique({
    where: { email: cleanEmail },
    select: { isActive: true }
  });

  if (subscriber && subscriber.isActive) {
    return { authorized: true, isAdmin: false, userExists: !!user };
  }

  // 3. Check if the email is associated with any purchase order (even UNPAID)
  // This allows customers to login immediately after placing an order to pay or cancel it.
  const anyOrder = await prisma.order.findFirst({
    where: {
      customerEmail: cleanEmail,
      status: {
        in: ['UNPAID', 'PAID', 'FULFILLING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
      }
    },
    select: { id: true }
  });

  if (anyOrder) {
    return { authorized: true, isAdmin: false, userExists: !!user };
  }

  // 4. Otherwise, this user is not authorized to login/register arbitrarily
  return {
    authorized: false,
    isAdmin: false,
    userExists: !!user,
    reason: 'Your email is not registered as a buyer or active subscriber. Please make a purchase or subscribe first.'
  };
}
