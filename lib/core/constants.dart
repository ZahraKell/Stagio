import 'env_config.dart';

class AppConstants {
  static String get baseUrl => EnvConfig.apiBaseUrl;

  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userRoleKey = 'user_role';
  static const String companyStatusKey = 'company_status';

  static const List<String> offerImages = [
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop',
  ];

  static String offerImage(int id) => offerImages[id % offerImages.length];

  static const Map<String, String> typeLabels = {
    'INTERNSHIP': 'Stage professionnel',
    'ALTERNANCE': 'Alternance',
    'FINAL_YEAR': 'PFE',
  };

  static const Map<String, String> statusLabels = {
    'pending': 'En attente',
    'review': 'En révision',
    'reviewed': 'En révision',
    'accepted': 'Accepté',
    'refused': 'Refusé',
    'rejected': 'Refusé',
    'validated': 'Validé',
    'open': 'Ouverte',
    'closed': 'Fermée',
    'filled': 'Pourvue',
  };

  static const List<String> algerianWilayas = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna',
    'Béjaïa', 'Biskra', 'Béchar', 'Blida', 'Bouira',
    'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou',
    'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda',
    'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine',
    'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara', 'Ouargla',
    'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arreridj', 'Boumerdès',
    'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela',
    'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma',
    'Aïn Témouchent', 'Ghardaïa', 'Relizane',
  ];
}
