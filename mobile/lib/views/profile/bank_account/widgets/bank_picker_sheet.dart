import 'package:flutter/material.dart';

import '../../../../models/vietqr_bank.dart';
import '../../../../theme/app_colors.dart';
import 'bank_selector_field.dart' show BankLogo;

Future<VietQrBank?> showBankPickerSheet({
  required BuildContext context,
  required List<VietQrBank> banks,
  VietQrBank? selectedBank,
}) {
  return showModalBottomSheet<VietQrBank>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) {
      return FractionallySizedBox(
        heightFactor: 0.88,
        child: BankPickerSheet(
          banks: banks,
          selectedBank: selectedBank,
        ),
      );
    },
  );
}

class BankPickerSheet extends StatefulWidget {
  const BankPickerSheet({
    super.key,
    required this.banks,
    this.selectedBank,
  });

  final List<VietQrBank> banks;
  final VietQrBank? selectedBank;

  @override
  State<BankPickerSheet> createState() => _BankPickerSheetState();
}

class _BankPickerSheetState extends State<BankPickerSheet> {
  final TextEditingController _searchController =
  TextEditingController();

  String _keyword = '';

  List<VietQrBank> get _filteredBanks {
    final String keyword = _keyword.trim().toLowerCase();

    if (keyword.isEmpty) {
      return widget.banks;
    }

    return widget.banks.where((VietQrBank bank) {
      return bank.name.toLowerCase().contains(keyword) ||
          bank.shortName.toLowerCase().contains(keyword) ||
          bank.code.toLowerCase().contains(keyword) ||
          bank.bin.toLowerCase().contains(keyword);
    }).toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final List<VietQrBank> banks = _filteredBanks;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(22),
        ),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(
            width: 46,
            height: 5,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(20),
            ),
          ),
          const Padding(
            padding: EdgeInsets.fromLTRB(18, 18, 18, 14),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Chọn ngân hàng',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              16,
              0,
              16,
              14,
            ),
            child: TextField(
              controller: _searchController,
              autofocus: false,
              textInputAction: TextInputAction.search,
              onChanged: (String value) {
                setState(() {
                  _keyword = value;
                });
              },
              decoration: InputDecoration(
                hintText: 'Tìm tên ngân hàng, mã hoặc BIN',
                hintStyle: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                ),
                prefixIcon: const Icon(
                  Icons.search_rounded,
                  color: AppColors.primary,
                ),
                suffixIcon: _keyword.isEmpty
                    ? null
                    : IconButton(
                  onPressed: () {
                    _searchController.clear();

                    setState(() {
                      _keyword = '';
                    });
                  },
                  icon: const Icon(
                    Icons.close_rounded,
                  ),
                ),
                filled: true,
                fillColor: AppColors.primaryLight,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 14,
                ),
                border: _searchBorder(
                  AppColors.border,
                ),
                enabledBorder: _searchBorder(
                  AppColors.border,
                ),
                focusedBorder: _searchBorder(
                  AppColors.primary,
                  width: 1.5,
                ),
              ),
            ),
          ),
          const Divider(
            height: 1,
            color: AppColors.border,
          ),
          Expanded(
            child: banks.isEmpty
                ? const _EmptyBankResult()
                : ListView.separated(
              keyboardDismissBehavior:
              ScrollViewKeyboardDismissBehavior.onDrag,
              padding: const EdgeInsets.symmetric(
                vertical: 8,
              ),
              itemCount: banks.length,
              separatorBuilder: (
                  BuildContext context,
                  int index,
                  ) {
                return const Divider(
                  height: 1,
                  indent: 78,
                  color: AppColors.border,
                );
              },
              itemBuilder: (
                  BuildContext context,
                  int index,
                  ) {
                final VietQrBank bank = banks[index];

                final bool isSelected =
                    bank.bin == widget.selectedBank?.bin;

                return ListTile(
                  onTap: () {
                    Navigator.of(context).pop(bank);
                  },
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 6,
                  ),
                  leading: BankLogo(
                    logoUrl: bank.logo,
                    size: 46,
                  ),
                  title: Text(
                    bank.shortName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 15,
                      fontWeight: isSelected
                          ? FontWeight.w700
                          : FontWeight.w600,
                    ),
                  ),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 3),
                    child: Text(
                      '${bank.name}\nBIN: ${bank.bin}',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        height: 1.35,
                      ),
                    ),
                  ),
                  trailing: isSelected
                      ? const Icon(
                    Icons.check_circle_rounded,
                    color: AppColors.primary,
                  )
                      : const Icon(
                    Icons.chevron_right_rounded,
                    color: AppColors.textSecondary,
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  OutlineInputBorder _searchBorder(
      Color color, {
        double width = 1,
      }) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(
        color: color,
        width: width,
      ),
    );
  }
}

class _EmptyBankResult extends StatelessWidget {
  const _EmptyBankResult();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.account_balance_outlined,
              size: 48,
              color: AppColors.textSecondary,
            ),
            SizedBox(height: 12),
            Text(
              'Không tìm thấy ngân hàng',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(height: 4),
            Text(
              'Hãy thử tìm bằng tên, mã ngân hàng hoặc mã BIN.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}