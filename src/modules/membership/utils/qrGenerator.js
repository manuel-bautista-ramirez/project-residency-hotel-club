import QRCode from "qrcode";

export const generarQR = async function (data) {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: "H",
      type: "image/png",
      margin: 2,
      width: 300,
    });
  } catch (error) {
    console.error("Error generando QR:", error);
    throw error;
  }
}
