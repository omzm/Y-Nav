// Local Storage Keys
export const LOCAL_STORAGE_KEY = 'cloudnav_data_cache_v2';
export const WEBDAV_CONFIG_KEY = 'cloudnav_webdav_config';
export const AI_CONFIG_KEY = 'cloudnav_ai_config';
export const SEARCH_CONFIG_KEY = 'cloudnav_search_config';
export const FAVICON_CACHE_KEY = 'cloudnav_favicon_cache';
export const SITE_SETTINGS_KEY = 'cloudnav_site_settings';
export const THEME_KEY = 'theme';

// Sync System Keys
export const DEVICE_ID_KEY = 'cloudnav_device_id';
export const SYNC_META_KEY = 'cloudnav_sync_meta';
export const LAST_SYNC_KEY = 'cloudnav_last_sync';

// Sync Configuration
export const SYNC_DEBOUNCE_MS = 3000; // 3秒内无新操作则触发同步
export const SYNC_API_ENDPOINT = '/api/sync';

// GitHub Repo URL
export const GITHUB_REPO_URL = 'https://github.com/yml2213/Y-Nav';

// 生成或获取设备唯一ID
export const getDeviceId = (): string => {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
};
