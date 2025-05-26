// utils/config.js
export const API_HOST = 'wantthisapp.uk';
export const PROTOCOL = 'https://';

// Общие URL для файлов
export const UPLOADS_URL = `${PROTOCOL}${API_HOST}/uploads`;
export const PLACEHOLDER_IMAGE = `${UPLOADS_URL}/60x60-placeholder.jpg`;

export const ENDPOINTS = {
  // Базовый адрес API
  BASE:    `${PROTOCOL}${API_HOST}`,
  AUTH:    `${PROTOCOL}${API_HOST}/api/auth`,
  CARDS:   `${PROTOCOL}${API_HOST}/api/cards`,
  ADMIN:   `${PROTOCOL}${API_HOST}/api/admin/cards`,

  // Глобальные карточки
  GLOBAL:           `${PROTOCOL}${API_HOST}/api/global/cards`,
  GLOBAL_MANIFEST:  `${PROTOCOL}${API_HOST}/api/global/cards/manifest`,
  GLOBAL_CHANGES:   `${PROTOCOL}${API_HOST}/api/global/cards/changes`,

  USERS:   `${PROTOCOL}${API_HOST}/api/users`,
};
