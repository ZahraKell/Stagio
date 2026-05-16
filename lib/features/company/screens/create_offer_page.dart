import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/constants.dart';
import '../../../core/api_error.dart';
import '../../../core/theme.dart';

class CreateOfferPage extends ConsumerStatefulWidget {
  final int? offerId;
  const CreateOfferPage({super.key, this.offerId});

  @override
  ConsumerState<CreateOfferPage> createState() => _CreateOfferPageState();
}

class _CreateOfferPageState extends ConsumerState<CreateOfferPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _townCtrl = TextEditingController();
  final _durationCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _techCtrl = TextEditingController();
  final _skillsCtrl = TextEditingController();
  final _salaryCtrl = TextEditingController();
  final _fieldCtrl = TextEditingController();

  String _type = 'INTERNSHIP';
  bool _isPaid = false;
  String? _deadline;
  bool _loading = false;

  @override
  void dispose() {
    _titleCtrl.dispose(); _townCtrl.dispose(); _durationCtrl.dispose();
    _descCtrl.dispose(); _techCtrl.dispose(); _skillsCtrl.dispose();
    _salaryCtrl.dispose(); _fieldCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill all required fields (title, city, duration, description).'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      final data = {
        'title': _titleCtrl.text.trim(),
        'town': _townCtrl.text.trim(),
        'duration': _durationCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'tech_stack': _techCtrl.text.trim(),
        'skills': _skillsCtrl.text.trim(),
        'field': _fieldCtrl.text.trim(),
        'internship_type': _type,
        'is_paid': _isPaid,
        if (_isPaid && _salaryCtrl.text.isNotEmpty) 'salary': _salaryCtrl.text.trim(),
        if (_deadline != null) 'deadline': _deadline,
      };
      if (widget.offerId != null) {
        await ApiClient().put(ApiPaths.offerUpdate(widget.offerId!), data: data);
      } else {
        await ApiClient().post(ApiPaths.offersCreate, data: data);
      }
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.offerId != null ? 'Offer updated!' : 'Offer published!'),
          backgroundColor: AppColors.success,
        ),
      );
      context.go('/company/offers');
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(parseApiError(e)), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: Text(widget.offerId != null ? 'Modifier l\'offre' : 'Nouvelle offre'),
        leading: IconButton(icon: const Icon(Icons.close), onPressed: () => context.go('/company/offers')),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _buildSectionTitle('Informations générales'),
            const SizedBox(height: 12),
            _buildField('Titre du poste *', _titleCtrl, Icons.title),
            const SizedBox(height: 14),
            _buildField('Domaine / Filière', _fieldCtrl, Icons.category_outlined),
            const SizedBox(height: 14),
            _buildField('Ville *', _townCtrl, Icons.location_on_outlined),
            const SizedBox(height: 14),
            _buildField('Durée *', _durationCtrl, Icons.access_time_outlined, hint: 'ex: 3 mois'),
            const SizedBox(height: 20),
            _buildSectionTitle('Type de stage'),
            const SizedBox(height: 12),
            _buildTypeSelector(),
            const SizedBox(height: 20),
            _buildSectionTitle('Rémunération'),
            const SizedBox(height: 12),
            _buildPaidToggle(),
            if (_isPaid) ...[
              const SizedBox(height: 14),
              _buildField('Salaire / Indemnité', _salaryCtrl, Icons.attach_money, hint: 'ex: 15000 DA/mois'),
            ],
            const SizedBox(height: 20),
            _buildSectionTitle('Compétences'),
            const SizedBox(height: 12),
            _buildField('Stack technique', _techCtrl, Icons.code, hint: 'ex: Python, Django, React', required: false),
            const SizedBox(height: 14),
            _buildField('Compétences requises', _skillsCtrl, Icons.psychology_outlined, hint: 'ex: Communication, Travail en équipe', required: false),
            const SizedBox(height: 20),
            _buildSectionTitle('Description'),
            const SizedBox(height: 12),
            _buildMultilineField(),
            const SizedBox(height: 20),
            _buildSectionTitle('Date limite de candidature'),
            const SizedBox(height: 12),
            _buildDeadlinePicker(),
            const SizedBox(height: 32),
            _loading
                ? const Center(child: CircularProgressIndicator())
                : _GradButton(onTap: _submit, label: widget.offerId != null ? 'Save changes' : 'Publish offer'),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Row(
      children: [
        Container(width: 4, height: 16, decoration: BoxDecoration(gradient: AppColors.navyGradient, borderRadius: BorderRadius.circular(4))),
        const SizedBox(width: 10),
        Text(title, style: AppTextStyles.h3),
      ],
    );
  }

  Widget _buildField(String label, TextEditingController ctrl, IconData icon,
      {String? hint, bool required = true}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyles.label),
        const SizedBox(height: 8),
        TextFormField(
          controller: ctrl,
          decoration: InputDecoration(
            hintText: hint ?? label,
            prefixIcon: Icon(icon, color: AppColors.textLight, size: 20),
          ),
          validator: required ? (v) => (v == null || v.isEmpty) ? 'Champ requis' : null : null,
        ),
      ],
    );
  }

  Widget _buildMultilineField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Description du poste *', style: AppTextStyles.label),
        const SizedBox(height: 8),
        TextFormField(
          controller: _descCtrl,
          maxLines: 6,
          decoration: const InputDecoration(
            hintText: 'Décrivez le poste, les missions, le contexte...',
            alignLabelWithHint: true,
          ),
          validator: (v) => (v == null || v.isEmpty) ? 'La description est requise' : null,
        ),
      ],
    );
  }

  Widget _buildTypeSelector() {
    return Row(
      children: AppConstants.typeLabels.entries.map((e) {
        final selected = _type == e.key;
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _type = e.key),
            child: Container(
              margin: EdgeInsets.only(right: e.key == 'FINAL_YEAR' ? 0 : 8),
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: selected ? AppColors.primary : AppColors.cardBg,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: selected ? AppColors.primary : AppColors.border),
              ),
              child: Text(
                e.value,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: selected ? Colors.white : AppColors.textMid),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildPaidToggle() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.cardBg, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
      child: Row(
        children: [
          const Icon(Icons.attach_money, color: AppColors.textMid, size: 22),
          const SizedBox(width: 12),
          Expanded(child: Text('Stage rémunéré', style: AppTextStyles.body)),
          Switch(value: _isPaid, onChanged: (v) => setState(() => _isPaid = v), activeColor: AppColors.primary),
        ],
      ),
    );
  }

  Widget _buildDeadlinePicker() {
    return GestureDetector(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: DateTime.now().add(const Duration(days: 30)),
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(const Duration(days: 365)),
          builder: (ctx, child) => Theme(
            data: Theme.of(ctx).copyWith(colorScheme: const ColorScheme.light(primary: AppColors.primary)),
            child: child!,
          ),
        );
        if (picked != null) {
          setState(() => _deadline = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}');
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.cardBg, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
        child: Row(
          children: [
            const Icon(Icons.calendar_today_outlined, color: AppColors.textMid, size: 20),
            const SizedBox(width: 12),
            Expanded(child: Text(_deadline ?? 'Sélectionner une date', style: TextStyle(color: _deadline == null ? AppColors.textLight : AppColors.textDark, fontSize: 14))),
            const Icon(Icons.chevron_right, color: AppColors.textLight),
          ],
        ),
      ),
    );
  }
}

class _GradButton extends StatelessWidget {
  final VoidCallback onTap;
  final String label;
  const _GradButton({required this.onTap, required this.label});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 54,
        decoration: BoxDecoration(gradient: AppColors.primaryGradient, borderRadius: BorderRadius.circular(14), boxShadow: [BoxShadow(color: AppColors.gradientMid.withOpacity(0.4), blurRadius: 16, offset: const Offset(0, 6))]),
        child: Center(child: Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15))),
      ),
    );
  }
}
