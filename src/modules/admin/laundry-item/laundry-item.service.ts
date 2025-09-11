import { AppError } from "../../../utils/app.error";
import prisma from "../../prisma/prisma.service";
import {
  CreateLaundryItemDTO,
  UpdateLaundryItemDTO,
} from "./dto/laundry-item.dto";

export class LaundryItemService {
  getAllLaundryItems = async () => {
    return await prisma.laundryItem.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  };

  getLaundryItemDetailById = async (id: string) => {
    const item = await prisma.laundryItem.findFirst({
      where: { id, deletedAt: null },
    });
    if (!item || item.deletedAt) {
      throw new AppError("Laundry item not found", 404);
    }
    return item;
  };

  createLaundryItem = async (data: CreateLaundryItemDTO) => {
    return await prisma.laundryItem.create({ data: { name: data.name } });
  };

  updateLaundryItem = async (id: string, data: UpdateLaundryItemDTO) => {
    return await prisma.laundryItem.update({
      where: { id },
      data: { ...data },
    });
  };

  deleteLaundryItem = async (id: string) => {
    return await prisma.laundryItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  };

  restoreLaundryItem = async (id: string) => {
     
    const item = await prisma.laundryItem.findUnique({
      where: { id, deletedAt: { not: null } },
    });
    if (!item) {
      throw new AppError("Laundry item not found or not deleted", 404);
    }

    return await prisma.laundryItem.update({
      where: { id },
      data: { deletedAt: null },
    });
}
}
