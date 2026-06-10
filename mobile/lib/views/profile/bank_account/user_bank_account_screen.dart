import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/views/profile/bank_account/widgets/%20bank_account_input.dart';

import '../../../models/user_bank_account.dart';
import '../../../models/vietqr_bank.dart';
import '../../../services/user_bank_account_service.dart';
import '../../../services/vietqr_bank_service.dart';
import '../../../theme/app_colors.dart';
import 'widgets/bank_picker_sheet.dart' show showBankPickerSheet;
import 'widgets/bank_selector_field.dart' show BankSelectorField;
import 'widgets/qr_code_picker.dart';

class UserBankAccountScreen extends StatefulWidget {
  const UserBankAccountScreen({
    super.key,
  });

  @override
  State<UserBankAccountScreen> createState() =>
      _UserBankAccountScreenState();
}

class _UserBankAccountScreenState extends State<UserBankAccountScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  final TextEditingController _accountNumberController =
  TextEditingController();

  final TextEditingController _accountHolderController =
  TextEditingController();

  final TextEditingController _branchController =
  TextEditingController();

  final ImagePicker _imagePicker = ImagePicker();

  final UserBankAccountService _bankAccountService =
  UserBankAccountService();

  final VietQrBankService _vietQrBankService =
  VietQrBankService();

  List<VietQrBank> _banks = [];

  VietQrBank? _selectedBank;

  String? _selectedQrImagePath;
  String? _existingQrUrl;

  String? _bankError;
  String? _loadError;

  bool _isLoading = true;
  bool _isSaving = false;
  bool _isLoadingBanks = false;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _accountNumberController.dispose();
    _accountHolderController.dispose();
    _branchController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    if (mounted) {
      setState(() {
        _isLoading = true;
        _loadError = null;
      });
    }

    UserBankAccount? bankAccount;
    List<VietQrBank> banks = [];

    try {
      bankAccount =
      await _bankAccountService.getUserBankAccount();
    } catch (error) {
      _loadError = _getErrorMessage(
        error,
        fallback: 'Không lấy được tài khoản ngân hàng',
      );
    }

    try {
      banks = await _vietQrBankService.getBanks();
    } catch (error) {
      _loadError ??= _getErrorMessage(
        error,
        fallback: 'Không lấy được danh sách ngân hàng',
      );
    }

    if (!mounted) {
      return;
    }

    setState(() {
      _banks = banks;

      if (bankAccount != null) {
        _accountNumberController.text =
            bankAccount.accountNumber;

        _accountHolderController.text =
            bankAccount.accountHolderName.toUpperCase();

        _branchController.text =
            bankAccount.branchName;

        _existingQrUrl =
        bankAccount.qrCode.trim().isEmpty
            ? null
            : bankAccount.qrCode;

        _selectedQrImagePath = null;

        _selectedBank = _resolveSelectedBank(
          banks: banks,
          account: bankAccount,
        );
      } else {
        _accountNumberController.clear();
        _accountHolderController.clear();
        _branchController.clear();

        _selectedBank = null;
        _existingQrUrl = null;
        _selectedQrImagePath = null;
      }

      _bankError = null;
      _isLoading = false;
    });
  }

  VietQrBank _resolveSelectedBank({
    required List<VietQrBank> banks,
    required UserBankAccount account,
  }) {
    for (final VietQrBank bank in banks) {
      final bool sameBin =
          bank.bin.trim() == account.bankBin.trim();

      final bool sameShortName =
          bank.shortName.trim().toLowerCase() ==
              account.bankName.trim().toLowerCase();

      final bool sameFullName =
          bank.name.trim().toLowerCase() ==
              account.bankName.trim().toLowerCase();

      if (sameBin || sameShortName || sameFullName) {
        return bank;
      }
    }

    return VietQrBank(
      name: account.bankName,
      shortName: account.bankName,
      code: '',
      bin: account.bankBin,
      logo: '',
    );
  }

  Future<void> _reloadBanks() async {
    if (_isLoadingBanks) {
      return;
    }

    setState(() {
      _isLoadingBanks = true;
    });

    try {
      final List<VietQrBank> banks =
      await _vietQrBankService.getBanks();

      if (!mounted) {
        return;
      }

      setState(() {
        _banks = banks;

        final String? selectedBin =
            _selectedBank?.bin;

        if (selectedBin != null &&
            selectedBin.trim().isNotEmpty) {
          for (final VietQrBank bank in banks) {
            if (bank.bin == selectedBin) {
              _selectedBank = bank;
              break;
            }
          }
        }
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      _showMessage(
        _getErrorMessage(
          error,
          fallback:
          'Không tải được danh sách ngân hàng',
        ),
        isError: true,
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingBanks = false;
        });
      }
    }
  }

  Future<void> _openBankPicker() async {
    FocusScope.of(context).unfocus();

    if (_banks.isEmpty) {
      await _reloadBanks();
    }

    if (!mounted || _banks.isEmpty) {
      return;
    }

    final VietQrBank? selectedBank =
    await showBankPickerSheet(
      context: context,
      banks: _banks,
      selectedBank: _selectedBank,
    );

    if (selectedBank == null || !mounted) {
      return;
    }

    setState(() {
      _selectedBank = selectedBank;
      _bankError = null;
    });
  }

  Future<void> _pickQrImage() async {
    try {
      final XFile? image =
      await _imagePicker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 88,
        maxWidth: 1600,
      );

      if (image == null || !mounted) {
        return;
      }

      setState(() {
        _selectedQrImagePath = image.path;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      _showMessage(
        'Không thể chọn ảnh QR',
        isError: true,
      );
    }
  }

  void _removeQrImage() {
    setState(() {
      _selectedQrImagePath = null;
      _existingQrUrl = null;
    });
  }

  Future<void> _saveBankAccount() async {
    FocusScope.of(context).unfocus();

    final bool isFormValid =
        _formKey.currentState?.validate() ?? false;

    if (_selectedBank == null) {
      setState(() {
        _bankError = 'Vui lòng chọn ngân hàng';
      });
    }

    if (!isFormValid || _selectedBank == null) {
      return;
    }

    final VietQrBank bank = _selectedBank!;

    // Chỉ tạo đúng các field BankAccountRequest backend nhận:
    // bankName, accountNumber, accountHolderName,
    // branchName, bankBin, qrCode.
    final UserBankAccount request =
    UserBankAccount(
      bankName: bank.shortName,
      accountNumber:
      _accountNumberController.text.trim(),
      accountHolderName:
      _accountHolderController.text
          .trim()
          .toUpperCase(),
      branchName:
      _branchController.text.trim(),
      bankBin: bank.bin,
      qrCode: _existingQrUrl ?? '',
    );

    setState(() {
      _isSaving = true;
    });

    try {
      final UserBankAccount? result =
      await _bankAccountService
          .saveUserBankAccount(
        bankAccount: request,
        qrCodeFilePath: _selectedQrImagePath,
      );

      if (!mounted) {
        return;
      }

      _showMessage(
        'Đã lưu thông tin tài khoản ngân hàng',
      );

      if (result != null) {
        setState(() {
          _accountNumberController.text =
              result.accountNumber;

          _accountHolderController.text =
              result.accountHolderName.toUpperCase();

          _branchController.text =
              result.branchName;

          _existingQrUrl =
          result.qrCode.trim().isEmpty
              ? null
              : result.qrCode;

          _selectedQrImagePath = null;

          _selectedBank = _resolveSelectedBank(
            banks: _banks,
            account: result,
          );
        });
      } else {
        await _loadInitialData();
      }
    } catch (error) {
      if (!mounted) {
        return;
      }

      _showMessage(
        _getErrorMessage(
          error,
          fallback:
          'Không thể lưu tài khoản ngân hàng',
        ),
        isError: true,
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  String _getErrorMessage(
      Object error, {
        required String fallback,
      }) {
    final String message = error
        .toString()
        .replaceFirst('Exception: ', '')
        .trim();

    if (message.isNotEmpty &&
        message.toLowerCase() != 'null') {
      return message;
    }

    return fallback;
  }

  void _showMessage(
      String message, {
        bool isError = false,
      }) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          behavior: SnackBarBehavior.floating,
          backgroundColor: isError
              ? AppColors.error
              : AppColors.success,
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.card,
        surfaceTintColor: AppColors.card,
        elevation: 0,
        centerTitle: false,
        title: const Text(
          'Tài khoản ngân hàng',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 19,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
          child: CircularProgressIndicator(
            color: AppColors.primary,
          ),
        )
            : RefreshIndicator(
          color: AppColors.primary,
          onRefresh: _loadInitialData,
          child: SingleChildScrollView(
            physics:
            const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(
              16,
              18,
              16,
              32,
            ),
            child: _buildBankAccountCard(),
          ),
        ),
      ),
    );
  }

  Widget _buildBankAccountCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(
        18,
        22,
        18,
        26,
      ),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.border,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment:
          CrossAxisAlignment.start,
          children: [
            const Text(
              'Tài khoản ngân hàng nhận tiền',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Tài khoản này được sử dụng để nhận tiền hoàn hoặc tiền thanh toán.',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),

            if (_loadError != null) ...[
              _buildErrorBox(),
              const SizedBox(height: 18),
            ],

            BankSelectorField(
              selectedBank: _selectedBank,
              errorText: _bankError,
              isLoading: _isLoadingBanks,
              onTap: _openBankPicker,
            ),

            const SizedBox(height: 18),

            BankAccountInput(
              label: 'Số tài khoản',
              requiredField: true,
              controller:
              _accountNumberController,
              hintText: 'Nhập số tài khoản',
              keyboardType:
              TextInputType.number,
              textInputAction:
              TextInputAction.next,
              inputFormatters: [
                FilteringTextInputFormatter
                    .digitsOnly,
                LengthLimitingTextInputFormatter(
                  30,
                ),
              ],
              validator: (String? value) {
                final String accountNumber =
                    value?.trim() ?? '';

                if (accountNumber.isEmpty) {
                  return 'Vui lòng nhập số tài khoản';
                }

                if (!RegExp(r'^[0-9]{6,30}$')
                    .hasMatch(accountNumber)) {
                  return 'Số tài khoản phải có từ 6 đến 30 chữ số';
                }

                return null;
              },
            ),

            const SizedBox(height: 18),

            BankAccountInput(
              label: 'Tên chủ tài khoản',
              requiredField: true,
              controller:
              _accountHolderController,
              hintText: 'VD: NGUYEN VAN A',
              textCapitalization:
              TextCapitalization.characters,
              textInputAction:
              TextInputAction.next,
              inputFormatters: [
                LengthLimitingTextInputFormatter(
                  100,
                ),
                TextInputFormatter.withFunction(
                      (
                      TextEditingValue oldValue,
                      TextEditingValue newValue,
                      ) {
                    return newValue.copyWith(
                      text:
                      newValue.text.toUpperCase(),
                      selection:
                      newValue.selection,
                      composing:
                      TextRange.empty,
                    );
                  },
                ),
              ],
              validator: (String? value) {
                final String holderName =
                    value?.trim() ?? '';

                if (holderName.isEmpty) {
                  return 'Vui lòng nhập tên chủ tài khoản';
                }

                if (holderName.length < 2) {
                  return 'Tên chủ tài khoản không hợp lệ';
                }

                return null;
              },
            ),

            const SizedBox(height: 18),

            BankAccountInput(
              label: 'Chi nhánh',
              controller: _branchController,
              hintText:
              'Tên chi nhánh ngân hàng (Có thể bỏ trống)',
              textInputAction:
              TextInputAction.done,
            ),

            const SizedBox(height: 22),

            QrCodePicker(
              localImagePath:
              _selectedQrImagePath,
              networkImageUrl:
              _existingQrUrl,
              onPickImage: _pickQrImage,
              onRemoveImage:
              _removeQrImage,
            ),

            const SizedBox(height: 28),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isSaving
                    ? null
                    : _saveBankAccount,
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                  AppColors.primary,
                  disabledBackgroundColor:
                  AppColors.primary.withOpacity(
                    0.55,
                  ),
                  foregroundColor:
                  Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius:
                    BorderRadius.circular(10),
                  ),
                ),
                child: _isSaving
                    ? const SizedBox(
                  width: 22,
                  height: 22,
                  child:
                  CircularProgressIndicator(
                    strokeWidth: 2.3,
                    color: Colors.white,
                  ),
                )
                    : const Text(
                  'Lưu tài khoản',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight:
                    FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorBox() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: AppColors.orangeLight,
        borderRadius:
        BorderRadius.circular(10),
        border: Border.all(
          color: AppColors.orange.withOpacity(
            0.35,
          ),
        ),
      ),
      child: Row(
        crossAxisAlignment:
        CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.warning_amber_rounded,
            color: AppColors.orange,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              _loadError!,
              style: const TextStyle(
                color: AppColors.orangeDark,
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ),
          IconButton(
            onPressed: _loadInitialData,
            icon: const Icon(
              Icons.refresh_rounded,
            ),
            color: AppColors.orange,
            tooltip: 'Tải lại',
          ),
        ],
      ),
    );
  }
}