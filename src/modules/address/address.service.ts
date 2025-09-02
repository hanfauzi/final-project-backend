import { CustomerAddress, Label } from "../../generated/prisma";
import { AppError } from "../../utils/app.error";
import prisma from "../prisma/prisma.service";
import { CreateCustomerAddressDTO } from "./dto/create-customer-address.dto";
import { EditCustomerAddressDTO } from "./dto/edit-customer-address.dto";

export class AddressService {
  constructor() {}

  createCustomerAddress = async ({
    customerId,
    label,
    address,
    city,
    postalCode,
    latitude,
    longitude,
    notes,
    isPrimary,
    phoneNumber,
  }: CreateCustomerAddressDTO & { customerId: string }) => {
    const created = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { id: true },
      });
      if (!customer) throw new AppError("Customer not found", 404);

      if (isPrimary) {
        await tx.customerAddress.updateMany({
          where: { customerId, deletedAt: null, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return tx.customerAddress.create({
        data: {
          customerId,
          label,
          address,
          city,
          postalCode,
          phoneNumber,
          latitude,
          longitude,
          notes: notes ?? null,
          isPrimary,
        },
        select: {
          id: true,
          label: true,
          address: true,
          city: true,
          postalCode: true,
          phoneNumber: true,
          latitude: true,
          longitude: true,
          notes: true,
          isPrimary: true,
        },
      });
    });
    return { message: "Create address success", data: created };
  };

  getCustomerAddresses = async (customerId: string) => {
    const addresses = await prisma.customerAddress.findMany({
      where: { customerId, deletedAt: null },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        label: true,
        address: true,
        city: true,
        postalCode: true,
        phoneNumber: true,
        latitude: true,
        longitude: true,
        notes: true,
        isPrimary: true,
      },
    });
    return addresses;
  };

  getCustomerAddressById = async (customerId: string, id: string) => {
    const address = await prisma.customerAddress.findFirst({
      where: { id, customerId, deletedAt: null },
      select: {
        id: true,
        label: true,
        address: true,
        city: true,
        postalCode: true,
        phoneNumber: true,
        latitude: true,
        longitude: true,
        notes: true,
        isPrimary: true,
      },
    });

    if (!address) {
      throw new AppError("Address not found!", 404);
    }

    return address;
  };

  editCustomerAddressById = async (
    id: string,
    customerId: string,
    body: EditCustomerAddressDTO
  ) => {
    const currentAddress = await prisma.customerAddress.findFirst({
      where: { id, customerId, deletedAt: null },
      select: { id: true, isPrimary: true },
    });

    if (!currentAddress) {
      throw new AppError("Address not found!", 404);
    }

    const edited = await prisma.$transaction(async (tx) => {
      if (body.isPrimary === true) {
        await tx.customerAddress.updateMany({
          where: { customerId, deletedAt: null, isPrimary: true },
          data: {
            isPrimary: false,
          },
        });
      }

      return tx.customerAddress.update({
        where: { id },
        data: {
          label: body.label ?? undefined,
          address: body.address ?? undefined,
          city: body.city ?? undefined,
          postalCode: body.postalCode ?? undefined,
          phoneNumber: body.phoneNumber ?? undefined,
          latitude: body.latitude ?? undefined,
          longitude: body.longitude ?? undefined,
          notes: body.notes ?? undefined,
          isPrimary: body.isPrimary ?? undefined,
        },
        select: {
          id: true,
          label: true,
          address: true,
          city: true,
          postalCode: true,
          phoneNumber: true,
          latitude: true,
          longitude: true,
          notes: true,
          isPrimary: true,
        },
      });
    });
    return edited;
  };

  deleteCustomerAddress = async (customerId: string, id: string) => {
    const address = await prisma.customerAddress.findFirst({
      where: { id, customerId, deletedAt: null },
      select: { id: true, isPrimary: true },
    });

    if (!address) {
      throw new AppError("Address not found!", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.customerAddress.update({
        where: { id },
        data: { deletedAt: new Date(), isPrimary: false },
      });

      if (address.isPrimary) {
        const newest = await tx.customerAddress.findFirst({
          where: { customerId, deletedAt: null },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });
        if (newest) {
          await tx.customerAddress.update({
            where: { id: newest.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    return { message: "Delete address success" };
  };

  setPrimaryCustomerAddress = async (customerId: string, id: string) => {
    const address = await prisma.customerAddress.findFirst({
      where: { id, customerId, deletedAt: null },
      select: { id: true },
    });
    if (!address) throw new AppError("Address not found", 404);

    const updatedAddress = await prisma.$transaction(async (tx) => {
      await tx.customerAddress.updateMany({
        where: { customerId, deletedAt: null, isPrimary: true },
        data: { isPrimary: false },
      });

      return tx.customerAddress.update({
        where: { id },
        data: { isPrimary: true },
        select: {
          id: true,
          label: true,
          address: true,
          city: true,
          postalCode: true,
          phoneNumber: true,
          latitude: true,
          longitude: true,
          notes: true,
          isPrimary: true,
        },
      });
    });

    return { message: "Set primary success", data: updatedAddress };
  };
}
