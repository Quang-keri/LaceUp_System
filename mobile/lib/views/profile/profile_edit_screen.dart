import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../services/user_service.dart';

class ProfileEditPage extends StatefulWidget {
  const ProfileEditPage({super.key});

  @override
  State<ProfileEditPage> createState() => _ProfileEditPageState();
}

class _ProfileEditPageState extends State<ProfileEditPage> {
  static const Color primaryPurple = Color(0xFF9156F1);
  static const Color darkPurple = Color(0xFF7443D8);
  static const Color lightPurple = Color(0xFFF1EAFE);
  static const Color backgroundColor = Color(0xFFF7F5FA);
  static const Color textColor = Color(0xFF24212B);
  static const Color secondaryTextColor = Color(0xFF7A7483);

  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  bool isLoading = false;
  bool isSaving = false;

  String? userId;
  String gender = 'Male';

  final TextEditingController nameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController dobController = TextEditingController();

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

      userId = user['userId']?.toString();

      nameController.text = user['userName']?.toString() ?? '';
      emailController.text = user['email']?.toString() ?? '';
      phoneController.text = user['phone']?.toString() ?? '';
      dobController.text = _normalizeApiDate(user['dateOfBirth']);

      final String? apiGender = user['gender']?.toString();

      gender = ['Male', 'Female', 'Other'].contains(apiGender)
          ? apiGender!
          : 'Male';
    } catch (e) {
      showError(e.toString());
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  Future<void> updateProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    FocusScope.of(context).unfocus();

    if (userId == null || userId!.isEmpty) {
      showError('Không tìm thấy thông tin tài khoản');
      return;
    }

    try {
      setState(() => isSaving = true);

      final Map<String, dynamic> updateData = {
        'userName': nameController.text.trim(),
        'phone': phoneController.text.trim(),
        'dateOfBirth': dobController.text.trim(),
        'gender': gender,
      };

      await userService.updateUser(updateData);

      if (!mounted) return;


      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      showError(e.toString());
    } finally {
      if (mounted) {
        setState(() => isSaving = false);
      }
    }
  }

  Future<void> selectDateOfBirth() async {
    FocusScope.of(context).unfocus();

    final DateTime now = DateTime.now();

    final DateTime initialDate =
        DateTime.tryParse(dobController.text.trim()) ??
            DateTime(now.year - 18, now.month, now.day);

    final DateTime? selectedDate = await showDatePicker(
      context: context,
      initialDate: initialDate.isAfter(now) ? now : initialDate,
      firstDate: DateTime(1900),
      lastDate: now,
      helpText: 'Chọn ngày sinh',
      cancelText: 'Hủy',
      confirmText: 'Chọn',
      fieldLabelText: 'Ngày sinh',
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: primaryPurple,
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: textColor,
            ),
            datePickerTheme: DatePickerThemeData(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
            ),
          ),
          child: child!,
        );
      },
    );

    if (selectedDate == null) return;

    setState(() {
      dobController.text = _dateToApiString(selectedDate);
    });
  }

  String _normalizeApiDate(dynamic value) {
    final String rawValue = value?.toString().trim() ?? '';

    if (rawValue.isEmpty) {
      return '';
    }

    final DateTime? parsedDate = DateTime.tryParse(rawValue);

    if (parsedDate == null) {
      return rawValue;
    }

    return _dateToApiString(parsedDate);
  }

  String _dateToApiString(DateTime date) {
    final String month = date.month.toString().padLeft(2, '0');
    final String day = date.day.toString().padLeft(2, '0');

    return '${date.year}-$month-$day';
  }

  String get profileInitials {
    final String name = nameController.text.trim();

    if (name.isEmpty) {
      return 'LU';
    }

    final List<String> parts = name
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .toList();

    if (parts.length == 1) {
      final String firstPart = parts.first;

      if (firstPart.length == 1) {
        return firstPart.toUpperCase();
      }

      return firstPart.substring(0, 2).toUpperCase();
    }

    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  String get displayPhone {
    final String phone = phoneController.text.trim();

    return phone.isEmpty ? 'Chưa cập nhật số điện thoại' : phone;
  }

  void showError(String message) {
    if (!mounted) return;

    final String displayMessage = message
        .replaceFirst('Exception: ', '')
        .replaceFirst('DioException: ', '');

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.error_outline_rounded,
                color: Colors.white,
              ),
              const SizedBox(width: 10),
              Expanded(child: Text(displayMessage)),
            ],
          ),
          behavior: SnackBarBehavior.floating,
          backgroundColor: const Color(0xFFD64545),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
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
    final MediaQueryData mediaQuery = MediaQuery.of(context);
    final double bottomInset = mediaQuery.viewInsets.bottom;
    final double horizontalPadding = mediaQuery.size.width < 360 ? 14 : 18;

    return GestureDetector(
      behavior: HitTestBehavior.translucent,
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        resizeToAvoidBottomInset: true,
        backgroundColor: backgroundColor,
        appBar: AppBar(
          elevation: 0,
          scrolledUnderElevation: 0,
          surfaceTintColor: Colors.white,
          backgroundColor: Colors.white,
          centerTitle: true,
          leadingWidth: 64,
          leading: Padding(
            padding: const EdgeInsets.only(left: 12),
            child: Center(
              child: Material(
                color: lightPurple,
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: () => Navigator.pop(context),
                  child: const SizedBox(
                    width: 42,
                    height: 42,
                    child: Icon(
                      Icons.arrow_back_ios_new_rounded,
                      size: 19,
                      color: primaryPurple,
                    ),
                  ),
                ),
              ),
            ),
          ),
          title: const Text(
            'Thông tin cá nhân',
            style: TextStyle(
              color: textColor,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        bottomNavigationBar: AnimatedPadding(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
          padding: EdgeInsets.only(bottom: bottomInset),
          child: SafeArea(
            top: false,
            child: Container(
              padding: EdgeInsets.fromLTRB(
                horizontalPadding,
                12,
                horizontalPadding,
                12,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(
                  top: BorderSide(
                    color: Color(0xFFEDE9F2),
                  ),
                ),
              ),
              child: _buildSaveButton(),
            ),
          ),
        ),
        body: isLoading
            ? const Center(
          child: CircularProgressIndicator(
            color: primaryPurple,
            strokeWidth: 3,
          ),
        )
            : SafeArea(
          top: false,
          child: Form(
            key: _formKey,
            child: SingleChildScrollView(
              keyboardDismissBehavior:
              ScrollViewKeyboardDismissBehavior.onDrag,
              padding: EdgeInsets.fromLTRB(
                horizontalPadding,
                10,
                horizontalPadding,
                110,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [

                  _buildInformationCard(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }



  Widget _buildInformationCard() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: const Color(0xFFEDE9F2),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.035),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(
                Icons.badge_outlined,
                color: primaryPurple,
                size: 22,
              ),
              SizedBox(width: 5),
              Text(
                'Thông tin cơ bản',
                style: TextStyle(
                  color: textColor,
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),


          const SizedBox(height: 22),
          _buildInput(
            label: 'Họ và tên',
            controller: nameController,
            hint: 'Nhập họ và tên',
            icon: Icons.person_outline_rounded,
            textCapitalization: TextCapitalization.words,
            onChanged: (_) => setState(() {}),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Vui lòng nhập họ và tên';
              }

              if (value.trim().length < 2) {
                return 'Họ và tên phải có ít nhất 2 ký tự';
              }

              return null;
            },
          ),
          const SizedBox(height: 18),
          _buildInput(
            label: 'Email',
            controller: emailController,
            icon: Icons.email_outlined,
            enabled: false,
            helperText: 'Email đăng nhập không thể thay đổi tại đây.',
          ),
          const SizedBox(height: 18),
          _buildInput(
            label: 'Số điện thoại',
            controller: phoneController,
            hint: 'Nhập số điện thoại',
            icon: Icons.phone_outlined,
            keyboardType: TextInputType.phone,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(11),
            ],
            onChanged: (_) => setState(() {}),
            validator: (value) {
              final String phone = value?.trim() ?? '';

              if (phone.isEmpty) {
                return null;
              }

              final RegExp phoneRegex = RegExp(r'^[0-9]{9,11}$');

              if (!phoneRegex.hasMatch(phone)) {
                return 'Số điện thoại phải có từ 9 đến 11 số';
              }

              return null;
            },
          ),
          const SizedBox(height: 18),
          _buildInput(
            label: 'Ngày sinh',
            controller: dobController,
            hint: 'Chọn ngày sinh',
            icon: Icons.cake_outlined,
            readOnly: true,
            onTap: selectDateOfBirth,
            suffixIcon: IconButton(
              onPressed: selectDateOfBirth,
              icon: const Icon(
                Icons.calendar_month_rounded,
                color: primaryPurple,
              ),
            ),
          ),
          const SizedBox(height: 20),
          _buildGenderSelector(),
        ],
      ),
    );
  }

  Widget _buildInput({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    String? hint,
    String? helperText,
    bool enabled = true,
    bool readOnly = false,
    TextInputType? keyboardType,
    TextCapitalization textCapitalization = TextCapitalization.none,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
    ValueChanged<String>? onChanged,
    VoidCallback? onTap,
    Widget? suffixIcon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: textColor,
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 9),
        TextFormField(
          controller: controller,
          enabled: enabled,
          readOnly: readOnly,
          keyboardType: keyboardType,
          textCapitalization: textCapitalization,
          inputFormatters: inputFormatters,
          validator: validator,
          onChanged: onChanged,
          onTap: onTap,
          textInputAction: readOnly
              ? TextInputAction.none
              : TextInputAction.next,
          style: TextStyle(
            color: enabled ? textColor : secondaryTextColor,
            fontSize: 15,
            fontWeight: FontWeight.w500,
          ),
          decoration: InputDecoration(
            hintText: hint,
            helperText: helperText,
            helperMaxLines: 2,
            helperStyle: const TextStyle(
              color: secondaryTextColor,
              fontSize: 12,
            ),
            prefixIcon: Icon(
              icon,
              color: enabled ? primaryPurple : const Color(0xFFA9A4AF),
              size: 21,
            ),
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: enabled
                ? const Color(0xFFFAF9FC)
                : const Color(0xFFF1EFF4),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 15,
              vertical: 16,
            ),
            hintStyle: const TextStyle(
              color: Color(0xFFA19AA9),
              fontWeight: FontWeight.w400,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: const BorderSide(
                color: Color(0xFFE8E3ED),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: const BorderSide(
                color: Color(0xFFE8E3ED),
              ),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: const BorderSide(
                color: Color(0xFFE6E2E9),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: const BorderSide(
                color: primaryPurple,
                width: 1.6,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: const BorderSide(
                color: Color(0xFFD64545),
              ),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: const BorderSide(
                color: Color(0xFFD64545),
                width: 1.5,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGenderSelector() {
    const List<Map<String, dynamic>> genders = [
      {
        'value': 'Male',
        'label': 'Nam',
        'icon': Icons.male_rounded,
      },
      {
        'value': 'Female',
        'label': 'Nữ',
        'icon': Icons.female_rounded,
      },
      {
        'value': 'Other',
        'label': 'Khác',
        'icon': Icons.person_outline_rounded,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Giới tính',
          style: TextStyle(
            color: textColor,
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: genders.map((item) {
            final String value = item['value'] as String;
            final bool isSelected = gender == value;

            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  right: value == 'Other' ? 0 : 8,
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: isSaving
                        ? null
                        : () {
                      setState(() {
                        gender = value;
                      });
                    },
                    borderRadius: BorderRadius.circular(14),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      height: 52,
                      decoration: BoxDecoration(
                        color: isSelected ? lightPurple : Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSelected
                              ? primaryPurple
                              : const Color(0xFFE8E3ED),
                          width: isSelected ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            item['icon'] as IconData,
                            size: 19,
                            color: isSelected
                                ? primaryPurple
                                : secondaryTextColor,
                          ),
                          const SizedBox(width: 5),
                          Flexible(
                            child: Text(
                              item['label'] as String,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: isSelected
                                    ? primaryPurple
                                    : textColor,
                                fontSize: 13,
                                fontWeight: isSelected
                                    ? FontWeight.w800
                                    : FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildSaveButton() {
    final bool isDisabled = isSaving || isLoading;

    return AnimatedOpacity(
      duration: const Duration(milliseconds: 180),
      opacity: isDisabled ? 0.6 : 1,
      child: Material(
        color: Colors.transparent,
        child: Ink(
          height: 54,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [
                primaryPurple,
                darkPurple,
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: isDisabled
                ? []
                : [
              BoxShadow(
                color: primaryPurple.withOpacity(0.28),
                blurRadius: 15,
                offset: const Offset(0, 7),
              ),
            ],
          ),
          child: InkWell(
            onTap: isDisabled ? null : updateProfile,
            borderRadius: BorderRadius.circular(16),
            child: Center(
              child: isSaving
                  ? const SizedBox(
                width: 23,
                height: 23,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2.5,
                ),
              )
                  : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.save_outlined,
                    color: Colors.white,
                    size: 21,
                  ),
                  SizedBox(width: 9),
                  Text(
                    'Lưu thay đổi',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
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