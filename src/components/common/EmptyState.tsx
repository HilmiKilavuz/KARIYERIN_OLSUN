"use client";

import React from "react";

export type EmptyStateProps = {
  Icon: React.ElementType;
  title: string;
  message: string;
  className?: string;
};

export const EmptyState: React.FC<EmptyStateProps> = ({ Icon, title, message, className }) => {
  return (
    <div className={`flex h-full flex-col items-center justify-center p-8 text-center ${className ?? ""}`}>
      <Icon className="mb-4 h-16 w-16 text-white/30" />
      <h3 className="text-xl font-semibold text-accent">{title}</h3>
      <p className="mt-2 max-w-xs text-muted">{message}</p>
    </div>
  );
};

