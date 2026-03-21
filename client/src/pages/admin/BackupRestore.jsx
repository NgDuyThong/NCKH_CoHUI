import React, { useState, useEffect } from 'react';
import { 
  FiDatabase, 
  FiDownload, 
  FiUpload, 
  FiRefreshCw, 
  FiAlertCircle, 
  FiCheckCircle,
  FiClock,
  FiHardDrive,
  FiArchive,
  FiTrash2,
  FiInfo,
  FiServer
} from 'react-icons/fi';
import { useTheme } from '../../contexts/AdminThemeContext';
import axiosInstance from '../../utils/axios';
import { toast } from 'react-toastify';

const BackupRestore = () => {
  const { isDarkMode } = useTheme();
  
  // State management
  const [selectedBackupType, setSelectedBackupType] = useState('full');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [backupHistory, setBackupHistory] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load dữ liệu khi component mount
  useEffect(() => {
    loadBackupList();
    loadSystemInfo();
  }, []);

  // Load danh sách backup
  const loadBackupList = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/backup/list');
      if (response.data.success) {
        setBackupHistory(response.data.backups);
      }
    } catch (error) {
      console.error('Error loading backup list:', error);
      toast.error('Lỗi khi tải danh sách backup');
    } finally {
      setLoading(false);
    }
  };

  // Load thông tin hệ thống
  const loadSystemInfo = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/backup/system-info');
      if (response.data.success) {
        setSystemInfo(response.data.system);
      }
    } catch (error) {
      console.error('Error loading system info:', error);
    }
  };

  // Tạo backup
  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      
      const endpoint = selectedBackupType === 'full' 
        ? '/api/admin/backup/create-full'
        : '/api/admin/backup/create-partial';
      
      const response = await axiosInstance.post(endpoint);
      
      if (response.data.success) {
        toast.success(response.data.message);
        loadBackupList();
        loadSystemInfo();
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi tạo backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Restore backup
  const handleRestoreBackup = async () => {
    if (!selectedFile) {
      toast.warning('Vui lòng chọn file backup');
      return;
    }

    // Xác nhận trước khi restore
    if (!window.confirm('⚠️ CẢNH BÁO: Quá trình restore sẽ ghi đè toàn bộ dữ liệu hiện tại. Bạn có chắc chắn muốn tiếp tục?')) {
      return;
    }

    try {
      setIsRestoring(true);
      
      const formData = new FormData();
      formData.append('backupFile', selectedFile);
      
      const response = await axiosInstance.post('/api/admin/backup/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedFile(null);
        loadSystemInfo();
        
        // Hiển thị thông tin chi tiết
        const restored = response.data.restored;
        setTimeout(() => {
          toast.info(`Đã khôi phục ${restored.documents} documents từ ${restored.collections} collections`);
        }, 1000);
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi khôi phục dữ liệu');
    } finally {
      setIsRestoring(false);
    }
  };

  // Chọn file
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra kích thước file (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error('File quá lớn. Kích thước tối đa là 100MB');
        return;
      }
      setSelectedFile(file);
      toast.success(`Đã chọn file: ${file.name}`);
    }
  };

  // Xóa backup
  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa backup "${filename}"?`)) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/api/admin/backup/delete/${filename}`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        loadBackupList();
        loadSystemInfo();
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xóa backup');
    }
  };

  // Download backup
  const handleDownloadBackup = async (filename) => {
    try {
      toast.info('Đang chuẩn bị tải xuống...');
      
      const response = await axiosInstance.get(`/api/admin/backup/download/${filename}`, {
        responseType: 'blob'
      });
      
      // Tạo URL để download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Tải xuống thành công');
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Lỗi khi tải xuống backup');
    }
  };

  // Format ngày giờ
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header Section */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-lg p-6 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} shadow-lg`}>
              <FiDatabase className="text-3xl text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Backup & Restore
              </h1>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Quản lý sao lưu và khôi phục dữ liệu hệ thống
              </p>
            </div>
          </div>
          
          {/* System Status */}
          <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
          }`}>
            <FiCheckCircle className="text-xl" />
            <span className="font-semibold">
              {systemInfo ? `${systemInfo.total_documents} documents` : 'Đang tải...'}
            </span>
          </div>
        </div>
      </div>

      {/* Alert Info Box */}
      <div className={`${isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-300'} border-l-4 p-4 mb-6 rounded-r-lg`}>
        <div className="flex items-start gap-3">
          <FiAlertCircle className={`text-2xl ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} mt-1`} />
          <div>
            <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
              Lưu ý quan trọng
            </h3>
            <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>
              <li>• Nên thực hiện backup định kỳ để đảm bảo an toàn dữ liệu</li>
              <li>• Kiểm tra kỹ file backup trước khi restore</li>
              <li>• Quá trình restore sẽ ghi đè dữ liệu hiện tại</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Create Backup Section */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-lg p-6`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'}`}>
              <FiDownload className="text-xl text-white" />
            </div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Tạo Backup
            </h2>
          </div>

          {/* Backup Type Selection */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Chọn loại backup
            </label>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setSelectedBackupType('full')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedBackupType === 'full'
                    ? isDarkMode 
                      ? 'border-blue-500 bg-blue-900/30' 
                      : 'border-blue-500 bg-blue-50'
                    : isDarkMode
                      ? 'border-gray-600 hover:border-gray-500'
                      : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <FiServer className={`text-2xl mt-1 ${selectedBackupType === 'full' ? 'text-blue-500' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <div className="text-left">
                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      Full Backup
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Sao lưu toàn bộ database (khuyến nghị)
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedBackupType('partial')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedBackupType === 'partial'
                    ? isDarkMode 
                      ? 'border-blue-500 bg-blue-900/30' 
                      : 'border-blue-500 bg-blue-50'
                    : isDarkMode
                      ? 'border-gray-600 hover:border-gray-500'
                      : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <FiArchive className={`text-2xl mt-1 ${selectedBackupType === 'partial' ? 'text-blue-500' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <div className="text-left">
                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      Partial Backup
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Sao lưu các bảng quan trọng
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Create Backup Button */}
          <button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className={`w-full py-4 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-3 ${
              isCreatingBackup
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
            }`}
          >
            {isCreatingBackup ? (
              <>
                <FiRefreshCw className="animate-spin text-xl" />
                Đang tạo backup...
              </>
            ) : (
              <>
                <FiDownload className="text-xl" />
                Tạo Backup Ngay
              </>
            )}
          </button>

          {/* Info Box */}
          <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="flex items-start gap-2">
              <FiInfo className={`text-lg mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                File backup sẽ được lưu tự động với tên theo định dạng: backup_[type]_[date]_[time].sql
              </p>
            </div>
          </div>
        </div>

        {/* Restore Backup Section */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-lg p-6`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-orange-600' : 'bg-orange-500'}`}>
              <FiUpload className="text-xl text-white" />
            </div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Khôi Phục Dữ Liệu
            </h2>
          </div>

          {/* File Upload Area */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Chọn file backup
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isDarkMode 
                  ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50' 
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
            >
              <input
                type="file"
                accept=".sql,.zip"
                onChange={handleFileSelect}
                className="hidden"
                id="backup-file"
              />
              <label htmlFor="backup-file" className="cursor-pointer">
                <FiUpload className={`text-5xl mx-auto mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <p className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedFile ? selectedFile.name : 'Click để chọn file backup'}
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Hỗ trợ file .sql, .zip
                </p>
              </label>
            </div>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiHardDrive className={`text-2xl ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedFile.name}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                >
                  <FiTrash2 className={`text-xl ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                </button>
              </div>
            </div>
          )}

          {/* Restore Button */}
          <button
            onClick={handleRestoreBackup}
            disabled={!selectedFile || isRestoring}
            className={`w-full py-4 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-3 ${
              !selectedFile || isRestoring
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-lg hover:shadow-xl'
            }`}
          >
            {isRestoring ? (
              <>
                <FiRefreshCw className="animate-spin text-xl" />
                Đang khôi phục...
              </>
            ) : (
              <>
                <FiUpload className="text-xl" />
                Khôi Phục Dữ Liệu
              </>
            )}
          </button>

          {/* Warning Box */}
          <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-2">
              <FiAlertCircle className={`text-lg mt-0.5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              <p className={`text-xs ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                <strong>Cảnh báo:</strong> Quá trình restore sẽ ghi đè toàn bộ dữ liệu hiện tại. Hãy chắc chắn bạn đã backup dữ liệu trước khi thực hiện.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Backup History Section */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-lg p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-purple-600' : 'bg-purple-500'}`}>
              <FiClock className="text-xl text-white" />
            </div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Lịch Sử Backup
            </h2>
          </div>
          <button className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`} onClick={() => { loadBackupList(); loadSystemInfo(); }}>
            <FiRefreshCw className="inline" />
            Làm mới
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tên File
                </th>
                <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Loại
                </th>
                <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Kích thước
                </th>
                <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Ngày tạo
                </th>
                <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Trạng thái
                </th>
                <th className={`text-right py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center">
                    <FiRefreshCw className={`animate-spin text-4xl mx-auto mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Đang tải...</p>
                  </td>
                </tr>
              ) : backupHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <FiDatabase className={`text-6xl mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Chưa có bản backup nào
                    </p>
                  </td>
                </tr>
              ) : (
                backupHistory.map((backup) => (
                  <tr 
                    key={backup.id}
                    className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                  >
                    <td className={`py-4 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                      <div className="flex items-center gap-2">
                        <FiDatabase className="text-blue-500" />
                        <span className="font-medium">{backup.name}</span>
                      </div>
                    </td>
                    <td className={`py-4 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        backup.type === 'full' 
                          ? isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                          : isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {backup.type === 'full' ? 'Full Backup' : 'Partial Backup'}
                      </span>
                    </td>
                    <td className={`py-4 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {backup.size}
                    </td>
                    <td className={`py-4 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {formatDate(backup.created_at)}
                    </td>
                    <td className={`py-4 px-4`}>
                      <span className={`flex items-center gap-2 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`}>
                        <FiCheckCircle />
                        Thành công
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadBackup(backup.name)}
                          className={`p-2 rounded-lg transition-all ${
                            isDarkMode 
                              ? 'hover:bg-blue-900/50 text-blue-400' 
                              : 'hover:bg-blue-100 text-blue-600'
                          }`}
                          title="Tải xuống"
                        >
                          <FiDownload className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup.name)}
                          className={`p-2 rounded-lg transition-all ${
                            isDarkMode 
                              ? 'hover:bg-red-900/50 text-red-400' 
                              : 'hover:bg-red-100 text-red-600'
                          }`}
                          title="Xóa"
                        >
                          <FiTrash2 className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Empty State - Đã xử lý bên trong tbody */}
      </div>
    </div>
  );
};

export default BackupRestore;
