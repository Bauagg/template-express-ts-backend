import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../databases';

export interface FileAttributes {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  user_id: string;
  created_at?: Date;
  created_by: string;
  updated_at?: Date;
  updated_by: string;
  deleted_at?: Date | null;
  deleted_by?: string | null;
  ref_id?: string | null;
  ref_type?: string | null;
}

export interface FileCreationAttributes
  extends Optional<FileAttributes, 'id' | 'deleted_at' | 'deleted_by' | 'ref_id' | 'ref_type'> {}

class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes {
  declare id: string;
  declare file_name: string;
  declare file_url: string;
  declare file_type: string;
  declare user_id: string;
  declare ref_id: string | null;
  declare ref_type: string | null;
  declare created_at: Date;
  declare created_by: string;
  declare updated_at: Date;
  declare updated_by: string;
  declare deleted_at: Date | null;
  declare deleted_by: string | null;
}

File.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: { msg: 'Nama file wajib diisi' },
        notEmpty: { msg: 'Nama file tidak boleh kosong' },
      },
    },
    file_url: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: { msg: 'URL file wajib diisi' },
        notEmpty: { msg: 'URL file tidak boleh kosong' },
      },
    },
    file_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Tipe file wajib diisi' },
        notEmpty: { msg: 'Tipe file tidak boleh kosong' },
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notNull: { msg: 'User ID wajib diisi' },
        isUUID: { args: 4, msg: 'User ID harus berupa UUID valid' },
      },
    },
    ref_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
    },
    ref_type: {
      type: DataTypes.STRING(100),
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
    tableName: 'files',
    underscored: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default File;
