import { Prisma } from "../../../generated/prisma";
import { AppError } from "../../../utils/app.error";
import { capitalizeWords } from "../../../utils/capitalize.word";
import { getCoordinatesFromAddress } from "../../../utils/openCage";
import { getMeta, getPagination } from "../../../utils/pagination.helper";
import prisma from "../../prisma/prisma.service";
import { CityService } from "../../city/city.service";
import { CreateOutletDTO } from "./dto/create.outlet.dto";
import { UpdateOutletDTO } from "./dto/update.outlet.dto";

export class OutletService {
  private cityService: CityService;
  constructor() {
    this.cityService = new CityService();
  }
  getAllOutlets = async (query: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
  }) => {
    const {
      page,
      limit,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
    } = query;
    const { skip, take } = getPagination(page, limit);

    const whereCondition: Prisma.OutletWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { address: { contains: search, mode: "insensitive" } },
              { cityName: { contains: search, mode: "insensitive" } },
              { phoneNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [outlets, total] = await prisma.$transaction([
      prisma.outlet.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          address: true,
          phoneNumber: true,
          cityName: true,
          isActive: true,
          OutletSchedule: true,
          createdAt: true,
        },
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.outlet.count({
        where: whereCondition,
      }),
    ]);

    return {
      data: outlets,
      meta: getMeta(total, page, limit),
    };
  };

  createOutlet = async (data: CreateOutletDTO) => {
    try {
      const normalizedName = data.name.trim().toUpperCase();
      const normalizedAddress = data.address.trim().toLowerCase();
      const normalizedCode = data.code?.trim().toUpperCase();
      const cities = await this.cityService.getCities();
      const selectedCity = cities.find((c) => c.cityId === String(data.cityId));
      if (!selectedCity) {
        throw new AppError("Invalid City ID", 400);
      }

      const existingOutlet = await prisma.outlet.findFirst({
        where: {
          OR: [
            { name: normalizedName },
            { address: normalizedAddress },
            { phoneNumber: data.phoneNumber },
          ],
        },
      });
      if (existingOutlet) {
        if (existingOutlet.name === normalizedName) {
          throw new AppError("Outlet name already exists", 400);
        }
        if (existingOutlet.address === normalizedAddress) {
          throw new AppError("Outlet address already exists", 400);
        }
        if (existingOutlet.phoneNumber === data.phoneNumber) {
          throw new AppError("Outlet phone number already exists", 400);
        }
      }
      const existingCode = await prisma.outlet.findFirst({
        where: { code: normalizedCode },
      });
      if (existingCode) {
        throw new AppError("Outlet code already exists, use another!", 400);
      }

      let latitude = data.latitude;
      let longitude = data.longitude;

      if (!latitude || !longitude) {
        const coords = await getCoordinatesFromAddress(data.address);
        latitude = coords.latitude;
        longitude = coords.longitude;
      }

      const outlet = await prisma.outlet.create({
        data: {
          name: normalizedName,
          address: normalizedAddress,
          phoneNumber: data.phoneNumber,
          cityId: selectedCity.cityId,
          cityName: selectedCity.cityName,
          postalCode: data.postalCode,
          latitude,
          longitude,
          coverageArea: data.coverageArea,
          isActive: true,
          code: normalizedCode,
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

  restoreOutlet = async (outletId: string) => {
    const deletedOutlet = await prisma.outlet.findFirst({
      where: { id: outletId, deletedAt: { not: null } },
    });

    if (!deletedOutlet) {
      throw new AppError("Outlet not found or not deleted", 404);
    }

    const restoredOutlet = await prisma.outlet.update({
      where: { id: outletId },
      data: { deletedAt: null },
    });

    return restoredOutlet;
  };
}
