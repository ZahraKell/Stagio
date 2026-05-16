/// Relative API paths (base URL already ends with `/api/`).
class ApiPaths {
  // Auth
  static const authRegister = 'auth/register/';
  static const authLogin = 'auth/login/';
  static const authLogout = 'auth/logout/';
  static const authMe = 'auth/me/';
  static const authProfile = 'auth/profile/';
  static const authRefresh = 'auth/token/refresh/';
  static const authVerifyOtp = 'auth/verify-otp/';
  static const authResendOtp = 'auth/resend-otp/';
  static const authForgotPassword = 'auth/forgot-password/';
  static const authResetPassword = 'auth/reset-password/';
  static const authCv = 'auth/cv/';
  static const authCvUpdate = 'auth/cv/update/';
  static String authCvEducation = 'auth/cv/education/';
  static String authCvEducationId(int id) => 'auth/cv/education/$id/';
  static String authCvExperience = 'auth/cv/experience/';
  static String authCvSkill = 'auth/cv/skill/';
  static String authCvLanguage = 'auth/cv/language/';

  // Public users (CV lookup)
  static String studentCv(int studentId) => 'users/students/$studentId/cv/';

  // Notifications
  static const notifications = 'notifications/';
  static const notificationsUnread = 'notifications/unread-count/';
  static const notificationsReadAll = 'notifications/read-all/';
  static String notificationRead(int id) => 'notifications/$id/read/';

  // Offers
  static const offers = 'offers/';
  static const offersFilter = 'offers/filter/';
  static const offersMine = 'offers/mine/';
  static String offer(int id) => 'offers/$id/';
  static String offerUpdate(int id) => 'offers/$id/update/';
  static String offerDelete(int id) => 'offers/$id/delete/';
  static const offersCreate = 'offers/create/';

  // Applications
  static const applications = 'applications/';
  static const applicationsMine = 'applications/my-applications/';
  static const applicationsCompany = 'applications/company/';
  static const applicationsAdminAll = 'applications/admin/all/';
  static const applicationsMyInterns = 'applications/my-interns/';
  static String applicationReview(int id) => 'applications/$id/review/';
  static String applicationValidateReport(int id) =>
      'applications/$id/validate-report/';

  // Conventions
  static String conventionSign(int id) => 'conventions/$id/sign/';

  // Admin
  static const adminUsers = 'admin/users/';
  static String adminUser(int id) => 'admin/users/$id/';
  static const adminCompanies = 'admin/companies/';
  static const adminCompaniesPending = 'admin/companies/pending/';
  static const adminOffers = 'admin/offers/';
  static String adminOfferStatus(int id) => 'admin/offers/$id/status/';
  static String adminCompanyApprove(int id) => 'admin/companies/$id/approve/';
  static String adminCompanyReject(int id) => 'admin/companies/$id/reject/';

  // University administration (scoped to institution email domain)
  static const administrationStudents = 'administration/students/';
  static const administrationCompanies = 'administration/companies/';
  static const applicationsPendingValidation = 'applications/pending-validation/';
  static String applicationValidate(int id) => 'applications/$id/validate/';
}
