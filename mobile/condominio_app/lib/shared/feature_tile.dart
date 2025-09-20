import 'package:flutter/material.dart';

class FeatureTile extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData icon;
  final VoidCallback? onTap;

  const FeatureTile({
    super.key,
    required this.title,
    this.subtitle,
    required this.icon,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Ink(
        width: 180,
        height: 120,
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color ?? Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: cs.onSurface.withOpacity(.06)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Align(alignment: Alignment.topRight, child: Icon(icon, color: cs.primary)),
              const Spacer(),
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              if (subtitle != null)
                Text(
                  subtitle!,
                  style: Theme.of(context).textTheme.bodySmall!.copyWith(color: cs.onSurfaceVariant),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
