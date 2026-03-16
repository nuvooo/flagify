import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { AuthGuard } from '../../shared/auth.guard';

@Controller('brands')
@UseGuards(AuthGuard)
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get(':brandId/flags')
  async findFlags(@Param('brandId') brandId: string) {
    return this.brandsService.findFlagsForBrand(brandId);
  }
}
