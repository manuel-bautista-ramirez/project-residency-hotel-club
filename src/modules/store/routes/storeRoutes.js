import express from "express";
import {
  showStore,
  renderCreateProduct,
  handleCreateProduct,
  renderEditProduct,
  handleUpdateProduct,
  handleDeleteProduct,
  renderCheckout,
  handleCheckout,
  showSales,
  showSaleDetail,
  handleDeleteSale,
  renderReports,
  generateReport,
  sendReportByEmail,
  sendReportByWhatsApp,
} from "../controllers/storeController.js";
import { authMiddleware } from "../../login/middlewares/accessDenied.js";

const routerStore = express.Router();

// =====================================================
//              RUTAS DE PRODUCTOS
// =====================================================

routerStore.use(authMiddleware);

// Mostrar tienda (todos los usuarios autenticados)
routerStore.get("/store", showStore);

// Crear producto (solo administradores)
routerStore.get("/store/create", renderCreateProduct);
routerStore.post("/store/create", handleCreateProduct);

// Editar producto (solo administradores)
routerStore.get("/edit/:id", renderEditProduct);
routerStore.post("/edit/:id", handleUpdateProduct);

// Eliminar producto (solo administradores)
routerStore.get("/delete/:id", handleDeleteProduct);

// =====================================================
//              RUTAS DE VENTAS
// =====================================================

// Checkout (finalizar compra)
routerStore.get("/checkout",  renderCheckout);
routerStore.post("/checkout", handleCheckout);

// Lista de ventas
routerStore.get("/sales", showSales);

// Detalle de venta
routerStore.get("/sales/:id",  showSaleDetail);

// Eliminar venta (solo administradores)
routerStore.get(
  "/sales/delete/:id",
  handleDeleteSale
);

// =====================================================
//              RUTAS DE REPORTES
// =====================================================

// Página de reportes
routerStore.get("/store/reports", renderReports);

// Generar reporte (API)
routerStore.get("/api/reports", generateReport);

// Enviar reporte por email
routerStore.post("/api/reports/email",  sendReportByEmail);

// Enviar reporte por WhatsApp
routerStore.post(
  "/api/reports/whatsapp",
  sendReportByWhatsApp
);

export { routerStore };
