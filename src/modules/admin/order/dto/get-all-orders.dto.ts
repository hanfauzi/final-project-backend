import { IsInt, IsOptional, IsString, IsIn, Min, IsUUID, IsDateString, IsEnum } from "class-validator";
import { Transform, Type } from "class-transformer";
import { $Enums, OrderStatus } from "../../../../generated/prisma";


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

   @IsOptional()
  @IsEnum(OrderStatus, {
    message: `status must be one of: ${Object.values(OrderStatus).join(", ")}`,
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value))
  status?: OrderStatus;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
