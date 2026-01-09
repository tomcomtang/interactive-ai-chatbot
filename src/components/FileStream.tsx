import { useEffect, useRef, useState } from 'react';
import '../styles/filestream.css';

interface FileStreamProps {
  className?: string;
}

export default function FileStream({ className = '' }: FileStreamProps) {
  const [active, setActive] = useState(false);
  const horizonRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 延迟激活动画效果
    const timer = setTimeout(() => {
      setActive(true);
    }, 500);

    // 监听滚动和鼠标移动，动态调整效果
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        setActive(isVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 初始检查

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className={`filestream ${className}`} ref={containerRef}>
      <div 
        className="horizon" 
        data-active={active ? 'true' : 'false'}
        ref={horizonRef}
        style={{ opacity: active ? 1 : 0 }}
      >
        <div className="horizon-line"></div>
        <div className="horizon-glow"></div>
      </div>
      
      {/* Left mask with decrypted content */}
      <div className="mask" data-position="left">
        <div className="scroller">
          <div className="decrypted">
            {/* 使用 CSS 渲染的卡片 */}
            <div className="card-placeholder" style={{
              width: '140px',
              height: '220px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}></div>
          </div>
        </div>
      </div>
      
      {/* Right mask with encrypted content */}
      <div className="mask" data-position="right">
        <div className="scroller">
          <div className="encrypted" style={{ position: 'relative' }}>
            {/* 使用 CSS 渲染的卡片 */}
            <div className="card-placeholder" style={{
              width: '140px',
              height: '220px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}></div>
            <div className="chars">
              <strong>8f2a</strong>9b3c<strong>1d4e</strong>5a6f<strong>7c8d</strong>9e0f
              <strong>1a2b</strong>3c4d<strong>5e6f</strong>7a8b<strong>9c0d</strong>1e2f
              <strong>3a4b</strong>5c6d<strong>7e8f</strong>9a0b<strong>1c2d</strong>3e4f
              <strong>5a6b</strong>7c8d<strong>9e0f</strong>1a2b<strong>3c4d</strong>5e6f
              <strong>7a8b</strong>9c0d<strong>1e2f</strong>3a4b<strong>5c6d</strong>7e8f
              <strong>9a0b</strong>1c2d<strong>3e4f</strong>5a6b<strong>7c8d</strong>9e0f
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
