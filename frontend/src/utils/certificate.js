// certificate.js — builds a printable "dummy" completion certificate as a real
// PDF and downloads it. Uses jsPDF (drawn vector graphics — no backend needed).
// jsPDF is imported lazily (only when the user clicks Download) so it stays out
// of the initial app bundle.

export async function downloadCertificate({ student, course }) {
  const { jsPDF } = await import("jspdf");

  const date = new Date().toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });

  // Landscape A4 in millimetres: 297 × 210.
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297, H = 210, cx = W / 2;

  const BLUE = [31, 58, 138];
  const GOLD = [201, 162, 39];
  const GRAY = [110, 110, 110];
  const DARK = [17, 17, 17];

  // Borders: thick blue frame + thin gold inner frame.
  doc.setDrawColor(...BLUE); doc.setLineWidth(1.4); doc.rect(10, 10, W - 20, H - 20);
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.4); doc.rect(15, 15, W - 30, H - 30);

  // Brand.
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...BLUE);
  doc.text("ABC LEARNING SOLUTIONS", cx, 38, { align: "center" });

  // Title + subtitle.
  doc.setFont("times", "bold"); doc.setFontSize(34); doc.setTextColor(...BLUE);
  doc.text("Certificate of Completion", cx, 66, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.setTextColor(...GRAY);
  doc.text("Corporate Training Program", cx, 78, { align: "center" });

  // Recipient.
  doc.setFontSize(11); doc.setTextColor(...GRAY);
  doc.text("THIS CERTIFICATE IS PROUDLY PRESENTED TO", cx, 100, { align: "center" });

  doc.setFont("times", "bolditalic"); doc.setFontSize(30); doc.setTextColor(...DARK);
  doc.text(student, cx, 118, { align: "center" });
  // Gold underline sized to the name.
  const nameWidth = doc.getTextWidth(student);
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.6);
  doc.line(cx - nameWidth / 2 - 6, 122, cx + nameWidth / 2 + 6, 122);

  // Body.
  doc.setFont("helvetica", "normal"); doc.setFontSize(13); doc.setTextColor(...DARK);
  doc.text("for successfully completing the course", cx, 137, { align: "center" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(...BLUE);
  doc.text(course, cx, 148, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.setTextColor(...DARK);
  doc.text("and demonstrating the required skills and dedication.", cx, 158, { align: "center" });

  // Footer: date (left) · seal (centre) · signature (right).
  doc.setDrawColor(120, 120, 120); doc.setLineWidth(0.4);
  doc.line(40, 178, 100, 178);
  doc.line(197, 178, 257, 178);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...GRAY);
  doc.text(`Date — ${date}`, 70, 183, { align: "center" });
  doc.text("Program Director", 227, 183, { align: "center" });

  // Seal.
  doc.setDrawColor(...GOLD); doc.setLineWidth(1.2); doc.circle(cx, 174, 15);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...GOLD);
  doc.text("VERIFIED", cx, 173, { align: "center" });
  doc.text("SEAL", cx, 178, { align: "center" });

  const fileName = `Certificate-${student}-${course}.pdf`.replace(/\s+/g, "_");
  doc.save(fileName);
}
