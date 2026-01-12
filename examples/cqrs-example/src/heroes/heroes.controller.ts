import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { HeroesService } from './heroes.service';

interface KillDragonDto {
  dragonId: string;
}

@Controller('heroes')
export class HeroesController {
  constructor(private readonly heroesService: HeroesService) {}

  @Get()
  findAll() {
    return this.heroesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.heroesService.findOne(id);
  }

  @Post(':id/kill')
  async killDragon(@Param('id') id: string, @Body() dto: KillDragonDto) {
    return this.heroesService.killDragon(id, dto.dragonId);
  }
}
