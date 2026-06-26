import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

class ReorderLinkItem {
  @IsNotEmpty()
  @IsString()
  id!: string;

  @IsPositive()
  @IsNumber()
  position!: number;
}

export class ReorderLinksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderLinkItem)
  ids!: ReorderLinkItem[];
}
