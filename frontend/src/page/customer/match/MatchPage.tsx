import React, {useEffect, useState} from 'react';
import {Calendar, Clock, MapPin, Users} from 'lucide-react';
import matchService from "../../../service/matchService.ts";
import type {MatchResponse} from "../../../types/match.ts";
import {toast} from 'react-toastify';
import CreateMatchModal from "./CreateMatchModal";

const MatchPage: React.FC = () => {
    const [matches, setMatches] = useState<MatchResponse[]>([]);
    const [filter, setFilter] = useState('Tất cả');
    const [, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Trận Đấu Vãng Lai</h1>
                    <p className="text-gray-500">Tìm đồng đội giao lưu hoặc tham gia kèo có sẵn</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition active:scale-95 shadow-lg shadow-blue-100">
                    <span className="text-xl">+</span> Tạo Kèo Tìm Bạn
                </button>
            </div>

            <CreateMatchModal
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
                        <div key={match.matchId}
                             className="bg-white rounded-2xl border p-6 relative shadow-sm hover:shadow-md transition-all">
                            <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
                                <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${match.hasCourt ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {match.hasCourt ? 'Sân cố định' : 'Kèo tự do'}
                                </span>
                                <span
                                    className={`text-xs px-3 py-1 rounded-full font-semibold ${match.remainingSlots > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {match.remainingSlots > 0 ? 'Còn Chỗ' : 'Hết Chỗ'}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold mb-1 text-gray-800">{match.title || `Giao lưu ${match.categoryName}`}</h3>
                            <p className="text-blue-600 text-sm font-semibold mb-4">{match.categoryName}</p>

                            <div className="space-y-3 mb-6 text-gray-600">
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-blue-500"/>
                                    <span
                                        className="text-sm font-medium">{match.hasCourt ? match.courtName : match.address || "Địa điểm tự thỏa thuận"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-blue-500"/>
                                    <span
                                        className="text-sm">{new Date(match.startTime).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-blue-500"/>
                                    <span
                                        className="text-sm">{match.startTime.split('T')[1]?.substring(0, 5)} - {match.endTime.split('T')[1]?.substring(0, 5)}</span>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <div className="flex items-center gap-2"><Users size={14}/>
                                            <span>{match.currentPlayers}/{match.maxPlayers} người</span></div>
                                        <span className="text-blue-600">Còn {match.remainingSlots} slot</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-blue-600 h-full transition-all duration-700"
                                             style={{width: `${(match.currentPlayers / match.maxPlayers) * 100}%`}}/>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center border-t pt-4">
                                <div>
                                    <p className="font-bold text-green-600 text-lg">{(match.price || 0).toLocaleString()}đ/người</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Host: {match.hostName}</p>
                                </div>
                                <button
                                    onClick={() => handleJoinMatch(match.matchId)}
                                    disabled={match.remainingSlots <= 0}
                                    className={`px-8 py-2.5 rounded-xl font-bold transition ${match.remainingSlots <= 0 ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}
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