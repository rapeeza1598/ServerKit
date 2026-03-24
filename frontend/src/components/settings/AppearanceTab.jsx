import React, { useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import useDashboardLayout from '../../hooks/useDashboardLayout';
import {
    ChevronDown, ChevronUp, RotateCcw, Star, X, Layers, Image, Type, Upload
} from 'lucide-react';

const ACCENT_PRESETS = [
    { label: 'Indigo', color: '#6366f1' },
    { label: 'Ocean', color: '#0ea5e9' },
    { label: 'Forest', color: '#10b981' },
    { label: 'Sunset', color: '#f97316' },
    { label: 'Rose', color: '#f43f5e' },
    { label: 'Violet', color: '#8b5cf6' },
    { label: 'Amber', color: '#f59e0b' },
    { label: 'Cyan', color: '#06b6d4' },
];

const WHITELABEL_MODES = [
    { id: 'image_text', label: 'Logo + Text', icon: Layers, desc: 'Mini logo with brand name' },
    { id: 'image_full', label: 'Full-width Logo', icon: Image, desc: 'Banner image only' },
    { id: 'text_only', label: 'Text Only', icon: Type, desc: 'Just the brand name' },
];

const AppearanceTab = () => {
    const { theme, setTheme, accentColor, setAccentColor, whiteLabel, setWhiteLabel } = useTheme();
    const { widgets, toggleWidget, moveWidget, resetLayout } = useDashboardLayout();
    const logoInputRef = useRef(null);

    return (
        <div className="settings-section">
            <div className="section-header">
                <h2>Appearance</h2>
                <p>Customize the look and feel of your dashboard</p>
            </div>

            <div className="settings-card">
                <h3>Theme</h3>
                <p>Select your preferred color scheme</p>
                <div className="theme-options">
                    <button
                        className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                        onClick={() => setTheme('dark')}
                    >
                        <div className="theme-preview dark">
                            <div className="preview-sidebar"></div>
                            <div className="preview-content">
                                <div className="preview-card"></div>
                                <div className="preview-card"></div>
                            </div>
                        </div>
                        <span>Dark</span>
                    </button>
                    <button
                        className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                        onClick={() => setTheme('light')}
                    >
                        <div className="theme-preview light">
                            <div className="preview-sidebar"></div>
                            <div className="preview-content">
                                <div className="preview-card"></div>
                                <div className="preview-card"></div>
                            </div>
                        </div>
                        <span>Light</span>
                    </button>
                    <button
                        className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                        onClick={() => setTheme('system')}
                    >
                        <div className="theme-preview system">
                            <div className="preview-sidebar"></div>
                            <div className="preview-content">
                                <div className="preview-card"></div>
                                <div className="preview-card"></div>
                            </div>
                        </div>
                        <span>System</span>
                    </button>
                </div>
            </div>

            <div className="settings-card">
                <h3>Accent Color</h3>
                <p>Choose the primary accent color used across the interface</p>
                <div className="accent-presets">
                    {ACCENT_PRESETS.map(({ label, color }) => (
                        <button
                            key={color}
                            className={`accent-preset${accentColor === color ? ' active' : ''}`}
                            onClick={() => setAccentColor(color)}
                        >
                            <span className="accent-swatch" style={{ background: color }} />
                            <span className="accent-label">{label}</span>
                        </button>
                    ))}
                </div>
                <div className="accent-custom">
                    <label className="accent-custom-label">Custom color</label>
                    <div className="accent-custom-row">
                        <input
                            type="color"
                            className="accent-custom-input"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                        />
                        <span className="accent-custom-hex">{accentColor.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <div className="settings-card">
                <h3>Dashboard Widgets</h3>
                <p>Toggle visibility and reorder widgets on the dashboard</p>
                <div className="widget-list">
                    {widgets.map((widget, idx) => (
                        <div key={widget.id} className={`widget-item${!widget.visible ? ' widget-item--hidden' : ''}`}>
                            <div className="widget-item__info">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={widget.visible}
                                        onChange={() => toggleWidget(widget.id)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                                <span className="widget-item__label">{widget.label}</span>
                            </div>
                            <div className="widget-item__controls">
                                <button
                                    className="widget-move-btn"
                                    onClick={() => moveWidget(widget.id, 'up')}
                                    disabled={idx === 0}
                                    title="Move up"
                                >
                                    <ChevronUp size={14} />
                                </button>
                                <button
                                    className="widget-move-btn"
                                    onClick={() => moveWidget(widget.id, 'down')}
                                    disabled={idx === widgets.length - 1}
                                    title="Move down"
                                >
                                    <ChevronDown size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button className="btn btn-secondary btn-sm" onClick={resetLayout} style={{ marginTop: '12px' }}>
                    <RotateCcw size={14} />
                    Reset to defaults
                </button>
            </div>

            <div className="settings-card">
                <h3>Custom Branding</h3>
                <p>Replace the default ServerKit branding in the sidebar with your own</p>

                <div className="settings-row">
                    <div className="settings-label">
                        <span>Enable custom branding</span>
                        <span className="settings-hint">Replaces the sidebar logo, name, and GitHub star link</span>
                    </div>
                    <div className="settings-control">
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={whiteLabel.enabled}
                                onChange={(e) => setWhiteLabel({ enabled: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                {whiteLabel.enabled && (
                    <>
                        <div className="whitelabel-modes">
                            {WHITELABEL_MODES.map(({ id, label, icon: Icon, desc }) => (
                                <button
                                    key={id}
                                    className={`whitelabel-mode${whiteLabel.mode === id ? ' active' : ''}`}
                                    onClick={() => setWhiteLabel({ mode: id })}
                                >
                                    <Icon size={20} />
                                    <span className="whitelabel-mode__label">{label}</span>
                                    <span className="whitelabel-mode__desc">{desc}</span>
                                </button>
                            ))}
                        </div>

                        <div className="whitelabel-fields">
                            {whiteLabel.mode !== 'image_full' && (
                                <div className="form-group">
                                    <label>Brand Name</label>
                                    <input
                                        type="text"
                                        value={whiteLabel.brandName}
                                        onChange={(e) => setWhiteLabel({ brandName: e.target.value })}
                                        placeholder="My Brand"
                                        maxLength={30}
                                    />
                                </div>
                            )}

                            {whiteLabel.mode !== 'text_only' && (
                                <div className="form-group">
                                    <label>Logo Image</label>
                                    <div className="whitelabel-upload" onClick={() => logoInputRef.current?.click()}>
                                        {whiteLabel.logoData ? (
                                            <div className="whitelabel-logo-preview">
                                                <img src={whiteLabel.logoData} alt="Logo preview" />
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={(e) => { e.stopPropagation(); setWhiteLabel({ logoData: '' }); }}
                                                >
                                                    <X size={12} /> Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="whitelabel-upload__placeholder">
                                                <Upload size={20} />
                                                <span>Click to upload logo</span>
                                                <span className="whitelabel-upload__hint">PNG, JPG, SVG — max 200KB</span>
                                            </div>
                                        )}
                                        <input
                                            ref={logoInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                if (file.size > 200 * 1024) {
                                                    alert('Image must be under 200KB');
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onload = (ev) => setWhiteLabel({ logoData: ev.target.result });
                                                reader.readAsDataURL(file);
                                                e.target.value = '';
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="whitelabel-preview">
                            <span className="whitelabel-preview__label">Preview</span>
                            <div className="whitelabel-preview__box">
                                {whiteLabel.mode === 'image_full' ? (
                                    <div className="brand-custom-banner">
                                        {whiteLabel.logoData ? (
                                            <img src={whiteLabel.logoData} alt="Preview" />
                                        ) : (
                                            <Layers size={24} />
                                        )}
                                    </div>
                                ) : whiteLabel.mode === 'text_only' ? (
                                    <span className="brand-custom-text">
                                        {whiteLabel.brandName || 'Brand'}
                                    </span>
                                ) : (
                                    <>
                                        <div className="brand-custom-logo">
                                            {whiteLabel.logoData ? (
                                                <img src={whiteLabel.logoData} alt="Preview" />
                                            ) : (
                                                <Layers size={16} />
                                            )}
                                        </div>
                                        <span className="brand-custom-text">
                                            {whiteLabel.brandName || 'Brand'}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="whitelabel-star-prompt">
                            <div className="star-icon">
                                <Star size={22} />
                            </div>
                            <div className="star-content">
                                <h4>Support ServerKit</h4>
                                <p>
                                    By using custom branding, the GitHub star link is hidden from the sidebar.
                                    If ServerKit is useful to you, please consider starring the project — it helps the community grow!
                                </p>
                                <a
                                    href="https://github.com/jhd3197/ServerKit"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary btn-sm"
                                >
                                    <Star size={14} />
                                    Star on GitHub
                                </a>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AppearanceTab;
