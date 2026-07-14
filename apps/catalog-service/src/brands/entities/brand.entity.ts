import { BaseEntity } from "@app/database";
import { Column, Entity, Index } from "typeorm";

@Index('idx_brand_name', ['name'], { unique: true})
@Entity({
    name: 'brands'
})
export class BrandEntity extends BaseEntity {

    @Column({
        type: 'varchar',
        length: 100,
        nullable: false,
        unique: true,
    })
    name: string;

}