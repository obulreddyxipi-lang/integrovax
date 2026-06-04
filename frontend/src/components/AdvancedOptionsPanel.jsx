import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Premium glass‑morphism panel
const panelStyle = {
  position: 'absolute',
  top: '70px', // below header
  right: '20px',
  width: '320px',
  maxHeight: '70vh',
  overflowY: 'auto',
  padding: '16px',
  borderRadius: '12px',
  background: 'rgba(255, 255, 255, 0.12)',
  backdropFilter: 'blur(12px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.18)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  color: '#fff',
  fontFamily: "'Inter', sans-serif",
};

const headerStyle = {
  fontSize: '14px',
  fontWeight: 600,
  marginBottom: '12px',
  color: '#e0e0e0',
};

const placeholderItem = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  marginBottom: '12px',
};

const labelStyle = {
  fontSize: '12px',
  color: '#cfd8dc',
};

const inputStyle = {
  width: '100%',
  padding: '6px 8px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: '13px',
  outline: 'none',
};

export default function AdvancedOptionsPanel({ onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        style={panelStyle}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div style={headerStyle}>🛠️ Advanced Options</div>
        {/* Placeholder controls – will be replaced with real options later */}
        <div style={placeholderItem}>
          <span style={labelStyle}>Execution Timeout (seconds)</span>
          <input type="number" placeholder="e.g. 30" style={inputStyle} />
        </div>
        <div style={placeholderItem}>
          <span style={labelStyle}>Retry Count</span>
          <input type="number" placeholder="e.g. 3" style={inputStyle} />
        </div>
        <div style={placeholderItem}>
          <span style={labelStyle}>Security Profile</span>
          <input type="text" placeholder="Profile name" style={inputStyle} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
