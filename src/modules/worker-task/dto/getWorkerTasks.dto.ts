import { IsOptional, IsString, IsEnum } from "class-validator";
import { PaginationQueryParams } from "../../pagination/pagination.dto";

export enum WorkerTaskMode {
  HISTORY = "HISTORY",
  AVAILABLE_TASK = "AVAILABLE_TASK",
}

export class GetWorkerTasksDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

  @IsOptional()
  @IsString()
  yearMonth?: string;

  @IsOptional()
  @IsString()
  station?: string;

  @IsOptional()
  @IsString()
  outlet?: string;

  @IsOptional()
  @IsString()
  takenStatus?: string;

  @IsOptional()
  @IsEnum(WorkerTaskMode)
  mode?: WorkerTaskMode; 

  take: number = 10;
}
