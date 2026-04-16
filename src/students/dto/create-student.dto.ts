import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  username: string;

  @IsString()
  @MinLength(1)
  password: string;

  @IsOptional()
  @IsString()
  parent?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  goal?: number;
}
