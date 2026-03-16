import { Slider, Checkbox, Radio, Divider } from "antd";

export default function FilterSidebar() {
  return (
    <div className="p-5 space-y-6   shadow-sm">
      <h3>Bộ lọc</h3>
      <div>
        <h3 className="font-semibold mb-3 text-gray-700">Khoảng giá / giờ</h3>

        <Slider range min={50000} max={500000} step={10000} />

        <div className="flex justify-between text-sm text-gray-500">
          <span>50k</span>
          <span>500k</span>
        </div>
      </div>

      <Divider className="my-3" />
      <div>
        <h3 className="font-semibold mb-3 text-gray-700">Sắp xếp</h3>

        <Radio.Group className="flex flex-col gap-2">
          <Radio value="price_low">Giá thấp → cao</Radio>
          <Radio value="price_high">Giá cao → thấp</Radio>
        </Radio.Group>
      </div>
      <Divider className="my-3" />

      {/* LOCATION */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-700">Khu vực</h3>

        <Checkbox.Group className="grid grid-cols-2 gap-2">
          <Checkbox value="hcm">TP.HCM</Checkbox>
          <Checkbox value="hanoi">Hà Nội</Checkbox>
          <Checkbox value="danang">Đà Nẵng</Checkbox>
          <Checkbox value="binhduong">Bình Dương</Checkbox>
        </Checkbox.Group>
      </div>

      <Divider />

      <div>
        <h3 className="font-semibold mb-3 text-gray-700">Loại sân</h3>

        <Checkbox.Group className="grid grid-cols-2 gap-2">
          <Checkbox value="badminton">Cầu lông</Checkbox>
          <Checkbox value="football">Bóng đá</Checkbox>
          <Checkbox value="pickleball">Pickleball</Checkbox>
          <Checkbox value="tennis">Tennis</Checkbox>
        </Checkbox.Group>
      </div>

      <Divider className="my-3" />

      <div>
        <h3 className="font-semibold mb-3 text-gray-700">Tiện nghi</h3>

        <Checkbox.Group className="grid grid-cols-2 gap-2">
          <div>
            <Checkbox value="tea">Trà đá</Checkbox>
          </div>
          <div>
            <Checkbox value="parking">Bãi giữ xe</Checkbox>
          </div>
          <div>
            <Checkbox value="power">Ổ điện</Checkbox>
          </div>
          <div>
            <Checkbox value="racket">Thuê vợt</Checkbox>
          </div>
        </Checkbox.Group>
      </div>
      <Divider className="my-3" />
    </div>
  );
}
