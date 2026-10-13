export const environment = {
  production: false,
  /**
   * Đường dẫn API:
   * - Mặc định nội bộ UI: '/api' (Truy cập xem ngay JSON tại: http://localhost:4200/api/products.json, http://localhost:4200/api/categories.json)
   * - Khi kết nối Backend độc lập (Spring Boot / Node.js / Python): đổi thành 'http://localhost:8080/api'
   */
  apiUrl: '/api',
};
