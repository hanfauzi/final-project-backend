import { Router } from "express";
import { CityController } from "./city.controller";

export class CityRouter {
  private router: Router;
  private cityController: CityController
  constructor() {
    this.router = Router();
    this.cityController = new CityController()
    this.initializedRoutes();
  }
  private initializedRoutes = () => {
    

    this.router.get(
      "/cities",
      this.cityController.getCities
    );

   

   
  };

  getRouter = () => {
    return this.router;
  };
}
