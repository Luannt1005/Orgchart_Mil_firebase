import '@/styles/loading.css';

export default function LoadingScreen() {
  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Đang tải dữ liệu...</p>
        <div className="loading-bar">
          <div className="loading-bar-fill"></div>
        </div>
      </div>
    </div>
  );
}
