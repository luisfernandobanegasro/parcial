import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../data/reservations_repository.dart';
import '../data/models/area.dart';
import '../data/models/reservation.dart';

class CreateReservationScreen extends StatefulWidget {
  const CreateReservationScreen({super.key});
  @override
  State<CreateReservationScreen> createState() =>
      _CreateReservationScreenState();
}

class _CreateReservationScreenState extends State<CreateReservationScreen> {
  final _formKey = GlobalKey<FormState>();
  Area? _area;
  DateTime? _start;
  DateTime? _end;
  final _asistCtrl = TextEditingController(text: '1');
  final _motivoCtrl = TextEditingController();
  bool _loadingAreas = false;
  bool _saving = false;
  List<Area> _areas = [];

  @override
  void initState() {
    super.initState();
    _loadAreas();
  }

  Future<void> _loadAreas() async {
    setState(() => _loadingAreas = true);
    try {
      final repo = context.read<ReservationsRepository>();
      final data = await repo.fetchAreas();
      setState(() => _areas = data);
    } catch (e) {
      _snack('Error cargando áreas: $e');
    } finally {
      setState(() => _loadingAreas = false);
    }
  }

  Future<DateTime?> _pickDateTime(
      {required String label, DateTime? base}) async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: base ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 2),
    );
    if (date == null) return null;
    final time = await showTimePicker(
      context: context,
      initialTime: base != null
          ? TimeOfDay(hour: base.hour, minute: base.minute)
          : const TimeOfDay(hour: 9, minute: 0),
      helpText: label,
    );
    if (time == null) return null;
    return DateTime(date.year, date.month, date.day, time.hour, time.minute);
  }

  Future<void> _verDisponibilidad() async {
    if (_area == null || _start == null || _end == null) {
      return _snack('Selecciona área, inicio y fin');
    }
    final repo = context.read<ReservationsRepository>();
    try {
      final ocupadas = await repo.checkAvailability(
        areaId: _area!.id,
        start: _start!,
        end: _end!,
      );
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Ocupaciones en el rango'),
          content: SizedBox(
            width: 420,
            child: ocupadas.isEmpty
                ? const Text('No hay reservas que se solapen 🎉')
                : ListView.separated(
                    shrinkWrap: true,
                    itemCount: ocupadas.length,
                    separatorBuilder: (_, __) => const Divider(height: 8),
                    itemBuilder: (_, i) {
                      final r = ocupadas[i];
                      return ListTile(
                        dense: true,
                        title: Text('${_fmt(r.inicio)} → ${_fmt(r.fin)}'),
                        subtitle: Text(r.motivo),
                        trailing: Text(r.estado),
                      );
                    },
                  ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cerrar')),
          ],
        ),
      );
    } catch (e) {
      _snack('Error consultando disponibilidad: $e');
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_area == null) return _snack('Selecciona un área');
    if (_start == null || _end == null)
      return _snack('Selecciona inicio y fin');
    if (_end!.isBefore(_start!) || _end!.isAtSameMomentAs(_start!)) {
      return _snack('El fin debe ser mayor al inicio');
    }

    setState(() => _saving = true);
    try {
      final repo = context.read<ReservationsRepository>();

      final ocupadas = await repo.checkAvailability(
        areaId: _area!.id,
        start: _start!,
        end: _end!,
      );
      if (ocupadas.isNotEmpty) {
        return _snack('Rango no disponible. (${ocupadas.length} choque/s)');
      }

      final asistentes = int.tryParse(_asistCtrl.text.trim()) ?? 0;
      final payload = {
        "area": _area!.id,
        "inicio": _start!.toIso8601String(),
        "fin": _end!.toIso8601String(),
        "asistentes": asistentes,
        "motivo": _motivoCtrl.text.trim(),
      };

      final Reservation r = await repo.createReservation(payload);
      if (!mounted) return;
      _snack('Reserva creada (#${r.id}) — ${r.estado}');
      Navigator.of(context).maybePop();
    } catch (e) {
      _snack('Error guardando: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _snack(String msg) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));

  @override
  void dispose() {
    _asistCtrl.dispose();
    _motivoCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _loadingAreas
        ? const Center(child: CircularProgressIndicator())
        : Padding(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: ListView(
                children: [
                  DropdownButtonFormField<Area>(
                    value: _area,
                    decoration: const InputDecoration(labelText: 'Área común'),
                    items: _areas
                        .map((a) =>
                            DropdownMenuItem(value: a, child: Text(a.nombre)))
                        .toList(),
                    onChanged: (v) => setState(() => _area = v),
                    validator: (v) => v == null ? 'Selecciona un área' : null,
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Inicio'),
                    subtitle: Text(_start == null
                        ? 'Selecciona fecha y hora'
                        : _fmtFull(_start!)),
                    trailing: IconButton(
                      icon: const Icon(Icons.edit_calendar),
                      onPressed: () async {
                        final d = await _pickDateTime(
                            label: 'Hora de inicio', base: _start);
                        if (d != null) setState(() => _start = d);
                      },
                    ),
                  ),
                  const SizedBox(height: 8),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Fin'),
                    subtitle: Text(_end == null
                        ? 'Selecciona fecha y hora'
                        : _fmtFull(_end!)),
                    trailing: IconButton(
                      icon: const Icon(Icons.edit_calendar),
                      onPressed: () async {
                        final d = await _pickDateTime(
                            label: 'Hora de fin', base: _end);
                        if (d != null) setState(() => _end = d);
                      },
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _asistCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Asistentes'),
                    validator: (v) {
                      final n = int.tryParse(v ?? '');
                      if (n == null || n < 0) return 'Número inválido';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _motivoCtrl,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Motivo / descripción',
                      alignLabelWithHint: true,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      OutlinedButton.icon(
                        onPressed: _verDisponibilidad,
                        icon: const Icon(Icons.calendar_month_outlined),
                        label: const Text('Ver disponibilidad'),
                      ),
                      const Spacer(),
                      FilledButton.icon(
                        onPressed: _saving ? null : _submit,
                        icon: _saving
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.check),
                        label: const Text('Reservar'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
  }

  String _fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')} '
      '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  String _fmtFull(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}  '
      '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
}
