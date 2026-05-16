import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/admin/screens/admin_applications_page.dart';
import '../features/admin/screens/admin_companies_page.dart';
import '../features/admin/screens/admin_dashboard_page.dart';
import '../features/admin/screens/admin_offers_page.dart';
import '../features/admin/screens/admin_shell.dart';
import '../features/admin/screens/admin_profile_page.dart';
import '../features/admin/screens/admin_users_page.dart';
import '../features/administration/screens/administration_conventions_page.dart';
import '../features/administration/screens/administration_dashboard_page.dart';
import '../features/administration/screens/administration_students_page.dart';
import '../features/auth/auth_provider.dart';
import '../features/auth/forgot_password_page.dart';
import '../features/auth/login_page.dart';
import '../features/auth/register_page.dart';
import '../features/auth/verify_otp_page.dart';
import '../features/company/screens/company_applications_page.dart';
import '../features/company/screens/company_offers_page.dart';
import '../features/company/screens/company_profile_page.dart';
import '../features/company/screens/company_shell.dart';
import '../features/company/screens/create_offer_page.dart';
import '../features/company/screens/dashboard_page.dart';
import '../features/company/screens/interns_page.dart';
import '../features/student/screens/applications_page.dart';
import '../features/student/screens/cv_page.dart';
import '../features/student/screens/home_page.dart';
import '../features/student/screens/offer_detail_page.dart';
import '../features/student/screens/offers_page.dart';
import '../features/student/screens/profile_page.dart';
import '../features/student/screens/student_shell.dart';
import 'token_storage.dart';
import 'constants.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) async {
      final loc = state.matchedLocation;
      final isPublicRoute = loc == '/login' ||
          loc == '/register' ||
          loc == '/forgot-password' ||
          loc == '/verify-otp' ||
          loc.startsWith('/register/');

      if (!auth.isInitialized) return null;

      final token = await TokenStorage.instance.read(AppConstants.accessTokenKey);

      if (token == null) {
        return isPublicRoute ? null : '/login';
      }

      if (isPublicRoute) {
        final role = auth.user?.role ?? await ref.read(authProvider.notifier).getSavedRole();
        if (role != null) {
          return ref.read(authProvider.notifier).homeRouteForRole(role);
        }
        return null;
      }

      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterPage()),
      GoRoute(
        path: '/register/student',
        builder: (_, __) => const StudentRegisterPage(),
      ),
      GoRoute(
        path: '/register/company',
        builder: (_, __) => const CompanyRegisterPage(),
      ),
      GoRoute(
        path: '/register/administration',
        builder: (_, __) => const AdministrationRegisterPage(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (_, __) => const ForgotPasswordPage(),
      ),
      GoRoute(
        path: '/verify-otp',
        builder: (_, state) => VerifyOtpPage(
          email: state.uri.queryParameters['email'] ?? '',
        ),
      ),

      ShellRoute(
        builder: (context, state, child) => StudentShell(child: child),
        routes: [
          GoRoute(path: '/student/home', builder: (_, __) => const StudentHomePage()),
          GoRoute(path: '/student/offers', builder: (_, __) => const StudentOffersPage()),
          GoRoute(
            path: '/student/offers/:id',
            builder: (_, state) => OfferDetailPage(
              offerId: int.parse(state.pathParameters['id']!),
            ),
          ),
          GoRoute(
            path: '/student/applications',
            builder: (_, __) => const StudentApplicationsPage(),
          ),
          GoRoute(path: '/student/cv', builder: (_, __) => const StudentCvPage()),
          GoRoute(
            path: '/student/profile',
            builder: (_, __) => const StudentProfilePage(),
          ),
        ],
      ),

      ShellRoute(
        builder: (context, state, child) => CompanyShell(child: child),
        routes: [
          GoRoute(
            path: '/company/dashboard',
            builder: (_, __) => const CompanyDashboardPage(),
          ),
          GoRoute(
            path: '/company/offers',
            builder: (_, __) => const CompanyOffersPage(),
          ),
          GoRoute(
            path: '/company/offers/create',
            builder: (_, __) => const CreateOfferPage(),
          ),
          GoRoute(
            path: '/company/offers/:id/edit',
            builder: (_, state) => CreateOfferPage(
              offerId: int.tryParse(state.pathParameters['id'] ?? ''),
            ),
          ),
          GoRoute(
            path: '/company/applications',
            builder: (_, __) => const CompanyApplicationsPage(),
          ),
          GoRoute(
            path: '/company/interns',
            builder: (_, __) => const CompanyInternsPage(),
          ),
          GoRoute(
            path: '/company/profile',
            builder: (_, __) => const CompanyProfilePage(),
          ),
        ],
      ),

      ShellRoute(
        builder: (context, state, child) => AdminShell(child: child),
        routes: [
          GoRoute(
            path: '/admin/dashboard',
            builder: (_, __) => const AdminDashboardPage(),
          ),
          GoRoute(path: '/admin/users', builder: (_, __) => const AdminUsersPage()),
          GoRoute(path: '/admin/offers', builder: (_, __) => const AdminOffersPage()),
          GoRoute(
            path: '/admin/applications',
            builder: (_, __) => const AdminApplicationsPage(),
          ),
          GoRoute(
            path: '/admin/companies',
            builder: (_, __) => const AdminCompaniesPage(),
          ),
          GoRoute(
            path: '/admin/profile',
            builder: (_, __) => const AdminProfilePage(),
          ),
        ],
      ),

      ShellRoute(
        builder: (context, state, child) =>
            AdminShell(child: child, isAdministration: true),
        routes: [
          GoRoute(
            path: '/administration/dashboard',
            builder: (_, __) => const AdministrationDashboardPage(),
          ),
          GoRoute(
            path: '/administration/students',
            builder: (_, __) => const AdministrationStudentsPage(),
          ),
          GoRoute(
            path: '/administration/conventions',
            builder: (_, __) => const AdministrationConventionsPage(),
          ),
          GoRoute(
            path: '/administration/profile',
            builder: (_, __) => const AdminProfilePage(),
          ),
        ],
      ),
    ],
  );
});
