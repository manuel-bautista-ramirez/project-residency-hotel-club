import { MembershipModel } from "../models/modelMembership.js";
import puppeteer from "puppeteer";
import hbs from "handlebars";
import fs from "fs/promises";
import path from "path";

const getReportDateRange = (period, date) => {
  const year = parseInt(date.substring(0, 4));
  const month = parseInt(date.substring(5, 7)) - 1;
  let startDate, endDate;

  switch (period) {
    case "monthly":
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
      break;
    case "biweekly":
      const fortnight = date.endsWith("first") ? 1 : 16;
      if (fortnight === 1) {
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month, 15);
      } else {
        startDate = new Date(year, month, 16);
        endDate = new Date(year, month + 1, 0);
      }
      break;
    case "weekly":
      const week = parseInt(date.substring(6));
      startDate = new Date(year, 0, 1 + (week - 1) * 7);
      endDate = new Date(year, 0, 1 + (week - 1) * 7 + 6);
      break;
    default:
      throw new Error("Invalid period specified");
  }

  return { startDate, endDate };
};

const reportsController = {
  async getReportPreview(req, res) {
    try {
      const { period, date } = req.query;
      const { startDate, endDate } = getReportDateRange(period, date);

      const incomeData = await MembershipModel.getIncomeByPaymentMethod(
        startDate,
        endDate
      );

      res.json(incomeData);
    } catch (error) {
      console.error("Error generating report preview:", error);
      res.status(500).json({ error: "Failed to generate report preview" });
    }
  },

  async downloadReportPDF(req, res) {
    try {
      const { period, date } = req.query;
      const { startDate, endDate } = getReportDateRange(period, date);

      const incomeData = await MembershipModel.getIncomeByPaymentMethod(
        startDate,
        endDate
      );

      const templatePath = path.resolve(
        "src",
        "views",
        "partials",
        "report-template.hbs"
      );
      const templateFile = await fs.readFile(templatePath, "utf8");
      const template = hbs.compile(templateFile);
      const html = template(incomeData);

      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({ format: "A4" });
      await browser.close();

      const formatDate = (date) => date.toISOString().split("T")[0];
      const filename = `Reporte-${period}-${formatDate(startDate)}-a-${formatDate(
        endDate
      )}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${filename}`
      );
      res.send(pdf);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      res.status(500).send("Failed to generate PDF report");
    }
  },

  async renderReports(req, res) {
    const userRole = req.session.user?.role || "Recepcionista";
    const isAdmin = userRole === "Administrador";

    if (!isAdmin) {
      return res.status(403).send("Acceso denegado");
    } else {
      res.render("reports", {
        title: "Reportes",
        isAdmin,
        userRole,
      });
    }
  },
};

export { reportsController };
