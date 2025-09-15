import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class ClockInAttendanceDTO {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;
}
