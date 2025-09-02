import { Router } from "express";
import { JwtVerify } from "../../middlewares/jwt-verify.middleware";
import { AddressController } from "./address.controller";
import { validateBody } from "../../middlewares/validate.middleware";
import { CreateCustomerAddressDTO } from "./dto/create-customer-address.dto";
import { EditCustomerAddressDTO } from "./dto/edit-customer-address.dto";

export class AddressRouter {
  private router: Router;
  private addressController: AddressController;
  constructor() {
    this.router = Router();
    this.addressController = new AddressController();
    this.initializedRoutes();
  }
  private initializedRoutes = () => {
    this.router.post(
      "/create",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      validateBody(CreateCustomerAddressDTO),
      this.addressController.createCustomerAddress
    );

    this.router.get(
      "/",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.addressController.getCustomerAddresses
    );

    this.router.get(
      "/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.addressController.getCustomerAddressById
    );

    this.router.patch(
      "/edit/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      validateBody(EditCustomerAddressDTO),
      this.addressController.editCustomerAddressById
    );

    this.router.delete(
      "/delete/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.addressController.deleteCustomerAddress
    );
    this.router.patch(
      "/primary/:id",
      JwtVerify.verifyToken,
      JwtVerify.verifyRole(["CUSTOMER"]),
      this.addressController.setPrimaryCustomerAddress
    );
  };
  getRouter = () => {
    return this.router;
  };
}
