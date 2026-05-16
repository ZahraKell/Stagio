import 'package:flutter/material.dart';

// ─────────────────────────────────────────────────────────────────────────────
//  Stag.io — Design Tokens
//
//  Brand palette:
//    #F4F6FA  page bg      → blue-tinted off-white background
//    #f5c518  yellow       → primary actions, buttons, active states
//    #214478  navy         → chips, accents, event dates
//    #4b78a2  steel blue   → secondary text, labels, icons
//    #6a9fc0  sky blue     → login gradient end, highlights
//    #1a1a2e  midnight     → app bar gradient start, primary text
//    #16213e  dark navy    → app bar gradient mid
//    #0f3460  deep navy    → app bar gradient end
//    #DC9365  terracotta   → offer/promo gradient start
//    #8B3A4A  rose-burg    → offer/promo gradient end
// ─────────────────────────────────────────────────────────────────────────────

abstract class AppColors {
  // ── Brand blues ───────────────────────────────────────────────────────────
  static const Color midnight  = Color(0xFF1A1A2E); // darkest — app bar start, primary text
  static const Color darkNavy  = Color(0xFF16213E); // app bar mid
  static const Color deepNavy  = Color(0xFF0F3460); // app bar end
  static const Color navy      = Color(0xFF214478); // primary navy — chips, dates
  static const Color steelBlue = Color(0xFF4B78A2); // secondary — labels, icons
  static const Color skyBlue   = Color(0xFF6A9FC0); // login gradient end

  // ── Primary (yellow) ──────────────────────────────────────────────────────
  static const Color primary      = yellow;
  static const Color yellow       = Color(0xFFF5C518); // buttons, active states
  static const Color yellowDark   = Color(0xFFD4A800); // pressed / darker yellow
  static const Color yellowLight  = Color(0xFFFFF8D6); // yellow tint bg

  // ── Offer / promo accent (warm) ───────────────────────────────────────────
  static const Color terracotta   = Color(0xFFDC9365); // offer gradient start
  static const Color roseBurgundy = Color(0xFF8B3A4A); // offer gradient end

  // ── Gradient ramp ─────────────────────────────────────────────────────────
  static const Color gradientStart = midnight;  // login / app bar top
  static const Color gradientMid   = navy;      // login mid
  static const Color gradientEnd   = skyBlue;   // login bottom

  // ── Accent — alias kept for backward compatibility ─────────────────────────
  // Previously: golden sand. Now maps to yellow (primary action color).
  static const Color accent      = yellow;
  static const Color accentLight = yellowLight;

  // ── Secondary accent — alias kept for backward compatibility ──────────────
  // Previously: dusty rose. Now maps to steel blue (secondary UI color).
  static const Color rose      = steelBlue;
  static const Color roseLight = Color(0xFFE2EAF4); // blue tint

  // ── Surfaces ──────────────────────────────────────────────────────────────
  static const Color pageBg  = Color(0xFFF4F6FA); // blue-tinted off-white
  static const Color cardBg  = Color(0xFFFFFFFF); // white cards
  static const Color border  = Color(0xFFD8E0EC); // cool blue-tinted border

  // ── Neutral / Text ────────────────────────────────────────────────────────
  static const Color textDark  = Color(0xFF1A1A2E); // midnight — primary text
  static const Color textMid   = Color(0xFF4B78A2); // steel blue — secondary text
  static const Color textLight = Color(0xFF8899BB); // muted blue-grey — hints

  // ── Navy / dark surface alias — kept for backward compatibility ────────────
  // Previously: mid burgundy-rose. Now maps to deep navy dark surface.
  static const Color navyLight = deepNavy;

  // ── Semantic ──────────────────────────────────────────────────────────────
  static const Color success      = Color(0xFF2D7D46);
  static const Color successLight = Color(0xFFDCF0E4);
  static const Color danger       = Color(0xFFB83232);
  static const Color dangerLight  = Color(0xFFFBE4E4);
  static const Color warning      = Color(0xFFB87D2E);
  static const Color warningLight = Color(0xFFFBF0D9);
  static const Color info         = Color(0xFF2B6CB0);
  static const Color infoLight    = Color(0xFFE0EEFB);

