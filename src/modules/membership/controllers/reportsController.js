import { MembershipService } from "../services/membershipService.js";

const reportsController = {
  async getReportPreview(req, res) {
    try {
      const { period, date } = req.query;
      const reportData = await MembershipService.getReportPreviewData(period, date);
      res.json(reportData);
    } catch (error) {
      console.error("Error generating report preview:", error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || "Failed to generate report preview" });
    }
  },

  async downloadReportPDF(req, res) {
    try {
      const { period, date } = req.query;
      const { pdf, filename } = await MembershipService.generateReportPDF(period, date);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.send(pdf);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      if (error.isValidationError || error.isNoDataError) {
        // Redirect back to the reports page with a user-friendly error message
        return res.redirect(`/memberships/reports?error=${encodeURIComponent(error.message)}`);
      }
      res.status(500).send("Failed to generate PDF report");
    }
  },

  async renderReports(req, res) {
    const userRole = req.session.user?.role || "Recepcionista";
    const isAdmin = userRole === "Administrador";

    if (!isAdmin) {
      // It's better to render a proper access denied page
      return res.status(403).render('error', {
        title: "Acceso Denegado",
        message: "No tienes permiso para acceder a esta página."
      });
    }

    // Pass any error message from the query string to the view
    const { error } = req.query;
    res.render("reports", {
      title: "Reportes",
      isAdmin,
      userRole,
      error: error || null, // Ensure error is not undefined
    });
  },
};

export { reportsController };