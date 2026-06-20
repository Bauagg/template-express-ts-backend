import { Transaction } from 'sequelize';
import { findNamingSeriesByKey, createNamingSeries, incrementSeq } from './repository';

// Format id: PREFIX_YEAR_COMPANYCODE, contoh: PRO_2026_1111
const buildId = (prefix: string, year: number, company_code: string) =>
  `${prefix}_${year}_${company_code}`;

// Format nomor dokumen: PREFIX/YEAR/COMPANYCODE/SEQ (SEQ 7 digit), contoh: PRO/2026/1111/0000001
const buildSerialNumber = (prefix: string, year: number, company_code: string, seq: number) =>
  `${prefix}/${year}/${company_code}/${String(seq).padStart(7, '0')}`;

export const generateSerialNumber = async (
  prefix: string,
  year: number,
  company_code: string,
  t?: Transaction
): Promise<string> => {
  const existing = await findNamingSeriesByKey(prefix, year, company_code, t);

  if (existing) {
    // increment di DB dulu, lalu baca ulang supaya dapat nilai aktual bukan nilai lama di memory
    await incrementSeq(existing.id, t);
    const updated = await findNamingSeriesByKey(prefix, year, company_code, t);
    return buildSerialNumber(prefix, year, company_code, updated!.seq);
  }

  // belum ada kombinasi prefix+year+company_code → buat record baru, seq mulai 1
  const id = buildId(prefix, year, company_code);
  await createNamingSeries({ id, prefix, year, company_code, seq: 1 }, t);
  return buildSerialNumber(prefix, year, company_code, 1);
};
