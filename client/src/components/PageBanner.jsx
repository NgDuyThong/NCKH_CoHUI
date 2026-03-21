// PageBanner.jsx - Component banner cho các trang
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChevronRight, FaHome } from 'react-icons/fa';
import { useTheme } from '../contexts/CustomerThemeContext';

// Import Google Fonts
import '@fontsource/montserrat/700.css'; // Bold
import '@fontsource/montserrat/800.css'; // Extra Bold
import '@fontsource/montserrat/900.css'; // Black
import '@fontsource/poppins/600.css'; // Semi Bold
import '@fontsource/poppins/700.css'; // Bold

const PageBanner = ({
  icon: Icon,
  title,
  subtitle,
  breadcrumbText,
  extraContent
}) => {
  const { theme } = useTheme();
  const location = useLocation();

  // Tạo breadcrumb từ current path
  const getBreadcrumbs = () => {
    // Bỏ qua ký tự "/" đầu tiên và split path thành array
    const pathSegments = location.pathname.split('/').filter(segment => segment);

    // Object map các path segment sang tên hiển thị
    const pathNames = {
      'products': 'Sản phẩm',
      'cart': 'Giỏ hàng',
      'checkout': 'Thanh toán',
      'order-history': 'Lịch sử đơn hàng',
      'wishlist': 'Yêu thích',
      'policy': 'Chính sách',
      'shipping': 'Vận chuyển',
      'male': 'Nam',
      'female': 'Nữ',
      'sale': 'Giảm giá',
      'sale-tet': 'Giảm giá Tết',
      'new-arrivals': 'Hàng mới về',
      'tet-collection': 'Thời trang Tết',
      'tet': 'Thời trang Tết',
      'news': 'Tin tức',
      'return': 'Đổi trả',
      'orders': 'Đơn hàng',
      'payment': 'Thanh toán',
      'support': 'Hỗ trợ',
      'about': 'Giới thiệu',
      'connect': 'Liên hệ',
      'faq': 'FAQ',
      'profile': 'Tài khoản',
      'size-guide': 'Hướng dẫn chọn size',
      'contact': 'Liên hệ',
      'promotion': 'Khuyến mãi',
      'coupons': 'Mã giảm giá',
      'notifications': 'Thông báo',
      'admin': 'Quản lý'
    };

    // Tạo mảng breadcrumbs với path và label
    const breadcrumbs = pathSegments.map((segment, index) => {
      // Tạo full path cho segment này
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      // Lấy tên hiển thị từ map hoặc dùng segment gốc nếu không có trong map
      let label = pathNames[segment] || segment;
      if (segment === 'product') {
        return { path: '/products', label: 'Sản phẩm' }; // Đường link cho segment 'product'
      }

      return { path, label };
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="relative">
      {/* Banner chính */}
      <div className={`relative overflow-hidden ${theme === 'tet'
        ? 'bg-gradient-to-br from-red-600 via-red-500 to-orange-500'
        : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600'
        }`}>
        {/* Các phần tử trang trí */}
        <div className="absolute inset-0">

          {/* Các hình tròn hiệu ứng động */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 animate-float-slow"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 animate-float-slow animation-delay-2000"></div>
          </div>

          {/* Nền Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>

          {/* Đường thẳng hiệu ứng động */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-shimmer"></div>
          </div>

          {/* Các chấm tròn trên overlay */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        {/* Container nội dung */}
        <div className="relative container mx-auto px-4 py-10 sm:py-12">
          <div className="max-w-4xl mx-auto text-center">
            {/* Decorative elements trên title */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="hidden sm:block h-[2px] w-12 bg-gradient-to-r from-transparent to-white/50 rounded-full"></div>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-pulse animation-delay-200"></div>
                <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse animation-delay-400"></div>
              </div>
              <div className="hidden sm:block h-[2px] w-12 bg-gradient-to-l from-transparent to-white/50 rounded-full"></div>
            </div>

            {/* Tiêu đề với đường chữ nổi - ENHANCED */}
            <h1 
              className="relative text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight animate-fade-in-up"
              style={{ 
                fontFamily: "'Montserrat', sans-serif",
                textShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 40px rgba(255,255,255,0.2), 0 0 60px rgba(255,255,255,0.1)',
                letterSpacing: '0.02em'
              }}
            >
              {/* Glow effect phía sau chữ */}
              <span className="absolute inset-0 blur-2xl bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 animate-pulse-slow"></span>
              
              {/* Text với gradient overlay */}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-white via-blue-50 to-white bg-clip-text text-transparent drop-shadow-2xl animate-shimmer-text">
                  {title.toUpperCase()}
                </span>
                
                {/* Underline animation với sparkle */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-gradient-to-r from-white/0 via-white to-white/0 rounded-full animate-slide-underline shadow-lg shadow-white/50"></div>
                </div>
                
                {/* Sparkles xung quanh chữ */}
                <div className="absolute -top-1 left-[10%] w-1 h-1 bg-white rounded-full animate-twinkle"></div>
                <div className="absolute -top-2 right-[15%] w-1 h-1 bg-blue-200 rounded-full animate-twinkle animation-delay-500"></div>
                <div className="absolute top-1/2 -right-3 w-1 h-1 bg-purple-200 rounded-full animate-twinkle animation-delay-300"></div>
                <div className="absolute -bottom-0.5 left-[20%] w-1 h-1 bg-pink-200 rounded-full animate-twinkle animation-delay-600"></div>
              </span>
            </h1>

            {/* Chữ mờ với gradient - ENHANCED */}
            {subtitle && (
              <div
                className={`text-base sm:text-lg md:text-xl font-semibold mt-4 animate-fade-in ${theme === 'tet'
                  ? 'text-yellow-100'
                  : 'text-blue-100'
                }`}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  textShadow: '0 2px 10px rgba(0,0,0,0.2), 0 4px 20px rgba(255,255,255,0.1)',
                  letterSpacing: '0.01em',
                  animationDelay: '0.2s'
                }}
              >
                <span className="relative inline-block">
                  {subtitle}
                  {/* Subtle underline */}
                  <div className="absolute -bottom-0.5 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-current to-transparent opacity-50"></div>
                </span>
              </div>
            )}

            {/* Decorative elements dưới subtitle */}
            <div className="flex items-center justify-center gap-2 mt-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="w-1 h-1 bg-white/60 rounded-full"></div>
              <div className="w-6 h-[1px] bg-gradient-to-r from-white/40 to-transparent"></div>
              <div className="w-1 h-1 bg-white/60 rounded-full"></div>
              <div className="w-6 h-[1px] bg-gradient-to-l from-white/40 to-transparent"></div>
              <div className="w-1 h-1 bg-white/60 rounded-full"></div>
            </div>

            {/* Nội dung bổ sung */}
            {extraContent}
          </div>
        </div>

        {/* Đường chia hiệu ứng động - SHORTENED */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-8 sm:h-10" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path
              d="M0,0 C150,90 400,120 600,100 C800,80 1050,40 1200,100 L1200,120 L0,120 Z"
              className="fill-[#F8FAFC]"
            ></path>
          </svg>
        </div>
      </div>

      {/* Breadcrumb hiệu ứng động */}
      <div className="container mx-auto px-4 pt-4">
        <div className={`relative mb-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full shadow-lg ${theme === 'tet'
          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
          : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
          } backdrop-blur-md`}>
          <Link
            to="/"
            className={`flex items-center gap-2 ${theme === 'tet'
              ? 'text-yellow-300 hover:text-yellow-400'
              : 'text-blue-200 hover:text-blue-300'
              } transition-colors duration-300`}
          >
            <FaHome className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">
              Trang chủ
            </span>
          </Link>

          {/* Breadcrumb */}
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>

              {/* Icon chevron */}
              <FaChevronRight className={`w-3 h-3 ${theme === 'tet'
                ? 'text-yellow-200'
                : 'text-blue-200'
                }`} />
              {index === breadcrumbs.length - 1 ? (
                
                // Label
                <span className={`font-medium ${theme === 'tet'
                  ? 'text-yellow-300'
                  : 'text-blue-300'
                  }`}>
                  {crumb.label}
                </span>
              ) : (
                
                // Link
                <Link
                  to={crumb.path}
                  className={`hover:opacity-90 transition-opacity ${theme === 'tet'
                    ? 'text-yellow-300/90'
                    : 'text-blue-300/90'
                    }`}
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ANIMATIONS */}
      <style>
        {`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-15px, -15px) rotate(-5deg); }
          66% { transform: translate(15px, -10px) rotate(5deg); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes shimmer-text {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        @keyframes slide-underline {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }

        .animate-shimmer-text {
          background-size: 200% auto;
          animation: shimmer-text 3s linear infinite;
        }

        .animate-slide {
          animation: slide 2s linear infinite;
        }

        .animate-slide-underline {
          animation: slide-underline 3s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }

        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }

        .animation-delay-700 {
          animation-delay: 0.7s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
        `}
      </style>
    </div>
  );
};

export default PageBanner;
