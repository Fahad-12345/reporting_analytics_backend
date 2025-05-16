import { AutoIncrement, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';

import {
    users
} from '.';

enum Gender {
    M,
    F,
    X
}

export interface user_basic_infoI {
    address: string;
    apartment_suite: string;
    area_id: number;
    biography: string;
    cell_no: string;
    city: string;
    created_at: Date;
    created_by: number;
    date_of_birth: string;
    deleted_at: Date;
    department_id: number;
    designation_id: number;
    emergency_phone: string;
    employed_by_id: number;
    employment_type_id: number;
    extension: string;
    fax: string;
    file_id: number;
    first_name: string;
    from: Date;
    gender: Gender;
    hiring_date: Date;
    id: number;
    last_name: string;
    middle_name: string;
    profile_pic: string;
    profile_pic_url: string;
    social_security: string;
    state: string;
    title: string;
    to: Date;
    updated_at: Date;
    updated_by: number;
    user_id: number;
    work_phone: string;
    zip: string;
}

@Table({
    modelName: 'user_basic_info',
    tableName: 'user_basic_info',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
})
export class user_basic_info extends Model<user_basic_infoI> {

    @Column
    public address: string;

    @Column
    public apartment_suite: string;

    @Column
    public area_id: number;

    @Column
    public biography: string;

    @Column
    public cell_no: string;

    @Column
    public city: string;

    @Column
    public created_at: Date;

    @Column
    public created_by: number;

    @Column
    public date_of_birth: string;

    @Column
    public deleted_at: Date;

    @Column
    public department_id: number;

    @Column
    public designation_id: number;

    @Column
    public emergency_phone: string;

    @Column
    public employed_by_id: number;

    @Column
    public employment_type_id: number;

    @Column
    public extension: string;

    @Column
    public fax: string;

    @Column
    public file_id: number;

    @Column
    public first_name: string;

    @Column
    public from: Date;

    @Column
    public gender: Gender;

    @Column
    public hiring_date: Date;

    @PrimaryKey
    @AutoIncrement
    @Column
    public id: number;

    @Column
    public last_name: string;

    @Column
    public middle_name: string;

    @Column
    public profile_pic: string;

    @Column
    public profile_pic_url: string;

    @Column
    public social_security: string;

    @Column
    public state: string;

    @Column
    public title: string;

    @Column
    public to: Date;

    @Column
    public updated_at: Date;

    @Column
    public updated_by: number;

    @ForeignKey((): typeof users => users)
    @Column
    public user_id: number;

    @Column
    public work_phone: string;

    @Column
    public zip: string;
}
