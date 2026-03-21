// SizeGuide.jsx - Component hiển thị trang hướng dẫn chọn size quần áo

import React, { useState } from 'react';
import { useTheme } from '../../../contexts/CustomerThemeContext';
import PageBanner from '../../../components/PageBanner';
import { FaMale, FaFemale, FaRuler, FaWeight, FaArrowRight, FaCalculator, FaInfoCircle, FaRegQuestionCircle } from 'react-icons/fa';
import { BsRulers } from 'react-icons/bs';
import { MdHeight } from 'react-icons/md';
import { FaTshirt, FaRuler as FaRulerIcon, FaMale as FaMaleIcon, FaFemale as FaFemaleIcon } from 'react-icons/fa';

const SizeGuide = () => {
  // Sử dụng theme context để quản lý giao diện theo chủ đề
  const { theme } = useTheme();

  // Khởi tạo state cho các số đo
  const [measurements, setMeasurements] = useState({
    gender: 'men', // Giới tính (nam/nữ)
    height: '', // Chiều cao (cm)
    weight: '', // Cân nặng (kg)
    chest: '', // Vòng ngực (cm)
    waist: '', // Vòng eo (cm)
    hip: '', // Vòng hông (cm)
  });

  // State lưu trữ kết quả tính size
  const [recommendedSize, setRecommendedSize] = useState(null);

  // Các mẹo đo size
  const tips = [
    {
      icon: <FaRulerIcon />,
      title: "Đo đúng cách",
      content: "Sử dụng thước dây, đo sát cơ thể nhưng không quá chặt. Đứng thẳng, thở bình thường khi đo."
    },
    {
      icon: <BsRulers />,
      title: "Các vị trí đo",
      content: "Ngực: Đo vòng ngực rộng nhất\nEo: Đo vòng eo nhỏ nhất\nHông: Đo vòng hông rộng nhất"
    }
  ];

  // Dữ liệu bảng size cho nam và nữ
  const sizeCharts = {
    men: {
      title: "Bảng size Nam",
      sizes: ["S", "M", "L", "XL", "XXL"],
      measurements: [
        {
          part: "Chiều cao (cm)",
          values: ["160-165", "165-170", "170-175", "175-180", "180-185"]
        },
        {
          part: "Cân nặng (kg)",
          values: ["50-55", "55-62", "62-68", "68-75", "75-82"]
        },
        {
          part: "Ngực (cm)",
          values: ["86-90", "90-94", "94-98", "98-102", "102-106"]
        },
        {
          part: "Eo (cm)",
          values: ["72-76", "76-80", "80-84", "84-88", "88-92"]
        },
        {
          part: "Hông (cm)",
          values: ["86-90", "90-94", "94-98", "98-102", "102-106"]
        }
      ]
    },
    women: {
      title: "Bảng size Nữ",
      sizes: ["S", "M", "L", "XL", "XXL"],
      measurements: [
        {
          part: "Chiều cao (cm)",
          values: ["150-155", "155-160", "160-165", "165-170", "170-175"]
        },
        {
          part: "Cân nặng (kg)",
          values: ["40-45", "45-50", "50-55", "55-60", "60-65"]
        },
        {
          part: "Ngực (cm)",
          values: ["80-84", "84-88", "88-92", "92-96", "96-100"]
        },
        {
          part: "Eo (cm)",
          values: ["62-66", "66-70", "70-74", "74-78", "78-82"]
        },
        {
          part: "Hông (cm)",
          values: ["86-90", "90-94", "94-98", "98-102", "102-106"]
        }
      ]
    }
  };

  // Hàm tính toán size phù hợp dựa trên các thông số đã nhập
  const calculateSize = () => {
    // Lấy bảng size theo giới tính (nam/nữ)
    const chart = sizeCharts[measurements.gender];
    // Khởi tạo mảng điểm cho từng size, ban đầu đều là 0
    // Ví dụ: [0, 0, 0, 0, 0] tương ứng với [S, M, L, XL, XXL]
    let points = new Array(chart.sizes.length).fill(0);

    // Hàm kiểm tra giá trị có nằm trong khoảng cho phép không
    // Input: value = 170, ranges = ["160-165", "165-170", "170-175",...]
    // Output: [false, false, true, false,...] -> true nếu 170 nằm trong khoảng
    const checkRange = (value, ranges) => {
      return ranges.map((range) => {
        // Tách chuỗi "170-175" thành [170, 175]
        const [min, max] = range.split('-').map(Number);
        // Kiểm tra value có nằm trong khoảng [min, max]
        return value >= min && value <= max;
      });
    };

    // Kiểm tra từng thông số và cộng điểm
    // Mỗi thông số khớp được cộng 2 điểm
    // Ví dụ: Chiều cao 170cm khớp với size L -> points[2] += 2

    // Giả sử người dùng nhập:
    // height = 170cm
    // weight = 65kg
    // chest = 95cm

    // Kiểm tra với size L:
    // height 170cm nằm trong 170-175 -> +2 điểm
    // weight 65kg nằm trong 62-68 -> +2 điểm
    // chest 95cm nằm trong 94-98 -> +2 điểm

    // Tổng điểm size L = 6 điểm
    // Độ chính xác = (6/10) * 100 = 60%

    // 1. Kiểm tra chiều cao
    if (measurements.height) {
      const heightRanges = chart.measurements[0].values;
      checkRange(Number(measurements.height), heightRanges)
        .forEach((matches, idx) => matches && (points[idx] += 2));
    }

    // 2. Kiểm tra cân nặng
    if (measurements.weight) {
      const weightRanges = chart.measurements[1].values;
      checkRange(Number(measurements.weight), weightRanges)
        .forEach((matches, idx) => matches && (points[idx] += 2));
    }

    // 3. Kiểm tra vòng ngực
    if (measurements.chest) {
      const chestRanges = chart.measurements[2].values;
      checkRange(Number(measurements.chest), chestRanges)
        .forEach((matches, idx) => matches && (points[idx] += 2));
    }

    // 4. Kiểm tra vòng eo
    if (measurements.waist) {
      const waistRanges = chart.measurements[3].values;
      checkRange(Number(measurements.waist), waistRanges)
        .forEach((matches, idx) => matches && (points[idx] += 2));
    }

    // 5. Kiểm tra vòng hông
    if (measurements.hip) {
      const hipRanges = chart.measurements[4].values;
      checkRange(Number(measurements.hip), hipRanges)
        .forEach((matches, idx) => matches && (points[idx] += 2));
    }

    // Tìm size có điểm cao nhất
    // Ví dụ: points = [2, 4, 8, 4, 2] -> size L có điểm cao nhất (8 điểm)
    const maxPoints = Math.max(...points);
    const sizeIndex = points.indexOf(maxPoints);

    // Cập nhật kết quả với size phù hợp nhất
    // Độ chính xác = (điểm đạt được / điểm tối đa) * 100
    // Điểm tối đa = 10 (5 thông số * 2 điểm)
    setRecommendedSize({
      size: chart.sizes[sizeIndex],
      confidence: Math.min(100, (maxPoints / (10) * 100))
    });
  };

  // Hàm xử lý khi người dùng nhập liệu
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMeasurements(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Hàm xử lý khi submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    calculateSize();
  };

  // Render component
  return (
    <div className={`min-h-screen relative ${
      theme === 'tet'
        ? 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Phần trang trí nền */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Hình tròn trang trí */}
        <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 ${
          theme === 'tet' ? 'bg-red-300' : 'bg-blue-300'
        }`} />
        <div className={`absolute -bottom-24 -left-24 w-96 h-96 rounded-full opacity-20 ${
          theme === 'tet' ? 'bg-yellow-300' : 'bg-purple-300'
        }`} />

        {/* Các phần tử nổi */}
        {theme === 'tet' ? (
          // Hiển thị các phần tử nổi cho theme 'tet'
          <>
            <div className="absolute top-1/4 left-10 w-4 h-4 bg-red-400 rounded-full animate-float-slow" />
            <div className="absolute top-1/3 right-12 w-3 h-3 bg-yellow-400 rounded-full animate-float-slower" />
            <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-orange-400 rounded-full animate-float" />
          </>
        ) : (
          // Hiển thị các phần tử nổi cho theme 'normal'
          <>
            <div className="absolute top-1/4 left-10 w-4 h-4 bg-blue-400 rounded-full animate-float-slow" />
            <div className="absolute top-1/3 right-12 w-3 h-3 bg-indigo-400 rounded-full animate-float-slower" />
            <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-purple-400 rounded-full animate-float" />
          </>
        )}
      </div>

      <div className="relative">
        {/* Banner trang */}
        <PageBanner
          icon={FaRegQuestionCircle}
          title="HƯỚNG DẪN CHỌN SIZE"
          subtitle="Bảng size chi tiết và cách đo size chuẩn"
          breadcrumbText="Hướng dẫn chọn size"
        />

        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Phần tính size tự động */}
          <div className={`p-6 rounded-2xl backdrop-blur-sm mb-12 ${
            theme === 'tet'
              ? 'bg-white/90'
              : 'bg-white/90'
          }`}>
            <h2 className="text-2xl font-bold mb-6">Tính size tự động</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Chọn giới tính */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange({ target: { name: 'gender', value: 'men' } })}
                  className={`flex-1 p-4 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                    measurements.gender === 'men'
                      ? theme === 'tet'
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FaMaleIcon className="text-xl" />
                  <span>Nam</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange({ target: { name: 'gender', value: 'women' } })}
                  className={`flex-1 p-4 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                    measurements.gender === 'women'
                      ? theme === 'tet'
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FaFemaleIcon className="text-xl" />
                  <span>Nữ</span>
                </button>
              </div>

              {/* Các trường nhập số đo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Chiều cao */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaRuler className="text-xl" />
                    Chiều cao (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={measurements.height}
                    onChange={handleInputChange}
                    placeholder="VD: 173"
                    className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                  />
                </div>

                {/* Cân nặng */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaRuler className="text-xl" />
                    Cân nặng (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={measurements.weight}
                    onChange={handleInputChange}
                    placeholder="VD: 65"
                    className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                  />
                </div>

                {/* Vòng ngực */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaRuler className="text-xl" />
                    Vòng ngực (cm)
                  </label>
                  <input
                    type="number"
                    name="chest"
                    value={measurements.chest}
                    onChange={handleInputChange}
                    placeholder="VD: 96"
                    className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                  />
                </div>

                {/* Vòng eo */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaRuler className="text-xl" />
                    Vòng eo (cm)
                  </label>
                  <input
                    type="number"
                    name="waist"
                    value={measurements.waist}
                    onChange={handleInputChange}
                    placeholder="VD: 82"
                    className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                  />
                </div>

                {/* Vòng hông */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaRuler className="text-xl" />
                    Vòng hông (cm)
                  </label>
                  <input
                    type="number"
                    name="hip"
                    value={measurements.hip}
                    onChange={handleInputChange}
                    placeholder="VD: 96"
                    className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                  />
                </div>
              </div>

              {/* Nút tính size */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  className={`px-6 py-3 rounded-xl font-medium text-white transition-colors flex items-center gap-2 ${
                    theme === 'tet'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  <span>Tính size</span>
                  <FaCalculator className="text-xl" />
                </button>
              </div>
            </form>

            {/* Hiển thị kết quả tính size */}
            {recommendedSize && (
              <div className="mt-8">
                <div className="flex justify-center">
                  <div className={`text-center inline-block px-8 py-4 rounded-xl ${
                    theme === 'tet'
                      ? 'bg-red-50'
                      : 'bg-blue-50'
                  }`}>
                    <p className="text-lg mb-2">Size phù hợp với bạn là:</p>
                    <div className={`text-4xl font-bold mb-2 ${
                      theme === 'tet'
                        ? 'text-red-500'
                        : 'text-blue-500'
                    }`}>
                      {recommendedSize.size}
                    </div>
                    <p className="text-sm text-gray-600">
                      Độ chính xác: {recommendedSize.confidence.toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Giải thích kết quả */}
                <div className="mt-6 space-y-4 text-gray-600">
                  <div>
                    <h4 className="font-medium mb-2">🎯 Độ chính xác là gì?</h4>
                    <p>Độ chính xác cho biết mức độ phù hợp của size được đề xuất dựa trên số lượng thông số bạn đã nhập:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>90-100%: Rất chính xác (phù hợp với hầu hết các thông số)</li>
                      <li>70-89%: Khá chính xác (phù hợp với đa số thông số)</li>
                      <li>50-69%: Tương đối chính xác (phù hợp với một số thông số)</li>
                      <li>&lt;50%: Tham khảo (cần thêm thông số để chính xác hơn)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">💡 Lời khuyên:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {recommendedSize.confidence < 50 && (
                        <li>Vui lòng nhập thêm các số đo để có kết quả chính xác hơn</li>
                      )}
                      {measurements.gender === 'men' ? (
                        <>
                          <li>Nam giới nên ưu tiên số đo vòng ngực và chiều cao</li>
                          <li>Nếu bạn thích mặc rộng rãi, có thể chọn size {sizeCharts.men.sizes[sizeCharts.men.sizes.indexOf(recommendedSize.size) + 1] || recommendedSize.size}</li>
                        </>
                      ) : (
                        <>
                          <li>Nữ giới nên ưu tiên số đo vòng ngực và vòng eo</li>
                          <li>Nếu bạn thích form ôm, có thể chọn size {sizeCharts.women.sizes[sizeCharts.women.sizes.indexOf(recommendedSize.size) - 1] || recommendedSize.size}</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">⚠️ Lưu ý:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Kết quả chỉ mang tính chất tham khảo</li>
                      <li>Size có thể thay đổi tùy theo kiểu dáng sản phẩm</li>
                      <li>Nếu bạn vẫn không chắc chắn, hãy liên hệ với chúng tôi để được tư vấn</li>
                      <li>Chúng tôi hỗ trợ đổi size trong vòng 7 ngày nếu size không phù hợp</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Phần mẹo đo size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {tips.map((tip, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl backdrop-blur-sm ${
                  theme === 'tet'
                    ? 'bg-white/90 hover:bg-red-50/90'
                    : 'bg-white/90 hover:bg-blue-50/90'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  theme === 'tet'
                    ? 'bg-red-100 text-red-500'
                    : 'bg-blue-100 text-blue-500'
                }`}>
                  {tip.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{tip.title}</h3>
                <p className="text-gray-600 whitespace-pre-line">{tip.content}</p>
              </div>
            ))}
          </div>

          {/* Bảng size */}
          <div className="space-y-12">
            {Object.entries(sizeCharts).map(([gender, data]) => (
              <div key={gender}>
                <div className="flex items-center gap-2 mb-6">
                  {gender === 'men' ? (
                    <FaMaleIcon className={`text-2xl ${
                      theme === 'tet' ? 'text-red-500' : 'text-blue-500'
                    }`} />
                  ) : (
                    <FaFemaleIcon className={`text-2xl ${
                      theme === 'tet' ? 'text-red-500' : 'text-blue-500'
                    }`} />
                  )}
                  <h2 className="text-2xl font-bold">{data.title}</h2>
                </div>

                {/* Hiển thị bảng size trên desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="py-3 px-4 text-left bg-gray-50">Kích thước</th>
                        {data.sizes.map((size) => (
                          <th key={size} className="py-3 px-4 text-center bg-gray-50">{size}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.measurements.map((row, rowIndex) => (
                        <tr key={row.part} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-3 px-4 font-medium">{row.part}</td>
                          {row.values.map((value, index) => (
                            <td key={index} className="py-3 px-4 text-center">{value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Hiển thị bảng size trên mobile */}
                <div className="md:hidden space-y-4">
                  {data.sizes.map((size, sizeIndex) => (
                    <div 
                      key={size} 
                      className={`p-4 rounded-xl ${
                        theme === 'tet' ? 'bg-white/90' : 'bg-white/90'
                      }`}
                    >
                      <div className={`text-lg font-bold mb-2 ${
                        theme === 'tet' ? 'text-red-500' : 'text-blue-500'
                      }`}>
                        Size {size}
                      </div>
                      <div className="space-y-2">
                        {data.measurements.map((row) => (
                          <div key={row.part} className="flex justify-between items-center">
                            <span className="text-gray-600">{row.part}</span>
                            <span className="font-medium">{row.values[sizeIndex]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Phần lưu ý */}
          <div className={`mt-12 p-6 rounded-2xl ${
            theme === 'tet'
              ? 'bg-red-50'
              : 'bg-blue-50'
          }`}>
            <h3 className="text-xl font-bold mb-4">Lưu ý:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Bảng size trên chỉ mang tính chất tham khảo</li>
              <li>Size có thể thay đổi tùy theo kiểu dáng sản phẩm</li>
              <li>Nếu bạn vẫn không chắc chắn, hãy liên hệ với chúng tôi để được tư vấn</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeGuide;
