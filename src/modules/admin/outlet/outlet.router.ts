import { Router } from "express";
import { OutletController } from "./outlet.controller";
import { JwtVerify } from "../../../middlewares/jwt-verify.middleware";
import { validateBody } from "../../../middlewares/validate.middleware";
import { CreateOutletDTO } from "./dto/create.outlet.dto";
import { UpdateOutletDTO } from "./dto/update.outlet.dto";


export class OutletRouter {
    private outletController: OutletController;
    private router: Router;

    constructor() {
        this.outletController = new OutletController();
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get("/", JwtVerify.verifyToken, JwtVerify.verifyRole(["SUPER_ADMIN"]), this.outletController.getAllOutlets);
        this.router.get("/:id", JwtVerify.verifyToken, JwtVerify.verifyRole(["SUPER_ADMIN"]), this.outletController.getOutletDetailById);
        this.router.post("/", JwtVerify.verifyToken, JwtVerify.verifyRole(["SUPER_ADMIN"]), validateBody(CreateOutletDTO), this.outletController.createOutlet);
        this.router.patch("/:id", JwtVerify.verifyToken, JwtVerify.verifyRole(["SUPER_ADMIN"]), validateBody(UpdateOutletDTO), this.outletController.updateOutlet);
        this.router.delete("/:id", JwtVerify.verifyToken, JwtVerify.verifyRole(["SUPER_ADMIN"]), this.outletController.deleteOutlet);
    }

    getRouter(): Router {
        return this.router;
    }
}