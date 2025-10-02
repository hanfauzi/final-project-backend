import "reflect-metadata"; 
import type { VercelRequest, VercelResponse } from "@vercel/node";
import App from "../src/app";

const expressApp = new App().getExpress();

export default function handler(req: VercelRequest, res: VercelResponse) {
  return (expressApp as any)(req, res);
}