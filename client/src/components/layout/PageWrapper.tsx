import React from 'react';

interface PageWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function PageWrapper({ 
  title, 
  description, 
  children, 
  actions 
}: PageWrapperProps) {
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-800 dark:text-white">{title}</h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="mt-3 sm:mt-0">
            {actions}
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}