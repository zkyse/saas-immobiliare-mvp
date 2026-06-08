import { Request, Response } from 'express';
import prisma from '../db';

export const getProperties = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, type, status, city } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { tenantId: req.tenantId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (city) where.city = { contains: String(city), mode: 'insensitive' };

    const properties = await prisma.property.findMany({
      where,
      skip,
      take: Number(limit),
      include: { agent: true, images: true },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.property.count({ where });

    res.json({
      success: true,
      data: properties,
      meta: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findFirst({
      where: { id, tenantId: req.tenantId },
      include: { agent: true, images: true },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ success: true, data: property });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createProperty = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      type,
      status,
      address,
      city,
      province,
      zipCode,
      country,
      rooms,
      bedrooms,
      bathrooms,
      squareMeters,
      price,
      features,
    } = req.body;

    const property = await prisma.property.create({
      data: {
        tenantId: req.tenantId,
        agentId: req.userId,
        title,
        description,
        type,
        status,
        address,
        city,
        province,
        zipCode,
        country,
        rooms,
        bedrooms,
        bathrooms,
        squareMeters,
        price,
        pricePerSqm: price / squareMeters,
        features,
      },
      include: { agent: true, images: true },
    });

    res.status(201).json({ success: true, data: property });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const property = await prisma.property.findFirst({
      where: { id, tenantId: req.tenantId },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const updated = await prisma.property.update({
      where: { id },
      data,
      include: { agent: true, images: true },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findFirst({
      where: { id, tenantId: req.tenantId },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    await prisma.property.delete({ where: { id } });

    res.json({ success: true, message: 'Property deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
