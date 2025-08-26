// import { SampleController } from './sample.controller';
// import { Router } from 'express';
// import { JwtVerify } from '../../middlewares/jwt-verify.middleware';

// export class SampleRouter {
//   private router: Router;
//   private sampleController: SampleController;

//   constructor() {
//     this.sampleController = new SampleController();
//     this.router = Router();
//     this.initializeRoutes();
//   }

//   private initializeRoutes(): void {
//     this.router.post(
//       '/samples',
//       JwtVerify.verifyToken(process.env.JWT_SECRET_KEY!),
//       this.sampleController.getSampleData
//     );
//   }

//   getRouter(): Router {
//     return this.router;
//   }
// }
