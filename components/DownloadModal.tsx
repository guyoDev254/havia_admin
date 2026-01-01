'use client'

import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react'
import { ExportFormat, exportToPDF, exportToExcel, exportToCSV } from '@/lib/report-export'

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  onDownload: (format: ExportFormat) => void
  title?: string
}

export default function DownloadModal({ isOpen, onClose, onDownload, title = 'Download Report' }: DownloadModalProps) {
  if (!isOpen) return null

  const handleDownload = (format: ExportFormat) => {
    onDownload(format)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="text-2xl text-gray-500 dark:text-gray-400">&times;</span>
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Choose your preferred file format:
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleDownload('pdf')}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-red-500 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left group"
            >
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400">
                  PDF Document
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Best for printing and sharing
                </div>
              </div>
              <Download className="h-5 w-5 text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
            </button>

            <button
              onClick={() => handleDownload('excel')}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left group"
            >
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                  Excel Spreadsheet
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Best for data analysis and editing
                </div>
              </div>
              <Download className="h-5 w-5 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400" />
            </button>

            <button
              onClick={() => handleDownload('csv')}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                <File className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  CSV File
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Best for importing into other systems
                </div>
              </div>
              <Download className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

