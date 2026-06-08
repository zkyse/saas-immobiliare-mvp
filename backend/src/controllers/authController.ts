import { Request, Response } from 'express';
import prisma from '../db';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, companyName } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: companyName,
        slug: companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        email,
      },
    });

    // Create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'ADMIN',
      },
    });

    // Generate token
    const token = generateToken({
      sub: user.id,
      tenantId: tenant.id,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      token,
      tenant,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate token
    const token = generateToken({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { tenant: true },
    });

    res.json({
      success: true,
      user: {
        id: user?.id,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        role: user?.role,
      },
      tenant: {
        id: user?.tenant.id,
        name: user?.tenant.name,
        slug: user?.tenant.slug,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
