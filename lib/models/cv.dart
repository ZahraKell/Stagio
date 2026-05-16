class CvData {
  final int id;
  final String github;
  final String linkedin;
  final String portfolio;
  final String description;
  final String updateDate;
  final List<CvEducation> educations;
  final List<CvExperience> experiences;
  final List<CvSkill> skills;
  final List<CvLanguage> languages;

  const CvData({
    required this.id,
    required this.github,
    required this.linkedin,
    required this.portfolio,
    required this.description,
    required this.updateDate,
    required this.educations,
    required this.experiences,
    required this.skills,
    required this.languages,
  });

  factory CvData.fromJson(Map<String, dynamic> json) => CvData(
        id: json['id'] ?? 0,
        github: json['github'] ?? '',
        linkedin: json['linkedin'] ?? '',
        portfolio: json['portfolio'] ?? '',
        description: json['description'] ?? '',
        updateDate: json['update_date'] ?? '',
        educations: (json['educations'] as List? ?? [])
            .map((e) => CvEducation.fromJson(e))
            .toList(),
        experiences: (json['experiences'] as List? ?? [])
            .map((e) => CvExperience.fromJson(e))
            .toList(),
        skills: (json['skills'] as List? ?? [])
            .map((e) => CvSkill.fromJson(e))
            .toList(),
        languages: (json['languages'] as List? ?? [])
            .map((e) => CvLanguage.fromJson(e))
            .toList(),
      );

  int get completionScore {
    int score = 0;
    if (description.isNotEmpty) score += 15;
    if (github.isNotEmpty) score += 5;
    if (linkedin.isNotEmpty) score += 5;
    if (educations.isNotEmpty) score += 20;
    if (experiences.isNotEmpty) score += 20;
    if (skills.isNotEmpty) score += 20;
    if (languages.isNotEmpty) score += 15;
    return score;
  }
}

class CvEducation {
  final int id;
  final String degree;
  final String institution;
  final String field;
  final int startYear;
  final int? endYear;
  final bool isCurrent;
  final String description;

  const CvEducation({
    required this.id,
    required this.degree,
    required this.institution,
    required this.field,
    required this.startYear,
    this.endYear,
    required this.isCurrent,
    required this.description,
  });

  factory CvEducation.fromJson(Map<String, dynamic> json) => CvEducation(
        id: json['id'] ?? 0,
        degree: json['degree'] ?? '',
        institution: json['institution'] ?? '',
        field: json['field'] ?? '',
        startYear: json['start_year'] ?? 0,
        endYear: json['end_year'],
        isCurrent: json['is_current'] ?? false,
        description: json['description'] ?? '',
      );
}

class CvExperience {
  final int id;
  final String jobTitle;
  final String company;
  final String location;
  final String startDate;
  final String? endDate;
  final bool isCurrent;
  final String description;

  const CvExperience({
    required this.id,
    required this.jobTitle,
    required this.company,
    required this.location,
    required this.startDate,
    this.endDate,
    required this.isCurrent,
    required this.description,
  });

  factory CvExperience.fromJson(Map<String, dynamic> json) => CvExperience(
        id: json['id'] ?? 0,
        jobTitle: json['job_title'] ?? '',
        company: json['company'] ?? '',
        location: json['location'] ?? '',
        startDate: json['start_date'] ?? '',
        endDate: json['end_date'],
        isCurrent: json['is_current'] ?? false,
        description: json['description'] ?? '',
      );
}

class CvSkill {
  final int id;
  final String name;
  final String level;

  const CvSkill({required this.id, required this.name, required this.level});

  factory CvSkill.fromJson(Map<String, dynamic> json) =>
      CvSkill(id: json['id'] ?? 0, name: json['name'] ?? '', level: json['level'] ?? 'beginner');
}

class CvLanguage {
  final int id;
  final String name;
  final String level;

  const CvLanguage({required this.id, required this.name, required this.level});

  factory CvLanguage.fromJson(Map<String, dynamic> json) =>
      CvLanguage(id: json['id'] ?? 0, name: json['name'] ?? '', level: json['level'] ?? 'A1');
}
