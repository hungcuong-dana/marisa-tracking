import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CurriculumService {
  constructor(private prisma: PrismaService) {}

  async getTree() {
    const levels = await this.prisma.level.findMany({
      orderBy: { order: 'asc' },
      include: {
        groups: {
          orderBy: { order: 'asc' },
          include: {
            categories: {
              orderBy: { order: 'asc' },
              include: {
                problems: { orderBy: { order: 'asc' } },
              },
            },
          },
        },
      },
    });

    return levels.map((lv) => ({
      key: lv.key,
      name: lv.name,
      tagline: lv.tagline,
      bg: lv.bg,
      fg: lv.fg,
      groups: lv.groups.map((g) => ({
        name: g.name,
        categories: g.categories.map((c) => ({
          key: c.key,
          name: c.name,
          freq: c.freq,
          problems: c.problems.map((p) => ({
            id: p.id,
            key: p.key,
            name: p.name,
            stars: p.stars,
            url: p.url,
          })),
        })),
      })),
    }));
  }
}
