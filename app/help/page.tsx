'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ArrowLeft, HelpCircle, Book, MessageSquare, Mail, Phone, FileText, Video, Search, Users, Shield, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const helpCategories = [
    {
      icon: Book,
      title: 'Getting Started',
      description: 'Learn the basics of using the admin panel',
      articles: [
        { title: 'How to navigate the dashboard', href: '#' },
        { title: 'Understanding user roles and permissions', href: '#' },
        { title: 'Managing clubs and events', href: '#' },
      ],
      color: 'bg-blue-500',
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Guide to managing users and their accounts',
      articles: [
        { title: 'How to view and edit user profiles', href: '#' },
        { title: 'Assigning roles and permissions', href: '#' },
        { title: 'Suspending or banning users', href: '#' },
      ],
      color: 'bg-green-500',
    },
    {
      icon: Shield,
      title: 'Moderation',
      description: 'Tools and tips for content moderation',
      articles: [
        { title: 'Reviewing and resolving reports', href: '#' },
        { title: 'Understanding the strike system', href: '#' },
        { title: 'Managing flagged content', href: '#' },
      ],
      color: 'bg-red-500',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Understanding your data and generating reports',
      articles: [
        { title: 'Viewing analytics dashboard', href: '#' },
        { title: 'Generating and exporting reports', href: '#' },
        { title: 'Understanding engagement metrics', href: '#' },
      ],
      color: 'bg-purple-500',
    },
  ]

  const quickLinks = [
    { icon: FileText, title: 'Documentation', href: '#', description: 'Complete admin guide' },
    { icon: Video, title: 'Video Tutorials', href: '#', description: 'Step-by-step video guides' },
    { icon: MessageSquare, title: 'Contact Support', href: '#', description: 'Get help from our team' },
  ]

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Find answers to common questions and get support
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => {
              const Icon = link.icon
              return (
                <Link
                  key={index}
                  href={link.href}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {link.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{link.description}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Help Categories */}
          <div className="space-y-6">
            {helpCategories.map((category, index) => {
              const Icon = category.icon
              return (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 ${category.color} rounded-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{category.title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      {category.articles.map((article, articleIndex) => (
                        <li key={articleIndex}>
                          <Link
                            href={article.href}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                          >
                            <FileText className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                            <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {article.title}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
                <p className="text-blue-100 mb-6">
                  Our support team is here to assist you. Reach out through any of these channels:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5" />
                    <span>support@northernbox.co.ke</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5" />
                    <span>+254 XXX XXX XXX</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5" />
                    <span>Live chat (available 9 AM - 5 PM EAT)</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <HelpCircle className="h-24 w-24 text-white/20" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

