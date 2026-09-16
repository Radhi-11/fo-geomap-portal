import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { successResponse } from '../../utils/apiResponse';
import { getQueryParam, getQueryParamAsNumber } from '../../utils/reqQuery';
import { formatIndonesianDate } from '../../utils/dateFormat';

export async function getProjectReport(req: Request, res: Response) {
  const { id } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: id as string },
    include: {
      kmzRoute: true,
      boqItems: true,
      priceValidations: { include: { khsItem: true } },
      lengthValidations: true,
    },
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project tidak ditemukan',
      errorCode: 'PROJECT_NOT_FOUND',
    });
  }

  const html = generateReportHtml(project);
  return res.send(html);
}

export async function getProjectReportPdf(req: Request, res: Response) {
  const { id } = req.params;
  const project = await prisma.project.findUnique({
    where: { id: id as string },
    include: {
      kmzRoute: true,
      boqItems: true,
      priceValidations: { include: { khsItem: true } },
      lengthValidations: true,
      files: true,
    },
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project tidak ditemukan',
      errorCode: 'PROJECT_NOT_FOUND',
    });
  }

  const html = generateReportHtml(project);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="report-${project.projectCode}.pdf"`);
  res.send(html);
}

export async function getProjectReportExcel(req: Request, res: Response) {
  const { id } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: id as string },
    include: {
      kmzRoute: true,
      boqItems: true,
      priceValidations: { include: { khsItem: true } },
      lengthValidations: true,
    },
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project tidak ditemukan',
      errorCode: 'PROJECT_NOT_FOUND',
    });
  }

  const csvLines: string[] = [
    'Project Information,,,,',
    `Project Code,${project.projectCode},,`,
    `Nama Project,${project.name},,`,
    `Teknisi,${project.technicianName || '-'},,`,
    `Provinsi,${project.province || '-'},,`,
    `Kota/Kabupaten,${project.city || '-'},,`,
    `Tanggal,${formatIndonesianDate(project.createdAt)},,`,
    '',
    'Route Validation,,,,',
    `Panjang KMZ (km),${project.kmzLength || '-'},,`,
    `Panjang BoQ (m),${project.boqLength || '-'},,`,
    `Selisih,${project.lengthDifference || '-'},,`,
    `Persentase Selisih,${project.lengthDiffPercentage || '-'},%`,
    `Status,${project.lengthValidationStatus || '-'},,`,
    '',
    'Price Validation,,,,',
    `Total Items,${project.boqItems.length},,`,
    `BoQ Total Value,${project.boqTotalValue || 0},,`,
  ];

  const csv = csvLines.join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="report-${project.projectCode}.csv"`);
  res.send(csv);
}

function generateReportHtml(project: any): string {
  const date = formatIndonesianDate(project.createdAt);
  const totalDifference = project.boqItems.reduce((sum: number, item: any) => {
    return sum + (item.totalPrice || 0);
  }, 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Laporan Project FO - ${project.projectCode}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    h1, h2 { color: #1e3a8a; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f8fafc; }
    .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .status-matched { background: #dcfce7; color: #166534; }
    .status-different { background: #fee2e2; color: #991b1b; }
    .status-review { background: #fef3c7; color: #92400e; }
    .summary-box { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>Laporan Project FO</h1>
  <div class="summary-box">
    <h2>Informasi Project</h2>
    <table>
      <tr><td><strong>Project Code</strong></td><td>${project.projectCode}</td></tr>
      <tr><td><strong>Nama Project</strong></td><td>${project.name}</td></tr>
      <tr><td><strong>Teknisi</strong></td><td>${project.technicianName || '-'}</td></tr>
      <tr><td><strong>Provinsi</strong></td><td>${project.province || '-'}</td></tr>
      <tr><td><strong>Kota/Kabupaten</strong></td><td>${project.city || '-'}</td></tr>
      <tr><td><strong>Tanggal</strong></td><td>${date}</td></tr>
    </table>
  </div>

  <div class="summary-box">
    <h2>Validasi Panjang Jalur</h2>
    <table>
      <tr><td><strong>Panjang KMZ (km)</strong></td><td>${project.kmzLength || '-'}</td></tr>
      <tr><td><strong>Panjang BoQ (m)</strong></td><td>${project.boqLength || '-'}</td></tr>
      <tr><td><strong>Selisih</strong></td><td>${project.lengthDifference || '-'}</td></tr>
      <tr><td><strong>Persentase Selisih</strong></td><td>${project.lengthDiffPercentage || '-'}%</td></tr>
      <tr><td><strong>Status</strong></td><td><span class="status-badge status-${(project.lengthValidationStatus || '').toLowerCase()}">${project.lengthValidationStatus || '-'}</span></td></tr>
    </table>
  </div>

  <div class="summary-box">
    <h2>Ringkasan Validasi Harga</h2>
    <table>
      <tr><td><strong>Total Item BoQ</strong></td><td>${project.boqItems.length}</td></tr>
      <tr><td><strong>Total Nilai BoQ</strong></td><td>Rp ${totalDifference.toLocaleString('id-ID')}</td></tr>
      <tr><td><strong>Selisih Total Harga</strong></td><td>Rp ${(project.totalPriceDifference || 0).toLocaleString('id-ID')}</td></tr>
      <tr><td><strong>Status Validasi Harga</strong></td><td><span class="status-badge status-${(project.priceValidationStatus || '').toLowerCase()}">${project.priceValidationStatus || '-'}</span></td></tr>
      <tr><td><strong>Status Keseluruhan</strong></td><td><span class="status-badge status-${(project.overallStatus || '').toLowerCase()}">${project.overallStatus || '-'}</span></td></tr>
    </table>
  </div>

  <h2>Detail Item BoQ</h2>
  <table>
    <thead>
      <tr><th>Kode Item</th><th>Nama</th><th>Qty</th><th>Satuan</th><th>Harga BoQ</th><th>Harga KHS</th><th>Selisih</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${project.boqItems.map((item: any) => {
        const pv = project.priceValidations?.find((pv: any) => pv.boqItemId === item.id);
        return `
          <tr>
            <td>${item.itemCode || '-'}</td>
            <td>${item.itemName}</td>
            <td>${item.quantity}</td>
            <td>${item.unit}</td>
            <td>${item.unitPrice.toLocaleString('id-ID')}</td>
            <td>${pv?.khsPrice?.toLocaleString('id-ID') || '-'}</td>
            <td>${pv?.difference ? Math.abs(pv.difference).toLocaleString('id-ID') : '-'}</td>
            <td><span class="status-badge status-${(pv?.status || '').toLowerCase()}">${pv?.status || 'NOT_FOUND'}</span></td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  ${project.validatorNotes ? `<div class="summary-box"><h2>Catatan Validator</h2><p>${project.validatorNotes}</p></div>` : ''}

  <p style="margin-top: 20px; font-size: 12px; color: #666;">Dicetak pada ${new Date().toISOString()}</p>
</body>
</html>`;
}
