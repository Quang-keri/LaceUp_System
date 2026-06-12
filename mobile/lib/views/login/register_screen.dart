import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../theme/app_colors.dart';
import '../../services/auth_service.dart';
import 'verify_otp_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  static const Color primaryColor = AppColors.primary;

  static final Uri _termsAndPrivacyUri = Uri.parse(
    'https://laceupzone.id.vn/legal/terms-and-privacy',
  );

  final _formKey = GlobalKey<FormState>();

  final userNameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final phoneController = TextEditingController();
  final dateOfBirthController = TextEditingController();

  String gender = 'MALE';
  bool loading = false;
  bool hidePassword = true;

  @override
  void dispose() {
    userNameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    phoneController.dispose();
    dateOfBirthController.dispose();
    super.dispose();
  }

  Future<void> submitRegister() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => loading = true);

    try {
      await authService.sendRegisterOtp(
        userName: userNameController.text.trim(),
        gender: gender,
        email: emailController.text.trim(),
        password: passwordController.text,
        phone: phoneController.text.trim(),
        dateOfBirth: dateOfBirthController.text.trim(),
      );

      if (!mounted) return;

      showSuccess('Mã OTP đã được gửi tới email của bạn');

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => VerifyOtpScreen(
            email: emailController.text.trim(),
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;

      showError(
        e.toString().replaceAll('Exception: ', ''),
      );
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  Future<void> _openTermsAndPrivacy() async {
    try {
      final opened = await launchUrl(
        _termsAndPrivacyUri,
        mode: LaunchMode.externalApplication,
      );

      if (!opened && mounted) {
        showError(
          'Không thể mở trang điều khoản và chính sách riêng tư',
        );
      }
    } catch (e) {
      if (!mounted) return;

      showError(
        'Không thể mở trang điều khoản và chính sách riêng tư',
      );
    }
  }

  void showError(String message) {
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void showSuccess(String message) {
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> pickDate() async {
    final now = DateTime.now();
    final maxAllowedDate = DateTime(
      now.year - 16,
      now.month,
      now.day,
    );

    final picked = await showDatePicker(
      context: context,
      initialDate: maxAllowedDate,
      firstDate: DateTime(1950),
      lastDate: maxAllowedDate,
      helpText: 'Chọn ngày sinh',
      cancelText: 'Hủy',
      confirmText: 'Chọn',
    );

    if (picked == null || !mounted) return;

    dateOfBirthController.text =
    '${picked.year.toString().padLeft(4, '0')}-'
        '${picked.month.toString().padLeft(2, '0')}-'
        '${picked.day.toString().padLeft(2, '0')}';
  }

  InputDecoration inputDecoration({
    required String label,
    required IconData icon,
    String? hint,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      prefixIcon: Icon(icon),
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: Colors.grey.shade50,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(
          color: Colors.grey.shade300,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(
          color: primaryColor,
          width: 1.5,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(
          color: Colors.red,
        ),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(
          color: Colors.red,
          width: 1.5,
        ),
      ),
    );
  }

  Widget _buildTermsAndPrivacy() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: 14,
        vertical: 12,
      ),
      decoration: BoxDecoration(
        color: primaryColor.withOpacity(0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: primaryColor.withOpacity(0.18),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 1),
            child: Icon(
              Icons.verified_user_outlined,
              size: 19,
              color: primaryColor,
            ),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Wrap(
              alignment: WrapAlignment.center,
              runSpacing: 2,
              children: [
                Text(
                  'Bằng việc đăng ký, bạn chấp nhận ',
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.45,
                    color: Colors.grey.shade700,
                  ),
                ),
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: _openTermsAndPrivacy,
                    borderRadius: BorderRadius.circular(4),
                    child: const Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: 1,
                      ),
                      child: Text(
                        'Điều khoản và Chính sách riêng tư',
                        style: TextStyle(
                          fontSize: 13,
                          height: 1.45,
                          color: primaryColor,
                          fontWeight: FontWeight.bold,
                          decoration: TextDecoration.underline,
                          decorationColor: primaryColor,
                        ),
                      ),
                    ),
                  ),
                ),
                Text(
                  ' của LaceUp.',
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.45,
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F6FF),
      appBar: AppBar(
        title: const Text('Đăng ký'),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  Container(
                    width: 82,
                    height: 82,
                    decoration: BoxDecoration(
                      color: primaryColor.withOpacity(0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.person_add_alt_1,
                      size: 46,
                      color: primaryColor,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Tạo tài khoản LaceUp',
                    style: TextStyle(
                      fontSize: 23,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Đăng ký tài khoản để đặt sân và theo dõi lịch sử đặt lịch của bạn',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade600,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 24),

                  TextFormField(
                    controller: userNameController,
                    textInputAction: TextInputAction.next,
                    decoration: inputDecoration(
                      label: 'Họ tên',
                      icon: Icons.person,
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Vui lòng nhập họ tên';
                      }

                      if (value.trim().length < 3) {
                        return 'Họ tên phải từ 3 ký tự';
                      }

                      return null;
                    },
                  ),

                  const SizedBox(height: 16),

                  TextFormField(
                    controller: emailController,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    decoration: inputDecoration(
                      label: 'Email',
                      icon: Icons.email,
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Vui lòng nhập email';
                      }

                      final emailRegex = RegExp(
                        r'^[\w\.-]+@([\w-]+\.)+[\w-]{2,}$',
                      );

                      if (!emailRegex.hasMatch(value.trim())) {
                        return 'Email không hợp lệ';
                      }

                      return null;
                    },
                  ),

                  const SizedBox(height: 16),

                  TextFormField(
                    controller: phoneController,
                    keyboardType: TextInputType.phone,
                    textInputAction: TextInputAction.next,
                    decoration: inputDecoration(
                      label: 'Số điện thoại',
                      icon: Icons.phone,
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Vui lòng nhập số điện thoại';
                      }

                      final phoneRegex = RegExp(r'^0\d{9}$');

                      if (!phoneRegex.hasMatch(value.trim())) {
                        return 'Số điện thoại phải gồm 10 số và bắt đầu bằng 0';
                      }

                      return null;
                    },
                  ),

                  const SizedBox(height: 16),

                  TextFormField(
                    controller: passwordController,
                    obscureText: hidePassword,
                    textInputAction: TextInputAction.next,
                    decoration: inputDecoration(
                      label: 'Mật khẩu',
                      icon: Icons.lock,
                      suffixIcon: IconButton(
                        icon: Icon(
                          hidePassword
                              ? Icons.visibility_off
                              : Icons.visibility,
                        ),
                        onPressed: () {
                          setState(() {
                            hidePassword = !hidePassword;
                          });
                        },
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Vui lòng nhập mật khẩu';
                      }

                      if (value.length < 6) {
                        return 'Mật khẩu phải từ 6 ký tự';
                      }

                      return null;
                    },
                  ),

                  const SizedBox(height: 16),

                  DropdownButtonFormField<String>(
                    value: gender,
                    decoration: inputDecoration(
                      label: 'Giới tính',
                      icon: Icons.wc,
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'MALE',
                        child: Text('Nam'),
                      ),
                      DropdownMenuItem(
                        value: 'FEMALE',
                        child: Text('Nữ'),
                      ),
                      DropdownMenuItem(
                        value: 'OTHER',
                        child: Text('Khác'),
                      ),
                    ],
                    onChanged: (value) {
                      if (value == null) return;

                      setState(() {
                        gender = value;
                      });
                    },
                  ),

                  const SizedBox(height: 16),

                  TextFormField(
                    controller: dateOfBirthController,
                    readOnly: true,
                    onTap: pickDate,
                    decoration: inputDecoration(
                      label: 'Ngày sinh',
                      hint: 'yyyy-MM-dd',
                      icon: Icons.calendar_month,
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Vui lòng chọn ngày sinh';
                      }

                      final dob = DateTime.tryParse(
                        value.trim(),
                      );

                      if (dob == null) {
                        return 'Ngày sinh không hợp lệ';
                      }

                      final now = DateTime.now();
                      final maxAllowedDate = DateTime(
                        now.year - 16,
                        now.month,
                        now.day,
                      );

                      if (dob.isAfter(maxAllowedDate)) {
                        return 'Bạn phải từ đủ 16 tuổi trở lên';
                      }

                      return null;
                    },
                  ),

                  const SizedBox(height: 12),

                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.info_outline,
                        size: 18,
                        color: Colors.grey.shade600,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Bạn cần đủ 16 tuổi trở lên để đăng ký và đặt sân trên LaceUp.',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade600,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  _buildTermsAndPrivacy(),

                  const SizedBox(height: 18),

                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: loading ? null : submitRegister,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryColor,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor:
                        primaryColor.withOpacity(0.55),
                        disabledForegroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                      child: loading
                          ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                          : const Text(
                        'Đăng ký',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  Text(
                    'Sau khi đăng ký, mã OTP sẽ được gửi đến email của bạn.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}