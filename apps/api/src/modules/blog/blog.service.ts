import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database.module';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Injectable()
export class BlogService {
  constructor(private db: DatabaseService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  async getPublished() {
    return this.db.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true, title: true, slug: true, excerpt: true,
        category: true, readTime: true, author: true, authorRole: true,
        featured: true, primaryFeatured: true, publishedAt: true, createdAt: true,
      },
    });
  }

  async getBySlug(slug: string) {
    const post = await this.db.blogPost.findUnique({ where: { slug } });
    if (!post || post.status !== 'PUBLISHED') throw new NotFoundException('Article not found');
    return post;
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async getAll() {
    return this.db.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, slug: true, excerpt: true, category: true,
        readTime: true, author: true, status: true, featured: true,
        primaryFeatured: true, publishedAt: true, createdAt: true, updatedAt: true,
      },
    });
  }

  async getOne(id: string) {
    const post = await this.db.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async create(dto: any) {
    const slug = dto.slug || slugify(dto.title);
    return this.db.blogPost.create({
      data: {
        ...dto,
        slug,
        publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
        updatedAt: new Date(),
      },
    });
  }

  async update(id: string, dto: any) {
    const existing = await this.db.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');

    const wasPublished = existing.status === 'PUBLISHED';
    const nowPublished = dto.status === 'PUBLISHED';

    return this.db.blogPost.update({
      where: { id },
      data: {
        ...dto,
        publishedAt: !wasPublished && nowPublished ? new Date() : existing.publishedAt,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string) {
    await this.db.blogPost.delete({ where: { id } });
    return { ok: true };
  }
}
