class Application {
  final int id;
  final String offerTitle;
  final String company;
  final String wilaya;
  final String status;
  final String appliedDate;
  final String? stageState;
  final bool attestationIssued;
  final int? offerId;

  const Application({
    required this.id,
    required this.offerTitle,
    required this.company,
    required this.wilaya,
    required this.status,
    required this.appliedDate,
    this.stageState,
    required this.attestationIssued,
    this.offerId,
  });

  factory Application.fromJson(Map<String, dynamic> json) => Application(
        id: json['id'] ?? 0,
        offerTitle: json['offer_title'] ?? json['title'] ?? '',
        company: json['offer_company_name'] ?? json['company'] ?? '',
        wilaya: json['offer_location'] ?? json['wilaya'] ?? '',
        status: _mapStatus(json['status'] ?? 'pending'),
        appliedDate: json['application_date'] ?? json['appliedDate'] ?? '',
        stageState: json['stage_state'],
        attestationIssued: json['attestation_issued_at'] != null ||
            json['attestation_issued'] == true,
        offerId: json['offer'],
      );

  static String _mapStatus(String s) {
    if (s == 'reviewed') return 'review';
    if (s == 'refused') return 'rejected';
    return s;
  }

  String get displayStatus {
    const labels = {
      'pending': 'En attente',
      'review': 'En révision',
      'accepted': 'Accepté',
      'rejected': 'Refusé',
      'validated': 'Validé',
    };
    return labels[status] ?? status;
  }

  String get companyInitials {
    final parts = company.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0].substring(0, parts[0].length.clamp(0, 2)).toUpperCase();
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }
}

class Convention {
  final int id;
  final String status;
  final int applicationId;
  final bool studentSigned;
  final bool companySigned;
  final bool adminValidated;
  final String? offerTitle;
  final String? companyName;
  final bool reportSubmitted;
  final bool reportValidated;
  final bool attestationIssued;

  const Convention({
    required this.id,
    required this.status,
    required this.applicationId,
    required this.studentSigned,
    required this.companySigned,
    required this.adminValidated,
    this.offerTitle,
    this.companyName,
    required this.reportSubmitted,
    required this.reportValidated,
    required this.attestationIssued,
  });

  factory Convention.fromJson(Map<String, dynamic> json) => Convention(
        id: json['id'] ?? 0,
        status: json['status'] ?? '',
        applicationId: json['application_id'] ?? json['application'] ?? 0,
        studentSigned: json['student_signed'] ?? false,
        companySigned: json['company_signed'] ?? false,
        adminValidated: json['admin_validated'] ?? false,
        offerTitle: json['offer_title'],
        companyName: json['company_name'],
        reportSubmitted: json['report_submitted'] ?? false,
        reportValidated: json['report_validated'] ?? false,
        attestationIssued: json['attestation_issued'] ?? false,
      );

  int get stepsCompleted {
    int steps = 0;
    if (studentSigned) steps++;
    if (companySigned) steps++;
    if (adminValidated) steps++;
    if (reportSubmitted) steps++;
    if (reportValidated) steps++;
    if (attestationIssued) steps++;
    return steps;
  }
}
