import {useState} from 'react';
import {toast} from 'react-toastify';
import matchService from "../../../service/matchService.ts";

interface CreateMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateMatchModal = ({isOpen, onClose, onSuccess}: CreateMatchModalProps) => {
    const [formData, setFormData] = useState({
        categoryId: '1', // Mặc định hoặc để trống bắt chọn
        address: '',    // Khu vực mong muốn
        startTime: '',
        endTime: '',
        maxPlayers: 10,
        minPlayersToStart: 6,
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!formData.startTime || !formData.address) {
            return toast.warning("Vui lòng điền đủ thời gian và khu vực!");
        }
        setLoading(true);
        try {
            // Lưu ý: Gửi courtId = null lên backend theo logic mới của bạn
            const response = await matchService.createMatch({...formData, courtId: null} as any);
            if (response.code === 1000 || response.code === 0) {
                toast.success("Đăng tin tìm đồng đội thành công!");
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi tạo trận");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div
                className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                <h2 className="text-2xl font-bold mb-6 text-blue-600 flex items-center gap-2">
                    🏸 Tìm Đồng Đội Giao Lưu
                </h2>

                <div className="space-y-5">
                    {/* Chọn Môn */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Bạn muốn chơi môn
                                gì?</label>
                            <select
                                className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-blue-500 bg-gray-50 font-semibold"
                                onChange={e => setFormData({...formData, categoryId: e.target.value})}
                            >
                                <option value="1">Cầu lông</option>
                                <option value="2">Bóng đá</option>
                                <option value="3">Pickleball</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Khu vực dự
                                kiến</label>
                            <input
                                type="text"
                                placeholder="Ví dụ: Quận 1, Quận 7 hoặc tên sân cụ thể..."
                                className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-blue-500 bg-gray-50"
                                onChange={e => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Thời gian */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Giờ bắt đầu</label>
                            <input
                                type="datetime-local"
                                className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-blue-500 bg-gray-50 transition-all"
                                onChange={e => setFormData({...formData, startTime: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Giờ kết thúc</label>
                            <input
                                type="datetime-local"
                                className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-blue-500 bg-gray-50 transition-all"
                                onChange={e => setFormData({...formData, endTime: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Số lượng */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Max người</label>
                            <input
                                type="number"
                                className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-blue-500 bg-gray-50"
                                defaultValue={10}
                                onChange={e => setFormData({...formData, maxPlayers: parseInt(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Min chốt kèo</label>
                            <input
                                type="number"
                                className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-blue-500 bg-gray-50"
                                defaultValue={6}
                                onChange={e => setFormData({...formData, minPlayersToStart: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end items-center gap-6">
                    <button onClick={onClose}
                            className="font-bold text-gray-400 hover:text-gray-600 transition-colors">Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 disabled:bg-gray-300 transition-all"
                    >
                        {loading ? 'Đang đăng tin...' : 'Đăng kèo ngay'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateMatchModal;