import 'package:flutter/material.dart';
import '../../services/user_service.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final UserService _userService = UserService();

  bool _isLoadingData = true; // Cờ báo đang tải dữ liệu API
  bool _isEditing = false;
  bool _isLoadingSave = false;

  Map<String, dynamic>? _userData; // Biến lưu toàn bộ thông tin user
  String? _userId; // Cần giữ lại userId để gọi hàm update

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _dobController = TextEditingController();

  String? _selectedGender;
  List<String> _selectedSports = [];

  final List<Map<String, dynamic>> recentActivities = [
    {"sport": "Bóng đá", "location": "Sân Chảo Lửa", "date": "15 Thg 3", "status": "confirmed"},
    {"sport": "Cầu lông", "location": "Sân Kỳ Hòa", "date": "10 Thg 3", "status": "canceled"},
  ];

  @override
  void initState() {
    super.initState();
    _fetchMyInfo(); // Gọi API ngay khi mở trang
  }

  // Hàm gọi API lấy thông tin
  Future<void> _fetchMyInfo() async {
    setState(() => _isLoadingData = true);

    final result = await _userService.getMyInfo();

    if (result['success']) {
      final data = result['data'];
      setState(() {
        _userData = data;
        _userId = data['userId']; // Mapping chuẩn theo DTO

        _nameController.text = data['userName'] ?? '';
        _emailController.text = data['email'] ?? '';
        _phoneController.text = data['phone'] ?? '';

        String dobText = '';
        if (data['dateOfBirth'] != null) {
        if (data['dateOfBirth'] is List) {
        // Nếu Java trả về mảng [YYYY, MM, DD]
        List dobList = data['dateOfBirth'];
        if (dobList.length >= 3) {
        String year = dobList[0].toString();
        String month = dobList[1].toString().padLeft(2, '0');
        String day = dobList[2].toString().padLeft(2, '0');
        dobText = '$year-$month-$day';
        }
        } else {
        // Nếu Java trả về chuỗi String bình thường
        dobText = data['dateOfBirth'].toString();
        }
        }
        _dobController.text = dobText;

        String gender = data['gender'] ?? 'Other';
        if (['Male', 'Female', 'Other'].contains(gender)) {
          _selectedGender = gender;
        }

        _isLoadingData = false;
      });
    } else {
      setState(() => _isLoadingData = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message'] ?? 'Lỗi lấy thông tin'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _handleSave() async {
    if (_userId == null) return;

    setState(() => _isLoadingSave = true);

    final updateData = {
      "userName": _nameController.text.trim(),
      "phone": _phoneController.text.trim(),
      "dateOfBirth": _dobController.text.trim(),
      "gender": _selectedGender,
    };

    final result = await _userService.updateUser(_userId!, updateData);

    setState(() => _isLoadingSave = false);

    if (result['success']) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cập nhật thông tin thành công!'), backgroundColor: Colors.green),
      );
      setState(() {
        _isEditing = false;
        // Cập nhật lại userData cục bộ để tuổi (age) hoặc tên trên UI đổi theo nếu cần
        _userData?['userName'] = _nameController.text.trim();
        _userData?['phone'] = _phoneController.text.trim();
        _userData?['dateOfBirth'] = _dobController.text.trim();
        _userData?['gender'] = _selectedGender;
      });
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message']), backgroundColor: Colors.red),
      );
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        title: const Text('Hồ sơ của tôi', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
        actions: [
          if (!_isEditing && !_isLoadingData)
            TextButton.icon(
              onPressed: () => setState(() => _isEditing = true),
              icon: const Icon(Icons.edit, color: Colors.blue),
              label: const Text('Chỉnh sửa', style: TextStyle(color: Colors.blue)),
            )
        ],
      ),
      // Hiện vòng xoay nếu đang load dữ liệu
      body: _isLoadingData
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // --- CARD 1: FORM THÔNG TIN ---
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildTextField('Họ và tên', _nameController),
                    const SizedBox(height: 16),
                    _buildTextField('Email', _emailController, isReadOnly: true),
                    const SizedBox(height: 16),
                    _buildTextField('Số điện thoại', _phoneController),
                    const SizedBox(height: 16),

                    DropdownButtonFormField<String>(
                      value: _selectedGender,
                      decoration: _inputDecoration('Giới tính'),
                      items: const [
                        DropdownMenuItem(value: 'Male', child: Text('Nam')),
                        DropdownMenuItem(value: 'Female', child: Text('Nữ')),
                        DropdownMenuItem(value: 'Other', child: Text('Khác')),
                      ],
                      onChanged: _isEditing ? (val) => setState(() => _selectedGender = val) : null,
                      disabledHint: Text(_selectedGender == 'Male' ? 'Nam' : _selectedGender == 'Female' ? 'Nữ' : 'Khác'),
                    ),
                    const SizedBox(height: 16),
                    _buildTextField('Ngày sinh (YYYY-MM-DD)', _dobController),
                    const SizedBox(height: 16),

                    // Tuổi (Map với field 'age' trong Java DTO)
                    TextFormField(
                      initialValue: (_userData?['age'] ?? 0) > 0
                          ? '${_userData!['age']} tuổi'
                          : 'Chưa cập nhật',
                      readOnly: true,
                      decoration: _inputDecoration('Tuổi').copyWith(fillColor: Colors.grey.shade100, filled: true),
                    ),
                    const SizedBox(height: 16),

                    const Text('Môn thể thao', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8.0,
                      children: [
                        _buildSportChip('football', 'Bóng đá'),
                        _buildSportChip('badminton', 'Cầu lông'),
                        _buildSportChip('tennis', 'Tennis'),
                      ],
                    ),

                    if (_isEditing) ...[
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() => _isEditing = false);
                                // Khôi phục lại text cũ từ _userData khi bấm Hủy
                                _nameController.text = _userData?['userName'] ?? '';
                                _phoneController.text = _userData?['phone'] ?? '';
                                _dobController.text = _userData?['dateOfBirth'] ?? '';
                                _selectedGender = _userData?['gender'] ?? 'Other';
                              },
                              child: const Text('Hủy'),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _isLoadingSave ? null : _handleSave,
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                              child: _isLoadingSave
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : const Text('Lưu thay đổi', style: TextStyle(color: Colors.white)),
                            ),
                          ),
                        ],
                      )
                    ]
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // --- CARD 2: CÁC MÔN ĐANG CHƠI ---
            const Text('Các môn đang chơi', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: _buildStatBox('⚽', '12', 'Trận bóng', const Color(0xFFF0F2F5))),
                const SizedBox(width: 16),
                Expanded(child: _buildStatBox('🏸', '4', 'Trận cầu', const Color(0xFFFFF1F0))),
              ],
            ),
            const SizedBox(height: 24),

            // --- CARD 3: HOẠT ĐỘNG GẦN ĐÂY ---
            const Text('Hoạt động gần đây', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: recentActivities.length,
                separatorBuilder: (context, index) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final act = recentActivities[index];
                  final isConfirmed = act['status'] == 'confirmed';
                  return ListTile(
                    leading: Icon(
                      isConfirmed ? Icons.check_circle : Icons.cancel,
                      color: isConfirmed ? Colors.green : Colors.red,
                      size: 32,
                    ),
                    title: Text('${act['sport']} - ${act['location']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text(act['date']),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isConfirmed ? Colors.green.shade50 : Colors.red.shade50,
                        border: Border.all(color: isConfirmed ? Colors.green : Colors.red),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        isConfirmed ? 'Đã xác nhận' : 'Đã hủy',
                        style: TextStyle(color: isConfirmed ? Colors.green : Colors.red, fontSize: 12),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Colors.grey),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {bool isReadOnly = false}) {
    bool disabled = isReadOnly || !_isEditing;
    return TextFormField(
      controller: controller,
      readOnly: disabled,
      decoration: _inputDecoration(label).copyWith(
        fillColor: disabled ? Colors.grey.shade100 : Colors.white,
        filled: disabled,
      ),
    );
  }

  Widget _buildSportChip(String value, String label) {
    bool isSelected = _selectedSports.contains(value);
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: _isEditing ? (bool selected) {
        setState(() {
          if (selected) {
            _selectedSports.add(value);
          } else {
            _selectedSports.remove(value);
          }
        });
      } : null,
      selectedColor: Colors.blue.shade100,
      checkmarkColor: Colors.blue,
    );
  }

  Widget _buildStatBox(String emoji, String number, String text, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(12)),
      child: Column(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 28)),
          const SizedBox(height: 4),
          Text(number, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          Text(text, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        ],
      ),
    );
  }
}