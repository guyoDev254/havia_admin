import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

export type ExportFormat = 'pdf' | 'excel' | 'csv'

interface ReportData {
  title: string
  type: string
  content: string
  periodStart?: string
  periodEnd?: string
  createdAt: string
  clubName?: string
  [key: string]: any
}

/**
 * Export report as PDF
 */
export function exportToPDF(report: ReportData, filename?: string) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPosition = margin

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(report.title || 'Report', margin, yPosition)
  yPosition += 10

  // Club name if available
  if (report.clubName) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Club: ${report.clubName}`, margin, yPosition)
    yPosition += 8
  }

  // Report type
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Type: ${report.type.replace('_', ' ')}`, margin, yPosition)
  yPosition += 8

  // Date range if available
  if (report.periodStart || report.periodEnd) {
    const dateRange = [
      report.periodStart ? format(new Date(report.periodStart), 'MMM d, yyyy') : '',
      report.periodEnd ? format(new Date(report.periodEnd), 'MMM d, yyyy') : '',
    ]
      .filter(Boolean)
      .join(' - ')
    doc.text(`Period: ${dateRange}`, margin, yPosition)
    yPosition += 8
  }

  // Generated date
  doc.text(
    `Generated: ${format(new Date(report.createdAt), 'MMM d, yyyy HH:mm')}`,
    margin,
    yPosition,
  )
  yPosition += 12

  // Divider line
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // Content
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  const contentLines = doc.splitTextToSize(report.content || 'No content available', pageWidth - 2 * margin)
  
  contentLines.forEach((line: string) => {
    if (yPosition > pageHeight - margin - 10) {
      doc.addPage()
      yPosition = margin
    }
    doc.text(line, margin, yPosition)
    yPosition += 7
  })

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' },
    )
  }

  // Save
  const finalFilename = filename || `${report.title || 'report'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(finalFilename)
}

/**
 * Export report as Excel
 */
export function exportToExcel(report: ReportData, filename?: string) {
  const workbook = XLSX.utils.book_new()

  // Create worksheet data
  const worksheetData = [
    ['Report Title', report.title || ''],
    ['Report Type', report.type.replace('_', ' ')],
    ['Club Name', report.clubName || ''],
    ['Period Start', report.periodStart ? format(new Date(report.periodStart), 'MMM d, yyyy') : ''],
    ['Period End', report.periodEnd ? format(new Date(report.periodEnd), 'MMM d, yyyy') : ''],
    ['Generated', format(new Date(report.createdAt), 'MMM d, yyyy HH:mm')],
    [''],
    ['Content'],
    [report.content || 'No content available'],
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Set column widths
  worksheet['!cols'] = [{ wch: 20 }, { wch: 60 }]

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')

  // Save
  const finalFilename = filename || `${report.title || 'report'}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
  XLSX.writeFile(workbook, finalFilename)
}

/**
 * Export report as CSV
 */
export function exportToCSV(report: ReportData, filename?: string) {
  const csvRows = [
    ['Report Title', report.title || ''],
    ['Report Type', report.type.replace('_', ' ')],
    ['Club Name', report.clubName || ''],
    ['Period Start', report.periodStart ? format(new Date(report.periodStart), 'MMM d, yyyy') : ''],
    ['Period End', report.periodEnd ? format(new Date(report.periodEnd), 'MMM d, yyyy') : ''],
    ['Generated', format(new Date(report.createdAt), 'MMM d, yyyy HH:mm')],
    [''],
    ['Content'],
    [report.content || 'No content available'],
  ]

  const csvContent = csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const finalFilename = filename || `${report.title || 'report'}-${format(new Date(), 'yyyy-MM-dd')}.csv`
  link.setAttribute('download', finalFilename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Export multiple reports as Excel
 */
export function exportMultipleReportsToExcel(reports: ReportData[], filename?: string) {
  const workbook = XLSX.utils.book_new()

  // Create summary sheet
  const summaryData = [
    ['Report Title', 'Type', 'Generated Date', 'Period Start', 'Period End'],
    ...reports.map((report) => [
      report.title || '',
      report.type.replace('_', ' '),
      format(new Date(report.createdAt), 'MMM d, yyyy'),
      report.periodStart ? format(new Date(report.periodStart), 'MMM d, yyyy') : '',
      report.periodEnd ? format(new Date(report.periodEnd), 'MMM d, yyyy') : '',
    ]),
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // Create individual sheets for each report
  reports.forEach((report, index) => {
    const worksheetData = [
      ['Report Title', report.title || ''],
      ['Report Type', report.type.replace('_', ' ')],
      ['Club Name', report.clubName || ''],
      ['Period Start', report.periodStart ? format(new Date(report.periodStart), 'MMM d, yyyy') : ''],
      ['Period End', report.periodEnd ? format(new Date(report.periodEnd), 'MMM d, yyyy') : ''],
      ['Generated', format(new Date(report.createdAt), 'MMM d, yyyy HH:mm')],
      [''],
      ['Content'],
      [report.content || 'No content available'],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    worksheet['!cols'] = [{ wch: 20 }, { wch: 60 }]
    const sheetName = report.title?.substring(0, 31) || `Report ${index + 1}`
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  })

  const finalFilename = filename || `reports-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
  XLSX.writeFile(workbook, finalFilename)
}

/**
 * Export table data as CSV
 */
export function exportTableToCSV(data: any[], headers: string[], filename: string) {
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header] || ''
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(','),
    ),
  ]

  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Export table data as Excel
 */
export function exportTableToExcel(data: any[], headers: string[], filename: string, sheetName: string = 'Data') {
  const workbook = XLSX.utils.book_new()

  const worksheetData = [
    headers,
    ...data.map((row) => headers.map((header) => row[header] || '')),
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Auto-size columns
  const maxWidths = headers.map((header, colIndex) => {
    const maxLength = Math.max(
      header.length,
      ...data.map((row) => String(row[headers[colIndex]] || '').length),
    )
    return { wch: Math.min(maxLength + 2, 50) }
  })
  worksheet['!cols'] = maxWidths

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, filename)
}

