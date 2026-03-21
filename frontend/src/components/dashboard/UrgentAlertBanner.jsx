// components/UrgentAlertBanner.jsx
// Shows a dismissible banner at the top of the dashboard
// when urgent feedback is detected

import { useState } from 'react';

export function UrgentAlertBanner({ alerts, onDismiss, onView }) {
    if (!alerts.length) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {alerts.map(alert => (
                <div key={alert.id} style={{
                    display:         'flex',
                    alignItems:      'flex-start',
                    justifyContent:  'space-between',
                    gap:             '12px',
                    padding:         '12px 16px',
                    background:      '#fef2f2',
                    border:          '1px solid #fecaca',
                    borderLeft:      '4px solid #ef4444',
                    borderRadius:    '8px',
                    animation:       'pulse 2s ease-in-out 3'
                }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        {/* Warning icon */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        </svg>
                        <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#991b1b' }}>
                                Urgent — {alert.reason}
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7f1d1d' }}>
                                [{alert.category}] {alert.preview}...
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#b91c1c' }}>
                                {new Date(alert.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                            onClick={() => onView && onView(alert.id)}
                            style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 500, background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                            View
                        </button>
                        <button
                            onClick={() => onDismiss(alert.id)}
                            style={{ padding: '4px 10px', fontSize: '12px', background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}>
                            Dismiss
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}