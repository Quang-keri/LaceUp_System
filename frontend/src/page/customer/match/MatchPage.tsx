import React, {useEffect, useState} from 'react';
import {Calendar, Clock, MapPin, Users} from 'lucide-react';
import matchService from "../../../service/matchService.ts";
import type {MatchResponse} from "../../../types/match.ts";
import {toast} from 'react-toastify';
import postService from "../../../service/post/postService.ts";
import CreateMatchModal from "./CreateMatchModal";

const MatchPage: React.FC = () => {
    const [matches, setMatches] = useState<MatchResponse[]>([]);
    const [filter, setFilter] = useState('Tất cả');
    const [loading, setLoading] = useState(false);

    // Quản lý Modal chọn sân
    const [isSelectCourtOpen, setIsSelectCourtOpen] = useState(false);
    const [allPosts, setAllPosts] = useState<any[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);

    // Quản lý Modal nhập thông tin trận
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);

    const fetchMatches = async () => {
        setLoading(true);
        try {
            const response = await matchService.getOpenMatches();
            if (response.code === 1000 || response.code === 0) {
                setMatches(response.result);
            }
        } catch (error) {
            toast.error("Lỗi kết nối máy chủ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, []);

    const handleOpenSelectCourt = async () => {
        setLoadingPosts(true);
        setIsSelectCourtOpen(true);
        try {
            const response = await postService.getPosts(1, 100);

            // Log ra để kiểm tra chính xác mảng nằm ở đâu nếu vẫn chưa lên
            console.log("Check API Post:", response);

            // Sửa dòng này cho khớp với ảnh Response bạn chụp
            // Thường response từ service của bạn đã là response.data rồi
            const postData = response.result?.data || [];
            setAllPosts(postData);

        } catch (error) {
            console.error("Lỗi:", error);
            toast.error("Không thể tải danh sách sân");
        } finally {
            setLoadingPosts(false);
        }
    };

    const handleSelectCourt = (post: any) => {
        setSelectedPost(post);
        setIsSelectCourtOpen(false);
        setIsFormOpen(true);
    };

    const handleJoinMatch = async (matchId: string) => {
        try {
            const response = await matchService.joinMatch(matchId);
            if (response.code === 1000 || response.code === 0) {
                toast.success("Tham gia trận thành công!");
                fetchMatches();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi tham gia");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Trận Đấu Vãng Lai</h1>
                    <p className="text-gray-500">Tham gia hoặc tạo trận đấu giao lưu</p>
                </div>
                <button
                    onClick={handleOpenSelectCourt}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition active:scale-95">
                    <span className="text-xl">+</span> Tạo Trận Đấu
                </button>
            </div>

            {/* BƯỚC 1: MODAL CHỌN SÂN (Tự viết đơn giản) */}
            {isSelectCourtOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Bước 1: Chọn sân</h2>
                            <button onClick={() => setIsSelectCourtOpen(false)}>✕</button>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {loadingPosts ? <p className="text-center">Đang tải...</p> :
                                allPosts.map(post => (
                                    <button
                                        key={post.postId}
                                        onClick={() => handleSelectCourt(post)}
                                        className="w-full text-left p-3 border rounded-xl hover:bg-blue-50 hover:border-blue-500 transition-all"
                                    >
                                        <p className="font-bold">{post.courtName}</p>
                                        <p className="text-xs text-gray-500">{post.address}</p>
                                    </button>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* BƯỚC 2: MODAL NHẬP INFO (Dùng Component tách rời) */}
            <CreateMatchModal
                post={selectedPost}
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={fetchMatches}
            />

            {/* Filter Tabs */}
            <div className="flex gap-3 mb-8 overflow-x-auto">
                {['Tất cả', 'Sân bóng đá', 'Sân cầu lông', 'Sân Pickleball'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                            filter === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Match Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matches
                    .filter(m => filter === 'Tất cả' || m.categoryName.toLowerCase().includes(filter.toLowerCase()))
                    .map((match) => (
                        <div key={match.matchId} className="bg-white rounded-2xl border p-6 relative shadow-sm">
                            <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
                                <span
                                    className={`text-xs px-3 py-1 rounded-full font-semibold ${match.remainingSlots > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {match.remainingSlots > 0 ? 'Còn Chỗ' : 'Hết Chỗ'}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold mb-1">{match.title}</h3>
                            <p className="text-blue-600 text-sm mb-4">{match.categoryName}</p>

                            <div className="space-y-2 mb-6 text-gray-600">
                                <div className="flex items-center gap-2"><MapPin size={16}/> <span
                                    className="text-sm">{match.courtName}</span></div>
                                <div className="flex items-center gap-2"><Calendar size={16}/> <span
                                    className="text-sm">{new Date(match.startTime).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="flex items-center gap-2"><Clock size={16}/> <span
                                    className="text-sm">{match.startTime.split('T')[1]?.substring(0, 5)} - {match.endTime.split('T')[1]?.substring(0, 5)}</span>
                                </div>
                                {/* Progress Bar */}
                                <div className="space-y-2 pt-1 mb-6">
                                    <div className="flex justify-between items-center text-gray-600">
                                        <div className="flex items-center gap-3">
                                            <Users size={18} className="text-gray-400"/>
                                            <span
                                                className="text-sm font-medium">{match.currentPlayers}/{match.maxPlayers} người</span>
                                        </div>
                                        <span className="text-xs text-blue-600 italic font-semibold">
            Còn {match.remainingSlots} slot
        </span>
                                    </div>

                                    {/* Thanh bar thực tế */}
                                    <div
                                        className="w-full bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-50">
                                        <div
                                            className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                                            style={{width: `${Math.min((match.currentPlayers / match.maxPlayers) * 100, 100)}%`}}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center border-t pt-4">
                                <div>
                                    <p className="font-bold text-green-600">{match.price?.toLocaleString()}đ/người</p>
                                    <p className="text-xs text-gray-400">Host: {match.hostName}</p>
                                </div>
                                <button
                                    onClick={() => handleJoinMatch(match.matchId)}
                                    disabled={match.remainingSlots <= 0}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold disabled:bg-gray-200"
                                >
                                    {match.remainingSlots <= 0 ? 'Hết chỗ' : 'Tham Gia'}
                                </button>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default MatchPage;