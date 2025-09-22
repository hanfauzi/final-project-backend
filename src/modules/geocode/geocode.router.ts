import { Router } from "express";
import { GeocodeController } from "./geocode.controller";
// import { JwtVerify } from "../../middlewares/jwt-verify.middleware"; // ← kalau mau proteksi

export class GeocodeRouter {
  private router: Router;
  private geocodeController: GeocodeController;

  constructor() {
    this.router = Router();
    this.geocodeController = new GeocodeController();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {

    this.router.get("/reverse", this.geocodeController.reverse);


  };

  getRouter = () => this.router;
}
