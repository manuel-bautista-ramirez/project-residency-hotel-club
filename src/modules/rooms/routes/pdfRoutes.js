import express from "express";
import { generateAndSendDocuments } from "../utils/pdfService.js";

const router = express.Router();

router.post("/generate/:type", async (req, res) => {
  const { type } = req.params;
  const data = req.body; // Debe incluir id, client_name, email, telefono, etc.

  try {
    const result = await generateAndSendDocuments(data, type);
    if (result.success) {
      res.status(200).json({
        message: "✅ Documentos generados y enviados correctamente.",
        pdfPath: result.pdfPath,
        qrPath: result.qrPath,
      });
    } else {
      res.status(500).json({ message: "Error generando documentos." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
