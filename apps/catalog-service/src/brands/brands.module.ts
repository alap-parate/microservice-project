import { Module } from "@nestjs/common";
import { BrandEntity } from "./entities/brand.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        TypeOrmModule.forFeature([BrandEntity]),
    ],
})
export class BrandsModule {}