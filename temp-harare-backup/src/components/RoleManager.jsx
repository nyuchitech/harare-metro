/* eslint-disable */
// src/components/RoleManager.jsx - Component for managing user roles and permissions
import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ShieldCheck, Users, Briefcase, PenTool, BarChart, Settings, Crown } from 'lucide-react'

const RoleManager = ({ currentRole, showPermissions = false }) => {
  const { userRoles, hasRole, isAdmin } = useAuth()

  // Role definitions with descriptions and permissions
  const roleDefinitions = {
    [userRoles.creator]: {
      name: 'Creator',
      description: 'Individual content creator with basic social features',
      icon: PenTool,
      color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      permissions: ['Create posts', 'Like articles', 'Save articles', 'Basic profile']
    },
    [userRoles.businessCreator]: {
      name: 'Business Creator',
      description: 'Business content creator with enhanced features',
      icon: Briefcase,
      color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      permissions: ['All Creator features', 'Business profile', 'Analytics access', 'Promotional content']
    },
    [userRoles.author]: {
      name: 'Author',
      description: 'Professional writer with publishing capabilities',
      icon: PenTool,
      color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      permissions: ['All Creator features', 'Article publishing', 'Verified badge', 'Reader insights']
    },
    [userRoles.admin]: {
      name: 'Admin',
      description: 'Full administrative access to platform',
      icon: Crown,
      color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      permissions: ['All features', 'User management', 'Content moderation', 'Analytics dashboard']
    },
    [userRoles.superAdmin]: {
      name: 'Super Admin',
      description: 'Complete system control and configuration',
      icon: Crown,
      color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      permissions: ['All Admin features', 'System configuration', 'Database access', 'API management']
    },
    [userRoles.moderator]: {
      name: 'Moderator',
      description: 'Content moderation and community management',
      icon: ShieldCheck,
      color: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      permissions: ['Content moderation', 'User management', 'Comment management', 'Report handling']
    },
    [userRoles.analyst]: {
      name: 'Analyst',
      description: 'Analytics and reporting access',
      icon: BarChart,
      color: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
      permissions: ['Analytics dashboard', 'Report generation', 'Data export', 'Performance insights']
    },
    [userRoles.contentManager]: {
      name: 'Content Manager',
      description: 'Editorial and content management',
      icon: Settings,
      color: 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200',
      permissions: ['Content management', 'Editorial tools', 'Publication control', 'SEO optimization']
    }
  }

  const role = roleDefinitions[currentRole] || roleDefinitions[userRoles.creator]
  const IconComponent = role.icon

  if (!showPermissions) {
    return (
      <div className="flex items-center space-x-2">
        <Badge className={role.color}>
          <IconComponent className="h-3 w-3 mr-1" />
          {role.name}
        </Badge>
        {isAdmin() && (
          <Badge variant="outline">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Admin Access
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <IconComponent className="h-5 w-5" />
          <span>{role.name} Role</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {role.description}
        </p>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Permissions:</h4>
          <ul className="space-y-1">
            {role.permissions.map((permission, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-center">
                <ShieldCheck className="h-3 w-3 mr-2 text-green-500" />
                {permission}
              </li>
            ))}
          </ul>
        </div>

        {isAdmin() && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <Crown className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                Administrative Privileges Active
              </span>
            </div>
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              You have enhanced access to system features and analytics.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RoleManager
