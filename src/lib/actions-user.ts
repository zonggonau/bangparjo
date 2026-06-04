'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

export async function getUserAddressesAction(email: string) {
  if (!email) return { success: false, error: 'Email is required' };
  try {
    // Auth check: verify caller owns this email
    const session = await auth();
    if (!session?.user?.email || session.user.email !== email) {
      return { success: false, error: 'Unauthorized' };
    }
    const setting = await prisma.storeSetting.findUnique({
      where: { key: `USER_ADDRESSES_${email}` }
    });
    const addresses = setting ? JSON.parse(setting.value) : [];
    return { success: true, data: addresses };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveUserAddressAction(data: any) {
  try {
    const { email, label, name, phone, line1, line2, city, state, zip, country, isDefault, id } = data;
    if (!email || !name || !line1 || !city || !state || !zip) {
      return { success: false, error: 'Missing required fields' };
    }

    // Auth check: verify caller owns this email
    const session = await auth();
    if (!session?.user?.email || session.user.email !== email) {
      return { success: false, error: 'Unauthorized' };
    }

    // Input validation: max lengths
    const MAX_LEN = 200;
    if (name.length > MAX_LEN || line1.length > MAX_LEN || city.length > MAX_LEN || state.length > MAX_LEN || zip.length > 20) {
      return { success: false, error: 'Field value too long' };
    }

    const setting = await prisma.storeSetting.findUnique({
      where: { key: `USER_ADDRESSES_${email}` }
    });
    let addresses = setting ? JSON.parse(setting.value) : [];

    // Address count limit (max 10)
    if (!id && addresses.length >= 10) {
      return { success: false, error: 'Maximum 10 addresses allowed' };
    }

    if (id) {
      // Update
      addresses = addresses.map((a: any) => a.id === id ? { ...a, ...data } : a);
      if (isDefault) {
        addresses = addresses.map((a: any) => ({ ...a, isDefault: a.id === id }));
      }
    } else {
      // Create
      const newAddress = {
        id: `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        label: (label || 'Home').slice(0, 20),
        name: name.trim().slice(0, MAX_LEN),
        phone: (phone || '').trim().slice(0, 30),
        line1: line1.trim().slice(0, MAX_LEN),
        line2: (line2 || '').trim().slice(0, MAX_LEN),
        city: city.trim().slice(0, MAX_LEN),
        state: state.trim().slice(0, MAX_LEN),
        zip: zip.trim().slice(0, 20),
        country: (country || 'US').slice(0, 5),
        isDefault: isDefault || addresses.length === 0,
      };
      if (newAddress.isDefault) {
        addresses = addresses.map((a: any) => ({ ...a, isDefault: false }));
      }
      addresses.push(newAddress);
      data.id = newAddress.id;
    }

    await prisma.storeSetting.upsert({
      where: { key: `USER_ADDRESSES_${email}` },
      update: { value: JSON.stringify(addresses) },
      create: { key: `USER_ADDRESSES_${email}`, value: JSON.stringify(addresses) },
    });

    return { success: true, data: addresses.find((a: any) => a.id === data.id) || addresses[addresses.length - 1] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setDefaultUserAddressAction(email: string, id: string) {
  try {
    if (!email || !id) return { success: false, error: 'Missing fields' };

    // Auth check: verify caller owns this email
    const session = await auth();
    if (!session?.user?.email || session.user.email !== email) {
      return { success: false, error: 'Unauthorized' };
    }

    const setting = await prisma.storeSetting.findUnique({
      where: { key: `USER_ADDRESSES_${email}` }
    });
    if (!setting) return { success: false, error: 'No addresses found' };

    let addresses = JSON.parse(setting.value);
    addresses = addresses.map((a: any) => ({ ...a, isDefault: a.id === id }));

    await prisma.storeSetting.update({
      where: { key: `USER_ADDRESSES_${email}` },
      data: { value: JSON.stringify(addresses) },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUserAddressAction(email: string, id: string) {
  try {
    if (!email || !id) return { success: false, error: 'Missing required fields' };

    // Auth check: verify caller owns this email
    const session = await auth();
    if (!session?.user?.email || session.user.email !== email) {
      return { success: false, error: 'Unauthorized' };
    }

    const setting = await prisma.storeSetting.findUnique({
      where: { key: `USER_ADDRESSES_${email}` }
    });
    if (!setting) return { success: false, error: 'No addresses found' };

    let addresses = JSON.parse(setting.value);
    addresses = addresses.filter((a: any) => a.id !== id);

    if (addresses.length > 0 && !addresses.some((a: any) => a.isDefault)) {
      addresses[0].isDefault = true;
    }

    await prisma.storeSetting.update({
      where: { key: `USER_ADDRESSES_${email}` },
      data: { value: JSON.stringify(addresses) },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProfileAction(name: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }
    if (!name) {
      return { success: false, error: 'Name is required' };
    }
    await prisma.user.update({
      where: { email: session.user.email },
      data: { name },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCustomerOrdersAction(email: string) {
  try {
    if (!email) return { success: false, error: 'Email is required' };

    // Auth check: verify caller owns this email
    const session = await auth();
    if (!session?.user?.email || session.user.email !== email) {
      return { success: false, error: 'Unauthorized' };
    }

    const orders = await prisma.order.findMany({
      where: { customerEmail: email },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNum: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        checkoutToken: true,
        customerName: true,
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            variant: {
              select: {
                id: true,
                color: true,
                size: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  }
                }
              }
            }
          }
        }
      }
    });
    return { success: true, data: orders };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function trackOrderAction(id: string) {
  try {
    if (!id) return { success: false, error: 'Order ID is required' };

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNum: id },
          { cjOrderId: id },
        ],
      },
      select: {
        orderNum: true,
        status: true,
        trackingNumber: true,
        createdAt: true,
        customerEmail: true,
        cjResponse: true,
      },
    });

    if (!order) return { success: false, error: 'Order not found' };

    let logisticName: string | null = null;
    try {
      if (order.cjResponse) {
        const parsed = order.cjResponse as any;
        logisticName = parsed.logisticName || parsed.carrier || null;
      }
    } catch {}

    // Only return safe public tracking info — no PII, no financials
    return {
      success: true,
      order: {
        orderNum: order.orderNum,
        status: order.status,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt?.toISOString(),
        logisticName,
      },
    };
  } catch (err: any) {
    return { success: false, error: 'Server error' };
  }
}

// ── Update Account Email & Password ──────────────────────────────────────

export async function updateAccountAction(data: {
  currentPassword?: string;
  newEmail?: string;
  newPassword?: string;
  confirmPassword?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.password) {
      return { success: false, error: 'Account has no password set. Contact admin.' };
    }

    // Verify current password
    const isValid = await bcrypt.compare(data.currentPassword || '', user.password);
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Update email if provided
    if (data.newEmail && data.newEmail !== user.email) {
      // Email changes are disabled for security — require re-verification flow
      return { success: false, error: 'Email changes are not supported. Please contact support.' };
    }

    // Update password if provided
    if (data.newPassword) {
      if (data.newPassword.length < 6) {
        return { success: false, error: 'New password must be at least 6 characters' };
      }
      if (data.newPassword !== data.confirmPassword) {
        return { success: false, error: 'Passwords do not match' };
      }
      const hashedPassword = await bcrypt.hash(data.newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
