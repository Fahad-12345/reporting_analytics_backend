import { AutoIncrement, Column, ForeignKey, HasOne, Model, PrimaryKey, Table } from 'sequelize-typescript';

import {
    user_basic_info,
} from '.';

export interface usersI {
    allow_multiple_assignment: boolean;
    created_at?: Date;
    created_by?: number;
    deleted_at?: Date;
    email: string;
    id: number;
    is_loggedIn: number;
    password: string;
    remember_token?: string;
    reset_key: string;
    status: number;
    updated_at?: Date;
    updated_by?: number;
    userBasicInfo?: user_basic_info;
}

@Table({
    modelName: 'users',
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
})
export class users extends Model<usersI> {

    @Column
    public allow_multiple_assignment: boolean;


    @Column
    public created_at: Date;

    @ForeignKey((): typeof users => users)
    @Column
    public created_by: number;

    @Column
    public deleted_at: Date;

    @Column
    public email: string;

    @PrimaryKey
    @AutoIncrement
    @Column
    public id: number;

    @Column
    public is_loggedIn: number;

    @Column
    public password: string;

    @Column
    public remember_token: string;

    @Column
    public reset_key: string;

    @Column
    public status: number;

    @Column
    public updated_at: Date;

    @ForeignKey((): typeof users => users)
    @Column
    public updated_by: number;

    @HasOne((): typeof user_basic_info => user_basic_info)
    public userBasicInfo: typeof user_basic_info;

}
