import 'package:flutter/material.dart';
import '../../services/user_service.dart';

class ProfileEditPage extends StatefulWidget {
  const ProfileEditPage({super.key});

  @override
  State<ProfileEditPage> createState() => _ProfileEditPageState();
}

class _ProfileEditPageState extends State<ProfileEditPage> {
  static const Color primaryPurple = Color(0xFFA78BFA);

  final _formKey = GlobalKey<FormState>();

  bool isLoading = false;
  bool isSaving = false;

  String? userId;

  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final phoneController = TextEditingController();
  final dobController = TextEditingController();

  String gender = "Male";

  @override
  void initState() {
    super.initState();
    loadUser();
  }

  Future<void> loadUser() async {
    try {
      setState(() => isLoading = true);

      final response = await userService.getMyInfo();

      final Map<String, dynamic> user =
      response is Map<String, dynamic> && response.containsKey('result')
          ? Map<String, dynamic>.from(response['result'])
          : Map<String, dynamic>.from(response);

      debugPrint("USER DATA: $user");

      userId = user['userId']?.toString();
      nameController.text = user['userName']?.toString() ?? '';
      emailController.text = user['email']?.toString() ?? '';
      phoneController.text = user['phone']?.toString() ?? '';
      dobController.text = user['dateOfBirth']?.toString() ?? '';

      final apiGender = user['gender']?.toString();
      gender = ['Male', 'Female', 'Other'].contains(apiGender)
          ? apiGender!
          : 'Male';

    } catch (e) {
      showError(e.toString());
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> updateProfile() async {
    if (!_formKey.currentState!.validate()) return;

    FocusScope.of(context).unfocus();

    if (userId == null || userId!.isEmpty) {
      showError("Không tìm thấy userId");
      return;
    }

    try {
      setState(() => isSaving = true);

      final updateData = {
        "userName": nameController.text.trim(),
        "phone": phoneController.text.trim(),
        "dateOfBirth": dobController.text.trim(),
        "gender": gender,
      };

      await userService.updateUser(userId!, updateData);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Cập nhật thông tin thành công")),
      );

      Navigator.pop(context, true);
    } catch (e) {
      showError(e.toString());
    } finally {
      if (mounted) setState(() => isSaving = false);
    }
  }

  void showError(String message) {
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message.replaceFirst('Exception: ', '')),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    phoneController.dispose();
    dobController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        resizeToAvoidBottomInset: true,
        backgroundColor: const Color(0xFFF8F8F8),
        appBar: AppBar(
          elevation: 0,
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          centerTitle: true,
          title: const Text(
            "Thông tin cá nhân",
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
        bottomNavigationBar: AnimatedPadding(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
          padding: EdgeInsets.only(bottom: bottomInset),
          child: SafeArea(
            child: Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: isSaving || isLoading ? null : updateProfile,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryPurple,
                    disabledBackgroundColor: primaryPurple.withOpacity(0.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: isSaving
                      ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2.5,
                    ),
                  )
                      : const Text(
                    "Lưu thay đổi",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        body: isLoading
            ? const Center(child: CircularProgressIndicator())
            : SafeArea(
          child: Form(
            key: _formKey,
            child: SingleChildScrollView(
              keyboardDismissBehavior:
              ScrollViewKeyboardDismissBehavior.onDrag,
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  buildInput(
                    label: "Họ và tên",
                    controller: nameController,
                    hint: "Nhập họ tên",
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return "Vui lòng nhập họ tên";
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 18),

                  buildInput(
                    label: "Email",
                    controller: emailController,
                    enabled: false,
                  ),
                  const SizedBox(height: 18),

                  buildInput(
                    label: "Số điện thoại",
                    controller: phoneController,
                    keyboardType: TextInputType.phone,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return null;
                      }

                      final phoneRegex = RegExp(r'^[0-9]{9,11}$');
                      if (!phoneRegex.hasMatch(value.trim())) {
                        return "Số điện thoại không hợp lệ";
                      }

                      return null;
                    },
                  ),
                  const SizedBox(height: 18),

                  buildInput(
                    label: "Ngày sinh",
                    controller: dobController,
                    hint: "YYYY-MM-DD",
                    keyboardType: TextInputType.datetime,
                  ),
                  const SizedBox(height: 18),

                  buildGender(),
                  const SizedBox(height: 90),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget buildInput({
    required String label,
    required TextEditingController controller,
    String? hint,
    bool enabled = true,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
        const SizedBox(height: 10),
        TextFormField(
          controller: controller,
          enabled: enabled,
          keyboardType: keyboardType,
          validator: validator,
          textInputAction: TextInputAction.next,
          style: const TextStyle(fontSize: 16),
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: enabled ? Colors.white : Colors.grey.shade100,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 18,
              vertical: 18,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(
                color: primaryPurple,
                width: 1.5,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget buildGender() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Giới tính",
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: gender,
              isExpanded: true,
              items: const [
                DropdownMenuItem(value: "Male", child: Text("Nam")),
                DropdownMenuItem(value: "Female", child: Text("Nữ")),
                DropdownMenuItem(value: "Other", child: Text("Khác")),
              ],
              onChanged: isSaving
                  ? null
                  : (value) {
                if (value == null) return;
                setState(() => gender = value);
              },
            ),
          ),
        ),
      ],
    );
  }
}