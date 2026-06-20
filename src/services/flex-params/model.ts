import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../databases';

export interface FlexParamAttributes {
  id: string;
  type_param: string;
  value_param: string;
  description?: string | null;
  user_id: string;
  photo_id?: string | null;
  photo_url?: string | null;
  header_id?: string | null;
  created_at?: Date;
  created_by: string;
  updated_at?: Date;
  updated_by: string;
  deleted_at?: Date | null;
  deleted_by?: string | null;
}

export interface FlexParamCreationAttributes
  extends Optional<FlexParamAttributes, 'id' | 'description' | 'photo_id' | 'photo_url' | 'header_id' | 'deleted_at' | 'deleted_by'> {}

class FlexParam extends Model<FlexParamAttributes, FlexParamCreationAttributes> implements FlexParamAttributes {
  declare id: string;
  declare type_param: string;
  declare value_param: string;
  declare description: string | null;
  declare user_id: string;
  declare photo_id: string | null;
  declare photo_url: string | null;
  declare header_id: string | null;
  declare created_at: Date;
  declare created_by: string;
  declare updated_at: Date;
  declare updated_by: string;
  declare deleted_at: Date | null;
  declare deleted_by: string | null;
}

FlexParam.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type_param: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: { msg: 'Type param wajib diisi' },
        notEmpty: { msg: 'Type param tidak boleh kosong' },
      },
    },
    value_param: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: { msg: 'Value param wajib diisi' },
        notEmpty: { msg: 'Value param tidak boleh kosong' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notNull: { msg: 'User ID wajib diisi' },
        isUUID: { args: 4, msg: 'User ID harus berupa UUID valid' },
      },
    },
    photo_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
    },
    photo_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    header_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
    },
    created_by: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: { msg: 'Created by wajib diisi' },
        notEmpty: { msg: 'Created by tidak boleh kosong' },
      },
    },
    updated_by: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: { msg: 'Updated by wajib diisi' },
        notEmpty: { msg: 'Updated by tidak boleh kosong' },
      },
    },
    deleted_by: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'flex_params',
    underscored: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default FlexParam;
