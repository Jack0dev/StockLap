import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { stockAPI } from '../api/api';
import './StockDetailPage.css';

const RANGES = ['1W', '1M', '3M', '6M', '1Y'];

export default function StockDetailPage() {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('3M');

  useEffect(() => {
    fetchStockDetail();
  }, [ticker]);

  useEffect(() => {
    if (stock) {
      fetchPriceHistory(selectedRange);
    }
  }, [selectedRange, stock]);

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  const fetchStockDetail = async () => {
    setLoading(true);
    try {
      const res = await stockAPI.getByTicker(ticker);
      if (res.data.success) {
        setStock(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi tải thông tin cổ phiếu:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceHistory = async (range) => {
    try {
      const res = await stockAPI.getPriceHistory(ticker, range);
      if (res.data.success && res.data.data) {
        renderChart(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi tải lịch sử giá:', err);
    }
  };

  const renderChart = (historyData) => {
    if (!chartContainerRef.current) return;

    // Remove existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#131722' },
        textColor: '#8a8f9e',
      },
      grid: {
        vertLines: { color: '#1c2030' },
        horzLines: { color: '#1c2030' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: '#2a2e3e',
      },
      timeScale: {
        borderColor: '#2a2e3e',
        timeVisible: false,
      },
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00c853',
      downColor: '#ff1744',
      borderDownColor: '#ff1744',
      borderUpColor: '#00c853',
      wickDownColor: '#ff1744',
      wickUpColor: '#00c853',
    });

    const candleData = historyData.map(d => ({
      time: d.tradingDate,
      open: Number(d.open),
      high: Number(d.high),
      low: Number(d.low),
      close: Number(d.close),
    }));

    candleSeries.setData(candleData);

    // Volume histogram
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#2962ff',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const volumeData = historyData.map(d => ({
      time: d.tradingDate,
      value: d.volume,
      color: Number(d.close) >= Number(d.open) ? 'rgba(0,200,83,0.3)' : 'rgba(255,23,68,0.3)',
    }));

    volumeSeries.setData(volumeData);

    chart.timeScale().fitContent();
  };

  const formatPrice = (price) => {
    if (!price) return '0';
    return Number(price).toLocaleString('vi-VN');
  };

  const getPriceClass = (change) => {
    if (change > 0) return 'price-up';
    if (change < 0) return 'price-down';
    return 'price-ref';
  };

  const getChangeClass = (change) => {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'ref';
  };

  const getTickerColor = (ticker) => {
    const colors = [
      '#2962ff', '#00c853', '#ff6d00', '#aa00ff',
      '#d50000', '#00bfa5', '#6200ea', '#c51162',
    ];
    let hash = 0;
    for (let i = 0; i < ticker.length; i++) {
      hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <div className="stock-detail-page">
        <div className="detail-loading">
          <div className="spinner"></div>
          <span>Đang tải thông tin cổ phiếu...</span>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="stock-detail-page">
        <div className="detail-loading">
          <span style={{ fontSize: '2rem' }}>❌</span>
          <span>Không tìm thấy cổ phiếu: {ticker}</span>
          <button className="btn btn-primary" onClick={() => navigate('/stocks')}>
            ← Quay lại Bảng giá
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-detail-page fade-in">
      {/* Back Button */}
      <button className="back-link" onClick={() => navigate('/stocks')}>
        ← Quay lại Bảng giá
      </button>

      {/* Stock Header */}
      <div className="stock-header">
        <div className="stock-header-left">
          <div
            className="stock-header-icon"
            style={{ background: getTickerColor(stock.ticker) }}
          >
            {stock.ticker.substring(0, 2)}
          </div>
          <div className="stock-header-info">
            <h1>{stock.ticker}</h1>
            <div className="stock-header-meta">
              <span>{stock.companyName}</span>
              <span>•</span>
              <span className={`exchange-badge exchange-${stock.exchange?.toLowerCase()}`}>
                {stock.exchange}
              </span>
            </div>
          </div>
        </div>

        <div className="stock-header-right">
          <div className={`stock-current-price ${getPriceClass(stock.change)}`}>
            {formatPrice(stock.currentPrice)}
          </div>
          <div className="stock-change-info">
            <span className={`stock-change-badge ${getChangeClass(stock.change)}`}>
              {stock.change > 0 ? '+' : ''}{formatPrice(stock.change)}
              {' '}({stock.changePercent > 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Price Info Grid */}
      <div className="price-info-grid">
        <div className="price-info-card">
          <div className="price-info-label">Giá tham chiếu</div>
          <div className="price-info-value price-ref">{formatPrice(stock.referencePrice)}</div>
        </div>
        <div className="price-info-card">
          <div className="price-info-label">Giá mở cửa</div>
          <div className="price-info-value">{formatPrice(stock.openPrice)}</div>
        </div>
        <div className="price-info-card">
          <div className="price-info-label">Cao nhất</div>
          <div className="price-info-value price-up">{formatPrice(stock.highPrice)}</div>
        </div>
        <div className="price-info-card">
          <div className="price-info-label">Thấp nhất</div>
          <div className="price-info-value price-down">{formatPrice(stock.lowPrice)}</div>
        </div>
        <div className="price-info-card">
          <div className="price-info-label">Khối lượng</div>
          <div className="price-info-value">{stock.volume?.toLocaleString('vi-VN')}</div>
        </div>
      </div>

      {/* Candlestick Chart */}
      <div className="chart-section">
        <div className="chart-header">
          <h3>🕯️ Biểu đồ nến — {stock.ticker}</h3>
          <div className="range-selector">
            {RANGES.map(range => (
              <button
                key={range}
                className={`range-btn ${selectedRange === range ? 'active' : ''}`}
                onClick={() => setSelectedRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-container" ref={chartContainerRef}></div>
      </div>
    </div>
  );
}
