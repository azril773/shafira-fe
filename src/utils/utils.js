export function getErrorMessage(error) {
  return error.response?.data?.message
    ? error.response.data.message
    : error.message;
}

export const validateBarcode = (barcode) => {
  let result = false;
  switch (barcode.length) {
    case 13:
      if (/^\d{13}$/.test(barcode)) {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
          const digit = parseInt(barcode[i], 10);
          sum += i % 2 === 0 ? digit : digit * 3;
        }
        const checksum = (10 - (sum % 10)) % 10;
        const lastDigit = parseInt(barcode[12], 10);
        result = checksum === lastDigit;
      }
      break;
    case 12:
      if (/^\d{12}$/.test(barcode)) {
        let sum = 0;
        for (let i = 0; i < 11; i++) {
          const digit = parseInt(barcode[i], 10);
          sum += i % 2 === 0 ? digit * 3 : digit;
        }
        const checksum = (10 - (sum % 10)) % 10;
        const lastDigit = parseInt(barcode[11], 10);
        result = checksum === lastDigit;
      }
      break;
    default:
      result = false;
  }
  return result;
};