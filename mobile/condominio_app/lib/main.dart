import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/app_theme_friendly.dart';
import 'core/api_client.dart';
import 'core/app_state.dart';
import 'core/app_router.dart';
import 'core/storage/secure_storage.dart';

import 'features/auth/data/auth_repository.dart';
import 'features/notices/data/notices_repository.dart';

//notificaciones
import 'core/notification_service.dart';

//reservas
import 'features/reservations/data/reservations_repository.dart';

//pagos /billing
import 'features/billing/data/billing_repository.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Storage y repos
  final storage = AppSecureStorage();

  // Resolver dependencia circular con un token provider “dummy”
  final dummyTokenProvider = _DummyTokenProvider();
  final apiClient = ApiClient(tokenProvider: dummyTokenProvider);
  final authRepo = AuthRepository(dio: apiClient.dio, storage: storage);

  final appState = AppState(authRepo: authRepo, storage: storage);
  dummyTokenProvider.real = appState; // conecta el provider real

  // Cargar estado de sesión antes de levantar la app
  await appState.init();
  await NotificationService.init();
  runApp(MyApp(appState: appState, apiClient: apiClient, authRepo: authRepo));
}

class MyApp extends StatelessWidget {
  final AppState appState;
  final ApiClient apiClient;
  final AuthRepository authRepo;

  const MyApp({
    super.key,
    required this.appState,
    required this.apiClient,
    required this.authRepo,
  });

  @override
  Widget build(BuildContext context) {
    final router = buildRouter(appState);

    return MultiProvider(
      providers: [
        // Estado global de auth
        ChangeNotifierProvider.value(value: appState),
        Provider.value(value: apiClient),
        Provider.value(value: authRepo),
        Provider<NoticesRepository>(
          create: (_) => NoticesRepository(apiClient),
        ),
        Provider<ReservationsRepository>(
          create: (_) => ReservationsRepository(apiClient),
        ),
        Provider<BillingRepository>(
          create: (_) => BillingRepository(apiClient),
        ),
      ],
      child: MaterialApp.router(
        debugShowCheckedModeBanner: false,
        theme: FriendlyTheme.light(),
        routerConfig: router,
      ),
    );
  }
}

/// Truco para resolver la dependencia circular del interceptor
class _DummyTokenProvider implements TokenProvider {
  AppState? real;

  @override
  void forceLogout() => real?.forceLogout();

  @override
  Future<String?> getAccessToken() => real!.getAccessToken();

  @override
  Future<bool> refreshToken() => real!.refreshToken();
}
