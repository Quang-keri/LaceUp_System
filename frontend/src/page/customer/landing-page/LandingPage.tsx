import MainSlider2 from "../../../components/Slider/MainSlider2";

export default function LandingPage() {

    return (

        <div className="flex items-center gap-5 mx-5">
            <div className="w-[20%]">
                <h1 className="text-4xl font-bold mb-4">Đặt sân ngay</h1>

                <p className="text-gray-500 mb-6">
                    Đặt sân thể thao nhanh chóng và dễ dàng
                </p>

                <div className="flex flex-col gap-3">
                    <select className="border p-3 rounded">
                        <option>Chọn thể thao</option>
                        <option>Bóng đá</option>
                        <option>Cầu lông</option>
                        <option>Pickleball</option>
                    </select>

                    <select className="border p-3 rounded">
                        <option>Chọn thành phố</option>
                        <option>Hà Nội</option>
                        <option>TP Hồ Chí Minh</option>
                    </select>

                    <input type="date" className="border p-3 rounded"/>

                    <button className="bg-black text-white p-3 rounded font-semibold">
                        Tìm ngay
                    </button>
                </div>
            </div>

            <div className="w-[80%]">
                <MainSlider2/>
            </div>
        </div>
    )
}
