import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BrandEntity } from "../entities/brand.entity";
import { BrandSearchFilters, CreateBrandDto } from "../dto/brands.dto";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { isUniqueConstraintViolation } from "@app/utils/exceptions";

export class BrandsService {
    constructor(
        @InjectRepository(BrandEntity)
        private readonly brandRepository: Repository<BrandEntity>,
    ) {}

    async create(brand: CreateBrandDto): Promise<BrandEntity> {
        const newBrand = this.brandRepository.create(brand);

        try {
            return await this.brandRepository.save(newBrand);
        } catch (error) {
            if(isUniqueConstraintViolation(error)) {
                throw new ConflictException('Brand name already taken');
            }
            throw error;
        }
    }

    async updateBrand(id: string, brandName: string): Promise<BrandEntity> {
        const brand = await this.brandRepository.findOne({ where: { id } });

        if(!brand) {
            throw new NotFoundException('Brand not found');
        }

        brand.name = brandName;

        await this.brandRepository.save(brand);

        return brand;
    }

    async deleteBrandDto(id: string): Promise<void> {
        const brand = await this.brandRepository.findOne({ where: { id } });

        if(!brand) {
            throw new NotFoundException('Brand not found');
        }

        await this.brandRepository.delete(brand.id);

        return;
    }

    async findOne(id: string): Promise<BrandEntity> {
        const brand = await this.brandRepository.findOne({ where: { id } });
        if(!brand) {
            throw new NotFoundException('Brand not found');
        }

        return brand;
    }

    async findAll(filters: BrandSearchFilters): Promise<{ brands: BrandEntity[], total: number }> {
        const queryBuilder = this.brandRepository.createQueryBuilder('brand');
        const { name, page, limit, sort, sortBy } = filters;

        if(name) {
            queryBuilder.andWhere('brand.name ILIKE :name', { name: `%${name}%`});
        }

        if(page && limit) {
            queryBuilder.skip((page - 1) * limit).take(limit);
        }

        if(sort && sortBy) {
            queryBuilder.orderBy(`brand.${sortBy}`);
        }

        const [brands, total] = await queryBuilder.getManyAndCount();

        return {
            brands,
            total,
        };
    }
}