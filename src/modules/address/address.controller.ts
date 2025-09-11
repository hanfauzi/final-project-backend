import { Request, Response } from "express";
import { AddressService } from "./address.service";

export class AddressController {
  private addressService: AddressService;
  constructor() {
    this.addressService = new AddressService();
  }
  createCustomerAddress = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const body = req.body;
    const result = await this.addressService.createCustomerAddress({
      customerId,
      ...body,
    });
    res.status(201).json(result);
  };

  getCustomerAddresses = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const result = await this.addressService.getCustomerAddresses(customerId);
    res.status(200).json(result);
  };

  getCustomerAddressById = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const { id } = req.params;
    const result = await this.addressService.getCustomerAddressById(
      customerId,
      id
    );
    res.status(200).json(result);
  };

  editCustomerAddressById = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const { id } = req.params;
    const body = req.body;
    const result = await this.addressService.editCustomerAddressById(
      id,
      customerId,
      body
    );
    res.status(200).json(result);
  };

  deleteCustomerAddress = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const { id } = req.params;

    const result = await this.addressService.deleteCustomerAddress(
      customerId,
      id
    );
    res.status(200).json(result);
  };

  setPrimaryCustomerAddress = async (req: Request, res: Response) => {
    const customerId = res.locals.payload.id;
    const { id } = req.params;

    const result = await this.addressService.setPrimaryCustomerAddress(
      customerId,
      id
    );
    res.status(200).json(result);
  };
}
