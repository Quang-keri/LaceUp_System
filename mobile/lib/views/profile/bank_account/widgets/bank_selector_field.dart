import 'package:flutter/material.dart';

import '../../../../models/vietqr_bank.dart';
import '../../../../theme/app_colors.dart';

class BankSelectorField extends StatelessWidget {
  const BankSelectorField({
    super.key,
    required this.selectedBank,
    required this.onTap,
    this.errorText,
    this.isLoading = false,
  });

  final VietQrBank? selectedBank;
  final VoidCallback onTap;
  final String? errorText;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final VietQrBank? bank = selectedBank;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _RequiredLabel(
          text: 'Tên ngân hàng',
        ),
        const SizedBox(height: 8),
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: isLoading ? null : onTap,
            borderRadius: BorderRadius.circular(10),
            child: Ink(
              height: 58,
              padding: const EdgeInsets.symmetric(
                horizontal: 14,
              ),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: errorText == null
                      ? AppColors.border
                      : AppColors.error,
                ),
              ),
              child: Row(
                children: [
                  if (isLoading) ...[
                    const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                  ] else if (bank != null) ...[
                    BankLogo(
                      logoUrl: bank.logo,
                      size: 36,
                    ),
                    const SizedBox(width: 11),
                  ],
                  Expanded(
                    child: bank == null
                        ? const Text(
                      'Chọn ngân hàng',
                      style: TextStyle(
                        color: Color(0xFFB8A9C7),
                        fontSize: 15,
                      ),
                    )
                        : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          bank.shortName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          bank.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.keyboard_arrow_down_rounded,
                    color: AppColors.primary,
                  ),
                ],
              ),
            ),
          ),
        ),
        if (errorText != null && errorText!.trim().isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            errorText!,
            style: const TextStyle(
              color: AppColors.error,
              fontSize: 12,
            ),
          ),
        ],
      ],
    );
  }
}

class BankLogo extends StatelessWidget {
  const BankLogo({
    super.key,
    required this.logoUrl,
    required this.size,
  });

  final String logoUrl;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(
          color: AppColors.border,
        ),
      ),
      child: ClipOval(
        child: logoUrl.trim().isEmpty
            ? const Icon(
          Icons.account_balance_rounded,
          color: AppColors.primary,
        )
            : Image.network(
          logoUrl,
          fit: BoxFit.contain,
          errorBuilder: (
              BuildContext context,
              Object error,
              StackTrace? stackTrace,
              ) {
            return const Icon(
              Icons.account_balance_rounded,
              color: AppColors.primary,
            );
          },
        ),
      ),
    );
  }
}

class _RequiredLabel extends StatelessWidget {
  const _RequiredLabel({
    required this.text,
  });

  final String text;

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        style: const TextStyle(
          color: AppColors.textPrimary,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        children: [
          const TextSpan(
            text: '* ',
            style: TextStyle(
              color: AppColors.error,
            ),
          ),
          TextSpan(text: text),
        ],
      ),
    );
  }
}