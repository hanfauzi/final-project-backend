// import { Sample } from "../../generated/prisma";


export class SampleService {
  async findSample({ name, code }: Pick<any, 'name' | 'code'>) {
    if (name && code) return true;
    return false;
  }
}
