import {
  getAllProducts, // Importar la nueva función
  getProductsWithLowStock,
  getBestSellingProducts,
  getSalesByCategory,
  generateInventoryReport
} from "../models/ModelStore.js";

// Dashboard del store con estadísticas
export const renderStoreDashboard = async (req, res) => {
  try {
    const user = req.session.user || {};

    if (user.role !== "Administrador") {
      return res.status(403).send("Acceso denegado");
    }

    // Obtener datos para el dashboard con manejo de errores
    let lowStockProducts = [];
    let bestSelling = [];
    let salesByCategory = [];
    let inventoryReport = { por_categoria: [], resumen_general: { productos_totales: 0, stock_total: 0, valor_total_inventario: 0, productos_agotados: 0, productos_stock_bajo: 0 } };

    try {
      lowStockProducts = await getProductsWithLowStock(5);
    } catch (error) {
      console.warn('⚠️ No se pudieron obtener productos con stock bajo:', error.message);
    }

    try {
      bestSelling = await getBestSellingProducts(30);
    } catch (error) {
      console.warn('⚠️ No se pudieron obtener productos más vendidos:', error.message);
    }

    try {
      salesByCategory = await getSalesByCategory(30);
    } catch (error) {
      console.warn('⚠️ No se pudieron obtener estadísticas por categoría:', error.message);
    }

    try {
      inventoryReport = await generateInventoryReport();
    } catch (error) {
      console.warn('⚠️ No se pudo generar reporte de inventario:', error.message);
    }

    res.render("storeDashboard", {
      title: "Dashboard de Tienda",
       showNavbar: true,
      showFooter: true,
      user,
      lowStockProducts,
      bestSelling,
      salesByCategory,
      inventoryReport
    });
  } catch (error) {
    console.error("Error en dashboard del store:", error);
    res.status(500).send("Error al cargar el dashboard");
  }
};

// Reporte de inventario
export const renderInventoryReport = async (req, res) => {
  try {
    const user = req.session.user || {};

    if (user.role !== "Administrador") {
      return res.status(403).send("Acceso denegado");
    }

    let allProducts = [];
    let inventoryReport = { por_categoria: [], resumen_general: { productos_totales: 0, stock_total: 0, valor_total_inventario: 0, productos_agotados: 0, productos_stock_bajo: 0 } };
    let lowStockProducts = [];

    try {
      allProducts = await getAllProducts();
    } catch (error) {
      console.warn('⚠️ No se pudieron obtener todos los productos:', error.message);
    }

    try {
      inventoryReport = await generateInventoryReport();
    } catch (error) {
      console.warn('⚠️ No se pudo generar reporte de inventario:', error.message);
    }

    try {
      lowStockProducts = await getProductsWithLowStock(10);
    } catch (error) {
      console.warn('⚠️ No se pudieron obtener productos con stock bajo:', error.message);
    }

    res.render("inventoryReport", {
      title: "Reporte de Inventario",
      showFooter: true,
      showNavbar: true,
      user,
      allProducts, // Pasar todos los productos a la vista
      inventoryReport,
      lowStockProducts
    });
  } catch (error) {
    console.error("Error en reporte de inventario:", error);
    res.status(500).send("Error al cargar el reporte de inventario");
  }
};

// API para obtener datos del dashboard
export const getDashboardData = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const [
      lowStockProducts,
      bestSelling,
      salesByCategory,
      inventoryReport
    ] = await Promise.all([
      getProductsWithLowStock(5),
      getBestSellingProducts(parseInt(days)),
      getSalesByCategory(parseInt(days)),
      generateInventoryReport()
    ]);

    res.json({
      success: true,
      data: {
        lowStockProducts,
        bestSelling,
        salesByCategory,
        inventoryReport
      }
    });
  } catch (error) {
    console.error("Error obteniendo datos del dashboard:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener datos del dashboard"
    });
  }
};

// API para alertas de stock bajo
export const getStockAlerts = async (req, res) => {
  try {
    const { minStock = 5 } = req.query;
    const lowStockProducts = await getProductsWithLowStock(parseInt(minStock));

    res.json({
      success: true,
      alerts: lowStockProducts.length,
      products: lowStockProducts
    });
  } catch (error) {
    console.error("Error obteniendo alertas de stock:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener alertas de stock"
    });
  }
};
