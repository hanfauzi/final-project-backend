import prisma from "../../prisma/prisma.service";

export class LaundryServiceService {
  getAllServices = async () => {
    return await prisma.service.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        name: "asc",
      },
      include: {
        serviceCatId: true,
      },
    });
  };

  getServiceById = async (id: string) => {
    return await prisma.service.findFirst({
      where: { id, deletedAt: null },
      include: { serviceCatId: true },
    });
  };
}
