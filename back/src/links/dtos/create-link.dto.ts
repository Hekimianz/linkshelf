import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateLinkDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsUrl()
  url!: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expires_at?: Date;
}
