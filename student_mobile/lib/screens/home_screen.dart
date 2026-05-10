import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'dart:ui';
import 'dart:math' as math;

// ─────────────────────────────────────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

class _C {
  static const bg = Color(0xFF0A1628);
  static const surface = Color(0xFF0F1F3D);
  static const primary = Color(0xFF1A56DB);
  static const accent = Color(0xFF38BDF8);
  static const gold = Color(0xFFFBBF24);
  static const success = Color(0xFF34D399);
  static const textHi = Colors.white;
  static const textMid = Color(0xFFAEC3E8);
  static const textLo = Color(0xFF4A6FA5);
  static const glass = Color(0x0DFFFFFF);
  static const glassBorder = Color(0x1AFFFFFF);
}

class _T {
  static const heading = TextStyle(
    fontFamily: 'Georgia',
    color: _C.textHi,
    fontWeight: FontWeight.w900,
    letterSpacing: -0.5,
    height: 1.1,
  );
  static const label = TextStyle(
    fontFamily: 'Georgia',
    color: _C.textMid,
    fontWeight: FontWeight.w400,
    height: 1.5,
  );
  static const mono = TextStyle(
    fontFamily: 'Courier',
    color: _C.accent,
    fontWeight: FontWeight.w700,
    letterSpacing: 3,
    fontSize: 12,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DATA MODELS
// ─────────────────────────────────────────────────────────────────────────────

class _FeedItem {
  final String category;
  final String content;
  final Color accent;
  final IconData icon;
  final String time;
  final int votes;

  const _FeedItem({
    required this.category,
    required this.content,
    required this.accent,
    required this.icon,
    required this.time,
    required this.votes,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  HOME SCREEN
// ─────────────────────────────────────────────────────────────────────────────

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  // ── State ────────────────────────────────────────────────────────────────

  int _currentIndex = 0;
  late AnimationController _orb;

  // ── Lifecycle ────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    _orb = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat();
  }

  @override
  void dispose() {
    _orb.dispose();
    super.dispose();
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  void _onNavTapped(int i) => setState(() => _currentIndex = i);

  void _openSubmitScreen() {
    Navigator.pop(context);
    Navigator.pushNamed(context, '/submit');
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _C.bg,
      extendBodyBehindAppBar: true,
      appBar: _buildAppBar(),
      drawer: _buildDrawer(),
      body: Stack(
        children: [
          _buildAmbientBackground(),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 400),
            transitionBuilder:
                (child, anim) => FadeTransition(
                  opacity: anim,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.03),
                      end: Offset.zero,
                    ).animate(
                      CurvedAnimation(parent: anim, curve: Curves.easeOut),
                    ),
                    child: child,
                  ),
                ),
            child: _getTab(_currentIndex),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  // ── Tab Router ────────────────────────────────────────────────────────────

  Widget _getTab(int index) {
    switch (index) {
      case 0:
        return _buildHomeTab(key: const ValueKey(0));
      case 1:
      default:
        return _buildProfileTab(key: const ValueKey(1));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  BACKGROUND
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildAmbientBackground() {
    return AnimatedBuilder(
      animation: _orb,
      builder: (_, __) {
        final t = _orb.value * 2 * math.pi;
        return SizedBox.expand(child: CustomPaint(painter: _OrbPainter(t)));
      },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  APP BAR
  // ─────────────────────────────────────────────────────────────────────────

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      elevation: 0,
      backgroundColor: Colors.transparent,
      iconTheme: const IconThemeData(color: _C.textHi),
      centerTitle: true,
      title: Text('CLARIBOX', style: _T.mono.copyWith(fontSize: 14)),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  BOTTOM NAVIGATION BAR
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildBottomNav() {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: const BoxDecoration(
            color: Color(0xCC0A1628),
            border: Border(top: BorderSide(color: _C.glassBorder)),
          ),
          child: BottomNavigationBar(
            backgroundColor: Colors.transparent,
            currentIndex: _currentIndex,
            onTap: _onNavTapped,
            selectedItemColor: _C.accent,
            unselectedItemColor: _C.textLo,
            type: BottomNavigationBarType.fixed,
            elevation: 0,
            selectedLabelStyle: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
            unselectedLabelStyle: const TextStyle(fontSize: 11),
            items: const [
              BottomNavigationBarItem(
                icon: Icon(LucideIcons.home, size: 20),
                label: 'Home',
              ),
              BottomNavigationBarItem(
                icon: Icon(LucideIcons.user, size: 20),
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  DRAWER
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: const Color(0xFF0C1A33),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(24, 64, 24, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('CLARIBOX', style: _T.mono.copyWith(fontSize: 16)),
                const SizedBox(height: 6),
                Text(
                  'Anonymous Feedback Platform',
                  style: _T.label.copyWith(fontSize: 12, color: _C.textLo),
                ),
              ],
            ),
          ),
          Container(height: 1, color: _C.glassBorder),
          const SizedBox(height: 16),
          _buildDrawerItem(LucideIcons.home, 'Home', 0),
          _buildDrawerItem(LucideIcons.user, 'Profile', 1),
          const Spacer(),
          Container(height: 1, color: _C.glassBorder),
          ListTile(
            leading: const Icon(
              LucideIcons.logOut,
              color: Color(0xFFF87171),
              size: 18,
            ),
            title: const Text(
              'Exit App',
              style: TextStyle(color: Color(0xFFF87171), fontSize: 14),
            ),
            onTap: () => Navigator.pop(context),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildDrawerItem(IconData icon, String title, int index) {
    final selected = _currentIndex == index;
    return ListTile(
      leading: Icon(icon, size: 18, color: selected ? _C.accent : _C.textLo),
      title: Text(
        title,
        style: _T.label.copyWith(
          fontSize: 15,
          color: selected ? _C.textHi : _C.textLo,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
        ),
      ),
      trailing:
          selected
              ? Container(
                width: 4,
                height: 4,
                decoration: const BoxDecoration(
                  color: _C.accent,
                  shape: BoxShape.circle,
                ),
              )
              : null,
      onTap: () {
        Navigator.pop(context);
        _onNavTapped(index);
      },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  HOME TAB
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildHomeTab({required Key key}) {
    return Center(
      key: key,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(28, 120, 28, 40),
        child: Column(
          children: [
            _buildBadge(),
            const SizedBox(height: 36),
            _buildHeadline(),
            const SizedBox(height: 20),
            Text(
              'Your identity is never collected.\nShare thoughts completely anonymously.',
              textAlign: TextAlign.center,
              style: _T.label.copyWith(fontSize: 15),
            ),
            const SizedBox(height: 48),
            _buildMainButtons(),
            const SizedBox(height: 24),
            TextButton.icon(
              onPressed: () {},
              icon: Icon(LucideIcons.info, size: 14, color: _C.textLo),
              label: Text(
                'How it works',
                style: _T.label.copyWith(fontSize: 13, color: _C.textLo),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeadline() {
    return Column(
      children: [
        Text(
          'Speak Up.',
          style: _T.heading.copyWith(
            fontSize: 48,
            foreground:
                Paint()
                  ..shader = const LinearGradient(
                    colors: [_C.textHi, _C.accent],
                  ).createShader(const Rect.fromLTWH(0, 0, 300, 60)),
          ),
        ),
        Text(
          'Be Heard.',
          style: _T.heading.copyWith(fontSize: 48, color: _C.textHi),
        ),
        const SizedBox(height: 8),
        Text(
          'Help Make Campus Better.',
          style: _T.heading.copyWith(fontSize: 20, color: _C.textMid),
        ),
      ],
    );
  }

  Widget _buildBadge() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(30),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: _C.success.withOpacity(0.08),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: _C.success.withOpacity(0.2)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(
                  color: _C.success,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'END-TO-END ANONYMOUS',
                style: _T.mono.copyWith(color: _C.success, fontSize: 10),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMainButtons() {
    return Column(
      children: [
        // Primary CTA
        GestureDetector(
          onTap: _openSubmitScreen,
          child: Container(
            width: double.infinity,
            height: 58,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [_C.primary, _C.accent],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: _C.accent.withOpacity(0.35),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(LucideIcons.send, size: 18, color: Colors.white),
                SizedBox(width: 10),
                Text(
                  'Submit Your Feedback',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),
      ],
    );
  }

  // Helper widgets (used across tabs)
  Widget _buildStat(String value, String label) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: _T.heading.copyWith(fontSize: 28, color: _C.accent),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            textAlign: TextAlign.center,
            style: _T.label.copyWith(fontSize: 11, color: _C.textLo),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Container(width: 1, height: 40, color: _C.glassBorder);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PROFILE TAB
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildProfileTab({required Key key}) {
    return Center(
      key: key,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildProfileAvatar(),
            const SizedBox(height: 24),
            Text('Anonymous Session', style: _T.heading.copyWith(fontSize: 26)),
            const SizedBox(height: 10),
            Text(
              'Your privacy is protected.\nNo account, no tracking, no data.',
              textAlign: TextAlign.center,
              style: _T.label.copyWith(fontSize: 14, color: _C.textLo),
            ),
            const SizedBox(height: 40),
            _buildProfileItem(LucideIcons.settings, 'Settings', 'Coming soon'),
            _buildProfileItem(LucideIcons.helpCircle, 'FAQ', 'Coming soon'),
            _buildProfileItem(LucideIcons.shield, 'Privacy Policy', 'View'),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileAvatar() {
    return Container(
      width: 90,
      height: 90,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          colors: [_C.primary, _C.accent],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: _C.accent.withOpacity(0.3),
            blurRadius: 24,
            spreadRadius: 2,
          ),
        ],
      ),
      child: const Icon(LucideIcons.user, color: Colors.white, size: 36),
    );
  }

  Widget _buildProfileItem(IconData icon, String title, String action) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          decoration: BoxDecoration(
            color: _C.glass,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _C.glassBorder),
          ),
          child: Row(
            children: [
              Icon(icon, size: 18, color: _C.accent),
              const SizedBox(width: 16),
              Text(
                title,
                style: _T.label.copyWith(color: _C.textHi, fontSize: 15),
              ),
              const Spacer(),
              Text(
                action,
                style: _T.label.copyWith(fontSize: 12, color: _C.textLo),
              ),
              const SizedBox(width: 6),
              const Icon(LucideIcons.chevronRight, size: 14, color: _C.textLo),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  AMBIENT ORB PAINTER
// ─────────────────────────────────────────────────────────────────────────────

class _OrbPainter extends CustomPainter {
  final double t;
  const _OrbPainter(this.t);

  @override
  void paint(Canvas canvas, Size size) {
    // Orb 1 — blue, top-right
    final p1 = Offset(
      size.width * 0.75 + math.sin(t) * 40,
      size.height * 0.18 + math.cos(t * 0.7) * 30,
    );
    canvas.drawCircle(
      p1,
      200,
      Paint()
        ..shader = RadialGradient(
          colors: [const Color(0x331A56DB), Colors.transparent],
        ).createShader(Rect.fromCircle(center: p1, radius: 200)),
    );

    // Orb 2 — cyan, bottom-left
    final p2 = Offset(
      size.width * 0.2 + math.cos(t * 0.6) * 35,
      size.height * 0.75 + math.sin(t * 0.8) * 25,
    );
    canvas.drawCircle(
      p2,
      160,
      Paint()
        ..shader = RadialGradient(
          colors: [const Color(0x2238BDF8), Colors.transparent],
        ).createShader(Rect.fromCircle(center: p2, radius: 160)),
    );

    // Orb 3 — gold, center
    final p3 = Offset(
      size.width * 0.5 + math.sin(t * 0.4 + 1) * 20,
      size.height * 0.45 + math.cos(t * 0.5) * 20,
    );
    canvas.drawCircle(
      p3,
      100,
      Paint()
        ..shader = RadialGradient(
          colors: [const Color(0x12FBBF24), Colors.transparent],
        ).createShader(Rect.fromCircle(center: p3, radius: 100)),
    );
  }

  @override
  bool shouldRepaint(_OrbPainter old) => old.t != t;
}
