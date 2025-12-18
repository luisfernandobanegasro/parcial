import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract class IStorage {
  Future<void> write({required String key, required String value});
  Future<String?> read({required String key});
  Future<void> delete({required String key});
  Future<void> deleteAll();
}

class AppSecureStorage implements IStorage {
  final FlutterSecureStorage _ss = const FlutterSecureStorage();

  @override
  Future<void> write({required String key, required String value}) =>
      _ss.write(key: key, value: value);

  @override
  Future<String?> read({required String key}) => _ss.read(key: key);

  @override
  Future<void> delete({required String key}) => _ss.delete(key: key);

  @override
  Future<void> deleteAll() => _ss.deleteAll();
}
