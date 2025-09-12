import { IsInt, IsOptional, IsString, IsIn, Min } from "class-validator";
import { Type } from "class-transformer";

export class GetAllOrdersDto {
  @IsOptional()
  @IsString()
  outletId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @IsString()
  sortBy: string = "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder: "asc" | "desc" = "desc";
}
