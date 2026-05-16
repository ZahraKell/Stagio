enum UserRole { student, company, admin, administration }

UserRole roleFromString(String? role) {
  switch (role) {
    case 'student': return UserRole.student;
    case 'company': return UserRole.company;
    case 'admin': return UserRole.admin;
    case 'administration': return UserRole.administration;
    default: return UserRole.student;
  }
}

class UserProfile {
  final int id;
  final String email;
  final String fullName;
  final String? town;
  final String? phone;
  final UserRole role;

  const UserProfile({
    required this.id,
    required this.email,
    required this.fullName,
    this.town,
    this.phone,
    required this.role,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
        id: json['id'] ?? 0,
        email: json['email'] ?? '',
        fullName: json['full_name'] ?? json['name'] ?? '',
        town: json['town'],
        phone: json['pnum'] ?? json['phone'],
        role: roleFromString(json['role'] ?? json['user_role']),
      );

  String get initials {
    final parts = fullName.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0].substring(0, parts[0].length.clamp(0, 2)).toUpperCase();
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }
}
