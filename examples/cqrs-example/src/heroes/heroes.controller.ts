import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { HeroesService } from './heroes.service';

interface CreateHeroDto {
  name: string;
}

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
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.heroesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateHeroDto) {
    return this.heroesService.create(dto.name);
  }

  @Post(':id/kill')
  killDragon(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: KillDragonDto,
  ) {
    return this.heroesService.killDragon(id, dto.dragonId);
  }
}
