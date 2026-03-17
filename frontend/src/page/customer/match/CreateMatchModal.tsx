import {useState, useEffect} from 'react';
import {toast} from 'react-toastify';
import matchService from "../../../service/matchService.ts";

interface CreateMatchModalProps {
    post: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateMatchModal = ({post, isOpen, onClose, onSuccess}: CreateMatchModalProps) => {
    const [formData, setFormData] = useState({
        courtId: '',
        startTime: '',
        endTime: '',
        maxPlayers: 10,
        minPlayersToStart: 6,
        isRecurring: false,
    });
    const [loading, setLoading] = useState(false);

    // Cập nhật courtId khi post thay đổi từ bên ngoài
    useEffect(() => {
        if (post) setFormData(prev => ({...prev, courtId: post.courtId}));
    }, [post]);

    const handleSubmit = async () => {
        if (!formData.startTime || !formData.endTime) return toast.warning("Chọn thời gian!");
        setLoading(true);
        try {
            const response = await matchService.createMatch(formData as any);
            if (response.code === 1000 || response.code === 0) {
                toast.success("Tạo thành công!");
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi tạo trận");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !post) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-blue-600">Thông tin trận đấu</h2>

                <div className="space-y-5">
                    {/* Mục Sân */}
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Sân đang
                            chọn</label>
                        <p className="p-3 bg-gray-50 rounded-xl font-semibold border border-gray-100 italic text-gray-700">
                            {post.courtName}
                        </p>
                    </div>

                    {/* Mục Thời gian */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Giờ
                                bắt đầu</label>
                            <input
                                type="datetime-local"
                                className="w-full border-2 border-gray-50 p-3 rounded-xl outline-none focus:border-blue-500 focus:bg-white bg-gray-50 transition-all"
                                onChange={e => setFormData({...formData, startTime: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Giờ
                                kết thúc</label>
                            <input
                                type="datetime-local"
                                className="w-full border-2 border-gray-50 p-3 rounded-xl outline-none focus:border-blue-500 focus:bg-white bg-gray-50 transition-all"
                                onChange={e => setFormData({...formData, endTime: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Mục Số lượng người */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Số
                                người tối đa</label>
                            <input
                                type="number"
                                placeholder="Ví dụ: 10"
                                className="w-full border-2 border-gray-50 p-3 rounded-xl outline-none focus:border-blue-500 bg-gray-50"
                                defaultValue={10}
                                onChange={e => setFormData({...formData, maxPlayers: parseInt(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Tối
                                thiểu để chốt</label>
                            <input
                                type="number"
                                placeholder="Ví dụ: 6"
                                className="w-full border-2 border-gray-50 p-3 rounded-xl outline-none focus:border-blue-500 bg-gray-50"
                                defaultValue={6}
                                onChange={e => setFormData({...formData, minPlayersToStart: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>

                {/* Nút bấm */}
                <div className="mt-8 flex justify-end items-center gap-6">
                    <button
                        onClick={onClose}
                        className="font-bold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:bg-gray-300"
                    >
                        {loading ? 'Đang tạo...' : 'Xác nhận tạo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateMatchModal;