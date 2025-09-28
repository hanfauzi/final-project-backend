import { IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/pagination.dto";

export class ReqWorkerTaskBypassDTO{
  @IsOptional()
  @IsString()
  bypassReqNote?: string;
}
