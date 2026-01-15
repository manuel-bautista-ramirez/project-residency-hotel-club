import express from "express";
import {
  showStore,
  renderCreateProduct,
  handleCreateProduct,
  renderEditProduct,
  handleUpdateProduct,
  handleDeleteProduct,
  handleAddStock, // Importar nuevo controlador
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

import {
  renderStoreDashboard,
  renderInventoryReport,
  getDashboardData,
  getStockAlerts
} from "../controllers/reportsController.js";
import { authMiddleware } from "../../../middlewares/validation/accessDenied.js";

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
routerStore.get("/store/edit/:id", renderEditProduct);
routerStore.post("/store/edit/:id", handleUpdateProduct);

// Eliminar producto (solo administradores)
routerStore.get("/store/delete/:id", handleDeleteProduct);
routerStore.post("/store/delete/:id", handleDeleteProduct);

// Añadir stock a producto (solo administradores)
routerStore.post("/store/inventory/add-stock/:id", handleAddStock);

// =====================================================
//              RUTAS DE VENTAS
// =====================================================

// Checkout (finalizar compra)
routerStore.get("/store/checkout", renderCheckout);
routerStore.post("/store/checkout", handleCheckout);

// Mostrar lista de ventas
routerStore.get("/store/sales", showSales);

// Detalle de venta
routerStore.get("/store/sales/:id", showSaleDetail);

// Eliminar venta (solo administradores)
routerStore.get("/store/sales/delete/:id", handleDeleteSale);
routerStore.post("/store/sales/delete/:id", handleDeleteSale);

// =====================================================
//              RUTAS DE REPORTES
// =====================================================

// Dashboard del store (solo administradores)
routerStore.get("/store/dashboard", renderStoreDashboard);

// Reporte de inventario (solo administradores)
routerStore.get("/store/inventory", renderInventoryReport);

// Página de reportes
routerStore.get("/store/reports", renderReports);

// Generar reporte (API)
routerStore.get("/store/api/reports", generateReport);

// Enviar reporte por email
routerStore.post("/store/api/reports/email", sendReportByEmail);

// Enviar reporte por WhatsApp
routerStore.post(
  "/store/api/reports/whatsapp",
  sendReportByWhatsApp
);

// API para datos del dashboard
routerStore.get("/store/api/dashboard", getDashboardData);

// API para alertas de stock
routerStore.get("/store/api/stock-alerts", getStockAlerts);

export { routerStore };
