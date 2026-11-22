import { useState, useEffect, useCallback } from 'react';
import { PortalBrandingConfig, DEFAULT_PORTAL_CONFIG } from '../types/portal';
import { loadPortalConfig, savePortalConfig, resetCustomLogo } from '../utils/storage';
import { saveAndApplyTheme } from '../utils/theme';
import { ThemePreset } from '../types/theme';

/**
 * Reactive hook that keeps any component in sync with the active
 * Organization & Branding configuration across the entire system.
 */
export function usePortalConfig() {
  const [portalConfig, setPortalConfig] = useState<PortalBrandingConfig>(() => loadPortalConfig());

  useEffect(() => {
    const handleConfigChange = (e: Event) => {
      const customEvent = e as CustomEvent<PortalBrandingConfig>;
      if (customEvent.detail) {
        setPortalConfig(customEvent.detail);
      } else {
        setPortalConfig(loadPortalConfig());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key?.includes('portal_config') || e.key?.includes('custom_logo')) {
        setPortalConfig(loadPortalConfig());
      }
    };

    window.addEventListener('kca-portal-config-changed', handleConfigChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('kca-portal-config-changed', handleConfigChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateConfig = useCallback((changes: Partial<PortalBrandingConfig>) => {
    // If a theme was selected, apply it dynamically to CSS variables
    if (changes.theme) {
      saveAndApplyTheme(changes.theme);
    } else if (changes.primaryColor) {
      saveAndApplyTheme(changes.primaryColor);
    }
    const updated = savePortalConfig(changes);
    setPortalConfig(updated);
    return updated;
  }, []);

  const resetConfig = useCallback(() => {
    resetCustomLogo();
    const updated = savePortalConfig(DEFAULT_PORTAL_CONFIG);
    if (DEFAULT_PORTAL_CONFIG.theme) {
      saveAndApplyTheme(DEFAULT_PORTAL_CONFIG.theme);
    } else if (DEFAULT_PORTAL_CONFIG.primaryColor) {
      saveAndApplyTheme(DEFAULT_PORTAL_CONFIG.primaryColor);
    }
    setPortalConfig(updated);
    return updated;
  }, []);

  // Computed Terminology Helpers
  const unitTerm = portalConfig.unitTerm || 'Unit';
  const unitTermPlural = portalConfig.unitTermPlural || 'Units';
  const idPrefix = portalConfig.idPrefix || 'KCA';
  const primaryColor = portalConfig.primaryColor || 'var(--color-primary, #8b0000)';

  return {
    portalConfig,
    updateConfig,
    resetConfig,
    unitTerm,
    unitTermPlural,
    idPrefix,
    primaryColor,
  };
}
