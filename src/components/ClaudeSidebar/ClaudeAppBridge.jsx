import { useEffect } from 'react';
import { setBridge } from './appBridge.js';

// Mounted once inside AccountingDashboard. Re-runs on every render so the
// bridge always points at the freshest state and setters. The sidebar's tool
// implementations read from this bridge when Claude calls a tool.
export default function ClaudeAppBridge({ state, actions }) {
  useEffect(() => {
    setBridge({ state, actions });
  });
  return null;
}
