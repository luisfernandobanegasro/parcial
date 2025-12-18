import 'package:flutter/material.dart';
import 'package:gap/gap.dart';

import '../../shared/feature_tile.dart';
import '../billing/presentation/billing_hub.dart';
import 'package:condominio_app/features/notifications/notifications_screen.dart';
import '../reservations/reservations_hub.dart';
import '../visitors/visitor_form.dart';
import '../maintenance/maintenance_report.dart';
import '../security/security_alerts.dart';
import 'package:condominio_app/features/notices/presentation/notices_list.dart';

class HomeMenu extends StatelessWidget {
  const HomeMenu({super.key});

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);

    return MediaQuery(
      data: mq.copyWith(textScaler: const TextScaler.linear(1.0)),
      child: Scaffold(
        appBar: AppBar(title: const Text('Menú')),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Funciones principales',
                  style: Theme.of(context).textTheme.titleLarge),
              const Gap(10),
              Expanded(
                child: GridView.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.2,
                  children: [
                    FeatureTile(
                      title: 'Cuotas y servicios',
                      subtitle: 'Consultar',
                      icon: Icons.receipt_long,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const BillingHub()),
                      ),
                    ),
                    FeatureTile(
                      title: 'Pagar en línea',
                      icon: Icons.credit_card,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const BillingHub(initialTab: 1)),
                      ),
                    ),
                    FeatureTile(
                      title: 'Historial de pagos',
                      icon: Icons.history,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const BillingHub(initialTab: 2)),
                      ),
                    ),
                    FeatureTile(
                      title: 'Avisos y comunicados',
                      icon: Icons.campaign,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const NoticesList()),
                      ),
                    ),
                    FeatureTile(
                      title: 'Reservar área común',
                      icon: Icons.event_available,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const ReservationsHub()),
                      ),
                    ),
                    FeatureTile(
                      title: 'Confirmar y pagar reserva',
                      icon: Icons.check_circle,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) =>
                                const ReservationsHub(initialTab: 1)),
                      ),
                    ),
                    FeatureTile(
                      title: 'Registrar visitante',
                      icon: Icons.badge_outlined,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const VisitorForm()),
                      ),
                    ),
                    FeatureTile(
                      title: 'Reportar mantenimiento',
                      icon: Icons.build_circle_outlined,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const MaintenanceReport()),
                      ),
                    ),
                    FeatureTile(
                      title: 'Alertas de seguridad',
                      icon: Icons.emergency_share_outlined,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const SecurityAlerts()),
                      ),
                    ),
                    FeatureTile(
                      title: 'Notificaciones push',
                      icon: Icons.notifications_active_outlined,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const NotificationsScreen()),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
