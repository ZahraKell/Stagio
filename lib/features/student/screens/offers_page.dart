import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import '../../../core/constants.dart';
import '../../../core/theme.dart';
import '../../../models/offer.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/offer_card.dart';

final _offersProvider = FutureProvider.family.autoDispose<List<Offer>, Map<String, String>>((ref, filters) async {
  final api = ApiClient();
  final res = await api.get(ApiPaths.offers, queryParameters: filters.isEmpty ? null : filters);
  return ApiClient.unwrapList(res.data, Offer.fromJson);
});

class StudentOffersPage extends ConsumerStatefulWidget {
  const StudentOffersPage({super.key});

  @override
  ConsumerState<StudentOffersPage> createState() => _StudentOffersPageState();
}

class _StudentOffersPageState extends ConsumerState<StudentOffersPage> {
  final _searchCtrl = TextEditingController();
  String _search = '';
  String? _selectedType;
  String? _selectedWilaya;
  bool? _isPaid;

  Map<String, String> get _filters {
    final f = <String, String>{};
    if (_search.isNotEmpty) f['search'] = _search;
    if (_selectedType != null) f['internship_type'] = _selectedType!;
    if (_selectedWilaya != null) f['town'] = _selectedWilaya!;
    if (_isPaid != null) f['is_paid'] = _isPaid! ? 'true' : 'false';
    return f;
  }

  @override
  Widget build(BuildContext context) {
    final offers = ref.watch(_offersProvider(_filters));
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        title: const Text('Internship Offers'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list_outlined),
            onPressed: _showFilterSheet,
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildActiveFilters(),
          Expanded(
            child: offers.when(
              loading: () => const LoadingState(),
              error: (e, _) => ErrorRetry(
                message: 'Impossible de charger les offres',
                onRetry: () => ref.refresh(_offersProvider(_filters)),
              ),
              data: (list) {
                if (list.isEmpty) {
                  return EmptyState(
                    icon: Icons.search_off_outlined,
                    title: 'Aucune offre trouvée',
                    subtitle: 'Essayez de modifier vos filtres',
                    actionLabel: 'Réinitialiser',
                    onAction: _clearFilters,
                  );
                }
                return RefreshIndicator(
                  onRefresh: () => ref.refresh(_offersProvider(_filters).future),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: list.length,
                    itemBuilder: (_, i) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: OfferCard(
                        offer: list[i],
                        onTap: () => context.push('/student/offers/${list[i].id}'),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: TextField(
        controller: _searchCtrl,
        decoration: InputDecoration(
          hintText: 'Rechercher par titre, domaine...',
          prefixIcon: const Icon(Icons.search, color: AppColors.textLight),
          suffixIcon: _search.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.close, color: AppColors.textLight),
                  onPressed: () {
                    _searchCtrl.clear();
                    setState(() => _search = '');
                  },
                )
              : null,
        ),
        onChanged: (v) => setState(() => _search = v),
      ),
    );
  }

  Widget _buildActiveFilters() {
    final chips = <Widget>[];
    if (_selectedType != null) {
      chips.add(_FilterChip(
        label: AppConstants.typeLabels[_selectedType] ?? _selectedType!,
        onRemove: () => setState(() => _selectedType = null),
      ));
    }
    if (_selectedWilaya != null) {
      chips.add(_FilterChip(
        label: _selectedWilaya!,
        onRemove: () => setState(() => _selectedWilaya = null),
      ));
    }
    if (_isPaid != null) {
      chips.add(_FilterChip(
        label: _isPaid! ? 'Rémunéré' : 'Non rémunéré',
        onRemove: () => setState(() => _isPaid = null),
      ));
    }
    if (chips.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: chips,
      ),
    );
  }

  void _clearFilters() {
    setState(() {
      _search = '';
      _searchCtrl.clear();
      _selectedType = null;
      _selectedWilaya = null;
      _isPaid = null;
    });
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _FilterSheet(
        selectedType: _selectedType,
        selectedWilaya: _selectedWilaya,
        isPaid: _isPaid,
        onApply: (type, wilaya, paid) {
          setState(() {
            _selectedType = type;
            _selectedWilaya = wilaya;
            _isPaid = paid;
          });
        },
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final VoidCallback onRemove;
  const _FilterChip({required this.label, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(width: 6),
          GestureDetector(
            onTap: onRemove,
            child: const Icon(Icons.close, size: 14, color: AppColors.primary),
          ),
        ],
      ),
    );
  }
}

class _FilterSheet extends StatefulWidget {
  final String? selectedType;
  final String? selectedWilaya;
  final bool? isPaid;
  final void Function(String?, String?, bool?) onApply;

  const _FilterSheet({
    this.selectedType,
    this.selectedWilaya,
    this.isPaid,
    required this.onApply,
  });

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  String? _type;
  String? _wilaya;
  bool? _paid;

  @override
  void initState() {
    super.initState();
    _type = widget.selectedType;
    _wilaya = widget.selectedWilaya;
    _paid = widget.isPaid;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Filtres', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              TextButton(onPressed: () => setState(() { _type = null; _wilaya = null; _paid = null; }), child: const Text('Réinitialiser')),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Type de stage', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: AppConstants.typeLabels.entries.map((e) => ChoiceChip(
              label: Text(e.value),
              selected: _type == e.key,
              onSelected: (v) => setState(() => _type = v ? e.key : null),
              selectedColor: AppColors.primary,
              labelStyle: TextStyle(color: _type == e.key ? Colors.white : AppColors.textDark),
            )).toList(),
          ),
          const SizedBox(height: 16),
          const Text('Wilaya', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _wilaya,
            hint: const Text('Toutes les wilayas'),
            onChanged: (v) => setState(() => _wilaya = v),
            items: AppConstants.algerianWilayas
                .map((w) => DropdownMenuItem(value: w, child: Text(w)))
                .toList(),
          ),
          const SizedBox(height: 16),
          const Text('Rémunération', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(label: const Text('Rémunéré'), selected: _paid == true, onSelected: (v) => setState(() => _paid = v ? true : null), selectedColor: AppColors.primary, labelStyle: TextStyle(color: _paid == true ? Colors.white : AppColors.textDark)),
              ChoiceChip(label: const Text('Non rémunéré'), selected: _paid == false, onSelected: (v) => setState(() => _paid = v ? false : null), selectedColor: AppColors.primary, labelStyle: TextStyle(color: _paid == false ? Colors.white : AppColors.textDark)),
            ],
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              widget.onApply(_type, _wilaya, _paid);
              Navigator.pop(context);
            },
            child: const Text('Appliquer les filtres'),
          ),
        ],
      ),
    );
  }
}