  // ── Gradients ─────────────────────────────────────────────────────────────

  /// Login / Register / OTP screens — midnight → navy → sky blue (Option B)
  static const LinearGradient loginGradient = LinearGradient(
    colors: [midnight, navy, skyBlue],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Kept for backward compatibility — alias for loginGradient.
  /// Previously: terracotta → burgundy 3-stop hero.
  static const LinearGradient heroGradient = loginGradient;

  /// Kept for backward compatibility — alias for appBarGradient.
  /// Previously: terracotta → burgundy 2-stop.
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [midnight, deepNavy],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// App bar & dark surfaces — midnight → dark navy → deep navy
  static const LinearGradient appBarGradient = LinearGradient(
    colors: [midnight, darkNavy, deepNavy],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Kept for backward compatibility — alias for appBarGradient.
  /// Previously: mid burgundy-rose → burgundy.
  static const LinearGradient navyGradient = appBarGradient;

  /// Offer / promo banners — terracotta → rose-burgundy
  static const LinearGradient offerGradient = LinearGradient(
    colors: [terracotta, roseBurgundy],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Event date chips — deep navy → navy
  static const LinearGradient eventDateGradient = LinearGradient(
    colors: [deepNavy, navy],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // ── Status helpers (used by StatusBadge widget) ───────────────────────────
  static Color statusColor(String status) {
    switch (status) {
      case 'pending':
        return const Color(0xFF8B5E1A);
      case 'review':
      case 'reviewed':
        return const Color(0xFF4B78A2);
      case 'accepted':
      case 'validated':
        return const Color(0xFF1E5C33);
      case 'rejected':
      case 'refused':
        return const Color(0xFF8B2020);
      case 'open':
        return const Color(0xFF1E5C33);
      case 'closed':
        return const Color(0xFF5A6A7A);
      default:
        return textMid;
    }
  }

  static Color statusBg(String status) {
    switch (status) {
      case 'pending':
        return const Color(0xFFFBF0D9);
      case 'review':
      case 'reviewed':
        return const Color(0xFFE0EEFB);
      case 'accepted':
      case 'validated':
        return const Color(0xFFDCF0E4);
      case 'rejected':
      case 'refused':
        return const Color(0xFFFBE4E4);
      case 'open':
        return const Color(0xFFDCF0E4);
      case 'closed':
        return const Color(0xFFEAEFF5);
      default:
        return const Color(0xFFE2EAF4);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Typography
// ─────────────────────────────────────────────────────────────────────────────

abstract class AppTextStyles {
  static const TextStyle h1 = TextStyle(
    fontSize: 26,
    fontWeight: FontWeight.w700,
    color: AppColors.textDark,
    letterSpacing: -0.3,
  );

  static const TextStyle h2 = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w700,
    color: AppColors.textDark,
  );

  static const TextStyle h3 = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: AppColors.textDark,
  );

  static const TextStyle body = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.textDark,
    height: 1.5,
  );

  static const TextStyle bodyMid = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: AppColors.textMid,
  );

  static const TextStyle small = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: AppColors.textLight,
  );

  static const TextStyle label = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w600,
    color: AppColors.textDark,
  );

  // ── On-dark variants (login hero, app bar) ────────────────────────────────
  static const TextStyle h1OnDark = TextStyle(
    fontSize: 26,
    fontWeight: FontWeight.w700,
    color: Colors.white,
    letterSpacing: -0.3,
  );

  static const TextStyle bodyOnDark = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: Color(0x99FFFFFF),
    height: 1.5,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ThemeData — pass to MaterialApp(theme: AppTheme.light)
// ─────────────────────────────────────────────────────────────────────────────

abstract class AppTheme {
  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.navy,
        primary: AppColors.navy,
        secondary: AppColors.steelBlue,
        tertiary: AppColors.yellow,
        surface: AppColors.cardBg,
        error: AppColors.danger,
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: AppColors.pageBg,

      // ── AppBar ─────────────────────────────────────────────────────────────
      // backgroundColor is midnight as fallback; use GradientAppBar widget
      // defined below for the full gradient effect.
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.midnight,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: Colors.white),
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 17,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.2,
        ),
      ),

      // ── Elevated Button — yellow ───────────────────────────────────────────
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.yellow,
          foregroundColor: AppColors.textDark,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
          minimumSize: const Size(double.infinity, 50),
          padding: const EdgeInsets.symmetric(horizontal: 20),
        ),
      ),

      // ── Outlined Button ────────────────────────────────────────────────────
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.navy,
          side: const BorderSide(color: Color(0x88214478)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          minimumSize: const Size(double.infinity, 46),
        ),
      ),

      // ── Text Button ────────────────────────────────────────────────────────
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.navy,
          textStyle: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // ── Input / TextField ──────────────────────────────────────────────────
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding:
        const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.navy, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.danger, width: 1.5),
        ),
        hintStyle:
        const TextStyle(color: AppColors.textLight, fontSize: 14),
        errorStyle:
        const TextStyle(color: AppColors.danger, fontSize: 12),
        prefixIconColor: AppColors.textLight,
        suffixIconColor: AppColors.textLight,
      ),

      // ── Card ───────────────────────────────────────────────────────────────
      cardTheme: CardThemeData(
        color: AppColors.cardBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.border, width: 0.5),
        ),
        margin: EdgeInsets.zero,
      ),

      // ── Chip ───────────────────────────────────────────────────────────────
      chipTheme: ChipThemeData(
        backgroundColor: const Color(0xFFE2EAF4),
        selectedColor: AppColors.yellow,
        labelStyle: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: AppColors.navy,
        ),
        secondaryLabelStyle: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: AppColors.textDark,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        shape: const StadiumBorder(),
        side: BorderSide.none,
      ),

      // ── SnackBar ───────────────────────────────────────────────────────────
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.midnight,
        contentTextStyle:
        const TextStyle(color: Colors.white, fontSize: 14),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
      ),

      // ── Tab Bar ────────────────────────────────────────────────────────────
      tabBarTheme: const TabBarThemeData(
        labelColor: AppColors.navy,
        unselectedLabelColor: AppColors.textLight,
        indicatorColor: AppColors.yellow,
        labelStyle:
        TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        unselectedLabelStyle:
        TextStyle(fontSize: 13, fontWeight: FontWeight.w400),
        indicatorSize: TabBarIndicatorSize.label,
      ),

      // ── Divider ────────────────────────────────────────────────────────────
      dividerTheme: const DividerThemeData(
        color: AppColors.border,
        thickness: 0.5,
        space: 1,
      ),

      // ── Progress Indicator ─────────────────────────────────────────────────
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.yellow,
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  GradientAppBar — drop-in replacement for AppBar with the app bar gradient.
//
//  Usage:
//    appBar: GradientAppBar(title: 'Home', actions: [...]),
// ─────────────────────────────────────────────────────────────────────────────

class GradientAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;
  final bool centerTitle;

  const GradientAppBar({
    super.key,
    required this.title,
    this.actions,
    this.leading,
    this.centerTitle = false,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: AppColors.appBarGradient,
      ),
      child: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: centerTitle,
        title: Text(title),
        leading: leading,
        actions: actions,
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  LoginBackground — wraps login / register / OTP screen body with the
//  loginGradient. Place as the outermost widget inside Scaffold body.
//
//  Usage:
//    body: LoginBackground(child: yourLoginContent),
// ─────────────────────────────────────────────────────────────────────────────

class LoginBackground extends StatelessWidget {
  final Widget child;

  const LoginBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(
        gradient: AppColors.loginGradient,
      ),
      child: child,
    );
  }
}