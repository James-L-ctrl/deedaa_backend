import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { AddCartItemDto } from './cart.dto';

export class MergeCartBodyDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => AddCartItemDto)
  items: AddCartItemDto[];
}
