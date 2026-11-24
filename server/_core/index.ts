import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getStudentById, getCoachNotes, getCustomFields, getStudentCustomValues, getStudentShares, getAiSummary } from "../db";
import { generateStudentPdf } from "../studentPdfServer";
import { generatePersonalInfoPdf } from "../personalInfoPdfServer";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // PDF generation endpoint (server-side, uses local fonts)
  app.get("/api/pdf/student/:id", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        res.status(400).json({ error: "Invalid student ID" });
        return;
      }
      const student = await getStudentById(studentId);
      if (!student) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      const [notes, fields, values, shares, aiSummaryRow] = await Promise.all([
        getCoachNotes(studentId),
        getCustomFields(),
        getStudentCustomValues(studentId),
        getStudentShares(studentId),
        getAiSummary(studentId),
      ]);
      // Convert relative photoUrl to absolute URL for PDFKit fetch
      const origin = `${req.protocol}://${req.get('host')}`;
      const studentWithAbsolutePhoto = {
        ...student,
        photoUrl: student.photoUrl
          ? student.photoUrl.startsWith('http')
            ? student.photoUrl
            : `${origin}${student.photoUrl}`
          : null,
      };
      const pdfBuffer = await generateStudentPdf({
        student: studentWithAbsolutePhoto,
        customFields: fields,
        customValues: values,
        coachNotes: notes,
        studentShares: shares,
        aiSummary: aiSummaryRow?.summary ?? null,
      });
      const name = student.nickname || student.fullNameChinese || `student_${student.id}`;
      const filename = encodeURIComponent(`格局17_${name}.pdf`);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
      res.send(pdfBuffer);
    } catch (err) {
      console.error("PDF generation error:", err);
      res.status(500).json({ error: "PDF generation failed" });
    }
  });

  // PDF: Personal Info only (image + profile tab fields)
  app.get("/api/pdf/personal/:id", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        res.status(400).json({ error: "Invalid student ID" });
        return;
      }
      const student = await getStudentById(studentId);
      if (!student) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      const [fields, values] = await Promise.all([
        getCustomFields(),
        getStudentCustomValues(studentId),
      ]);
      const origin = `${req.protocol}://${req.get('host')}`;
      const studentWithAbsolutePhoto = {
        ...student,
        photoUrl: student.photoUrl
          ? student.photoUrl.startsWith('http')
            ? student.photoUrl
            : `${origin}${student.photoUrl}`
          : null,
      };
      const pdfBuffer = await generatePersonalInfoPdf({
        student: studentWithAbsolutePhoto,
        customFields: fields,
        customValues: values,
      });
      const name = student.nickname || student.fullNameChinese || `student_${student.id}`;
      const filename = encodeURIComponent(`格局17_個人資料_${name}.pdf`);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
      res.send(pdfBuffer);
    } catch (err) {
      console.error("Personal Info PDF generation error:", err);
      res.status(500).json({ error: "PDF generation failed" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
