import { AppError } from "../../../utils/app.error";
import { capitalizeWords } from "../../../utils/capitalize.word";
import prisma from "../../prisma/prisma.service";
import { CreateOutletDTO } from "./dto/create.outlet.dto";
import { UpdateOutletDTO } from "./dto/update.outlet.dto";

export class OutletService {
  getAllOutlets = async () => {
    return await prisma.outlet.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        address: true,
        phoneNumber: true,
        city: true,
        isActive: true,
        OutletSchedule: true,
      },
    });
  };

  createOutlet = async (data: CreateOutletDTO) => {
    try {
      const normalizedName = data.name.trim().toUpperCase();
      const normalizedAddress = data.address.trim().toLowerCase();
      const normalizedCity = capitalizeWords(data.city.trim());

      const existingName = await prisma.outlet.findFirst({
        where: { name: normalizedName },
      });
      if (existingName) {
        throw new AppError("Outlet name already exists", 400);
      }

      const existingAddress = await prisma.outlet.findFirst({
        where: { address: normalizedAddress },
      });
      if (existingAddress) {
        throw new AppError("Outlet address already exists", 400);
      }

      const existingPhoneNumber = await prisma.outlet.findFirst({
        where: { phoneNumber: data.phoneNumber },
      });
      if (existingPhoneNumber) {
        throw new AppError("Outlet phone number already exists", 400);
      }

      const outlet = await prisma.outlet.create({
        data: {
          name: normalizedName,
          address: normalizedAddress,
          phoneNumber: data.phoneNumber,
          city: normalizedCity,
          postalCode: data.postalCode,
          latitude: data.latitude,
          longitude: data.longitude,
          coverageArea: data.coverageArea,
        },
      });

      return outlet;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Failed to create outlet", 500);
    }
  };

  getOutletDetailById = async (outletId: string) => {
    const outlet = await prisma.outlet.findFirst({
      where: { id: outletId, deletedAt: null },
      include: {
        OutletSchedule: true,
      },
    });

    if (!outlet) {
      throw new AppError("Outlet not found", 404);
    }

    return outlet;
  };

  updateOutlet = async (outletId: string, data: UpdateOutletDTO) => {
    const normalizedName = data.name?.trim().toUpperCase();
    const normalizedAddress = data.address?.trim().toLowerCase();
    const normalizedCity = data.city
      ? capitalizeWords(data.city.trim())
      : undefined;

    const outlet = await prisma.outlet.findFirst({
      where: { id: outletId, deletedAt: null },
    });
    if (!outlet) {
      throw new AppError("Outlet not found", 404);
    }

    if (normalizedName) {
      const existingName = await prisma.outlet.findFirst({
        where: {
          name: normalizedName,
          id: { not: outletId },
        },
      });
      if (existingName) {
        throw new AppError("Outlet name already exists", 400);
      }
    }

    if (normalizedAddress) {
      const existingAddress = await prisma.outlet.findFirst({
        where: {
          address: normalizedAddress,
          id: { not: outletId },
        },
      });
      if (existingAddress) {
        throw new AppError("Outlet address already exists", 400);
      }
    }

    if (data.phoneNumber) {
      const existingPhone = await prisma.outlet.findFirst({
        where: {
          phoneNumber: data.phoneNumber,
          id: { not: outletId },
        },
      });
      if (existingPhone) {
        throw new AppError("Outlet phone number already exists", 400);
      }
    }

    const updatedOutlet = await prisma.outlet.update({
      where: { id: outletId, deletedAt: null },
      data: {
        ...(data.name && { name: normalizedName }),
        ...(data.address && { address: normalizedAddress }),
        ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
        ...(data.city && { city: normalizedCity }),
        ...(data.postalCode && { postalCode: data.postalCode }),
        ...(data.latitude && { latitude: data.latitude }),
        ...(data.longitude && { longitude: data.longitude }),
        ...(data.coverageArea && { coverageArea: data.coverageArea }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return updatedOutlet;
  };

  deleteOutlet = async (outletId: string) => {
    const outlet = await prisma.outlet.findFirst({
      where: { id: outletId, deletedAt: null },
    });
    if (!outlet) {
      throw new AppError("Outlet not found", 404);
    }

    const deletedOutlet = await prisma.outlet.update({
      where: { id: outletId },
      data: { deletedAt: new Date() },
    });

    return deletedOutlet;
  };
}
