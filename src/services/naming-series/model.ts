import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../databases';

export interface NamingSeriesAttributes {
  id: string;
  prefix: string;
  year: number;
  company_code: string;
  seq: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface NamingSeriesCreationAttributes
  extends Optional<NamingSeriesAttributes, 'id' | 'seq'> {}

class NamingSeries extends Model<NamingSeriesAttributes, NamingSeriesCreationAttributes> implements NamingSeriesAttributes {
  declare id: string;
  declare prefix: string;
  declare year: number;
  declare company_code: string;
  declare seq: number;
  declare created_at: Date;
  declare updated_at: Date;
}

NamingSeries.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      // format: PREFIX_YEAR_COMPANY_CODE contoh: PRO_2026_1111
    },
    prefix: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notNull: { msg: 'Prefix wajib diisi' },
        notEmpty: { msg: 'Prefix tidak boleh kosong' },
      },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'Tahun wajib diisi' },
        isInt: { msg: 'Tahun harus berupa angka' },
      },
    },
    company_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notNull: { msg: 'Kode perusahaan wajib diisi' },
        notEmpty: { msg: 'Kode perusahaan tidak boleh kosong' },
      },
    },
    seq: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isInt: { msg: 'Sequence harus berupa angka' },
        min: { args: [1], msg: 'Sequence minimal 1' },
      },
    },
  },
  {
    sequelize,
    tableName: 'naming_series',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default NamingSeries;
