import React from 'react';

const PlaceholderPage = ({ title }) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-500">此模块正在开发中...</p>
    </div>
  );
};

export const Reports = () => <PlaceholderPage title="报告管理" />;
export const Targets = () => <PlaceholderPage title="目标管理" />;
