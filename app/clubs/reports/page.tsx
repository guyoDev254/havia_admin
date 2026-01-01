'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { PresentationChart, FileText, Download, Calendar, BarChart3, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ManagedClub {
  id: string
  clubId: string
  club: {
    id: string
    name: string
    category: string
    logo?: string
  }
}

interface ClubReport {
  id: string
  type: string
  title: string
  createdAt: string
  periodStart?: string
  periodEnd?: string
}

export default function ClubReportsPage() {
  const { user } = useAuth()
  const [managedClubs, setManagedClubs] = useState<ManagedClub[]>([])
  const [reports, setReports] = useState<Record<string, ClubReport[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchManagedClubs()
    }
  }, [user])

  const fetchManagedClubs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/clubs/me/managed')
      const clubs = response.data || []
      setManagedClubs(clubs)

      // Fetch reports for each club
      const reportsMap: Record<string, ClubReport[]> = {}
      for (const m of clubs) {
        try {
          const reportsResponse = await api.get(`/clubs/${m.club.id}/reports`)
          reportsMap[m.club.id] = reportsResponse.data || []
        } catch (error) {
          reportsMap[m.club.id] = []
        }
      }
      setReports(reportsMap)
    } catch (error) {
      console.error('Error fetching managed clubs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (clubId: string, type: string) => {
    try {
      // Navigate to club detail page with report generation
      window.location.href = `/clubs/${clubId}?tab=reports&generate=${type}`
    } catch (error) {
      console.error('Error generating report:', error)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading club reports..." showProgress={true} fullScreen={false} />
        </Layout>
      </ProtectedRoute>
    )
  }

  const reportTypes = [
    {
      name: 'Activity Report',
      description: 'Overview of club activities and engagement',
      type: 'ACTIVITY',
      icon: BarChart3,
      color: 'bg-blue-500',
    },
    {
      name: 'Membership Report',
      description: 'Member statistics and growth',
      type: 'MEMBERSHIP',
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      name: 'Financial Report',
      description: 'Financial contributions and usage summary',
      type: 'FINANCIAL',
      icon: PresentationChart,
      color: 'bg-purple-500',
    },
    {
      name: 'Project Report',
      description: 'Project progress and milestones',
      type: 'PROJECT',
      icon: Calendar,
      color: 'bg-orange-500',
    },
  ]

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Club Reports</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Generate and view reports for your managed clubs
              </p>
            </div>
          </div>

          {managedClubs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-12 text-center">
              <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <PresentationChart className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No clubs assigned yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You need to be assigned as a club manager to generate reports.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {managedClubs.map((m) => {
                const clubReports = reports[m.club.id] || []
                return (
                  <div
                    key={m.id}
                    className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        {m.club.logo ? (
                          <img
                            src={m.club.logo}
                            alt={m.club.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {m.club.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{m.club.name}</h2>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{m.club.category}</span>
                        </div>
                      </div>
                      <Link
                        href={`/clubs/${m.club.id}?tab=reports`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View All Reports →
                      </Link>
                    </div>

                    {/* Generate New Reports */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Generate New Report
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {reportTypes.map((reportType) => {
                          const Icon = reportType.icon
                          return (
                            <button
                              key={reportType.type}
                              onClick={() => handleGenerateReport(m.club.id, reportType.type)}
                              className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all text-left"
                            >
                              <div className={`inline-flex p-2 ${reportType.color} rounded-lg mb-2`}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1">
                                {reportType.name}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {reportType.description}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Recent Reports */}
                    {clubReports.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Recent Reports
                        </h3>
                        <div className="space-y-2">
                          {clubReports.slice(0, 5).map((report) => (
                            <Link
                              key={report.id}
                              href={`/clubs/${m.club.id}?tab=reports&reportId=${report.id}`}
                              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <div>
                                <p className="font-medium text-sm text-gray-900 dark:text-white">
                                  {report.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {report.type} • {new Date(report.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

