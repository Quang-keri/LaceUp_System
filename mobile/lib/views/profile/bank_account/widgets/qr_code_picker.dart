import 'dart:io';

import 'package:flutter/material.dart';

import '../../../../theme/app_colors.dart';

class QrCodePicker extends StatelessWidget {
  const QrCodePicker({
    super.key,
    required this.onPickImage,
    required this.onRemoveImage,
    this.localImagePath,
    this.networkImageUrl,
  });

  final String? localImagePath;
  final String? networkImageUrl;

  final VoidCallback onPickImage;
  final VoidCallback onRemoveImage;

  bool get _hasLocalImage {
    return localImagePath != null &&
        localImagePath!.trim().isNotEmpty;
  }

  bool get _hasNetworkImage {
    return networkImageUrl != null &&
        networkImageUrl!.trim().isNotEmpty;
  }

  bool get _hasImage {
    return _hasLocalImage ||
        _hasNetworkImage;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment:
      CrossAxisAlignment.start,
      children: [
        const Text(
          'Ảnh mã QR tĩnh',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Stack(
          clipBehavior: Clip.none,
          children: [
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: onPickImage,
                borderRadius:
                BorderRadius.circular(12),
                child: Ink(
                  width: 130,
                  height: 130,
                  decoration: BoxDecoration(
                    color:
                    AppColors.primaryLight,
                    borderRadius:
                    BorderRadius.circular(
                      12,
                    ),
                    border: Border.all(
                      color: AppColors.border,
                    ),
                  ),
                  child: _hasImage
                      ? _buildImage()
                      : _buildPlaceholder(),
                ),
              ),
            ),
            if (_hasImage)
              Positioned(
                top: -10,
                right: -10,
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: onRemoveImage,
                    borderRadius:
                    BorderRadius.circular(
                      30,
                    ),
                    child: Ink(
                      width: 32,
                      height: 32,
                      decoration:
                      const BoxDecoration(
                        color: AppColors.error,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color:
                            Color(0x26000000),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.close_rounded,
                        size: 19,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildImage() {
    if (_hasLocalImage) {
      return ClipRRect(
        borderRadius:
        BorderRadius.circular(11),
        child: Image.file(
          File(localImagePath!),
          fit: BoxFit.cover,
          errorBuilder: (
              context,
              error,
              stackTrace,
              ) {
            return _buildPlaceholder();
          },
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(11),
      child: Image.network(
        networkImageUrl!,
        fit: BoxFit.cover,
        errorBuilder: (
            context,
            error,
            stackTrace,
            ) {
          return _buildPlaceholder();
        },
      ),
    );
  }

  Widget _buildPlaceholder() {
    return const Column(
      mainAxisAlignment:
      MainAxisAlignment.center,
      children: [
        Icon(
          Icons.add_photo_alternate_outlined,
          color: AppColors.primary,
          size: 31,
        ),
        SizedBox(height: 9),
        Text(
          'Tải ảnh lên',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}