// generate username dari full_name + random 4 angka, spasi diganti underscore
export const generateUsername = (fullName: string): string => {
  const base = fullName.toLowerCase().trim().replace(/\s+/g, '_');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${base}_${random}`;
};
