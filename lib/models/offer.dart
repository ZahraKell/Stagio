class Offer {
  final int id;
  final String title;
  final String companyName;
  final String town;
  final String duration;
  final String internshipType;
  final bool isPaid;
  final String? salary;
  final String? techStack;
  final String? skills;
  final String? field;
  final String? companySector;
  final String status;
  final String datePosted;
  final String? deadline;
  final String? description;

  const Offer({
    required this.id,
    required this.title,
    required this.companyName,
    required this.town,
    required this.duration,
    required this.internshipType,
    required this.isPaid,
    this.salary,
    this.techStack,
    this.skills,
    this.field,
    this.companySector,
    required this.status,
    required this.datePosted,
    this.deadline,
    this.description,
  });

  factory Offer.fromJson(Map<String, dynamic> json) => Offer(
        id: json['id'] ?? 0,
        title: json['title'] ?? '',
        companyName: json['company_name'] ?? json['company'] ?? '',
        town: json['town'] ?? json['wilaya'] ?? '',
        duration: json['duration'] ?? '',
        internshipType: json['internship_type'] ?? '',
        isPaid: json['is_paid'] ?? false,
        salary: json['salary']?.toString(),
        techStack: json['tech_stack'],
        skills: json['skills'] ?? json['skills_text'],
        field: json['field'] ?? json['domain'],
        companySector: json['company_sector'],
        status: json['status'] ?? 'open',
        datePosted: json['date_posted'] ?? json['posted'] ?? '',
        deadline: json['deadline'],
        description: json['description'],
      );

  List<String> get skillsList {
    final raw = techStack ?? skills ?? '';
    return raw.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
  }

  String get typeLabel {
    const labels = {
      'INTERNSHIP': 'Stage professionnel',
      'ALTERNANCE': 'Alternance',
      'FINAL_YEAR': 'PFE',
    };
    return labels[internshipType] ?? internshipType;
  }

  String get companyInitials {
    final parts = companyName.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0].substring(0, parts[0].length.clamp(0, 2)).toUpperCase();
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }
}
