
/// <reference types="node" />

// Add React JSX runtime support
import React from "react";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      // Add other environment variables your app uses
    }
  }
}

export {};
